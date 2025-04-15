import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { ClassSchedule, DAYS_OF_WEEK, TIME_SLOTS } from '../types/Schedule';
import ScheduleActivities from './TodaySchedule';

const Dashboard = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<ClassSchedule> | null>(null);
  const { logout } = useAuth();
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedule();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    subject: '',
    professor: '',
    room: '',
    building: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
    selectedDays: [] as number[]
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      alert('Failed to log out');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduleData = {
        ...formData,
        dayOfWeek: formData.selectedDays[0] || 1 // Usa o primeiro dia selecionado como principal
      };

      if (editingSchedule?.id) {
        await updateSchedule(editingSchedule.id, scheduleData);
      } else {
        // Cria uma aula para cada dia selecionado
        for (const day of formData.selectedDays) {
          await addSchedule({
            ...scheduleData,
            dayOfWeek: day
          } as any);
        }
      }
      setOpenDialog(false);
      setEditingSchedule(null);
      resetForm();
    } catch (error) {
      alert('Failed to save schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await deleteSchedule(id);
      } catch (error) {
        alert('Failed to delete schedule');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      professor: '',
      room: '',
      building: '',
      dayOfWeek: 1,
      startTime: '',
      endTime: '',
      selectedDays: []
    });
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => {
      const selectedDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays };
    });
  };

  // Função para encontrar aula em um determinado horário e dia
  const findClass = (time: string, day: number) => {
    return schedules.find(
      schedule => schedule.startTime === time && schedule.dayOfWeek === day
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-3 rounded-lg shadow">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-0">Meus Horários</h1>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-4">
            <button
              onClick={() => {
                setEditingSchedule(null);
                setOpenDialog(true);
              }}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              Adicionar Aula
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Grade de Horários */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário
                </th>
                {DAYS_OF_WEEK.slice(1, 6).map((day) => (
                  <th key={day} className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {TIME_SLOTS.map((time) => (
                <tr key={time}>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    {time}
                  </td>
                  {[1, 2, 3, 4, 5].map((day) => {
                    const classSchedule = findClass(time, day);
                    return (
                      <td key={`${time}-${day}`} className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal text-xs sm:text-sm text-gray-500 border-l border-gray-200">
                        {classSchedule ? (
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 line-clamp-1">{classSchedule.subject}</div>
                            {classSchedule.professor && (
                              <div className="text-xs text-gray-500 line-clamp-1">Prof: {classSchedule.professor}</div>
                            )}
                            {classSchedule.room && (
                              <div className="text-xs text-gray-500 line-clamp-1">
                                Sala: {classSchedule.room} {classSchedule.building && `- Bloco ${classSchedule.building}`}
                              </div>
                            )}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingSchedule(classSchedule);
                                  setFormData({
                                    subject: classSchedule.subject,
                                    professor: classSchedule.professor || '',
                                    room: classSchedule.room || '',
                                    building: classSchedule.building || '',
                                    dayOfWeek: classSchedule.dayOfWeek,
                                    startTime: classSchedule.startTime,
                                    endTime: classSchedule.endTime,
                                    selectedDays: [classSchedule.dayOfWeek]
                                  });
                                  setOpenDialog(true);
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-900"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Tem certeza que deseja excluir esta aula?')) {
                                    deleteSchedule(classSchedule.id);
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-900"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Seção de Atividades */}
        <div className="bg-white rounded-lg shadow">
          <ScheduleActivities />
        </div>

        {/* Modal de Adicionar/Editar */}
        {openDialog && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">
                {editingSchedule ? 'Editar Aula' : 'Adicionar Nova Aula'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Disciplina</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Professor</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.professor}
                    onChange={(e) => setFormData(prev => ({ ...prev, professor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sala</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.room}
                    onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bloco</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.building}
                    onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dias da Semana</label>
                  <div className="flex flex-wrap gap-4">
                    {DAYS_OF_WEEK.slice(1, 6).map((day, index) => (
                      <label key={index + 1} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          checked={formData.selectedDays.includes(index + 1)}
                          onChange={() => handleDayToggle(index + 1)}
                        />
                        <span className="ml-2 text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horário</label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  >
                    <option value="">Selecione o horário</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDialog(false);
                      setEditingSchedule(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingSchedule ? 'Salvar' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 