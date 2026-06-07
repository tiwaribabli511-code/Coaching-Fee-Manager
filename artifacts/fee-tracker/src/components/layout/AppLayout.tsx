import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, CreditCard, PieChart, Settings, UserCircle, LogOut } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { teacher, setTeacher } = useAuth();
  const [location, setLocation] = useLocation();

  if (!teacher) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    setTeacher(null);
    setLocation("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
    { href: "/fees", label: "Fees", icon: CreditCard },
    { href: "/reports", label: "Reports", icon: PieChart },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-lg text-primary">{teacher.instituteName}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t space-y-1">
          <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <UserCircle className="w-4 h-4" /> Profile
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
