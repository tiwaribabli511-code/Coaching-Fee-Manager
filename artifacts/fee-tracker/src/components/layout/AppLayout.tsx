import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoSave } from "@/contexts/AutoSaveContext";
import { Link, useLocation } from "wouter";
import { logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import {
  LayoutDashboard, Users, CreditCard, PieChart,
  Settings, UserCircle, LogOut, Menu, X, GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students",  label: "Students",  icon: Users },
  { href: "/fees",      label: "Fees",      icon: CreditCard },
  { href: "/reports",   label: "Reports",   icon: PieChart },
];

const BOTTOM_ITEMS = [
  { href: "/profile",  label: "Profile",  icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { teacher, setTeacher } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setTeacher(null);
    setLocation("/login");
    onNavigate?.();
  };

  const handleNav = () => onNavigate?.();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border/60 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm leading-tight text-foreground line-clamp-2">
          {teacher?.instituteName ?? "Fee Tracker"}
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={handleNav}>
              <button
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-border/60 space-y-0.5 shrink-0">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.startsWith(href);
          return (
            <Link key={href} href={href} onClick={handleNav}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { teacher } = useAuth();
  const { saveStatus } = useAutoSave();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  if (!teacher) return <>{children}</>;

  const currentPage = [...NAV_ITEMS, ...BOTTOM_ITEMS].find(
    item => location.startsWith(item.href)
  )?.label ?? "Dashboard";

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 lg:w-64 border-r border-border/60 bg-card flex-col shrink-0">
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 md:h-12 border-b border-border/60 bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-1">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 max-w-[80vw]">
                <NavContent onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-sm text-foreground">{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <SaveIndicator status={saveStatus} />
            <span className="hidden sm:block text-xs text-muted-foreground">
              {teacher.name}
            </span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
