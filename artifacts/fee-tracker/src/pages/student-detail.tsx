import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/contexts/AutoSaveContext";
import { getTeacherData } from "@/lib/storage";
import { FeeRecord, Student } from "@/types";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateReceiptPDF } from "@/lib/pdf";
import { ArrowLeft, Download, MessageCircle, User, Phone, IndianRupee, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  paid:    "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400",
};

export default function StudentDetail() {
  const { id } = useParams();
  const { teacher } = useAuth();
  const { save } = useAutoSave();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [payingFee, setPayingFee] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { toast } = useToast();

  const loadData = () => {
    if (!teacher || !id) return;
    const data = getTeacherData(teacher.id);
    const s = data.students.find(s => s.id === id);
    if (s) {
      setStudent(s);
      setFees(data.feeRecords.filter(f => f.studentId === id).sort((a, b) => b.month.localeCompare(a.month)));
    }
  };

  useEffect(() => { loadData(); }, [teacher, id]);

  const handleWhatsApp = (fee: FeeRecord) => {
    if (!student || !teacher) return;
    const text = `Dear ${student.name}'s parent, your fee of ₹${fee.paidAmount} for ${fee.month} has been received. Receipt No: ${fee.receiptNumber}. Thank you! - ${teacher.instituteName}`;
    window.open(`https://wa.me/${student.phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher || !payingFee) return;
    const data = getTeacherData(teacher.id);
    const idx = data.feeRecords.findIndex(f => f.id === payingFee);
    if (idx === -1) return;

    const fee = data.feeRecords[idx];
    fee.paidAmount += Number(paymentAmount);
    fee.paidDate = new Date().toISOString();
    fee.paymentMethod = paymentMethod as "cash" | "online" | "cheque";
    fee.status = fee.paidAmount >= fee.amount ? "paid" : "partial";

    save(teacher.id, data);
    loadData();
    setPayingFee(null);
    setPaymentAmount("");
    toast({ title: "Payment recorded" });
  };

  if (!student || !teacher) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground">
      Student not found.
    </div>
  );

  const selectedFee = fees.find(f => f.id === payingFee);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/students">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{student.name}</h1>
          <p className="text-muted-foreground text-sm truncate">{student.batch} Batch · {student.subjects.join(", ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center py-2">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="w-10 h-10" />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { icon: Phone, label: "Phone", value: student.phone },
                { icon: IndianRupee, label: "Monthly Fee", value: `₹${student.monthlyFee.toLocaleString()}` },
                { icon: Calendar, label: "Joined", value: format(new Date(student.joiningDate), "dd MMM yyyy") },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              ))}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={student.isActive ? "default" : "secondary"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee history */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fee History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fees.length === 0 ? (
              <p className="text-muted-foreground text-center py-12 text-sm">No fee records yet.</p>
            ) : (
              <div className="divide-y">
                {fees.map(fee => (
                  <div key={fee.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{fee.month}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[fee.status] ?? ""}`}>
                          {fee.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ₹{fee.paidAmount.toLocaleString()} paid of ₹{fee.amount.toLocaleString()}
                        {fee.paidDate && ` · ${format(new Date(fee.paidDate), "dd MMM")}`}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0 flex-wrap">
                      {fee.status !== "pending" && fee.status !== "overdue" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateReceiptPDF(teacher, student, fee)}
                            data-testid={`button-pdf-${fee.id}`}
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsApp(fee)}
                            data-testid={`button-whatsapp-${fee.id}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                          </Button>
                        </>
                      )}
                      {fee.status !== "paid" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setPayingFee(fee.id);
                            setPaymentAmount((fee.amount - fee.paidAmount).toString());
                          }}
                          data-testid={`button-pay-${fee.id}`}
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment dialog */}
      <Dialog open={!!payingFee} onOpenChange={(open) => { if (!open) setPayingFee(null); }}>
        <DialogContent className="max-w-sm w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedFee && (
            <div className="text-sm p-3 bg-muted/50 rounded-lg mb-4">
              <p className="font-medium">{student.name} · {selectedFee.month}</p>
              <p className="text-muted-foreground mt-0.5">Outstanding: ₹{(selectedFee.amount - selectedFee.paidAmount).toLocaleString()}</p>
            </div>
          )}
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                required
                min="1"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                data-testid="input-payment-amount"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online / UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Confirm Payment</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
