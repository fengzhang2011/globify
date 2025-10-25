import { writable, get } from 'svelte/store';
import { nanoid } from 'nanoid';
import { whiteboardDB, type Session, type Participant, type Sketch, type VoteRecord } from '$lib/services/whiteboard-db';

interface WhiteboardState {
  sessions: Session[];
  currentSession: Session | null;
  currentParticipant: Participant | null;
  loading: boolean;
  wsConnected: boolean;
}

const initialState: WhiteboardState = {
  sessions: [],
  currentSession: null,
  currentParticipant: null,
  loading: false,
  wsConnected: false,
};

function createWhiteboardStore() {
  const { subscribe, set, update } = writable<WhiteboardState>(initialState);

  // Broadcast changes to other tabs/windows
  function broadcastChange(session: Session) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whiteboard_sync', JSON.stringify({
        session,
        timestamp: Date.now()
      }));
    }
  }

  // Listen for changes from other tabs/windows
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', async (e) => {
      if (e.key === 'whiteboard_sync' && e.newValue) {
        try {
          const { session } = JSON.parse(e.newValue);
          // Update local state with the new session data
          update(state => {
            if (state.currentSession?.id === session.id) {
              return {
                ...state,
                currentSession: session,
                sessions: state.sessions.map(s => s.id === session.id ? session : s),
              };
            }
            return state;
          });
          // Also update IndexedDB
          await whiteboardDB.saveSession(session);
        } catch (err) {
          console.error('Failed to sync session:', err);
        }
      }
    });
  }

  // Generate a short join code
  function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // Generate a random color for participant
  function generateColor(): string {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return {
    subscribe,

    async init() {
      update(state => ({ ...state, loading: true }));
      try {
        await whiteboardDB.init();
        const sessions = await whiteboardDB.getAllSessions();
        update(state => ({ ...state, sessions, loading: false }));
      } catch (error) {
        console.error('Failed to initialize whiteboard store:', error);
        update(state => ({ ...state, loading: false }));
      }
    },

    async createSession(hostName: string, sessionName: string, drawingDuration: number = 300, votesPerParticipant: number = 3) {
      const code = generateCode();
      const hostId = nanoid();

      const host: Participant = {
        id: hostId,
        name: hostName,
        color: generateColor(),
        joinedAt: Date.now(),
        isHost: true,
      };

      const newSession: Session = {
        id: nanoid(),
        code,
        name: sessionName,
        hostId,
        hostName,
        status: 'waiting',
        drawingDuration,
        votesPerParticipant,
        participants: [host],
        sketches: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await whiteboardDB.saveSession(newSession);

      update(state => ({
        ...state,
        sessions: [...state.sessions, newSession],
        currentSession: newSession,
        currentParticipant: host,
      }));

      broadcastChange(newSession);

      return { session: newSession, participant: host };
    },

    async joinSession(code: string, participantName: string) {
      const session = await whiteboardDB.getSessionByCode(code.toUpperCase());

      if (!session) {
        throw new Error('Session not found');
      }

      // Allow joining at any stage except 'completed'
      if (session.status === 'completed') {
        throw new Error('This session has already ended');
      }

      // Check if participant already exists (rejoining) - check both host and non-host
      const existingParticipant = session.participants.find(
        p => p.name === participantName
      );

      let participant: Participant;

      if (existingParticipant) {
        // Rejoining - reuse existing participant
        participant = existingParticipant;
      } else {
        // New participant - create new entry
        participant = {
          id: nanoid(),
          name: participantName,
          color: generateColor(),
          joinedAt: Date.now(),
          isHost: false,
        };

        session.participants.push(participant);
        session.updatedAt = Date.now();

        await whiteboardDB.saveSession(session);
        broadcastChange(session);
      }

      update(state => ({
        ...state,
        currentSession: session,
        currentParticipant: participant,
        sessions: state.sessions.map(s => s.id === session.id ? session : s),
      }));

      return { session, participant };
    },

    async resumeSession(sessionId: string, participantId: string) {
      const session = await whiteboardDB.getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      const participant = session.participants.find(p => p.id === participantId);

      if (!participant) {
        throw new Error('Participant not found in session');
      }

      update(state => ({
        ...state,
        currentSession: session,
        currentParticipant: participant,
        sessions: state.sessions.map(s => s.id === session.id ? session : s),
      }));

      return { session, participant };
    },

    async loadSession(sessionId: string) {
      const session = await whiteboardDB.getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      update(state => ({
        ...state,
        currentSession: session,
        currentParticipant: null, // View as observer without participant
        sessions: state.sessions.map(s => s.id === session.id ? session : s),
      }));

      return session;
    },

    async startDrawing() {
      const state = get({ subscribe });
      if (!state.currentSession || !state.currentParticipant?.isHost) {
        throw new Error('Only host can start drawing');
      }

      const session = state.currentSession;
      session.status = 'drawing';
      session.startedAt = Date.now();
      session.drawingEndsAt = Date.now() + (session.drawingDuration * 1000);
      session.updatedAt = Date.now();

      await whiteboardDB.saveSession(session);

      update(s => ({
        ...s,
        currentSession: session,
        sessions: s.sessions.map(sess => sess.id === session.id ? session : sess),
      }));

      broadcastChange(session);
    },

    async saveSketch(snapshot: string, thumbnail?: string) {
      const state = get({ subscribe });
      if (!state.currentSession || !state.currentParticipant) {
        throw new Error('No active session');
      }

      const sketch: Sketch = {
        id: nanoid(),
        participantId: state.currentParticipant.id,
        participantName: state.currentParticipant.name,
        snapshot,
        thumbnail,
        createdAt: Date.now(),
        votes: [],
      };

      const session = state.currentSession;

      // Replace existing sketch from this participant or add new
      const existingIndex = session.sketches.findIndex(s => s.participantId === state.currentParticipant!.id);
      if (existingIndex >= 0) {
        session.sketches[existingIndex] = sketch;
      } else {
        session.sketches.push(sketch);
      }

      session.updatedAt = Date.now();

      await whiteboardDB.saveSession(session);

      update(s => ({
        ...s,
        currentSession: session,
        sessions: s.sessions.map(sess => sess.id === session.id ? session : sess),
      }));

      broadcastChange(session);
    },

    async endDrawing() {
      const state = get({ subscribe });
      if (!state.currentSession || !state.currentParticipant?.isHost) {
        throw new Error('Only host can end drawing');
      }

      const session = state.currentSession;
      session.status = 'gallery';
      session.updatedAt = Date.now();

      await whiteboardDB.saveSession(session);

      update(s => ({
        ...s,
        currentSession: session,
        sessions: s.sessions.map(sess => sess.id === session.id ? session : sess),
      }));

      broadcastChange(session);
    },

    async startVoting() {
      const state = get({ subscribe });
      if (!state.currentSession || !state.currentParticipant?.isHost) {
        throw new Error('Only host can start voting');
      }

      const session = state.currentSession;
      session.status = 'voting';
      session.updatedAt = Date.now();

      await whiteboardDB.saveSession(session);

      update(s => ({
        ...s,
        currentSession: session,
        sessions: s.sessions.map(sess => sess.id === session.id ? session : sess),
      }));

      broadcastChange(session);
    },

    async vote(sketchIds: string[]) {
      const state = get({ subscribe });
      if (!state.currentSession || !state.currentParticipant) {
        throw new Error('No active session');
      }

      const session = state.currentSession;

      if (sketchIds.length > session.votesPerParticipant) {
        throw new Error(`You can only vote for ${session.votesPerParticipant} sketches`);
      }

      // Update vote counts in sketches
      session.sketches = session.sketches.map(sketch => ({
        ...sketch,
        votes: sketchIds.includes(sketch.id)
          ? [...sketch.votes.filter(v => v !== state.currentParticipant!.id), state.currentParticipant!.id]
          : sketch.votes.filter(v => v !== state.currentParticipant!.id)
      }));

      session.updatedAt = Date.now();

      const voteRecord: VoteRecord = {
        sessionId: session.id,
        participantId: state.currentParticipant.id,
        sketchIds,
        votedAt: Date.now(),
      };

      await whiteboardDB.saveVote(voteRecord);
      await whiteboardDB.saveSession(session);

      update(s => ({
        ...s,
        currentSession: session,
        sessions: s.sessions.map(sess => sess.id === session.id ? session : sess),
      }));

      broadcastChange(session);
    },

    async endVoting() {
      const state = get({ subscribe });
      if (!state.currentSession || !state.currentParticipant?.isHost) {
        throw new Error('Only host can end voting');
      }

      const session = state.currentSession;
      session.status = 'completed';
      session.updatedAt = Date.now();

      await whiteboardDB.saveSession(session);

      update(s => ({
        ...s,
        currentSession: session,
        sessions: s.sessions.map(sess => sess.id === session.id ? session : sess),
      }));

      broadcastChange(session);
    },

    async leaveSession() {
      update(state => ({
        ...state,
        currentSession: null,
        currentParticipant: null,
      }));
    },

    async deleteSession(sessionId: string) {
      await whiteboardDB.deleteSession(sessionId);
      update(state => ({
        ...state,
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
      }));
    },

    setWsConnected(connected: boolean) {
      update(state => ({ ...state, wsConnected: connected }));
    },

    updateSessionFromWs(session: Session) {
      update(state => ({
        ...state,
        currentSession: state.currentSession?.id === session.id ? session : state.currentSession,
        sessions: state.sessions.map(s => s.id === session.id ? session : s),
      }));
    },
  };
}

export const whiteboardStore = createWhiteboardStore();
