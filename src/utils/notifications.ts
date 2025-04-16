import { messaging } from '../firebase';
import { getToken } from 'firebase/messaging';
import { Activity, NotificationSettings } from '../types/Schedule';
import { formatDateTimeBR } from './dateUtils';

// Verificar se o navegador suporta notificações
export const canUseNotifications = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Solicitar permissão para enviar notificações
export const requestNotificationPermission = async () => {
  if (!canUseNotifications()) {
    return { permission: 'denied', error: 'Navegador não suporta notificações' };
  }

  try {
    const permission = await Notification.requestPermission();
    return { permission, error: null };
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error);
    return { permission: 'denied', error };
  }
};

// Registrar o Service Worker se ainda não estiver registrado
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker não suportado neste navegador');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.error('Erro ao registrar service worker:', error);
    throw error;
  }
};

// Verificar se uma atividade deve ser notificada com base nas configurações
export const shouldNotifyActivity = (activity: Activity, settings: NotificationSettings): { shouldNotify: boolean, reason?: string } => {
  if (!settings.enabled) {
    return { shouldNotify: false, reason: 'Notificações desativadas' };
  }

  if (activity.completed) {
    return { shouldNotify: false, reason: 'Atividade já concluída' };
  }

  const now = new Date();
  const dueDate = new Date(activity.dueDate);
  const hoursLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Verificar se a atividade está atrasada e se devemos notificar sobre atividades atrasadas
  if (hoursLeft < 0 && settings.showOverdue) {
    return { shouldNotify: true, reason: 'Atividade atrasada' };
  }

  // Verificar se a atividade está próxima do prazo e se devemos notificar sobre atividades próximas
  if (hoursLeft > 0 && hoursLeft <= settings.upcomingThreshold && settings.showUpcoming) {
    return { shouldNotify: true, reason: 'Atividade próxima do prazo' };
  }

  // Verificar se a atividade está dentro do prazo de lembrete
  const reminderHours = settings.reminderTime;
  if (hoursLeft > 0 && hoursLeft <= reminderHours) {
    return { shouldNotify: true, reason: 'Lembrete de atividade' };
  }

  return { shouldNotify: false, reason: 'Fora dos critérios de notificação' };
};

// Enviar notificação para uma atividade
export const sendActivityNotification = async (activity: Activity, settings: NotificationSettings, reason: string) => {
  if (Notification.permission !== 'granted') {
    const { permission } = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações não concedida');
    }
  }

  // Verificar se o service worker está ativo
  const registration = await navigator.serviceWorker.ready;

  let title = 'Atividade Pendente';
  let body = '';

  if (reason === 'Atividade atrasada') {
    title = '⚠️ Atividade Atrasada';
    body = `${activity.subject}: ${activity.title} está atrasada! Prazo: ${formatDateTimeBR(activity.dueDate)}`;
  } else if (reason === 'Atividade próxima do prazo') {
    title = '🔔 Atividade em Breve';
    body = `${activity.subject}: ${activity.title} vence em breve (${formatDateTimeBR(activity.dueDate)})`;
  } else if (reason === 'Lembrete de atividade') {
    title = '📝 Lembrete de Atividade';
    body = `Não esqueça: ${activity.subject} - ${activity.title} (${formatDateTimeBR(activity.dueDate)})`;
  }

  try {
    if (messaging) {
      // Tentar com Firebase messaging
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'PUSH_TEST',
        title: title,
        body: body,
        url: window.location.href,
        activityId: activity.id
      });
    } else {
      // Fallback para notificação local
      await registration.showNotification(title, {
        body: body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          url: window.location.href,
          activityId: activity.id
        }
      });
    }
  } catch (error) {
    console.error('Erro ao enviar notificação para atividade:', error);
    throw error;
  }
};

// Gerar resumo diário das atividades
export const sendDailyDigest = async (activities: Activity[], settings: NotificationSettings) => {
  if (!settings.enabled || !settings.dailyDigest) {
    return;
  }

  if (Notification.permission !== 'granted') {
    const { permission } = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações não concedida');
    }
  }

  // Verificar se o service worker está ativo
  const registration = await navigator.serviceWorker.ready;

  const now = new Date();
  
  // Filtrar atividades pendentes (não concluídas) e ordená-las por data
  const pendingActivities = activities
    .filter(a => !a.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  if (pendingActivities.length === 0) {
    return; // Não há atividades pendentes
  }

  const overdueActivities = pendingActivities.filter(a => new Date(a.dueDate) < now);
  const todayActivities = pendingActivities.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate.getDate() === now.getDate() && 
           dueDate.getMonth() === now.getMonth() && 
           dueDate.getFullYear() === now.getFullYear();
  });

  const upcomingActivities = pendingActivities.filter(a => {
    const dueDate = new Date(a.dueDate);
    const daysLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return dueDate > now && daysLeft <= 7; // Próximos 7 dias
  });

  // Montar texto de resumo para o corpo da notificação
  let body = '';
  
  if (overdueActivities.length > 0) {
    body += `${overdueActivities.length} atividade(s) atrasada(s).\n`;
  }
  
  if (todayActivities.length > 0) {
    body += `${todayActivities.length} atividade(s) para hoje.\n`;
  }
  
  if (upcomingActivities.length > 0) {
    body += `${upcomingActivities.length} atividade(s) para os próximos 7 dias.`;
  }

  try {
    const title = '📋 Resumo Diário de Atividades';
    
    if (messaging) {
      // Tentar com Firebase messaging
      registration.active?.postMessage({
        type: 'PUSH_TEST',
        title: title,
        body: body,
        url: window.location.href,
        isDigest: true
      });
    } else {
      // Fallback para notificação local
      await registration.showNotification(title, {
        body: body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        data: {
          url: window.location.href,
          isDigest: true
        }
      });
    }
  } catch (error) {
    console.error('Erro ao enviar resumo diário:', error);
    throw error;
  }
};

// Enviar uma notificação de teste local (sem usar servidor)
export const sendTestNotification = async () => {
  if (Notification.permission !== 'granted') {
    const { permission } = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão para notificações não concedida');
    }
  }

  // Verificar se o service worker está ativo
  const registration = await navigator.serviceWorker.ready;

  try {
    // Primeiro tentar com Firebase messaging (para notificações push)
    if (messaging) {
      console.log('Tentando notificação via Firebase Messaging...');
      
      // Primeiro obter o token do dispositivo (necessário para notificações push)
      try {
        const currentToken = await getToken(messaging, {
          vapidKey: 'BKmWHaAnktBSyUxAXSQGIqLUceCTkxkPTPV8MRtcIPmRPcBGYiI3b3wRF-JOUW3bjRmEOBDOTdG1Sqjms5fOQg4'
        });
        
        if (currentToken) {
          console.log('Token FCM:', currentToken);
          // Normalmente enviaria este token para o servidor
          // para poder enviar notificações push para este dispositivo
          
          // Como é apenas teste, vamos simular uma notificação push diretamente
          // Isto dispara o evento push no service worker
          registration.active?.postMessage({
            type: 'PUSH_TEST',
            title: 'Notificação Push de Teste',
            body: 'Esta é uma notificação push simulada',
            url: window.location.href
          });
          
          return;
        }
      } catch (error) {
        console.warn('Erro ao obter token FCM, tentando método alternativo:', error);
      }
    }
    
    // Fallback: usar notificação local
    console.log('Usando notificação local como fallback...');
    
    // Simular uma notificação push criando uma notificação local
    await registration.showNotification('Notificação de Teste', {
      body: 'Esta é uma notificação de teste local',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: window.location.href,
        test: true
      }
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    throw error;
  }
}; 