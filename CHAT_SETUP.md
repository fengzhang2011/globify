# Globify Chat - Setup Guide

## Overview

A real-time chat application built with SvelteKit that supports cross-server messaging via MQTT (NanoMQ) and local server messaging via WebSockets (uWebSockets.js), with offline message persistence using IndexedDB.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SvelteKit Frontend                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Chat UI (+page.svelte)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                             │                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               Chat Store (chat.ts)                      │ │
│  │         - State Management                             │ │
│  │         - Message Coordination                         │ │
│  └────────────────────────────────────────────────────────┘ │
│           │                          │                       │
│  ┌────────────────┐       ┌─────────────────────┐          │
│  │ MQTT Service   │       │ WebSocket Service   │          │
│  │ (mqtt.ts)      │       │ (websocket.ts)      │          │
│  │                │       │                     │          │
│  │ - Cross-server │       │ - Local server      │          │
│  │ - NanoMQ       │       │ - uWebSockets.js    │          │
│  │ - Auto-reconnect│      │ - Auto-reconnect    │          │
│  └────────────────┘       └─────────────────────┘          │
│           │                          │                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           IndexedDB Service (db.ts)                    │ │
│  │         - Offline message storage                      │ │
│  │         - Message persistence                          │ │
│  │         - Sync tracking                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    │                          │
                    ▼                          ▼
          ┌─────────────────┐      ┌──────────────────┐
          │  NanoMQ Broker  │      │  uWebSockets.js  │
          │  (Port 8083)    │      │   (Port 3001)    │
          └─────────────────┘      └──────────────────┘
```

## Features

### ✅ Implemented

1. **MQTT WebSocket Connection**
   - Connect to NanoMQ broker via WebSocket protocol
   - Subscribe to room-based topics: `chat/room/<room_id>`
   - Publish messages with QoS 1
   - Automatic reconnection with exponential backoff

2. **Local WebSocket Integration**
   - Connect to uWebSockets.js server for local messages
   - Real-time message delivery within the same server
   - Automatic reconnection

3. **Offline Storage (IndexedDB)**
   - Persist all messages locally
   - Store unsynced messages when offline
   - Auto-sync when connection restored
   - Query messages by conversation
   - Store contacts and conversations

4. **Dual Messaging Modes**
   - **Room/Group Chat**: Public channels with MQTT topics
   - **Direct Messages**: Private 1-on-1 conversations
   - Unified conversation list with tabs
   - Contact management with online status

5. **Rich Messaging Features**
   - **Message Reply/Quotation**: Click reply to quote any message
   - **@Mentions**: Type @ to mention users (auto-highlighted)
   - **Image Sharing**: Upload and display images inline
   - **Video Sharing**: Upload and play videos with controls
   - **Emoji Picker**: Built-in emoji selector
   - **Message Attachments**: Support for files with download

6. **Enhanced Chat UI**
   - Three-column layout (Conversations | Chat | User Info)
   - Room and contact tabs for easy navigation
   - Message threading with reply context
   - Rich media previews
   - Connection status indicators (MQTT & WebSocket)
   - User avatars and timestamps
   - Auto-scroll to new messages
   - Offline message indicators
   - Hover actions (reply, etc.)

7. **Error Handling & Reconnection**
   - Automatic reconnection for both MQTT and WebSocket
   - Max retry limits with exponential backoff
   - Connection status tracking
   - Graceful offline mode

## File Structure

```
src/
├── lib/
│   ├── services/
│   │   ├── db.ts              # IndexedDB operations (messages, contacts, conversations)
│   │   ├── mqtt.ts            # MQTT client wrapper
│   │   └── websocket.ts       # WebSocket client wrapper
│   ├── stores/
│   │   └── chat.ts            # Svelte store for chat state
│   ├── components/
│   │   ├── chat/
│   │   │   ├── EmojiPicker.svelte        # Emoji picker component
│   │   │   ├── MessageInput.svelte       # Rich message input with attachments
│   │   │   ├── MessageItem.svelte        # Message display with replies/media
│   │   │   └── ConversationList.svelte   # Room and contact list
│   │   └── ui/                # shadcn-svelte components
└── routes/
    └── chat/
        └── +page.svelte       # Enhanced chat UI
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

Dependencies added:
- `mqtt@5.14.1` - MQTT client library
- `idb@8.0.3` - IndexedDB wrapper
- `emoji-picker-element@1.27.0` - Emoji picker component

### 2. Setup NanoMQ Broker

Install NanoMQ:
```bash
# Using Docker (recommended)
docker run -d --name nanomq -p 1883:1883 -p 8083:8083 emqx/nanomq:latest

# Or install locally
# https://nanomq.io/docs/en/latest/installation.html
```

Configure NanoMQ to enable WebSocket on port 8083 (usually enabled by default).

### 3. Setup uWebSockets.js Server (Optional)

Create a simple WebSocket server for local messages:

```javascript
// server.js
const uWS = require('uWebSockets.js');

const app = uWS.App();

app.ws('/*', {
  open: (ws) => {
    console.log('Client connected');
  },
  message: (ws, message, isBinary) => {
    // Broadcast to all connected clients
    app.publish('chat', message, isBinary);
  },
  close: (ws) => {
    console.log('Client disconnected');
  }
});

app.listen(3001, (token) => {
  if (token) {
    console.log('WebSocket server listening on port 3001');
  }
});
```

Run the server:
```bash
node server.js
```

### 4. Configure Connection URLs

