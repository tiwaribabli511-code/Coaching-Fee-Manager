import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Teacher } from "../types";
import { getCurrentTeacher } from "../lib/auth";

interface AuthContextType {
  teacher: Teacher | null;
  setTeacher: (teacher: Teacher | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ teacher: null, setTeacher: () => {}, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTeacher(getCurrentTeacher());
    setIsLoading(false);
  }, []);

  return <AuthContext.Provider value={{ teacher, setTeacher, isLoading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
