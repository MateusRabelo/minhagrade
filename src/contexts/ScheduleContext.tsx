import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { ClassSchedule } from '../types/Schedule';

interface ScheduleContextType {
  schedules: ClassSchedule[];
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => Promise<void>;
  updateSchedule: (id: string, schedule: Partial<ClassSchedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setSchedules([]);
      return;
    }

    // Criar uma query que busca apenas os horários do usuário atual
    const q = query(
      collection(db, 'schedules'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassSchedule[];
      setSchedules(schedulesData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addSchedule = async (schedule: Omit<ClassSchedule, 'id'>) => {
    if (!currentUser) throw new Error('Must be logged in to add schedules');
    
    await addDoc(collection(db, 'schedules'), {
      ...schedule,
      userId: currentUser.uid,
      createdAt: new Date().toISOString()
    });
  };

  const updateSchedule = async (id: string, schedule: Partial<ClassSchedule>) => {
    if (!currentUser) throw new Error('Must be logged in to update schedules');
    
    const scheduleRef = doc(db, 'schedules', id);
    await updateDoc(scheduleRef, {
      ...schedule,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteSchedule = async (id: string) => {
    try {
      if (!currentUser) throw new Error('User not authenticated');
      
      // Verificar se a disciplina existe e se pode ser excluída
      const scheduleDoc = await getDoc(doc(db, 'schedules', id));
      
      if (!scheduleDoc.exists()) {
        throw new Error(`Schedule ${id} not found`);
      }
      
      const scheduleData = scheduleDoc.data();
      
      // Se a aula foi importada do sistema acadêmico e não tem a flag isDeletable,
      // não permitir a exclusão
      if (scheduleData.importedFromAcademicSystem === true && scheduleData.isDeletable !== true) {
        throw new Error('Esta aula foi importada do sistema acadêmico e não pode ser excluída');
      }
      
      // Se chegou aqui, pode excluir normalmente
      await deleteDoc(doc(db, 'schedules', id));
      
      // Atualizar estado local
      setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== id));
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      alert(error.message || 'Falha ao excluir a aula');
    }
  };

  const value = {
    schedules,
    addSchedule,
    updateSchedule,
    deleteSchedule
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
}; 