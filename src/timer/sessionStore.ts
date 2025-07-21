import { Store } from '@tanstack/react-store';
import { db, Session } from '@/lib/db';

interface SessionStore {
  sessions: Session[];
  activeSession: Session;
}

export const SessionStore = new Store({} as SessionStore);

export async function setup() {
  const sessions = await db.sessions.toArray();
  const activeSession = sessions.reduce<Session>(
    (max, session) =>
      (session.lastUsed ?? -Infinity) > (max.lastUsed ?? -Infinity)
        ? session
        : max,
    sessions[0]
  );

  SessionStore.setState(() => ({
    sessions,
    activeSession,
  }));
}

export function setActiveSession(session: Session) {
  if (!session.id) return;

  db.sessions.update(session.id, { lastUsed: Date.now() });
  SessionStore.setState(state => ({
    ...state,
    activeSession: session,
  }));
}

export function createSession(session: Session) {
  session.lastUsed = Date.now();
  db.sessions.add(session);
  SessionStore.setState(state => ({
    ...state,
    activeSession: session,
    sessions: [...state.sessions, session],
  }));
}

export function deleteSession(session: Session) {
  if (!session.id) return;

  db.sessions.delete(session.id);
  db.solves.where('sessionId').equals(session.id).delete();
  SessionStore.setState(state => ({
    ...state,
    sessions: state.sessions.filter(s => s.id !== session.id),
  }));
}
