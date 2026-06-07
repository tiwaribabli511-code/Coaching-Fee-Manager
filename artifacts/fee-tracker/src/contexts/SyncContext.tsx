import {
  createContext, useCallback, useContext, useEffect, useRef,
  useState, ReactNode
} from "react";
import {
  pingGas, loadKey, saveKey, getGasUrl, ConnectionStatus
} from "@/lib/gasApi";
import { getTeacherData, saveTeacherData, getTeachers, saveTeachers } from "@/lib/storage";
import { Teacher, TeacherData } from "@/types";

interface SyncContextType {
  connectionStatus: ConnectionStatus;
  lastSynced: Date | null;
  isSyncing: boolean;
  checkConnection: () => Promise<void>;
  syncFromSheets: (teacherId: string) => Promise<void>;
  syncToSheets: (teacherId: string, data: TeacherData) => Promise<void>;
  syncTeachersFromSheets: () => Promise<Teacher[]>;
  syncTeachersToSheets: (teachers: Teacher[]) => Promise<void>;
}

const SyncContext = createContext<SyncContextType>({
  connectionStatus: "not_configured",
  lastSynced: null,
  isSyncing: false,
  checkConnection: async () => {},
  syncFromSheets: async () => {},
  syncToSheets: async () => {},
  syncTeachersFromSheets: async () => [],
  syncTeachersToSheets: async () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    getGasUrl() ? "checking" : "not_configured"
  );
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const checkConnection = useCallback(async () => {
    if (!getGasUrl()) {
      setConnectionStatus("not_configured");
      return;
    }
    setConnectionStatus("checking");
    const ok = await pingGas();
    setConnectionStatus(ok ? "connected" : "disconnected");
  }, []);

  // Pull all teacher data from Sheets → update localStorage
  const syncFromSheets = useCallback(async (teacherId: string) => {
    if (!getGasUrl() || syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const remote = (await loadKey(`data_${teacherId}`)) as TeacherData | null;
      if (remote && Array.isArray(remote.students) && Array.isArray(remote.feeRecords)) {
        saveTeacherData(teacherId, remote);
      }
      setLastSynced(new Date());
      setConnectionStatus("connected");
    } catch {
      setConnectionStatus("disconnected");
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Push teacher data to Sheets (fire-and-forget safe)
  const syncToSheets = useCallback(async (teacherId: string, data: TeacherData) => {
    if (!getGasUrl()) return;
    try {
      const ok = await saveKey(`data_${teacherId}`, data);
      if (ok) {
        setLastSynced(new Date());
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch {
      setConnectionStatus("disconnected");
    }
  }, []);

  // Pull teachers list from Sheets, merge with localStorage
  const syncTeachersFromSheets = useCallback(async (): Promise<Teacher[]> => {
    if (!getGasUrl()) return getTeachers();
    try {
      const remote = (await loadKey("teachers")) as Teacher[] | null;
      if (remote && Array.isArray(remote) && remote.length > 0) {
        // Merge: remote teachers + any local-only teachers
        const local = getTeachers();
        const merged = [...remote];
        local.forEach(lt => {
          if (!merged.some(rt => rt.email === lt.email)) merged.push(lt);
        });
        saveTeachers(merged);
        return merged;
      }
      return getTeachers();
    } catch {
      return getTeachers();
    }
  }, []);

  // Push teachers list to Sheets
  const syncTeachersToSheets = useCallback(async (teachers: Teacher[]) => {
    if (!getGasUrl()) return;
    try {
      await saveKey("teachers", teachers);
    } catch {
      // silent fail — localStorage still has the data
    }
  }, []);

  // On mount: check connection
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Re-check on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (getGasUrl()) checkConnection();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [checkConnection]);

  return (
    <SyncContext.Provider value={{
      connectionStatus,
      lastSynced,
      isSyncing,
      checkConnection,
      syncFromSheets,
      syncToSheets,
      syncTeachersFromSheets,
      syncTeachersToSheets,
    }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useSync = () => useContext(SyncContext);
