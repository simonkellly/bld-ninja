import { Store } from '@tanstack/react-store';
import { timerDb, type Session } from './timer-db';

interface SessionStore {
  sessions: Session[];
  activeSession: Session;
}

export const SessionStore = new Store({} as SessionStore);

export async function setup() {
  const sessions = await timerDb.sessions.toArray();

  if (sessions.length === 0) {
    const defaultSession: Session = {
      name: 'Default Session',
      type: '3BLD',
      lastUsed: Date.now(),
    };
    await timerDb.sessions.add(defaultSession);
    await setup();
    return;
  }

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

  timerDb.sessions.update(session.id, { lastUsed: Date.now() });
  SessionStore.setState(state => ({
    ...state,
    activeSession: session,
  }));
}

export function createSession(session: Session) {
  session.lastUsed = Date.now();
  timerDb.sessions.add(session);
  SessionStore.setState(state => ({
    ...state,
    activeSession: session,
    sessions: [...state.sessions, session],
  }));
}

export function deleteSession(session: Session) {
  if (!session.id) return;

  timerDb.sessions.delete(session.id);
  timerDb.solves.where('sessionId').equals(session.id).delete();
  
  SessionStore.setState(state => {
    const remainingSessions = state.sessions.filter(s => s.id !== session.id);
    
    // If we're deleting the active session, switch to another one
    let newActiveSession = state.activeSession;
    if (state.activeSession.id === session.id && remainingSessions.length > 0) {
      // Switch to the most recently used session
      newActiveSession = remainingSessions.reduce<Session>(
        (max, s) =>
          (s.lastUsed ?? -Infinity) > (max.lastUsed ?? -Infinity) ? s : max,
        remainingSessions[0]
      );
      
      // Update the last used time for the new active session
      if (newActiveSession.id) {
        timerDb.sessions.update(newActiveSession.id, { lastUsed: Date.now() });
        newActiveSession.lastUsed = Date.now();
      }
    }
    
    return {
      ...state,
      sessions: remainingSessions,
      activeSession: newActiveSession,
    };
  });
}

export async function archiveSession(session: Session) {
  if (!session.id) return;

  const archiveSession = SessionStore.state.sessions.find(s => s.type === session.type && s.name === `${session.type} Archive`);
  let archiveSessionId = archiveSession?.id;
  if (!archiveSession) {
    const newArchive = {
      name: `${session.type} Archive`,
      type: session.type,
      lastUsed: Date.now(),
    };
    archiveSessionId = await timerDb.sessions.add(newArchive);
  }

  await timerDb.sessions.delete(session.id);
  await timerDb.solves.where('sessionId').equals(session.id).modify({
    sessionId: archiveSessionId,
  });

  const sessions = await timerDb.sessions.toArray();
  SessionStore.setState(state => ({
    ...state,
    activeSession: archiveSession!,
    sessions,
  }));
}
