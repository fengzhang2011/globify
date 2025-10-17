# Globify Chat - Feature Documentation

## Overview

Globify Chat is a modern, feature-rich real-time messaging application with support for both group rooms and direct messages. It combines MQTT for cross-server messaging with WebSockets for local server communication, all while maintaining offline capabilities through IndexedDB.

## Key Features

### 1. Dual Messaging Modes

#### Room/Group Chat
- **Purpose**: Public channels for team collaboration
- **Examples**: #general, #development, #random, #announcements
- **Protocol**: MQTT via NanoMQ (cross-server messaging)
- **Topics**: `chat/room/<room_id>`
- **Features**:
  - Real-time group messaging
  - Cross-server message delivery
  - Persistent room history
  - Unread message counts

#### Direct Messages (DMs)
- **Purpose**: Private 1-on-1 conversations
- **Contact Management**: Add and manage contacts
- **Status Indicators**: Online, away, offline
- **Features**:
  - Private conversations
  - Last seen timestamps
  - Contact list with status
  - Auto-created DM conversations

### 2. Rich Messaging Features

#### Message Reply/Quotation
```typescript
// User clicks "Reply" on any message
// Reply context is shown above the message
// Example:
┌─────────────────────────────────┐
│ Replying to Alice               │
│ "Hey, how's the project going?" │
└─────────────────────────────────┘
│ It's going great! We're almost  │
│ done with the chat feature.     │
└─────────────────────────────────┘
```

**How to use**:
1. Hover over any message
2. Click the "↩️ Reply" button
3. Type your reply
4. Original message is quoted in your reply

#### @Mentions
```typescript
// Auto-detects @username in messages
// Highlights mentioned users with blue background
// Example: "Hey @Alice, can you review this?"
```

**How to use**:
1. Type `@` in the message input
2. Type the username (e.g., `@Alice`)
3. Mention is automatically highlighted
4. Stored in message metadata for notifications

**Features**:
- Auto-detection via regex
- Visual highlighting (blue background)
- Stored in `message.mentions[]` array
- Can mention multiple users

#### Image Sharing
**Supported formats**: PNG, JPG, GIF, WebP, SVG

**How to use**:
1. Click the 🖼️ (image) button
2. Select one or more images
3. Images upload and display inline
4. Click image to view full size

**Features**:
- Multiple image upload
- Inline preview
- Click to enlarge
- File name display
- Automatic thumbnail generation

#### Video Sharing
**Supported formats**: MP4, WebM, OGG

**How to use**:
1. Click the 🎥 (video) button
2. Select one or more videos
3. Videos display with player controls
4. Play/pause, volume, fullscreen

**Features**:
- Multiple video upload
- Built-in video player
- Playback controls
- Poster/thumbnail support
- File info display

#### Emoji Picker
**Library**: emoji-picker-element

**How to use**:
1. Click the 😀 (emoji) button
2. Browse emoji categories
3. Click to insert emoji
4. Picker closes automatically

**Features**:
- Full emoji library
- Category navigation
- Search functionality
- Skin tone selection
- Recently used emojis

#### File Attachments
**Supported**: Any file type

**Features**:
- File name and size display
- Download button
- File type icons
- Size formatting (MB/KB)

### 3. User Interface

#### Three-Column Layout

```
┌──────────────┬────────────────────┬──────────────┐
│ Conversations│    Chat Messages   │  User Info   │
│              │                    │              │
│ [Rooms]      │  # general         │  👤 User     │
│ [Contacts]   │  ┌──────────────┐  │  Profile     │
│              │  │ Message 1    │  │              │
│ # general    │  │ Message 2    │  │  Quick Tips  │
│ # dev        │  │ Message 3    │  │  • @mention  │
│ # random     │  └──────────────┘  │  • Reply     │
│              │                    │  • Upload    │
│ 💬 Alice     │  [Message Input]   │              │
│ 💬 Bob       │                    │              │
└──────────────┴────────────────────┴──────────────┘
```

#### Conversation List
- **Tabs**: Switch between Rooms and Contacts
- **Visual Design**:
  - Room icon: #
  - DM icon: 💬
  - User avatars with gradient
  - Status indicators (online/away/offline)
- **Information**:
  - Last message preview
  - Timestamp (e.g., "2m ago", "1h ago")
  - Unread count badges
- **Interaction**: Click to open conversation

#### Message Display
- **User Avatar**: Circular with username initial
- **Username**: Bold, prominent
- **Timestamp**: Relative time
- **Sync Status**: Shows "⏳ Sending..." for unsynced
- **Reply Context**: Quoted message shown above
- **Mentions**: Highlighted with blue background
- **Media**: Inline image/video display
- **Hover Actions**: Reply button appears on hover

#### Message Input
- **Auto-expanding**: Grows with content (max 4 lines)
- **Keyboard Shortcuts**:
  - `Enter`: Send message
  - `Shift+Enter`: New line
- **Toolbar Buttons**:
  - 🖼️ Upload image
  - 🎥 Upload video
  - @ Mention user
  - 😀 Emoji picker
- **Reply Preview**: Shows above input when replying
- **Send Button**: Disabled when empty

### 4. Connection Management

