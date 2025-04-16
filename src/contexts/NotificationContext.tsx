import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { NotificationSettings } from '../types/Schedule';

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  saveSettings: () => Promise<void>;
  hasPermissionError: boolean;
}

// Configurações padrão
const defaultSettings: NotificationSettings = {
  enabled: true,
  reminderTime: 24, // 24 horas antes do prazo
  showOverdue: true,
  showUpcoming: true,
  upcomingThreshold: 48, // 48 horas (2 dias) antes é considerado "em breve"
  dailyDigest: false,
  dailyDigestTime: '09:00', // 9 da manhã
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const { currentUser } = useAuth();

  // Carregar configurações do usuário do Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) {
        setSettings(defaultSettings);
        setHasPermissionError(false);
        return;
      }

      try {
        const settingsRef = doc(db, 'notificationSettings', currentUser.uid);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as NotificationSettings);
          setHasPermissionError(false);
        } else {
          // Se não existir, tentar criar com as configurações padrão
          try {
            await setDoc(settingsRef, defaultSettings);
            setHasPermissionError(false);
          } catch (error) {
            console.error('Erro ao criar configurações de notificação iniciais:', error);
            setHasPermissionError(true);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de notificação:', error);
        // Se tivermos um erro de permissão, usamos as configurações padrão
        setSettings(defaultSettings);
        setHasPermissionError(true);
      }
    };

    loadSettings();
  }, [currentUser]);

  // Atualizar configurações localmente
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Salvar configurações no Firestore
  const saveSettings = async () => {
    if (!currentUser) throw new Error('Usuário deve estar logado para salvar configurações');

    try {
      const settingsRef = doc(db, 'notificationSettings', currentUser.uid);
      await setDoc(settingsRef, settings);
      setHasPermissionError(false);
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
      setHasPermissionError(true);
      // Ainda assim, não lançamos o erro, apenas notificamos o usuário através da UI
    }
  };

  return (
    <NotificationContext.Provider value={{ settings, updateSettings, saveSettings, hasPermissionError }}>
      {children}
    </NotificationContext.Provider>
  );
}; 