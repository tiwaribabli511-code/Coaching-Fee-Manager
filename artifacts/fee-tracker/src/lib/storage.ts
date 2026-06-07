import { Teacher, TeacherData, Student, FeeRecord } from "../types";

export const TEACHERS_KEY = "cft_teachers";
export const CURRENT_TEACHER_KEY = "cft_currentTeacher";

export function getTeachers(): Teacher[] {
  const data = localStorage.getItem(TEACHERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTeachers(teachers: Teacher[]) {
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
}

export function getTeacherData(teacherId: string): TeacherData {
  const data = localStorage.getItem(`cft_data_${teacherId}`);
  if (data) {
    return JSON.parse(data);
  }
  return {
    students: [],
    feeRecords: []
  };
}

export function saveTeacherData(teacherId: string, data: TeacherData) {
  localStorage.setItem(`cft_data_${teacherId}`, JSON.stringify(data));
}
