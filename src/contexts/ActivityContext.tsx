import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { Activity } from '../types/Schedule';

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'userId'>) => Promise<void>;
  updateActivity: (id: string, activity: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleActivityComplete: (id: string) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setActivities([]);
      return;
    }

    const q = query(
      collection(db, 'activities'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      setActivities(activitiesData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addActivity = async (activity: Omit<Activity, 'id' | 'userId'>) => {
    if (!currentUser) throw new Error('Must be logged in to add activities');
    
    await addDoc(collection(db, 'activities'), {
      ...activity,
      userId: currentUser.uid,
      completed: false,
      createdAt: new Date().toISOString()
    });
  };

  const updateActivity = async (id: string, activity: Partial<Activity>) => {
    if (!currentUser) throw new Error('Must be logged in to update activities');
    
    const activityRef = doc(db, 'activities', id);
    await updateDoc(activityRef, {
      ...activity,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteActivity = async (id: string) => {
    if (!currentUser) throw new Error('Must be logged in to delete activities');
    
    const activityRef = doc(db, 'activities', id);
    await deleteDoc(activityRef);
  };

  const toggleActivityComplete = async (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (activity) {
      await updateActivity(id, { completed: !activity.completed });
    }
  };

  const value = {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityComplete
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}; 