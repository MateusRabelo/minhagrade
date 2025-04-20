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
  importedFromAcademicSystem?: boolean; // Indica se foi importado de um sistema acadêmico
  isDeletable?: boolean; // Indica se pode ser excluído
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

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: number; // horas antes do prazo
  showOverdue: boolean;
  showUpcoming: boolean;
  upcomingThreshold: number; // horas antes de considerar uma atividade como "em breve"
  dailyDigest: boolean;
  dailyDigestTime: string; // formato "HH:MM"
}

export interface ScheduleContextType {
  schedules: ClassSchedule[];
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, schedule: Partial<ClassSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  getTodaySchedules: () => ClassSchedule[];
} 