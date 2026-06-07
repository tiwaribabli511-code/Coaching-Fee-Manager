import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { saveTeachers, getTeachers, CURRENT_TEACHER_KEY } from "@/lib/storage";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { teacher, setTeacher } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", instituteName: "", phone: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        email: teacher.email,
        instituteName: teacher.instituteName,
        phone: teacher.phone || ""
      });
    }
  }, [teacher]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    const teachers = getTeachers();
    const index = teachers.findIndex(t => t.id === teacher.id);
    if (index !== -1) {
      teachers[index] = { ...teachers[index], ...formData };
      saveTeachers(teachers);
      setTeacher(teachers[index]);
      sessionStorage.setItem(CURRENT_TEACHER_KEY, JSON.stringify(teachers[index]));
      toast({ title: "Profile updated successfully" });
    }
  };

  if (!teacher) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Update your personal and institute details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>This information will appear on student receipts.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSave}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Institute Name</Label>
              <Input required value={formData.instituteName} onChange={e => setFormData({ ...formData, instituteName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required disabled value={formData.email} className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
