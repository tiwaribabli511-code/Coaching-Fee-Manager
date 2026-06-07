import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherData, saveTeacherData } from "@/lib/storage";
import { Student } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus } from "lucide-react";

export default function Students() {
  const { teacher } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "", phone: "", batch: "", subjects: "", monthlyFee: ""
  });

  useEffect(() => {
    if (teacher) {
      const data = getTeacherData(teacher.id);
      setStudents(data.students);
    }
  }, [teacher]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;
    
    const newStudent: Student = {
      id: uuidv4(),
      teacherId: teacher.id,
      name: formData.name,
      phone: formData.phone,
      batch: formData.batch,
      subjects: formData.subjects.split(",").map(s => s.trim()),
      monthlyFee: Number(formData.monthlyFee),
      joiningDate: new Date().toISOString(),
      isActive: true
    };

    const data = getTeacherData(teacher.id);
    data.students.push(newStudent);
    saveTeacherData(teacher.id, data);
    setStudents(data.students);
    setIsAddOpen(false);
    setFormData({ name: "", phone: "", batch: "", subjects: "", monthlyFee: "" });
    toast({ title: "Student added successfully" });
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">Manage your student directory.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Input required value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Subjects (comma separated)</Label>
                <Input required value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Monthly Fee</Label>
                <Input required type="number" value={formData.monthlyFee} onChange={e => setFormData({...formData, monthlyFee: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save Student</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell>${student.monthlyFee}</TableCell>
                  <TableCell>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/students/${student.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
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
