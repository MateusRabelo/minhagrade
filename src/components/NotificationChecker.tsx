import { useEffect, useRef } from 'react';
import { useActivity } from '../contexts/ActivityContext';
import { useNotification } from '../contexts/NotificationContext';
import { requestNotificationPermission, shouldNotifyActivity, sendActivityNotification, sendDailyDigest } from '../utils/notifications';

// Componente invisível que gerencia as notificações
const NotificationChecker: React.FC = () => {
  const { activities } = useActivity();
  const { settings } = useNotification();
  const checkedActivitiesRef = useRef<Set<string>>(new Set());
  const lastDailyDigestRef = useRef<string | null>(null);

  // Efeito para verificar se devemos pedir permissão de notificação
  useEffect(() => {
    if (settings.enabled) {
      const checkPermission = async () => {
        // Apenas solicitar permissão se as notificações estiverem habilitadas
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          await requestNotificationPermission();
        }
      };
      
      checkPermission();
    }
  }, [settings.enabled]);

  // Efeito para verificar atividades pendentes e enviar notificações
  useEffect(() => {
    if (!settings.enabled || !activities.length) return;
    
    // Verificar cada atividade
    const checkActivities = async () => {
      for (const activity of activities) {
        // Pular atividades que já foram verificadas (para evitar notificações duplicadas)
        if (checkedActivitiesRef.current.has(activity.id)) continue;
        
        const { shouldNotify, reason } = shouldNotifyActivity(activity, settings);
        
        if (shouldNotify && reason) {
          try {
            await sendActivityNotification(activity, settings, reason);
            // Marcar como notificada
            checkedActivitiesRef.current.add(activity.id);
          } catch (error) {
            console.error('Erro ao enviar notificação para atividade:', error);
          }
        }
      }
    };
    
    // Verificar atividades imediatamente e depois a cada 5 minutos
    checkActivities();
    const intervalId = setInterval(checkActivities, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [activities, settings]);

  // Efeito para verificar se devemos enviar o resumo diário
  useEffect(() => {
    if (!settings.enabled || !settings.dailyDigest) return;
    
    const checkDailyDigest = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Verificar se já enviamos o resumo hoje
      if (lastDailyDigestRef.current === today) return;
      
      const [hour, minute] = settings.dailyDigestTime.split(':').map(Number);
      
      // Verificar se está na hora do resumo diário (com uma margem de 5 minutos)
      if (now.getHours() === hour && Math.abs(now.getMinutes() - minute) <= 5) {
        try {
          await sendDailyDigest(activities, settings);
          // Marcar que já enviamos o resumo hoje
          lastDailyDigestRef.current = today;
        } catch (error) {
          console.error('Erro ao enviar resumo diário:', error);
        }
      }
    };
    
    // Verificar a cada minuto
    const intervalId = setInterval(checkDailyDigest, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [activities, settings]);

  // Este componente não renderiza nada visível
  return null;
};

export default NotificationChecker; 