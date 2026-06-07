import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect } from "react";

// Pages
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import Students from "@/pages/students";
import StudentDetail from "@/pages/student-detail";
import Fees from "@/pages/fees";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { teacher, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !teacher) {
      setLocation("/login");
    }
  }, [teacher, isLoading, setLocation]);

  if (isLoading || !teacher) return null;

  return <Component {...rest} />;
}

function RedirectRoute() {
  const { teacher, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      setLocation(teacher ? "/dashboard" : "/login");
    }
  }, [teacher, isLoading, setLocation]);

  return null;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={RedirectRoute} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
        <Route path="/students" component={() => <ProtectedRoute component={Students} />} />
        <Route path="/students/:id" component={() => <ProtectedRoute component={StudentDetail} />} />
        <Route path="/fees" component={() => <ProtectedRoute component={Fees} />} />
        <Route path="/reports" component={() => <ProtectedRoute component={Reports} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
