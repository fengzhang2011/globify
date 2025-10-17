# Chat Offline Mode - Documentation

## Overview

The Globify Chat application now works completely offline, with example rooms, contacts, and messages appearing even when MQTT and WebSocket servers are unavailable.

## Key Changes

### ✅ Offline-First Initialization

The app now initializes in this order:

1. **Load/Create Demo Data First** (works offline)
   - Loads existing data from IndexedDB
   - Creates default rooms and contacts if they don't exist
   - Saves example welcome message
   - All operations use IndexedDB directly

2. **Then Connect to Servers** (may fail gracefully)
   - Attempts MQTT connection
   - Attempts WebSocket connection
   - Failures are caught and logged
   - App continues to work offline

3. **Join Default Room**
   - Opens #general room automatically
   - Shows existing messages from IndexedDB

### 🎯 What Works Offline

#### ✅ Rooms
- View all rooms (general, development, random, announcements)
- Switch between rooms
- Create new rooms
- Edit room names
- Delete rooms
- Messages persist in IndexedDB

#### ✅ Contacts
- View all contacts (Alice, Bob, Charlie)
- See contact status (online/away/offline)
- Add new contacts
- Edit contact details
- Delete contacts
- Start direct message conversations

#### ✅ Messages
- View existing messages
- Send new messages (stored locally)
- Reply to messages
- Use @mentions
- Upload images/videos
- Use emoji picker
- Messages queued for sync when connection returns

#### ✅ Example Data
- **4 Default Rooms**: general, development, random, announcements
- **3 Demo Contacts**:
  - Alice (🟢 Online)
  - Bob (🟡 Away)
  - Charlie (⚫ Offline, last seen 1h ago)
- **Welcome Message**: In #general from Alice

## Implementation Details

### Initialization Flow

**File**: [src/routes/chat/+page.svelte](src/routes/chat/+page.svelte)

```typescript
onMount(async () => {
  // 1. Initialize demo data first (works offline)
  await initializeDemoData();

  // 2. Then initialize chat services (may fail if servers are down)
  await chatStore.initialize(
    'ws://localhost:8083/mqtt',
    'ws://localhost:3001'
  );

  // 3. Join default room
  const defaultRoom = conversationsList.find(c => c.type === 'room');
  if (defaultRoom) {
    await chatStore.joinConversation(defaultRoom.id, 'room');
  }
});
```

### Demo Data Creation

```typescript
async function initializeDemoData() {
  // Load existing data first
  await chatStore.loadConversations();
  await chatStore.loadContacts();

  // Create rooms if they don't exist
  const defaultRooms = ['general', 'development', 'random', 'announcements'];
  for (const room of defaultRooms) {
    const exists = conversationsList.some(c => c.id === room);
    if (!exists) {
      await chatStore.createConversation({
        id: room,
        type: 'room',
        name: room,
        unreadCount: 0
      });
    }
  }

  // Create contacts if they don't exist
  const demoContacts = [
    { id: 'user-alice', username: 'Alice', status: 'online' },
    { id: 'user-bob', username: 'Bob', status: 'away' },
    { id: 'user-charlie', username: 'Charlie', status: 'offline' }
  ];
  for (const contact of demoContacts) {
    const exists = contactsList.some(c => c.id === contact.id);
    if (!exists) {
      await chatStore.addContact(contact);
    }
  }

  // Reload to update UI
  await chatStore.loadConversations();
  await chatStore.loadContacts();

  // Add example message
  await addExampleMessages();
}
```

### Example Message Creation

```typescript
async function addExampleMessages() {
  const { getMessagesByConversation, saveMessage } = await import('$lib/services/db');
  const existingMessages = await getMessagesByConversation('general');

  const exampleId = 'example-welcome-message';
  const hasExampleMessage = existingMessages.some(m => m.id === exampleId);

  if (!hasExampleMessage) {
    const exampleMessage = {
      id: exampleId,
      conversationId: 'general',
      conversationType: 'room',
      userId: 'user-alice',
      username: 'Alice',
      content: 'Welcome to Globify Chat! 👋 Try creating rooms, adding contacts, and sending messages with @mentions, images, and emojis!',
      messageType: 'text',
      timestamp: Date.now() - 60000, // 1 minute ago
      synced: true
    };

    await saveMessage(exampleMessage);
  }
}
```

### Store Initialization

**File**: [src/lib/stores/chat.ts](src/lib/stores/chat.ts)

```typescript
async initialize(mqttBrokerUrl?: string, wsServerUrl?: string) {
  update(state => ({ ...state, loading: true, error: null }));

  try {
    // Connect to services (may fail)
    await Promise.all([
      mqttService.connect().catch(err => console.error('MQTT failed:', err)),
      wsService.connect().catch(err => console.error('WebSocket failed:', err))
    ]);

    // Load from IndexedDB (always works)
    const [contacts, conversations] = await Promise.all([
      getContacts(),
      getConversations()
    ]);

    update(state => ({
      ...state,
      loading: false,
      contacts,
      conversations
    }));
  } catch (error) {
    // Graceful failure
    update(state => ({
      ...state,
      loading: false,
      error: error.message
    }));
  }
}
```

## Persistence

### IndexedDB Stores

**Database**: `chat-db` (version 2)

**Stores**:
1. **messages** - All chat messages
2. **contacts** - User contacts
3. **conversations** - Rooms and DM conversations

