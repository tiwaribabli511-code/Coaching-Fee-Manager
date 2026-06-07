import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData } from "@/lib/storage";
import { exportToCSV } from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { teacher } = useAuth();
  const { toast } = useToast();
  
  if (!teacher) return null;

  const handleBackup = () => {
    const data = getTeacherData(teacher.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-${teacher.id}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast({ title: "Backup downloaded successfully" });
  };

  const handleExportStudents = () => {
    const data = getTeacherData(teacher.id);
    exportToCSV(`students-${teacher.id}.csv`, data.students);
    toast({ title: "Students exported" });
  };

  const handleExportFees = () => {
    const data = getTeacherData(teacher.id);
    exportToCSV(`fees-${teacher.id}.csv`, data.feeRecords);
    toast({ title: "Fee records exported" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your data, exports, and account preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Backup</CardTitle>
            <CardDescription>Download a complete JSON backup of your data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackup} className="w-full gap-2">
              <Download className="w-4 h-4" /> Download JSON Backup
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export to CSV</CardTitle>
            <CardDescription>Export your lists to CSV for Excel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleExportStudents} variant="outline" className="w-full gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export Students
            </Button>
            <Button onClick={handleExportFees} variant="outline" className="w-full gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Export Fees
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
