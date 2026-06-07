import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import { TeacherData } from "@/types";
import { saveTeacherData, SaveStatus } from "@/lib/storage";

interface AutoSaveContextType {
  saveStatus: SaveStatus | null;
  save: (teacherId: string, data: TeacherData) => void;
  saveImmediate: (teacherId: string, data: TeacherData) => void;
}

const AutoSaveContext = createContext<AutoSaveContextType>({
  saveStatus: null,
  save: () => {},
  saveImmediate: () => {},
});

const DEBOUNCE_MS = 800;

export function AutoSaveProvider({ children }: { children: ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ teacherId: string; data: TeacherData } | null>(null);

  const flush = useCallback(() => {
    if (!pendingRef.current) return;
    const { teacherId, data } = pendingRef.current;
    pendingRef.current = null;
    saveTeacherData(teacherId, data, setSaveStatus);
  }, []);

  const save = useCallback((teacherId: string, data: TeacherData) => {
    setSaveStatus("saving");
    pendingRef.current = { teacherId, data };
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, DEBOUNCE_MS);
  }, [flush]);

  const saveImmediate = useCallback((teacherId: string, data: TeacherData) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = null;
    saveTeacherData(teacherId, data, setSaveStatus);
  }, []);

  return (
    <AutoSaveContext.Provider value={{ saveStatus, save, saveImmediate }}>
      {children}
    </AutoSaveContext.Provider>
  );
}

export const useAutoSave = () => useContext(AutoSaveContext);
