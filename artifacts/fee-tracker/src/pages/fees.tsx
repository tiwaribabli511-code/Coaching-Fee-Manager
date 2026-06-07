import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/contexts/AutoSaveContext";
import { getTeacherData } from "@/lib/storage";
import { FeeRecord } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

type EnrichedFee = FeeRecord & { studentName: string };

const STATUS_COLORS = {
  paid:    "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.pending}`}>
      {status}
    </span>
  );
}

export default function Fees() {
  const { teacher } = useAuth();
  const { save } = useAutoSave();
  const [records, setRecords] = useState<EnrichedFee[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedFee, setSelectedFee] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { toast } = useToast();

  const loadData = () => {
    if (!teacher) return;
    const data = getTeacherData(teacher.id);
    const enriched: EnrichedFee[] = data.feeRecords.map(f => ({
      ...f,
      studentName: data.students.find(s => s.id === f.studentId)?.name ?? "Unknown",
    })).sort((a, b) => b.month.localeCompare(a.month));
    setRecords(enriched);
  };

  useEffect(() => { loadData(); }, [teacher]);

  const handleMarkPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !selectedFee) return;

    const data = getTeacherData(teacher.id);
    const idx = data.feeRecords.findIndex(f => f.id === selectedFee);
    if (idx === -1) return;

    const fee = data.feeRecords[idx];
    const amount = Number(paymentAmount);

    fee.paidAmount += amount;
    fee.paidDate = new Date().toISOString();
    fee.paymentMethod = paymentMethod as "cash" | "online" | "cheque";
    fee.status = fee.paidAmount >= fee.amount ? "paid" : "partial";

    save(teacher.id, data);
    loadData();
    setSelectedFee(null);
    setPaymentAmount("");
    toast({ title: "Payment recorded successfully" });
  };

  const filtered = records.filter(r => filterStatus === "all" || r.status === filterStatus);
  const selectedRecord = records.find(r => r.id === selectedFee);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fees</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {records.length} total records
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-fee-filter">
            <SelectValue placeholder="Filter status" />
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

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No fee records found</p>
          <p className="text-sm mt-1">Add students to auto-generate monthly fees</p>
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <>
          <div className="hidden sm:block border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Receipt No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(fee => (
                  <TableRow key={fee.id} data-testid={`row-fee-${fee.id}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{fee.receiptNumber}</TableCell>
                    <TableCell className="font-medium">{fee.studentName}</TableCell>
                    <TableCell>{fee.month}</TableCell>
                    <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                    <TableCell>₹{fee.paidAmount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={fee.status} /></TableCell>
                    <TableCell className="text-right">
                      {fee.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFee(fee.id);
                            setPaymentAmount((fee.amount - fee.paidAmount).toString());
                          }}
                          data-testid={`button-pay-${fee.id}`}
                        >
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {filtered.map(fee => (
              <Card key={fee.id} className={fee.status === "overdue" ? "border-red-200 dark:border-red-900" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{fee.studentName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{fee.receiptNumber}</p>
                    </div>
                    <StatusBadge status={fee.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3 gap-2">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>{fee.month}</p>
                      <p>₹{fee.paidAmount.toLocaleString()} / ₹{fee.amount.toLocaleString()}</p>
                    </div>
                    {fee.status !== "paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFee(fee.id);
                          setPaymentAmount((fee.amount - fee.paidAmount).toString());
                        }}
                        data-testid={`button-pay-mobile-${fee.id}`}
                      >
                        Record Payment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Payment dialog */}
      <Dialog open={!!selectedFee} onOpenChange={(open) => { if (!open) setSelectedFee(null); }}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
              <p><span className="font-medium text-foreground">{selectedRecord.studentName}</span> · {selectedRecord.month}</p>
              <p className="mt-0.5">Outstanding: ₹{(selectedRecord.amount - selectedRecord.paidAmount).toLocaleString()}</p>
            </div>
          )}
          <form onSubmit={handleMarkPayment} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount Received (₹)</Label>
              <Input
                type="number"
                required
                min="1"
                max={selectedRecord ? selectedRecord.amount - selectedRecord.paidAmount : undefined}
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                data-testid="input-payment-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online / UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" data-testid="button-confirm-payment">
              Confirm Payment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
