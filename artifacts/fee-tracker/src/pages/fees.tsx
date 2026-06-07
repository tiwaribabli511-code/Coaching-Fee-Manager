import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData, saveTeacherData } from "@/lib/storage";
import { FeeRecord } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Fees() {
  const { teacher } = useAuth();
  const [records, setRecords] = useState<(FeeRecord & { studentName: string })[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedFee, setSelectedFee] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [teacher]);

  const loadData = () => {
    if (!teacher) return;
    const data = getTeacherData(teacher.id);
    const enriched = data.feeRecords.map(f => ({
      ...f,
      studentName: data.students.find(s => s.id === f.studentId)?.name || "Unknown"
    })).sort((a, b) => b.month.localeCompare(a.month));
    setRecords(enriched);
  };

  const handleMarkPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !selectedFee) return;

    const data = getTeacherData(teacher.id);
    const feeIndex = data.feeRecords.findIndex(f => f.id === selectedFee);
    if (feeIndex === -1) return;

    const fee = data.feeRecords[feeIndex];
    const amount = Number(paymentAmount);
    
    fee.paidAmount += amount;
    fee.paidDate = new Date().toISOString();
    fee.paymentMethod = paymentMethod as any;
    
    if (fee.paidAmount >= fee.amount) {
      fee.status = "paid";
    } else {
      fee.status = "partial";
    }

    saveTeacherData(teacher.id, data);
    loadData();
    setSelectedFee(null);
    setPaymentAmount("");
    toast({ title: "Payment recorded successfully" });
  };

  const filtered = records.filter(r => filterStatus === "all" || r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
          <p className="text-muted-foreground mt-1">Manage all fee collections.</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt No</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No fee records found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(fee => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium text-xs">{fee.receiptNumber}</TableCell>
                  <TableCell>{fee.studentName}</TableCell>
                  <TableCell>{fee.month}</TableCell>
                  <TableCell>${fee.amount}</TableCell>
                  <TableCell>${fee.paidAmount}</TableCell>
                  <TableCell>
                    <Badge variant={
                      fee.status === "paid" ? "default" :
                      fee.status === "overdue" ? "destructive" :
                      fee.status === "partial" ? "outline" : "secondary"
                    }>
                      {fee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {fee.status !== "paid" && (
                      <Dialog open={selectedFee === fee.id} onOpenChange={(open) => {
                        if (open) {
                          setSelectedFee(fee.id);
                          setPaymentAmount((fee.amount - fee.paidAmount).toString());
                        } else {
                          setSelectedFee(null);
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Pay</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Record Payment</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleMarkPayment} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Amount Received</Label>
                              <Input type="number" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} max={fee.amount - fee.paidAmount} />
                            </div>
                            <div className="space-y-2">
                              <Label>Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="online">Online/UPI</SelectItem>
                                  <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="submit" className="w-full">Confirm Payment</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
