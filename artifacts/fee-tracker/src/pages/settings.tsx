import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSync } from "@/contexts/SyncContext";
import { getTeacherData, exportBackupJSON, importBackupJSON, getAutoBackupInfo } from "@/lib/storage";
import { getGasUrl, setGasUrl, clearGasUrl, pingGas, GAS_SCRIPT, isGasConfigured } from "@/lib/gasApi";
import { exportToCSV } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Download, Upload, FileSpreadsheet, ShieldCheck, Clock,
  Wifi, WifiOff, Loader2, RefreshCw, CheckCircle2, Copy,
  Database, ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { teacher } = useAuth();
  const { connectionStatus, lastSynced, isSyncing, checkConnection, syncFromSheets, syncToSheets } = useSync();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [gasUrl, setGasUrlLocal] = useState(getGasUrl() ?? "");
  const [testingUrl, setTestingUrl] = useState(false);
  const [urlTestResult, setUrlTestResult] = useState<"success" | "fail" | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  if (!teacher) return null;

  // ─── Google Sheets management ─────────────────────────────────────────────

  const handleTestUrl = async () => {
    if (!gasUrl.trim()) return;
    setTestingUrl(true);
    setUrlTestResult(null);
    const prev = getGasUrl();
    setGasUrl(gasUrl.trim());
    const ok = await pingGas();
    if (!ok) {
      if (prev) setGasUrl(prev); else clearGasUrl();
    }
    setTestingUrl(false);
    setUrlTestResult(ok ? "success" : "fail");
    await checkConnection();
  };

  const handleSaveUrl = () => {
    if (!gasUrl.trim()) { clearGasUrl(); toast({ title: "Google Sheets disconnected" }); return; }
    setGasUrl(gasUrl.trim());
    checkConnection();
    toast({ title: "Google Sheets URL saved" });
  };

  const handleSyncNow = async () => {
    await syncFromSheets(teacher.id);
    toast({ title: "Data synced from Google Sheets" });
  };

  const handlePushNow = async () => {
    const data = getTeacherData(teacher.id);
    await syncToSheets(teacher.id, data);
    toast({ title: "Data pushed to Google Sheets" });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GAS_SCRIPT).then(() => {
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 2000);
    });
  };

  // ─── Backup / restore ────────────────────────────────────────────────────

  const handleBackup = () => {
    const json = exportBackupJSON(teacher.id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cft-backup-${teacher.instituteName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Backup downloaded" });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = importBackupJSON(teacher.id, ev.target?.result as string);
      if (ok) {
        toast({ title: "Data restored", description: "Reloading the page…" });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast({ title: "Restore failed", description: "Invalid or corrupted file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportStudents = () => {
    const data = getTeacherData(teacher.id);
    exportToCSV(`students-${teacher.instituteName}.csv`, data.students);
    toast({ title: "Students exported to CSV" });
  };

  const handleExportFees = () => {
    const data = getTeacherData(teacher.id);
    exportToCSV(`fees-${teacher.instituteName}.csv`, data.feeRecords);
    toast({ title: "Fee records exported to CSV" });
  };

  const autoBackups = getAutoBackupInfo(teacher.id);
  const validBackups = autoBackups.filter(b => b.savedAt !== null);

  const connIcon = {
    connected:      <Wifi className="w-4 h-4 text-green-500" />,
    disconnected:   <WifiOff className="w-4 h-4 text-red-500" />,
    checking:       <Loader2 className="w-4 h-4 animate-spin text-amber-500" />,
    not_configured: <WifiOff className="w-4 h-4 text-slate-400" />,
  }[connectionStatus];

  const connLabel = {
    connected:      "Connected",
    disconnected:   "Not Connected",
    checking:       "Checking…",
    not_configured: "Not Configured",
  }[connectionStatus];

  const connColor = {
    connected:      "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
    disconnected:   "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
    checking:       "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
    not_configured: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  }[connectionStatus];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your data, exports, and Google Sheets connection.</p>
      </div>

      {/* ── Google Sheets Status ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="w-5 h-5 text-primary" /> Google Sheets Connection
          </CardTitle>
          <CardDescription>Your data syncs to Google Sheets so it's safe on any device.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status row */}
          <div className={cn("flex items-center justify-between gap-3 p-3 rounded-lg border", connColor)}>
            <div className="flex items-center gap-2">
              {connIcon}
              <span className="font-medium text-sm">{connLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              {lastSynced && (
                <span className="text-xs opacity-80">
                  Last sync: {format(lastSynced, "HH:mm:ss")}
                </span>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={checkConnection}>
                <RefreshCw className="w-3 h-3" /> Recheck
              </Button>
            </div>
          </div>

          {/* Sync buttons */}
          {isGasConfigured() && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={handleSyncNow} disabled={isSyncing} data-testid="button-pull-sheets">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Pull from Sheets
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handlePushNow} data-testid="button-push-sheets">
                <Upload className="w-4 h-4" /> Push to Sheets
              </Button>
            </div>
          )}

          {/* URL input */}
          <div className="space-y-2 pt-1">
            <p className="text-sm font-medium">
              {isGasConfigured() ? "Update Web App URL" : "Enter Web App URL"}
            </p>
            <Input
              value={gasUrl}
              onChange={e => { setGasUrlLocal(e.target.value); setUrlTestResult(null); }}
              placeholder="https://script.google.com/macros/s/…/exec"
              className={cn(
                "text-xs font-mono",
                urlTestResult === "success" && "border-green-400",
                urlTestResult === "fail" && "border-red-400"
              )}
              data-testid="input-gas-url"
            />
            {urlTestResult && (
              <p className={cn("text-xs", urlTestResult === "success" ? "text-green-600" : "text-red-600")}>
                {urlTestResult === "success" ? "Connection successful!" : "Connection failed — check the URL."}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleTestUrl} disabled={testingUrl || !gasUrl.trim()} className="gap-1.5" data-testid="button-test-url">
                {testingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                Test
              </Button>
              <Button size="sm" onClick={handleSaveUrl} className="gap-1.5" data-testid="button-save-url">
                <CheckCircle2 className="w-3.5 h-3.5" /> Save URL
              </Button>
              <a href="/setup" className="ml-auto">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Setup guide
                </Button>
              </a>
            </div>
          </div>

          {/* Apps Script code */}
          <div className="border-t pt-3">
            <button
              onClick={() => setShowScript(v => !v)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {showScript ? "Hide" : "Show"} Apps Script code
            </button>
            {showScript && (
              <div className="mt-2 relative">
                <pre className="bg-muted rounded-lg p-3 text-[10px] overflow-x-auto leading-relaxed max-h-40 overflow-y-auto font-mono">
                  {GAS_SCRIPT}
                </pre>
                <Button size="sm" variant="secondary" className="absolute top-2 right-2 h-6 text-xs gap-1" onClick={handleCopyScript}>
                  {scriptCopied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {scriptCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Auto-backups ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="w-5 h-5 text-green-500" /> Auto-Recovery Backups
          </CardTitle>
          <CardDescription>
            The last 3 local snapshots — auto-restored if your data ever gets corrupted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validBackups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No auto-backups yet. They appear after your first save.</p>
          ) : (
            <div className="space-y-2">
              {autoBackups.map(({ slot, savedAt }) => (
                <div key={slot} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Backup #{slot}</p>
                    <p className="text-xs text-muted-foreground">
                      {savedAt ? format(new Date(savedAt), "dd MMM yyyy, HH:mm:ss") : "Empty"}
                    </p>
                  </div>
                  {savedAt && <Badge variant="outline" className="text-green-600 border-green-300 shrink-0">Available</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Manual Backup / Restore ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Manual Backup</CardTitle>
            <CardDescription>Download a full JSON backup of your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackup} className="w-full gap-2" data-testid="button-download-backup">
              <Download className="w-4 h-4" /> Download JSON Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Restore Data</CardTitle>
            <CardDescription>Upload a previously downloaded backup file.</CardDescription>
          </CardHeader>
          <CardContent>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} data-testid="input-restore-file" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full gap-2" data-testid="button-restore-backup">
              <Upload className="w-4 h-4" /> Restore from JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── CSV Export ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Export to CSV / Excel</CardTitle>
          <CardDescription>Download lists as CSV, compatible with Excel and Google Sheets.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleExportStudents} className="flex-1 gap-2" data-testid="button-export-students">
            <FileSpreadsheet className="w-4 h-4" /> Export Students
          </Button>
          <Button variant="outline" onClick={handleExportFees} className="flex-1 gap-2" data-testid="button-export-fees">
            <FileSpreadsheet className="w-4 h-4" /> Export Fee Records
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
