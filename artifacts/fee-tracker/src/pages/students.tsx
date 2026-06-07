import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/contexts/AutoSaveContext";
import { getTeacherData } from "@/lib/storage";
import { Student } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ChevronRight, Users } from "lucide-react";

export default function Students() {
  const { teacher } = useAuth();
  const { save } = useAutoSave();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [filterBatch, setFilterBatch] = useState("");
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
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      batch: formData.batch.trim(),
      subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
      monthlyFee: Number(formData.monthlyFee),
      joiningDate: new Date().toISOString(),
      isActive: true,
    };

    const data = getTeacherData(teacher.id);
    data.students.push(newStudent);
    save(teacher.id, data);
    setStudents([...data.students]);
    setIsAddOpen(false);
    setFormData({ name: "", phone: "", batch: "", subjects: "", monthlyFee: "" });
    toast({ title: "Student added successfully" });
  };

  const batches = [...new Set(students.map(s => s.batch).filter(Boolean))];

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !search || s.name.toLowerCase().includes(q) || s.phone.includes(q);
    const matchBatch = !filterBatch || s.batch === filterBatch;
    return matchSearch && matchBatch;
  });

  const StatusBadge = ({ active }: { active: boolean }) => (
    <Badge
      variant={active ? "default" : "secondary"}
      className={active ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950/50 dark:text-green-400" : ""}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {students.length} students enrolled
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-add-student">
              <Plus className="w-4 h-4" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[calc(100vw-2rem)] sm:w-full">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-2">
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "e.g. Ravi Kumar" },
                { label: "Phone Number", key: "phone", type: "tel", placeholder: "10-digit number" },
                { label: "Batch", key: "batch", type: "text", placeholder: "e.g. Morning, Evening" },
                { label: "Subjects (comma separated)", key: "subjects", type: "text", placeholder: "e.g. Math, Science" },
                { label: "Monthly Fee (₹)", key: "monthlyFee", type: "number", placeholder: "e.g. 1500" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`field-${key}`}>{label}</Label>
                  <Input
                    id={`field-${key}`}
                    required
                    type={type}
                    placeholder={placeholder}
                    value={formData[key as keyof typeof formData]}
                    onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                    data-testid={`input-student-${key}`}
                  />
                </div>
              ))}
              <Button type="submit" className="w-full" data-testid="button-save-student">Save Student</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone…"
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-students"
          />
        </div>
        {batches.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterBatch === "" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setFilterBatch("")}
              className="text-xs"
            >
              All
            </Button>
            {batches.map(b => (
              <Button
                key={b}
                variant={filterBatch === b ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFilterBatch(b)}
                className="text-xs"
              >
                {b}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search || filterBatch ? "No students match your search" : "No students yet"}</p>
          <p className="text-sm mt-1">{!search && !filterBatch && "Click 'Add Student' to get started"}</p>
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <>
          <div className="hidden sm:block border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(student => (
                  <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.phone}</TableCell>
                    <TableCell>{student.batch}</TableCell>
                    <TableCell>₹{student.monthlyFee.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge active={student.isActive} /></TableCell>
                    <TableCell className="text-right">
                      <Link href={`/students/${student.id}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-view-student-${student.id}`}>
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {filtered.map(student => (
              <Link key={student.id} href={`/students/${student.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{student.name}</p>
                        <StatusBadge active={student.isActive} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {student.batch} · ₹{student.monthlyFee.toLocaleString()}/mo
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
