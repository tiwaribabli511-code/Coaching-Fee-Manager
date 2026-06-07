// ─── Google Apps Script API client ───────────────────────────────────────────
// All data is stored in a Google Sheet via a GAS Web App URL.
// localStorage is used as a fast cache + offline fallback.

export const GAS_URL_KEY = "cft_gas_url";
export const GAS_SKIP_KEY = "cft_skip_gas";

export type ConnectionStatus = "connected" | "disconnected" | "checking" | "not_configured";

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function getGasUrl(): string | null {
  return localStorage.getItem(GAS_URL_KEY) || null;
}

export function setGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_KEY, url.trim());
  localStorage.removeItem(GAS_SKIP_KEY);
}

export function clearGasUrl(): void {
  localStorage.removeItem(GAS_URL_KEY);
}

export function isGasConfigured(): boolean {
  return !!localStorage.getItem(GAS_URL_KEY);
}

// ─── Low-level fetch helpers ──────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
}

async function gasGet(action: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = getGasUrl();
  if (!url) throw new Error("GAS URL not configured");

  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await withTimeout(fetch(`${url}?${qs}`), 12000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function gasPost(body: Record<string, unknown>): Promise<unknown> {
  const url = getGasUrl();
  if (!url) throw new Error("GAS URL not configured");

  // Use text/plain to avoid CORS preflight on GAS Web Apps
  const res = await withTimeout(
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    }),
    15000
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function pingGas(): Promise<boolean> {
  try {
    const data = (await gasGet("ping")) as { ok: boolean };
    return data?.ok === true;
  } catch {
    return false;
  }
}

export async function loadKey(key: string): Promise<unknown> {
  try {
    const res = (await gasGet("get", { key })) as { ok: boolean; value: string | null };
    if (res?.value) {
      try {
        return JSON.parse(res.value);
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveKey(key: string, value: unknown): Promise<boolean> {
  try {
    const res = (await gasPost({
      action: "set",
      key,
      value: JSON.stringify(value),
    })) as { ok: boolean };
    return res?.ok === true;
  } catch {
    return false;
  }
}

// ─── GAS Script template (shown to users on Setup page) ──────────────────────

export const GAS_SCRIPT = `function doGet(e) {
  var action = e.parameter.action;
  if (action === 'ping') return out({ok: true, message: 'Connected!'});
  if (action === 'get') return out({ok: true, value: getValue(e.parameter.key)});
  return out({ok: false, error: 'Unknown action'});
}

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.action === 'set') {
    setValue(body.key, body.value);
    return out({ok: true});
  }
  return out({ok: false, error: 'Unknown action'});
}

function getValue(key) {
  var sheet = getSheet();
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(key)) return vals[i][1];
  }
  return null;
}

function setValue(key, value) {
  var sheet = getSheet();
  var vals = sheet.getDataRange().getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]) === String(key)) {
      sheet.getRange(i+1,2).setValue(value);
      sheet.getRange(i+1,3).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([key, value, new Date().toISOString()]);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName('CFT_Data');
  if (!s) {
    s = ss.insertSheet('CFT_Data');
    s.appendRow(['key', 'value', 'updatedAt']);
    s.setFrozenRows(1);
  }
  return s;
}

function out(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;
