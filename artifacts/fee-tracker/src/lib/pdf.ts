import jsPDF from "jspdf";
import { Student, FeeRecord, Teacher } from "../types";
import { format } from "date-fns";

export function generateReceiptPDF(teacher: Teacher, student: Student, fee: FeeRecord) {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text(teacher.instituteName, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Receipt No: ${fee.receiptNumber}`, 140, 20);
  doc.text(`Date: ${fee.paidDate ? format(new Date(fee.paidDate), 'PP') : format(new Date(), 'PP')}`, 140, 28);
  
  doc.line(20, 35, 190, 35);
  
  doc.setFontSize(14);
  doc.text("Student Details:", 20, 45);
  doc.setFontSize(12);
  doc.text(`Name: ${student.name}`, 20, 55);
  doc.text(`Batch: ${student.batch}`, 20, 63);
  doc.text(`Contact: ${student.phone}`, 20, 71);
  
  doc.setFontSize(14);
  doc.text("Payment Details:", 20, 85);
  doc.setFontSize(12);
  doc.text(`Month: ${format(new Date(fee.month + "-01"), "MMMM yyyy")}`, 20, 95);
  doc.text(`Total Amount: $${fee.amount}`, 20, 103);
  doc.text(`Amount Paid: $${fee.paidAmount}`, 20, 111);
  doc.text(`Payment Method: ${fee.paymentMethod || 'N/A'}`, 20, 119);
  doc.text(`Status: ${fee.status.toUpperCase()}`, 20, 127);
  
  doc.line(20, 140, 190, 140);
  
  doc.text("Authorized Signature", 140, 160);
  doc.line(140, 155, 190, 155);
  
  doc.save(`Receipt-${fee.receiptNumber}.pdf`);
}
