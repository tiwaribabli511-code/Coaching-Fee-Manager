import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData, saveTeacherData } from "@/lib/storage";
import { generateMissingFees, getDashboardStats } from "@/lib/feeUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, DollarSign, AlertCircle, Calendar } from "lucide-react";

export default function Dashboard() {
  const { teacher } = useAuth();
  const [stats, setStats] = useState({ activeStudents: 0, collectedThisMonth: 0, pendingAmount: 0, pendingStudents: 0 });

  useEffect(() => {
    if (teacher) {
      let data = getTeacherData(teacher.id);
      data = generateMissingFees(teacher.id, data);
      saveTeacherData(teacher.id, data);
      setStats(getDashboardStats(data));
    }
  }, [teacher]);

  if (!teacher) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {teacher.name}. Here's an overview of your institute.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Collected This Month</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.collectedThisMonth.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${stats.pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From {stats.pendingStudents} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Period</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and activity feed would go here in a fuller implementation */}
      <Card className="min-h-[300px] flex items-center justify-center border-dashed border-2">
        <p className="text-muted-foreground">More features loading...</p>
      </Card>
    </div>
  );
}
