import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'whiteboard-db';
const DB_VERSION = 1;

export interface Participant {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
  isHost: boolean;
}

export interface Sketch {
  id: string;
  participantId: string;
  participantName: string;
  snapshot: string; // tldraw snapshot JSON
  thumbnail?: string; // base64 image
  createdAt: number;
  votes: string[]; // Array of participant IDs who voted
}

export interface Session {
  id: string;
  code: string; // Short join code (e.g., "ABC123")
  name: string;
  hostId: string;
  hostName: string;
  status: 'waiting' | 'drawing' | 'gallery' | 'voting' | 'completed';
  drawingDuration: number; // in seconds
  votesPerParticipant: number;
  participants: Participant[];
  sketches: Sketch[];
  startedAt?: number;
  drawingEndsAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface VoteRecord {
  sessionId: string;
  participantId: string;
  sketchIds: string[]; // Sketch IDs voted for
  votedAt: number;
}

class WhiteboardDB {
  private db: IDBPDatabase | null = null;

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('code', 'code', { unique: true });
          sessionStore.createIndex('createdAt', 'createdAt');
        }

        // Votes store
        if (!db.objectStoreNames.contains('votes')) {
          const voteStore = db.createObjectStore('votes', { keyPath: ['sessionId', 'participantId'] });
          voteStore.createIndex('sessionId', 'sessionId');
        }
      },
    });
  }

  private async ensureDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Session operations
  async saveSession(session: Session) {
    const db = await this.ensureDB();
    await db.put('sessions', session);
  }

  async getSession(id: string): Promise<Session | undefined> {
    const db = await this.ensureDB();
    return db.get('sessions', id);
  }

  async getSessionByCode(code: string): Promise<Session | undefined> {
    const db = await this.ensureDB();
    const index = db.transaction('sessions').store.index('code');
    return index.get(code);
  }

  async getAllSessions(): Promise<Session[]> {
    const db = await this.ensureDB();
    return db.getAll('sessions');
  }

  async deleteSession(id: string) {
    const db = await this.ensureDB();
    await db.delete('sessions', id);
    // Also delete related votes
    const votes = await this.getVotesBySession(id);
    for (const vote of votes) {
      await this.deleteVote(vote.sessionId, vote.participantId);
    }
  }

  // Vote operations
  async saveVote(vote: VoteRecord) {
    const db = await this.ensureDB();
    await db.put('votes', vote);
  }

  async getVote(sessionId: string, participantId: string): Promise<VoteRecord | undefined> {
    const db = await this.ensureDB();
    return db.get('votes', [sessionId, participantId]);
  }

  async getVotesBySession(sessionId: string): Promise<VoteRecord[]> {
    const db = await this.ensureDB();
    const index = db.transaction('votes').store.index('sessionId');
    return index.getAll(sessionId);
  }

  async deleteVote(sessionId: string, participantId: string) {
    const db = await this.ensureDB();
    await db.delete('votes', [sessionId, participantId]);
  }
}

export const whiteboardDB = new WhiteboardDB();