### Data Persistence

All operations immediately save to IndexedDB:
- Creating rooms → `saveConversation()`
- Adding contacts → `saveContact()`
- Sending messages → `saveMessage()`
- Editing items → Updates in IndexedDB
- Deleting items → Removes from IndexedDB

Data survives:
- Page refresh
- Browser restart
- Server downtime
- Network disconnection

## Testing Offline Mode

### Scenario 1: First Load (Servers Down)

1. Stop MQTT and WebSocket servers
2. Open `http://localhost:5173/chat`
3. **Expected Result**:
   - 4 rooms appear in list
   - 3 contacts appear in list
   - #general opens automatically
   - Welcome message visible
   - Connection indicators show "Disconnected"
   - All features work (create/edit/delete)

### Scenario 2: Going Offline

1. Load app with servers running
2. Send some messages
3. Stop servers
4. Continue using app
5. **Expected Result**:
   - Existing messages remain visible
   - Can send new messages (queued)
   - Can create/edit/delete rooms and contacts
   - Messages marked as "Sending..." (unsynced)

### Scenario 3: Coming Back Online

1. Start with app offline
2. Send messages
3. Start servers
4. Refresh page or wait for reconnection
5. **Expected Result**:
   - Connection indicators turn green
   - Queued messages sync to server
   - Messages update to "sent" status
   - Real-time sync resumes

## Error Handling

### Connection Failures

**MQTT Connection Fails**:
```javascript
MQTT connection failed: Error: Connection refused
// App continues working offline
```

**WebSocket Connection Fails**:
```javascript
WebSocket connection failed: Error: Connection refused
// App continues working offline
```

### Graceful Degradation

| Feature | Online | Offline |
|---------|--------|---------|
| View rooms | ✅ | ✅ |
| Create rooms | ✅ | ✅ |
| Edit/delete rooms | ✅ | ✅ |
| View contacts | ✅ | ✅ |
| Add/edit contacts | ✅ | ✅ |
| View messages | ✅ | ✅ |
| Send messages | ✅ Real-time | ✅ Queued |
| Reply to messages | ✅ | ✅ |
| @Mentions | ✅ | ✅ |
| Upload media | ✅ | ✅ |
| Emoji picker | ✅ | ✅ |
| Cross-server sync | ✅ | ❌ (queued) |
| Direct messages | ✅ | ✅ Local |

## Connection Status Indicators

Top-right of page shows:
- 🟢 **MQTT Connected** - NanoMQ connected
- 🔴 **MQTT Disconnected** - No NanoMQ connection
- 🟢 **WebSocket Connected** - uWebSockets.js connected
- 🔴 **WebSocket Disconnected** - No WebSocket connection

## User Experience

### On First Visit

User sees:
```
┌─────────────────────────────────────────────┐
│  Rooms         │  #general      │  User Info │
│                │                │            │
│  #general      │  Alice         │            │
│  #development  │  Welcome to... │            │
│  #random       │                │            │
│  #announcements│                │            │
│                │                │            │
│  [+ Create]    │  [Input...]    │            │
└─────────────────────────────────────────────┘
```

**Not** an empty screen!

### Benefits

1. **Immediate Value**: See working example instantly
2. **No Setup Required**: Works out of the box
3. **Learn by Doing**: Example message explains features
4. **Professional Look**: Populated demo looks polished
5. **Offline Support**: Works without any servers

## Development Mode

### With Servers

```bash
# Terminal 1: Start NanoMQ
docker run -d -p 1883:1883 -p 8083:8083 emqx/nanomq:latest

# Terminal 2: Start uWebSockets server
node server.js

# Terminal 3: Start dev server
pnpm dev
```

Result: Full real-time sync + offline support

### Without Servers

```bash
# Just start dev server
pnpm dev
```

Result: Full offline functionality, no sync

## Production Considerations

### IndexedDB Limits

- Browser storage quota (usually 50-100MB)
- Consider pagination for large message histories
- Implement cleanup/archiving for old messages

### Sync Strategy

When connection restored:
1. Load unsynced messages from IndexedDB
2. Send to server via MQTT/WebSocket
3. Mark as synced in IndexedDB
4. Update UI status indicators

### Data Consistency

- Use unique IDs to prevent duplicates
- Timestamp-based conflict resolution
- Server is source of truth when online

## Troubleshooting

### Example Data Not Appearing

**Problem**: Rooms/contacts not showing

**Solution**:
1. Clear browser IndexedDB
2. Refresh page
3. Check browser console for errors

```javascript
// In browser console
indexedDB.deleteDatabase('chat-db');
location.reload();
```

### Welcome Message Duplicated

**Problem**: Multiple welcome messages

**Solution**: Message has fixed ID `example-welcome-message`
- Only creates once
- Check-skips if exists

### Data Not Persisting

**Problem**: Data lost on refresh

**Solution**:
1. Check browser storage permissions
2. Verify IndexedDB enabled
3. Check browser console for quota errors

## Summary

✅ **App works completely offline**
✅ **Example data appears automatically**
✅ **4 rooms, 3 contacts, 1 welcome message**
✅ **All CRUD operations work offline**
✅ **Data persists across sessions**
✅ **Graceful server connection failures**
✅ **Professional first-time experience**

The chat application is now fully functional even without any external servers running! 🎉
