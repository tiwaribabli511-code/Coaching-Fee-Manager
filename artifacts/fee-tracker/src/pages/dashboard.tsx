import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/contexts/AutoSaveContext";
import { getTeacherData } from "@/lib/storage";
import { generateMissingFees, getDashboardStats } from "@/lib/feeUtils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, IndianRupee, AlertCircle, Calendar, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
import { TeacherData } from "@/types";
import { format } from "date-fns";

export default function Dashboard() {
  const { teacher } = useAuth();
  const { saveImmediate } = useAutoSave();
  const [stats, setStats] = useState({
    activeStudents: 0, collectedThisMonth: 0, pendingAmount: 0, pendingStudents: 0
  });
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; amount: number }>>([]);
  const [data, setData] = useState<TeacherData | null>(null);

  useEffect(() => {
    if (!teacher) return;
    let d = getTeacherData(teacher.id);
    const updated = generateMissingFees(teacher.id, d);
    if (updated !== d) {
      saveImmediate(teacher.id, updated);
      d = updated;
    }
    setData(d);
    setStats(getDashboardStats(d));

    // build monthly collection for last 6 months
    const monthMap: Record<string, number> = {};
    d.feeRecords.forEach(r => {
      monthMap[r.month] = (monthMap[r.month] ?? 0) + r.paidAmount;
    });
    const sorted = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month: format(new Date(month + "-01"), "MMM yy"), amount }));
    setMonthlyData(sorted);
  }, [teacher, saveImmediate]);

  if (!teacher) return null;

  const statCards = [
    {
      label: "Active Students",
      value: stats.activeStudents,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Collected This Month",
      value: `₹${stats.collectedThisMonth.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-950/30",
    },
    {
      label: "Total Pending",
      value: `₹${stats.pendingAmount.toLocaleString()}`,
      sub: `From ${stats.pendingStudents} students`,
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
    {
      label: "Current Period",
      value: format(new Date(), "MMM yyyy"),
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Welcome back, {teacher.name}.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{label}</p>
                  <p className={`text-lg sm:text-2xl font-bold mt-1 truncate ${color}`} data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
                    {value}
                  </p>
                  {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
                </div>
                <div className={`${bg} ${color} p-2 rounded-lg shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Monthly Collections
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[260px] px-2 sm:px-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Collected"]} />
                  <Area
                    type="monotone" dataKey="amount"
                    stroke="hsl(var(--primary))" strokeWidth={2}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No collection data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Fee Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[260px] px-2 sm:px-4">
            {data && data.feeRecords.length > 0 ? (() => {
              const counts = { paid: 0, partial: 0, pending: 0, overdue: 0 };
              data.feeRecords.forEach(r => {
                if (r.status in counts) counts[r.status as keyof typeof counts]++;
              });
              const barData = [
                { name: "Paid",    value: counts.paid,    fill: "#22c55e" },
                { name: "Partial", value: counts.partial, fill: "#f59e0b" },
                { name: "Pending", value: counts.pending, fill: "#94a3b8" },
                { name: "Overdue", value: counts.overdue, fill: "#ef4444" },
              ];
              return (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              );
            })() : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No fee records yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent fee records */}
      {data && data.feeRecords.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data.feeRecords
                .filter(f => f.paidDate)
                .sort((a, b) => (b.paidDate ?? "").localeCompare(a.paidDate ?? ""))
                .slice(0, 5)
                .map(fee => {
                  const student = data.students.find(s => s.id === fee.studentId);
                  return (
                    <div key={fee.id} className="flex items-center justify-between px-4 sm:px-6 py-3 gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{student?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{fee.month} · {fee.receiptNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-green-600">+₹{fee.paidAmount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{fee.paymentMethod ?? "cash"}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
