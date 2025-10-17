# Globify Chat - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ and pnpm installed
- Docker (optional, for NanoMQ)

### Step 1: Install Dependencies
```bash
cd /path/to/globify
pnpm install
```

### Step 2: Start NanoMQ (Optional)
```bash
# Using Docker
docker run -d --name nanomq -p 1883:1883 -p 8083:8083 emqx/nanomq:latest

# Verify it's running
docker ps | grep nanomq
```

### Step 3: Start the App
```bash
pnpm dev
```

### Step 4: Open in Browser
Navigate to: `http://localhost:5173/chat`

## ✨ First Time Usage

### Demo Data
The app automatically creates:
- 4 default rooms: `#general`, `#development`, `#random`, `#announcements`
- 3 demo contacts: `Alice`, `Bob`, `Charlie`

### Your User
- Random username: `User XXX`
- Random user ID: `user-xxxxxx`
- (In production, these would come from authentication)

## 📱 Feature Tour

### 1. Send Your First Message
1. Select `#general` from the room list (left sidebar)
2. Type a message in the input box at the bottom
3. Press `Enter` to send

### 2. Reply to a Message
1. Hover over any message
2. Click the "↩️ Reply" button
3. Type your reply
4. The original message will be quoted

### 3. Mention Someone
1. Type `@` followed by a username (e.g., `@Alice`)
2. The mention will be highlighted in blue
3. Send the message

### 4. Send an Image
1. Click the 🖼️ button next to the message input
2. Select an image file
3. Image uploads and displays inline

### 5. Send a Video
1. Click the 🎥 button
2. Select a video file
3. Video displays with playback controls

### 6. Use Emojis
1. Click the 😀 button
2. Browse or search for an emoji
3. Click to insert into your message

### 7. Start a Direct Message
1. Click the "Contacts" tab in the left sidebar
2. Click on a contact (e.g., `Alice`)
3. A new DM conversation is created
4. Start chatting privately

## 🎯 Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line (without sending)

## 🔌 Connection Status

Look at the top-right corner for connection indicators:
- 🟢 **Green** = Connected
- 🔴 **Red** = Disconnected

Two connections:
- **MQTT**: Cross-server messaging (NanoMQ)
- **WebSocket**: Local server messaging

## 💡 Tips & Tricks

### Offline Mode
- Messages are saved locally even when offline
- They'll sync automatically when connection is restored
- Look for "⏳ Sending..." indicator

### Multiple Rooms
- Switch between rooms using the left sidebar
- Each room maintains its own message history
- Unread counts show on room badges

### Rich Messages
- Combine features: reply + mention + emoji
- Example: Reply to someone and mention another user

### Media Upload
- Upload multiple images/videos at once
- Click on images to view full size
- Videos have playback controls

## 🐛 Troubleshooting

### "MQTT Disconnected" Error
**Problem**: Can't connect to NanoMQ broker

**Solutions**:
1. Check if NanoMQ is running: `docker ps | grep nanomq`
2. Restart NanoMQ: `docker restart nanomq`
3. Check port 8083 is not in use
4. Update URL in code if using different port

### "WebSocket Disconnected" Error
**Problem**: Can't connect to local WebSocket server

**Solutions**:
1. Check if uWebSockets.js server is running
2. The app works without WebSocket (MQTT only)
3. Update URL in code if using different port

### Messages Not Sending
**Problem**: Messages stuck with "⏳ Sending..."

**Solutions**:
1. Check internet connection
2. Check MQTT/WebSocket connection status
3. Messages will auto-sync when connection restored
4. Check browser console for errors

### Images/Videos Not Displaying
**Problem**: Uploaded media not showing

**Solutions**:
1. Check file format is supported
2. Try smaller file sizes (< 10MB recommended)
3. Check browser console for errors
4. Clear IndexedDB and refresh

### Emoji Picker Not Loading
**Problem**: Emoji button doesn't work

**Solutions**:
1. Wait a few seconds (first load is slow)
2. Refresh the page
3. Check browser console for errors

## 📚 Next Steps

### Production Deployment
1. Set up proper authentication
2. Upload files to server (not object URLs)
3. Configure production MQTT broker URL
4. Set up WebSocket server (uWebSockets.js)
5. Enable HTTPS/WSS
6. Add rate limiting
7. Implement user management

### Advanced Features
- Explore [CHAT_FEATURES.md](./CHAT_FEATURES.md) for detailed feature documentation
- Read [CHAT_SETUP.md](./CHAT_SETUP.md) for full setup guide
- Check component API documentation

### Customization
- Change room names in `initializeDemoData()`
- Update color scheme in components
- Modify message input toolbar
- Add custom emoji sets
- Customize user avatars

## 🔗 Useful Links

- **MQTT Docs**: https://mqtt.org/
- **NanoMQ**: https://nanomq.io/
- **uWebSockets.js**: https://github.com/uNetworking/uWebSockets.js
- **IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Emoji Picker**: https://github.com/nolanlawson/emoji-picker-element

## ❓ Need Help?

Check the detailed documentation:
- [CHAT_SETUP.md](./CHAT_SETUP.md) - Full setup and configuration
- [CHAT_FEATURES.md](./CHAT_FEATURES.md) - Complete feature reference

## 🎉 Have Fun Chatting!

You're all set! Enjoy using Globify Chat. Try out all the features:
- ✅ Send messages in rooms
- ✅ Start direct conversations
- ✅ Reply to messages
- ✅ Mention your friends
- ✅ Share images and videos
- ✅ Use emojis
- ✅ Works offline!
