import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData, saveTeacherData } from "@/lib/storage";
import { FeeRecord, Student } from "@/types";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateReceiptPDF } from "@/lib/pdf";
import { ArrowLeft, Download, MessageCircle, User } from "lucide-react";

export default function StudentDetail() {
  const { id } = useParams();
  const { teacher } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);

  useEffect(() => {
    if (teacher && id) {
      const data = getTeacherData(teacher.id);
      const foundStudent = data.students.find(s => s.id === id);
      if (foundStudent) {
        setStudent(foundStudent);
        setFees(data.feeRecords.filter(f => f.studentId === id).sort((a, b) => b.month.localeCompare(a.month)));
      }
    }
  }, [teacher, id]);

  if (!student || !teacher) return <div className="p-6">Student not found.</div>;

  const handleWhatsApp = (fee: FeeRecord) => {
    const text = `Dear ${student.name}'s parent, your fee of $${fee.paidAmount} for ${fee.month} has been received. Receipt No: ${fee.receiptNumber}. Thank you! - ${teacher.instituteName}`;
    const url = `https://wa.me/${student.phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students">
          <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          <p className="text-muted-foreground">{student.batch} Batch • {student.subjects.join(", ")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <User className="w-12 h-12" />
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Phone</span>
              <p className="font-medium">{student.phone}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Monthly Fee</span>
              <p className="font-medium">${student.monthlyFee}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Joining Date</span>
              <p className="font-medium">{new Date(student.joiningDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <div>
                <Badge variant={student.isActive ? "default" : "secondary"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Fee History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fees.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No fee records found.</p>
              ) : (
                fees.map(fee => (
                  <div key={fee.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{fee.month}</span>
                        <Badge variant={
                          fee.status === "paid" ? "default" :
                          fee.status === "overdue" ? "destructive" :
                          fee.status === "partial" ? "outline" : "secondary"
                        }>
                          {fee.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Amount: ${fee.amount} • Paid: ${fee.paidAmount}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {fee.status === "paid" || fee.status === "partial" ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => generateReceiptPDF(teacher, student, fee)}>
                            <Download className="w-4 h-4 mr-2" /> PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleWhatsApp(fee)}>
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
