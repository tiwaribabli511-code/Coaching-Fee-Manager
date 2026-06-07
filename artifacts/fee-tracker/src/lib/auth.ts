import { Teacher } from "../types";
import { getTeachers, saveTeachers, CURRENT_TEACHER_KEY } from "./storage";
import { v4 as uuidv4 } from "uuid";

export function login(email: string, password: string): Teacher | null {
  const teachers = getTeachers();
  const teacher = teachers.find(t => t.email === email && t.password === btoa(password));
  if (teacher) {
    sessionStorage.setItem(CURRENT_TEACHER_KEY, JSON.stringify(teacher));
    return teacher;
  }
  return null;
}

export function signup(data: Omit<Teacher, "id" | "createdAt" | "password"> & { password: string }): Teacher {
  const teachers = getTeachers();
  if (teachers.some(t => t.email === data.email)) {
    throw new Error("Email already exists");
  }
  const newTeacher: Teacher = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    password: btoa(data.password)
  };
  teachers.push(newTeacher);
  saveTeachers(teachers);
  return newTeacher;
}

export function logout() {
  sessionStorage.removeItem(CURRENT_TEACHER_KEY);
}

export function getCurrentTeacher(): Teacher | null {
  const data = sessionStorage.getItem(CURRENT_TEACHER_KEY);
  return data ? JSON.parse(data) : null;
}
