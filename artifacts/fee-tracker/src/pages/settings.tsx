import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData, exportBackupJSON, importBackupJSON, getAutoBackupInfo } from "@/lib/storage";
import { exportToCSV } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileSpreadsheet, ShieldCheck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Settings() {
  const { teacher } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!teacher) return null;

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
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const success = importBackupJSON(teacher.id, json);
      if (success) {
        toast({ title: "Data restored successfully", description: "Reload the page to see the changes." });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast({ title: "Restore failed", description: "Invalid or corrupted backup file.", variant: "destructive" });
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your data, exports, and backups.</p>
      </div>

      {/* Auto-backup status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            Auto-Recovery Backups
          </CardTitle>
          <CardDescription>
            The app automatically keeps the last 3 snapshots of your data. If your data ever gets corrupted, it will auto-restore from the latest backup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validBackups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No auto-backups yet. They appear after your first data save.</p>
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
                  {savedAt && (
                    <Badge variant="outline" className="text-green-600 border-green-300 shrink-0">
                      Available
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual backup / restore */}
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
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestore}
              data-testid="input-restore-file"
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="w-full gap-2"
              data-testid="button-restore-backup"
            >
              <Upload className="w-4 h-4" /> Restore from JSON
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CSV Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Export to CSV / Excel</CardTitle>
          <CardDescription>Download your lists as CSV files, compatible with Excel and Google Sheets.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleExportStudents}
            className="flex-1 gap-2"
            data-testid="button-export-students"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Students
          </Button>
          <Button
            variant="outline"
            onClick={handleExportFees}
            className="flex-1 gap-2"
            data-testid="button-export-fees"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Fee Records
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
