export interface ClassSchedule {
  id: string;
  subject: string;
  startTime: string; // formato "HH:mm"
  endTime: string;   // formato "HH:mm"
  dayOfWeek: number; // 1 = Segunda, 2 = Terça, etc.
  professor?: string;
  room?: string;
  building?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  subject: string;
  completed: boolean;
  userId: string;
  scheduleId: string;
  createdAt: string;
  updatedAt?: string;
}

export const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const TIME_SLOTS = [
  '08:00',
  '10:00',
  '13:30',
  '15:30'
];

export interface ScheduleContextType {
  schedules: ClassSchedule[];
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, schedule: Partial<ClassSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  getTodaySchedules: () => ClassSchedule[];
} 