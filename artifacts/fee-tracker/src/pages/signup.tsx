import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSync } from "@/contexts/SyncContext";
import { useLocation, Link } from "wouter";
import { signup } from "@/lib/auth";
import { getTeachers } from "@/lib/storage";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [loading, setLoading] = useState(false);
  const { setTeacher } = useAuth();
  const { syncTeachersToSheets } = useSync();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = signup({ name, email, password, instituteName });
      setTeacher(user);

      // Push updated teachers list to Sheets so account is available across devices
      syncTeachersToSheets(getTeachers()); // fire-and-forget

      toast({ title: "Account created!", description: "Welcome to Coaching Fee Tracker." });
      setLocation("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg">Coaching Fee Tracker</span>
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Create Account</CardTitle>
          <CardDescription>Sign up to start managing your institute.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {[
              { id: "name",          label: "Your Full Name",    type: "text",  placeholder: "e.g. Ramesh Sharma",     val: name,          set: setName },
              { id: "instituteName", label: "Institute Name",    type: "text",  placeholder: "e.g. Sharma Academy",   val: instituteName, set: setInstituteName },
              { id: "email",         label: "Email",             type: "email", placeholder: "teacher@institute.com", val: email,         set: setEmail },
              { id: "password",      label: "Password",          type: "password", placeholder: "Min. 6 characters",  val: password,      set: setPassword },
            ].map(({ id, label, type, placeholder, val, set }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input
                  id={id}
                  type={type}
                  required
                  minLength={type === "password" ? 6 : undefined}
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  autoComplete={type === "password" ? "new-password" : undefined}
                  data-testid={`input-${id}`}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-0">
            <Button type="submit" className="w-full gap-2" disabled={loading} data-testid="button-signup">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account…" : "Create Account"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
