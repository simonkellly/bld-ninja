import ResultsStats from "./results-stats";
import ResultsTable from "./results-table";
import { useStore } from "@tanstack/react-store";
import { SessionStore } from "../logic/session-store";
import SessionManager from "./session-manager";
import { useLiveQuery } from "dexie-react-hooks";
import { timerDb } from "../logic/timer-db";
import { ResultsStore } from "../logic/result-store";
import { useEffect } from "react";

export default function Sidebar() {
  const currentSession = useStore(SessionStore, state => state.activeSession);
  const results = useLiveQuery(() => timerDb.solves.where('sessionId').equals(currentSession.id ?? '').toArray(), [currentSession.id]);

  useEffect(() => {
    ResultsStore.setState(state => ({
      ...state,
      results: results ?? [],
    }));
  }, [results]);

  return (
    <div className="w-[22rem] flex-none flex flex-col rounded-large p-4 border-small border-default-200 rounded-r-none">
      <SessionManager />
      <ResultsStats />
      <ResultsTable />
    </div>
  );
}