# Chat CRUD Operations Guide

## Overview

The Globify Chat now supports full CRUD (Create, Read, Update, Delete) operations for both rooms and contacts.

## Features

### Room Management

#### Create Room
1. Navigate to the **Rooms** tab
2. Click the **"+ Create Room"** button
3. Enter the room name (e.g., "marketing", "design")
4. The ID will be auto-generated from the name (e.g., "marketing" → `marketing`)
5. Click **Create**

#### Edit Room
1. Hover over any room in the list
2. Click the **✏️ Edit** button that appears
3. Modify the room name
4. Click **Save**

#### Delete Room
1. Hover over any room in the list
2. Click the **🗑️ Delete** button that appears
3. Confirm deletion in the dialog
4. The room and all its messages will be removed

### Contact Management

#### Add Contact
1. Navigate to the **Contacts** tab
2. Click the **"+ Add Contact"** button
3. Enter the contact username
4. Select the status (Online, Away, Offline)
5. The ID will be auto-generated (e.g., "Alice" → `user-alice`)
6. Click **Add**

#### Edit Contact
1. Hover over any contact in the list
2. Click the **✏️ Edit** button that appears
3. Modify the username or status
4. Click **Save**

#### Delete Contact
1. Hover over any contact in the list
2. Click the **🗑️ Delete** button that appears
3. Confirm deletion in the dialog
4. The contact will be removed

## Components

### Dialog Components

#### RoomDialog
Location: [`src/lib/components/chat/RoomDialog.svelte`](src/lib/components/chat/RoomDialog.svelte)

**Props:**
- `open` (boolean, bindable) - Controls dialog visibility
- `room` (Conversation | null) - Room being edited
- `mode` ('create' | 'edit') - Dialog mode

**Events:**
- `save` - Emits `{ id: string, name: string }`
- `cancel` - Dialog closed without saving

**Usage:**
```svelte
<RoomDialog
  bind:open={showDialog}
  room={editingRoom}
  mode="create"
  on:save={handleSave}
/>
```

#### ContactDialog
Location: [`src/lib/components/chat/ContactDialog.svelte`](src/lib/components/chat/ContactDialog.svelte)

**Props:**
- `open` (boolean, bindable) - Controls dialog visibility
- `contact` (Contact | null) - Contact being edited
- `mode` ('create' | 'edit') - Dialog mode

**Events:**
- `save` - Emits `{ id: string, username: string, status: 'online' | 'offline' | 'away' }`
- `cancel` - Dialog closed without saving

**Usage:**
```svelte
<ContactDialog
  bind:open={showDialog}
  contact={editingContact}
  mode="edit"
  on:save={handleSave}
/>
```

#### DeleteConfirmDialog
Location: [`src/lib/components/chat/DeleteConfirmDialog.svelte`](src/lib/components/chat/DeleteConfirmDialog.svelte)

**Props:**
- `open` (boolean, bindable) - Controls dialog visibility
- `title` (string) - Dialog title
- `message` (string) - Confirmation message

**Events:**
- `confirm` - User confirmed deletion
- `cancel` - User cancelled deletion

**Usage:**
```svelte
<DeleteConfirmDialog
  bind:open={showDialog}
  title="Delete Room"
  message="Are you sure?"
  on:confirm={handleDelete}
/>
```

### Updated Components

#### ConversationList
Location: [`src/lib/components/chat/ConversationList.svelte`](src/lib/components/chat/ConversationList.svelte)

**New Events:**
- `createRoom` - User clicked "Create Room"
- `editRoom` - User clicked edit on a room (emits Conversation)
- `deleteRoom` - User clicked delete on a room (emits Conversation)
- `createContact` - User clicked "Add Contact"
- `editContact` - User clicked edit on a contact (emits Contact)
- `deleteContact` - User clicked delete on a contact (emits Contact)

**Features:**
- "Create Room" button in Rooms tab
- "Add Contact" button in Contacts tab
- Hover to show edit/delete buttons
- Edit (✏️) and Delete (🗑️) icons appear on hover

## Store API

### Chat Store Methods

Location: [`src/lib/stores/chat.ts`](src/lib/stores/chat.ts)

#### Room/Conversation Operations

**Create:**
```typescript
await chatStore.createConversation({
  id: 'room-id',
  type: 'room',
  name: 'Room Name',
  unreadCount: 0
});
```

**Update:**
```typescript
await chatStore.updateConversation({
  ...existingConversation,
  name: 'New Name'
});
```

**Delete:**
```typescript
await chatStore.removeConversation('room-id');
```

**Reload:**
```typescript
await chatStore.loadConversations();
```

#### Contact Operations

**Create:**
```typescript
await chatStore.addContact({
  id: 'user-alice',
  username: 'Alice',
  status: 'online'
});
```

**Update:**
```typescript
await chatStore.updateContact({
  ...existingContact,
  username: 'Alice Smith',
  status: 'away'
});
```

**Delete:**
```typescript
await chatStore.removeContact('user-alice');
```

**Reload:**
```typescript
await chatStore.loadContacts();
```

## Database Layer

### Functions

Location: [`src/lib/services/db.ts`](src/lib/services/db.ts)