Edit [+page.svelte:23-26](src/routes/+page.svelte#L23-L26):

```typescript
await chatStore.initialize(
  'ws://localhost:8083/mqtt',  // Your NanoMQ WebSocket URL
  'ws://localhost:3001'        // Your uWebSockets.js server URL
);
```

### 5. Run the Application

```bash
pnpm dev
```

Visit `http://localhost:5173` to see the chat interface.

## Usage

### Basic Chat Operations

```typescript
// Initialize the chat store
await chatStore.initialize(mqttBrokerUrl, wsServerUrl);

// Join a room
await chatStore.joinRoom('general');

// Send a message
await chatStore.sendMessage('Hello!', userId, username);

// Leave a room
await chatStore.leaveRoom();

// Disconnect
chatStore.disconnect();
```

### Working with Messages

```typescript
import { messages, connectionStatus } from '$lib/stores/chat';

// Subscribe to messages
$: chatMessages = $messages;

// Check connection status
$: isConnected = $connectionStatus;
```

### Direct Service Usage

```typescript
import { getMQTTService } from '$lib/services/mqtt';
import { getWebSocketService } from '$lib/services/websocket';

// MQTT operations
const mqtt = getMQTTService('ws://localhost:8083/mqtt');
await mqtt.connect();
mqtt.subscribeToRoom('roomId');
mqtt.publishMessage('roomId', message);

// WebSocket operations
const ws = getWebSocketService('ws://localhost:3001');
await ws.connect();
ws.sendMessage(message);
```

## API Reference

### ChatMessage Interface

```typescript
interface ChatMessage {
  id: string;          // Unique message ID
  roomId: string;      // Room identifier
  userId: string;      // Sender user ID
  username: string;    // Sender username
  content: string;     // Message content
  timestamp: number;   // Unix timestamp
  synced: boolean;     // Sync status
}
```

### Chat Store Methods

- `initialize(mqttUrl?, wsUrl?)` - Connect to both services
- `joinRoom(roomId)` - Subscribe to a room and load messages
- `leaveRoom()` - Unsubscribe from current room
- `sendMessage(content, userId, username)` - Send a message
- `clearError()` - Clear error state
- `disconnect()` - Close all connections

### MQTT Service Methods

- `connect()` - Connect to MQTT broker
- `subscribeToRoom(roomId)` - Subscribe to room topic
- `unsubscribeFromRoom(roomId)` - Unsubscribe from room
- `publishMessage(roomId, message)` - Publish message to room
- `onMessage(callback)` - Listen for incoming messages
- `onConnectionChange(callback)` - Listen for connection changes
- `disconnect()` - Close connection
- `isConnected()` - Check connection status

### WebSocket Service Methods

- `connect()` - Connect to WebSocket server
- `sendMessage(message)` - Send message
- `onMessage(callback)` - Listen for incoming messages
- `onConnectionChange(callback)` - Listen for connection changes
- `disconnect()` - Close connection
- `isConnected()` - Check connection status

### IndexedDB Service Methods

- `initDB()` - Initialize database
- `saveMessage(message)` - Store a message
- `getMessagesByRoom(roomId)` - Get all messages for a room
- `getUnsyncedMessages()` - Get messages not yet synced
- `markMessageAsSynced(messageId)` - Mark message as synced
- `deleteMessage(messageId)` - Delete a message
- `clearAllMessages()` - Clear all messages

## Configuration

### MQTT Topics

Messages are published/subscribed using the pattern:
```
chat/room/<room_id>
```

Example: `chat/room/general`

### Reconnection Settings

MQTT Service ([mqtt.ts](src/lib/services/mqtt.ts)):
```typescript
private maxReconnectAttempts = 10;
private reconnectDelay = 1000;  // 1 second
```

WebSocket Service ([websocket.ts](src/lib/services/websocket.ts)):
```typescript
private maxReconnectAttempts = 10;
private reconnectDelay = 1000;  // Exponential backoff
```

## Troubleshooting

### MQTT Connection Issues

1. **Check NanoMQ is running:**
   ```bash
   docker ps | grep nanomq
   ```

2. **Verify WebSocket port:**
   - Default: `ws://localhost:8083/mqtt`
   - Check NanoMQ configuration

3. **Check browser console:**
   - Look for MQTT connection errors
   - Verify broker URL is correct

### WebSocket Connection Issues

1. **Verify uWS server is running:**
   ```bash
   # Should see "WebSocket server listening on port 3001"
   ```

2. **Check CORS settings:**
   - WebSocket connections may be blocked by CORS
   - Ensure server allows connections from your origin

### IndexedDB Issues

1. **Clear browser data:**
   - Open DevTools → Application → IndexedDB
   - Delete `chat-db` database

2. **Check browser support:**
   - IndexedDB is supported in all modern browsers
   - Private/incognito mode may have limitations

## Production Considerations

1. **Authentication & Authorization**
   - Add user authentication
   - Implement JWT tokens
   - Validate user permissions for rooms

2. **Message Encryption**
   - Encrypt messages end-to-end
   - Use TLS/SSL for WebSocket connections

3. **Rate Limiting**
   - Implement message rate limits
   - Prevent spam and abuse

4. **Scalability**
   - Use MQTT clustering for horizontal scaling
   - Implement message persistence on the server
   - Add message pagination

5. **Error Recovery**
   - Add retry mechanisms for failed messages
   - Implement conflict resolution
   - Handle duplicate messages

6. **Monitoring**
   - Add logging and analytics
   - Monitor connection health
   - Track message delivery rates

## Next Steps

- [ ] Add user authentication
- [ ] Implement message encryption
- [ ] Add file/image sharing
- [ ] Implement typing indicators
- [ ] Add read receipts
- [ ] Support message reactions
- [ ] Add user presence (online/offline)
- [ ] Implement message search
- [ ] Add notification support
- [ ] Create mobile responsive design

## License

MIT
