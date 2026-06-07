import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export default function Reports() {
  const { teacher } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (teacher) {
      setData(getTeacherData(teacher.id));
    }
  }, [teacher]);

  if (!data) return null;

  // Monthly collection trend
  const monthMap: Record<string, number> = {};
  data.feeRecords.forEach((r: any) => {
    if (!monthMap[r.month]) monthMap[r.month] = 0;
    monthMap[r.month] += r.paidAmount;
  });
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  // Status breakdown
  const statusCounts = { paid: 0, partial: 0, pending: 0, overdue: 0 };
  data.feeRecords.forEach((r: any) => {
    if (r.status in statusCounts) {
      statusCounts[r.status as keyof typeof statusCounts]++;
    }
  });
  const pieData = [
    { name: "Paid", value: statusCounts.paid, color: "hsl(var(--chart-3))" },
    { name: "Partial", value: statusCounts.partial, color: "hsl(var(--chart-4))" },
    { name: "Pending", value: statusCounts.pending, color: "hsl(var(--muted-foreground))" },
    { name: "Overdue", value: statusCounts.overdue, color: "hsl(var(--chart-5))" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Analytics and insights for your institute.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Collections (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