**Conversations:**
- `saveConversation(conversation)` - Create or update
- `getConversation(id)` - Get by ID
- `getConversations()` - Get all
- `deleteConversation(id)` - Delete by ID

**Contacts:**
- `saveContact(contact)` - Create or update
- `getContact(id)` - Get by ID
- `getContacts()` - Get all
- `deleteContact(id)` - Delete by ID

All operations are persisted in IndexedDB and survive page refreshes.

## UI/UX Features

### Hover Actions
- Action buttons appear when hovering over rooms/contacts
- Edit and delete buttons are contextual
- Visual feedback on hover

### Auto-generated IDs
- Room IDs generated from name (lowercase, hyphenated)
  - Example: "Product Team" → `product-team`
- Contact IDs prefixed with `user-`
  - Example: "Alice" → `user-alice`

### Confirmation Dialogs
- Delete operations require confirmation
- Clear warning messages
- Separate messages for rooms vs contacts

### Keyboard Support
- Enter key to save in dialogs
- Escape key to cancel
- Tab navigation in forms

## Example Workflow

### Creating a New Team Room

1. **User Action:** Click "Create Room"
2. **Dialog Opens:** RoomDialog in 'create' mode
3. **User Input:** Enter "Design Team"
4. **ID Preview:** Shows `design-team`
5. **User Clicks:** "Create"
6. **Handler Fires:** `handleSaveRoom`
7. **Store Action:** `chatStore.createConversation`
8. **Database:** `saveConversation` to IndexedDB
9. **Store Reload:** `chatStore.loadConversations`
10. **UI Updates:** New room appears in list

### Editing a Contact

1. **User Action:** Hover over "Alice", click ✏️
2. **Dialog Opens:** ContactDialog in 'edit' mode
3. **Pre-filled:** Username="Alice", Status="online"
4. **User Changes:** Status to "away"
5. **User Clicks:** "Save"
6. **Handler Fires:** `handleSaveContact`
7. **Store Action:** `chatStore.updateContact`
8. **Database:** `saveContact` updates IndexedDB
9. **Store Reload:** `chatStore.loadContacts`
10. **UI Updates:** Alice shows 🟡 away status

### Deleting a Room

1. **User Action:** Hover over "#random", click 🗑️
2. **Dialog Opens:** DeleteConfirmDialog
3. **Warning:** "All messages will be removed"
4. **User Confirms:** Click "Delete"
5. **Handler Fires:** `handleConfirmDelete`
6. **Check Active:** If in this room, leave it
7. **Store Action:** `chatStore.removeConversation`
8. **Database:** `deleteConversation` from IndexedDB
9. **Store Reload:** `chatStore.loadConversations`
10. **UI Updates:** Room removed from list

## Technical Details

### State Management

Dialog states in main page:
```typescript
let showRoomDialog = $state(false);
let showContactDialog = $state(false);
let showDeleteDialog = $state(false);
let editingRoom = $state<Conversation | null>(null);
let editingContact = $state<Contact | null>(null);
let deletingItem = $state<{
  type: 'room' | 'contact';
  item: Conversation | Contact
} | null>(null);
```

### Event Flow

```
User Click
    ↓
Event Handler (ConversationList)
    ↓
Custom Event Dispatch
    ↓
Page Handler (e.g., handleEditRoom)
    ↓
Open Dialog / Set State
    ↓
User Input
    ↓
Save/Delete Handler
    ↓
Chat Store Method
    ↓
Database Operation (IndexedDB)
    ↓
Reload Store
    ↓
UI Re-renders
```

### Persistence

All CRUD operations are immediately persisted to IndexedDB:
- Survives page refresh
- Works offline
- No server required for demo
- Can be extended with API calls

## Best Practices

### When Creating
- Use descriptive room names
- Choose appropriate contact statuses
- Check for duplicates before creating

### When Editing
- Update names to keep them relevant
- Keep contact statuses current
- Consider impact on active conversations

### When Deleting
- Double-check before confirming
- Understand that room messages are deleted
- Consider archiving instead of deleting

## Future Enhancements

Potential improvements:
- [ ] Bulk operations (multi-select delete)
- [ ] Room descriptions/topics
- [ ] Contact groups/categories
- [ ] Room avatars/icons
- [ ] Import/export contacts
- [ ] Search/filter rooms and contacts
- [ ] Duplicate detection
- [ ] Undo delete functionality
- [ ] Audit log for changes
- [ ] Permissions (who can create/delete)

## Troubleshooting

### Dialog doesn't open
- Check event handler binding
- Verify dialog state is set to true
- Check browser console for errors

### Changes don't persist
- Verify IndexedDB is enabled
- Check browser storage quota
- Look for database errors in console

### Duplicate IDs
- Ensure ID generation is unique
- Check existing items before creating
- Consider adding validation

## Summary

The chat application now supports full CRUD operations for rooms and contacts with:
- ✅ Intuitive UI with hover actions
- ✅ Modal dialogs for all operations
- ✅ Confirmation for destructive actions
- ✅ Auto-generated IDs
- ✅ IndexedDB persistence
- ✅ Real-time UI updates
- ✅ Keyboard support
- ✅ Clear visual feedback
