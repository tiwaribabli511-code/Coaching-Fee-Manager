import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData } from "@/lib/storage";
import { TeacherData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Legend
} from "recharts";
import { format } from "date-fns";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#94a3b8", "#ef4444"];

export default function Reports() {
  const { teacher } = useAuth();
  const [data, setData] = useState<TeacherData | null>(null);

  useEffect(() => {
    if (teacher) setData(getTeacherData(teacher.id));
  }, [teacher]);

  if (!data) return null;

  // Monthly collection trend (last 12 months)
  const monthMap: Record<string, number> = {};
  data.feeRecords.forEach(r => {
    monthMap[r.month] = (monthMap[r.month] ?? 0) + r.paidAmount;
  });
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month: format(new Date(month + "-01"), "MMM yy"), amount }));

  // Status breakdown
  const counts = { paid: 0, partial: 0, pending: 0, overdue: 0 };
  data.feeRecords.forEach(r => {
    if (r.status in counts) counts[r.status as keyof typeof counts]++;
  });
  const pieData = [
    { name: "Paid",    value: counts.paid },
    { name: "Partial", value: counts.partial },
    { name: "Pending", value: counts.pending },
    { name: "Overdue", value: counts.overdue },
  ].filter(d => d.value > 0);

  // Subject revenue
  const subjectMap: Record<string, number> = {};
  data.feeRecords.forEach(r => {
    const student = data.students.find(s => s.id === r.studentId);
    if (!student) return;
    student.subjects.forEach(sub => {
      subjectMap[sub] = (subjectMap[sub] ?? 0) + r.paidAmount;
    });
  });
  const subjectData = Object.entries(subjectMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([subject, amount]) => ({ subject, amount }));

  // Summary stats
  const totalCollected = data.feeRecords.reduce((s, r) => s + r.paidAmount, 0);
  const totalPending   = data.feeRecords.reduce((s, r) => s + (r.amount - r.paidAmount), 0);
  const collectionRate = data.feeRecords.length > 0
    ? Math.round((counts.paid / data.feeRecords.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">Analytics and financial insights for your institute.</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total Collected", value: `₹${totalCollected.toLocaleString()}` },
          { label: "Total Pending",   value: `₹${totalPending.toLocaleString()}` },
          { label: "Collection Rate", value: `${collectionRate}%` },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 sm:p-5">
              <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
              <p className="text-base sm:text-2xl font-bold mt-0.5 truncate">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Monthly Collection Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[260px] px-1 sm:px-4">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Collected"]} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Fee Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[260px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius="35%"
                    outerRadius="60%"
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Subject revenue */}
        {subjectData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Revenue by Subject</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px] sm:h-[260px] px-1 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {subjectData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${220 + i * 30}, 70%, 55%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
