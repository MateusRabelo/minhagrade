import React, { useState, useMemo } from 'react';
import { useSchedule } from '../contexts/ScheduleContext';
import { useActivity } from '../contexts/ActivityContext';
import { DAYS_OF_WEEK, Activity } from '../types/Schedule';
import { formatDateTimeBR } from '../utils/dateUtils';
import NotificationSettingsPanel from './NotificationSettingsPanel';

interface ActivityFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
}

type TabType = 'active' | 'history';

const ScheduleActivities = () => {
  const { schedules } = useSchedule();
  const { activities, addActivity, toggleActivityComplete } = useActivity();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [hideCompleted, setHideCompleted] = useState(true);
  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    description: '',
    dueDate: '',
    dueTime: ''
  });

  // Função para verificar se uma atividade foi concluída há mais de 48h
  const isCompletedOld = (activity: Activity) => {
    if (!activity.completed) return false;
    const completedDate = new Date(activity.updatedAt || activity.dueDate);
    const now = new Date();
    const hoursSinceCompletion = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCompletion > 48;
  };

  // Função para verificar se faltam menos de 24h para o prazo
  const isDueSoon = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  // Função para verificar se o prazo já passou
  const isOverdue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  };

  // Função para formatar a data com informação de prazo
  const formatDueDate = (activity: Activity) => {
    const formattedDate = formatDateTimeBR(activity.dueDate);
    
    if (activity.completed) {
      return (
        <p className="text-xs text-gray-400 mt-1">
          Entrega: {formattedDate}
        </p>
      );
    }

    if (isOverdue(activity.dueDate)) {
      return (
        <p className="text-xs text-red-600 font-medium mt-1">
          Atrasado! Prazo: {formattedDate}
        </p>
      );
    }

    if (isDueSoon(activity.dueDate)) {
      return (
        <p className="text-xs text-red-500 font-medium mt-1">
          Urgente! Entrega em menos de 24h: {formattedDate}
        </p>
      );
    }

    return (
      <p className="text-xs text-gray-400 mt-1">
        Entrega: {formattedDate}
      </p>
    );
  };

  // Agrupar disciplinas únicas
  const uniqueSubjects = useMemo(() => {
    const subjects = new Map();
    schedules.forEach(schedule => {
      if (!subjects.has(schedule.subject)) {
        // Guarda a primeira ocorrência de cada disciplina
        subjects.set(schedule.subject, schedule);
      }
    });
    return Array.from(subjects.values());
  }, [schedules]);

  const handleOpenModal = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsModalOpen(true);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      dueTime: ''
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScheduleId(null);
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId || !formData.title.trim()) return;

    try {
      const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString();

      await addActivity({
        title: formData.title,
        description: formData.description,
        dueDate: dueDateTime,
        subject: selectedSchedule?.subject || '',
        completed: false,
        scheduleId: selectedScheduleId,
        createdAt: new Date().toISOString()
      });
      
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao adicionar atividade:', error);
      alert('Erro ao adicionar atividade. Por favor, tente novamente.');
    }
  };

  // Filtrar e agrupar atividades
  const { activeActivities, historyActivities } = useMemo(() => {
    const active = new Map<string, Activity[]>();
    const history = new Map<string, Activity[]>();

    activities.forEach(activity => {
      const schedule = schedules.find(s => s.id === activity.scheduleId);
      if (!schedule) return;

      const isHidden = activity.completed && (hideCompleted || isCompletedOld(activity));
      const targetMap = isHidden ? history : active;

      if (!targetMap.has(schedule.subject)) {
        targetMap.set(schedule.subject, []);
      }
      targetMap.get(schedule.subject)?.push(activity);
    });

    return { activeActivities: active, historyActivities: history };
  }, [activities, schedules, hideCompleted]);

  const renderActivities = (activitiesMap: Map<string, Activity[]>) => (
    <div className="space-y-6">
      {uniqueSubjects.map((subject) => {
        const subjectActivities = activitiesMap.get(subject.subject) || [];
        if (subjectActivities.length === 0) return null;

        return (
          <div key={subject.id} className="border-t pt-4 first:border-t-0 first:pt-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-700">{subject.subject}</h3>
              {activeTab === 'active' && (
                <button
                  onClick={() => handleOpenModal(subject.id)}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                >
                  + Atividade
                </button>
              )}
            </div>

            <div className="space-y-2">
              {subjectActivities
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .map((activity: Activity) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-center space-x-2 text-sm p-2 rounded ${
                      activity.completed 
                        ? 'bg-gray-50' 
                        : isOverdue(activity.dueDate)
                        ? 'bg-red-50'
                        : isDueSoon(activity.dueDate)
                        ? 'bg-orange-50'
                        : 'bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activity.completed}
                      onChange={() => toggleActivityComplete(activity.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      disabled={activeTab === 'history'}
                    />
                    <div className="flex-1">
                      <span className={
                        activity.completed 
                          ? 'line-through text-gray-400' 
                          : isOverdue(activity.dueDate)
                          ? 'text-red-600'
                          : isDueSoon(activity.dueDate)
                          ? 'text-red-500'
                          : 'text-gray-700'
                      }>
                        {activity.title}
                      </span>
                      {activity.description && (
                        <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                      )}
                      {formatDueDate(activity)}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-3 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Atividades</h2>
          <div className="flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 text-sm font-medium rounded-md flex-1 ${
                activeTab === 'active'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-sm font-medium rounded-md flex-1 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Histórico
            </button>
          </div>
        </div>

        {activeTab === 'active' && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={hideCompleted}
                onChange={(e) => setHideCompleted(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Esconder concluídas</span>
            </label>
            <div className="relative w-full sm:w-auto flex space-x-2">
              <select
                className="w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-8 py-1.5 appearance-none"
                value={selectedScheduleId || ''}
                onChange={(e) => e.target.value && handleOpenModal(e.target.value)}
              >
                <option value="">Adicionar atividade</option>
                {uniqueSubjects.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.subject}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-md flex items-center justify-center"
                title="Configurações de notificação"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-2 sm:px-0">
        {activeTab === 'active' ? renderActivities(activeActivities) : renderActivities(historyActivities)}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Nova Atividade
                </h3>
                {schedules.find(s => s.id === selectedScheduleId)?.subject && (
                  <span className="block text-sm text-gray-500 mt-1">
                    {schedules.find(s => s.id === selectedScheduleId)?.subject}
                  </span>
                )}
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Data de Entrega *
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700">
                    Hora de Entrega *
                  </label>
                  <input
                    type="time"
                    id="dueTime"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Painel de Configurações de Notificação */}
      <NotificationSettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

export default ScheduleActivities; 