#### MQTT Connection
- **Protocol**: WebSocket (ws://)
- **Default**: `ws://localhost:8083/mqtt`
- **Status**: Real-time indicator
- **Features**:
  - Auto-reconnect with exponential backoff
  - Max 10 retry attempts
  - Connection callbacks
  - Topic subscription management

#### WebSocket Connection
- **Protocol**: WebSocket (ws://)
- **Default**: `ws://localhost:3001`
- **Status**: Real-time indicator
- **Features**:
  - Auto-reconnect with exponential backoff
  - Max 10 retry attempts
  - Graceful error handling

#### Offline Mode
- **Message Queue**: Stores unsent messages
- **Auto-sync**: Sends when connection restored
- **Visual Indicator**: Shows sync status per message
- **Persistence**: All data stored in IndexedDB

### 5. Data Persistence

#### IndexedDB Stores

**Messages Store**:
```typescript
{
  id: string;
  conversationId: string;
  conversationType: 'room' | 'direct';
  userId: string;
  username: string;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  timestamp: number;
  synced: boolean;
  attachments?: MessageAttachment[];
  replyTo?: MessageReply;
  mentions?: string[];
}
```

**Contacts Store**:
```typescript
{
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: number;
}
```

**Conversations Store**:
```typescript
{
  id: string;
  type: 'room' | 'direct';
  name: string;
  participantIds?: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}
```

## Usage Examples

### Sending a Text Message
```typescript
await chatStore.sendMessage(
  "Hello, world!",
  userId,
  username
);
```

### Replying to a Message
```typescript
await chatStore.sendMessage(
  "That's a great idea!",
  userId,
  username,
  {
    replyTo: {
      messageId: originalMessage.id,
      userId: originalMessage.userId,
      username: originalMessage.username,
      content: originalMessage.content
    }
  }
);
```

### Mentioning Users
```typescript
await chatStore.sendMessage(
  "Hey @Alice and @Bob, check this out!",
  userId,
  username,
  {
    mentions: ['Alice', 'Bob']
  }
);
```

### Sending an Image
```typescript
const attachment = {
  type: 'image',
  url: imageUrl,
  name: 'screenshot.png',
  size: 1024000,
  mimeType: 'image/png'
};

await chatStore.sendMessage(
  "📷 Image",
  userId,
  username,
  {
    attachments: [attachment]
  }
);
```

### Creating a Direct Message
```typescript
// Select a contact from the list
// System automatically creates DM conversation
const conversation = {
  id: `dm-${userId}-${contactId}`,
  type: 'direct',
  name: contactName,
  participantIds: [userId, contactId],
  unreadCount: 0
};

await chatStore.createConversation(conversation);
await chatStore.joinConversation(conversation.id, 'direct');
```

## Component API

### MessageInput Component

**Props**:
- `value: string` - Current input value
- `replyingTo: MessageReply | null` - Message being replied to
- `disabled: boolean` - Disable input

**Events**:
- `send: string` - Emitted when message is sent
- `cancelReply: void` - Emitted when reply is cancelled
- `upload: { files: FileList, type: 'image' | 'video' }` - File upload

### MessageItem Component

**Props**:
- `message: ChatMessage` - Message to display
- `isOwn: boolean` - Whether message is from current user

**Events**:
- `reply: ChatMessage` - Emitted when reply button clicked

### ConversationList Component

**Props**:
- `conversations: Conversation[]` - List of conversations
- `contacts: Contact[]` - List of contacts
- `currentConversationId: string | null` - Active conversation
- `activeTab: 'rooms' | 'contacts'` - Current tab

**Events**:
- `selectConversation: string` - Conversation selected
- `selectContact: string` - Contact selected
- `changeTab: 'rooms' | 'contacts'` - Tab changed

## Technical Details

### Message Flow

1. **User types message** → MessageInput component
2. **Mentions detected** → Regex extracts @usernames
3. **Message created** → ChatStore creates ChatMessage object
4. **Optimistic update** → Message added to UI immediately
5. **IndexedDB save** → Message persisted locally
6. **Network send**:
   - MQTT publish (for rooms)
   - WebSocket send (for local server)
7. **Mark as synced** → Update message status
8. **Remote receive** → Other users get message via MQTT/WS
9. **Display** → MessageItem component renders message

### Reconnection Strategy

```typescript
// Exponential backoff
delay = baseDelay * Math.pow(2, attemptNumber - 1)

// Example:
// Attempt 1: 1s
// Attempt 2: 2s
// Attempt 3: 4s
// Attempt 4: 8s
// ...
// Attempt 10: 512s (max)
```

### File Upload Flow

1. **User selects file** → File input dialog
2. **Create object URL** → `URL.createObjectURL(file)`
3. **Create attachment** → MessageAttachment object
4. **Send message** → With attachment metadata
5. **Display** → MessageItem renders media

**Note**: In production, files should be uploaded to a server first, then URLs stored.

## Browser Compatibility

- **IndexedDB**: All modern browsers
- **WebSocket**: All modern browsers
- **Emoji Picker**: ES6+ browsers
- **Video/Audio**: HTML5 compatible browsers

## Performance Considerations

- **Message Pagination**: Load messages in chunks for large conversations
- **Image Optimization**: Consider thumbnails for large images
- **Video Streaming**: Use video streaming for large files
- **IndexedDB Limits**: Browser storage quotas apply
- **Memory Management**: Clean up object URLs after use

## Security Notes

- **File Upload**: Validate file types and sizes
- **XSS Prevention**: Sanitize user input (especially in mentions)
- **CSRF Protection**: Implement CSRF tokens for uploads
- **Rate Limiting**: Prevent message spam
- **Authentication**: Add user authentication in production
- **Encryption**: Consider E2E encryption for DMs

## Future Enhancements

- [ ] Typing indicators
- [ ] Read receipts
- [ ] Message reactions (👍, ❤️, etc.)
- [ ] Message editing
- [ ] Message deletion
- [ ] Voice messages
- [ ] Screen sharing
- [ ] Video calls
- [ ] Group voice/video calls
- [ ] Message search
- [ ] Advanced emoji/GIF search
- [ ] File drag-and-drop
- [ ] Notification system
- [ ] Mobile app (React Native/Flutter)
