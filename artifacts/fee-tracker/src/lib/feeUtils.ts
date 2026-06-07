import { Student, FeeRecord, TeacherData } from "../types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

export function generateMissingFees(teacherId: string, data: TeacherData): TeacherData {
  const currentMonth = format(new Date(), "yyyy-MM");
  const { students, feeRecords } = data;
  let updated = false;

  const newRecords = [...feeRecords];

  for (const student of students) {
    if (!student.isActive) continue;
    
    const exists = newRecords.some(r => r.studentId === student.id && r.month === currentMonth);
    if (!exists) {
      const joiningMonth = format(new Date(student.joiningDate), "yyyy-MM");
      if (currentMonth >= joiningMonth) {
        newRecords.push({
          id: uuidv4(),
          studentId: student.id,
          teacherId,
          month: currentMonth,
          amount: student.monthlyFee,
          paidAmount: 0,
          status: "pending",
          receiptNumber: `RCP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        });
        updated = true;
      }
    }
  }

  for (const r of newRecords) {
    if ((r.status === "pending" || r.status === "partial") && r.month < currentMonth) {
      r.status = "overdue";
      updated = true;
    }
  }

  if (updated) {
    return { ...data, feeRecords: newRecords };
  }
  return data;
}

export function getDashboardStats(data: TeacherData) {
  const currentMonth = format(new Date(), "yyyy-MM");
  const activeStudents = data.students.filter(s => s.isActive).length;
  
  const currentMonthFees = data.feeRecords.filter(r => r.month === currentMonth);
  const collectedThisMonth = currentMonthFees.reduce((sum, r) => sum + r.paidAmount, 0);
  
  const pendingAmount = data.feeRecords.reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);
  const pendingStudents = new Set(data.feeRecords.filter(r => r.amount > r.paidAmount).map(r => r.studentId)).size;

  return { activeStudents, collectedThisMonth, pendingAmount, pendingStudents };
}
