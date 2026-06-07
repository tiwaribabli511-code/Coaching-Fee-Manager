import { Teacher, TeacherData } from "../types";

export const TEACHERS_KEY = "cft_teachers";
export const CURRENT_TEACHER_KEY = "cft_currentTeacher";
const DATA_VERSION = 1;
const MAX_AUTO_BACKUPS = 3;

// ─── Schema Validation ────────────────────────────────────────────────────────

function isValidTeacherData(obj: unknown): obj is TeacherData {
  if (!obj || typeof obj !== "object") return false;
  const d = obj as Record<string, unknown>;
  if (!Array.isArray(d.students)) return false;
  if (!Array.isArray(d.feeRecords)) return false;
  return true;
}

function isValidTeachersArray(obj: unknown): obj is Teacher[] {
  return Array.isArray(obj);
}

// ─── Safe JSON parse ──────────────────────────────────────────────────────────

function safeParseJSON<T>(raw: string | null, validator: (v: unknown) => v is T): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ─── Teacher Directory ─────────────────────────────────────────────────────────

export function getTeachers(): Teacher[] {
  const raw = localStorage.getItem(TEACHERS_KEY);
  return safeParseJSON(raw, isValidTeachersArray) ?? [];
}

export function saveTeachers(teachers: Teacher[]) {
  try {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
  } catch (e) {
    console.error("[storage] Failed to save teachers:", e);
  }
}

// ─── Per-teacher data keys ────────────────────────────────────────────────────

function dataKey(teacherId: string) {
  return `cft_data_${teacherId}`;
}

function backupKey(teacherId: string, slot: number) {
  return `cft_autobak_${teacherId}_${slot}`;
}

// ─── Auto-backup rotation ─────────────────────────────────────────────────────

function rotateAutoBackups(teacherId: string, serialized: string) {
  // shift slots: bak_2 → bak_3, bak_1 → bak_2
  for (let slot = MAX_AUTO_BACKUPS; slot > 1; slot--) {
    const prev = localStorage.getItem(backupKey(teacherId, slot - 1));
    if (prev) {
      try { localStorage.setItem(backupKey(teacherId, slot), prev); } catch { /* quota */ }
    }
  }
  // write current as bak_1
  try {
    localStorage.setItem(backupKey(teacherId, 1), serialized);
  } catch { /* quota */ }
}

// ─── Corruption recovery ──────────────────────────────────────────────────────

function recoverFromBackups(teacherId: string): TeacherData | null {
  for (let slot = 1; slot <= MAX_AUTO_BACKUPS; slot++) {
    const raw = localStorage.getItem(backupKey(teacherId, slot));
    if (!raw) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { continue; }
    // handle versioned wrapper
    if (parsed && typeof parsed === "object" && "data" in (parsed as Record<string, unknown>)) {
      parsed = (parsed as Record<string, unknown>).data;
    }
    if (isValidTeacherData(parsed)) {
      console.warn(`[storage] Recovered data from auto-backup slot ${slot} for teacher ${teacherId}`);
      return parsed;
    }
  }
  return null;
}

// ─── Read teacher data ────────────────────────────────────────────────────────

export function getTeacherData(teacherId: string): TeacherData {
  const raw = localStorage.getItem(dataKey(teacherId));
  if (raw) {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }

    // handle versioned wrapper { version, data, savedAt }
    if (parsed && typeof parsed === "object" && "data" in (parsed as Record<string, unknown>)) {
      parsed = (parsed as Record<string, unknown>).data;
    }

    if (isValidTeacherData(parsed)) return parsed;

    // primary data is corrupted — try backups
    console.warn("[storage] Primary data corrupted, attempting recovery…");
    const recovered = recoverFromBackups(teacherId);
    if (recovered) {
      // restore recovered data as primary immediately
      saveTeacherData(teacherId, recovered);
      return recovered;
    }
  }

  const empty: TeacherData = { students: [], feeRecords: [] };
  return empty;
}

// ─── Write teacher data ───────────────────────────────────────────────────────

export type SaveStatus = "saved" | "saving" | "error";

export function saveTeacherData(
  teacherId: string,
  data: TeacherData,
  onStatus?: (status: SaveStatus) => void
) {
  onStatus?.("saving");
  try {
    const versioned = {
      version: DATA_VERSION,
      savedAt: new Date().toISOString(),
      data,
    };
    const serialized = JSON.stringify(versioned);

    // rotate backups before overwriting primary
    const existing = localStorage.getItem(dataKey(teacherId));
    if (existing) rotateAutoBackups(teacherId, existing);

    localStorage.setItem(dataKey(teacherId), serialized);
    onStatus?.("saved");
  } catch (e) {
    console.error("[storage] Failed to save teacher data:", e);
    onStatus?.("error");
  }
}

// ─── Manual backup helpers (for Settings page) ────────────────────────────────

export function exportBackupJSON(teacherId: string): string {
  const data = getTeacherData(teacherId);
  return JSON.stringify({ version: DATA_VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function importBackupJSON(teacherId: string, json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    const inner = (parsed?.data ?? parsed) as unknown;
    if (!isValidTeacherData(inner)) return false;
    saveTeacherData(teacherId, inner);
    return true;
  } catch {
    return false;
  }
}

// ─── List all auto-backup timestamps ─────────────────────────────────────────

export function getAutoBackupInfo(teacherId: string): Array<{ slot: number; savedAt: string | null }> {
  return Array.from({ length: MAX_AUTO_BACKUPS }, (_, i) => {
    const slot = i + 1;
    const raw = localStorage.getItem(backupKey(teacherId, slot));
    let savedAt: string | null = null;
    if (raw) {
      try {
        const p = JSON.parse(raw);
        savedAt = p?.savedAt ?? null;
      } catch { /* ignore */ }
    }
    return { slot, savedAt };
  });
}
