export interface Teacher {
  id: string;
  name: string;
  email: string;
  password: string;
  instituteName: string;
  phone?: string;
  logo?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  teacherId: string;
  name: string;
  phone: string;
  parentPhone?: string;
  email?: string;
  batch: string;
  subjects: string[];
  monthlyFee: number;
  joiningDate: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  photo?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  teacherId: string;
  month: string;
  amount: number;
  paidAmount: number;
  status: "paid" | "partial" | "pending" | "overdue";
  paidDate?: string;
  receiptNumber: string;
  notes?: string;
  paymentMethod?: "cash" | "online" | "cheque";
}

export interface TeacherData {
  students: Student[];
  feeRecords: FeeRecord[];
  lastBackup?: string;
}
