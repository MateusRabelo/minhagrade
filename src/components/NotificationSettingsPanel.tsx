import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';

interface NotificationSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, saveSettings, hasPermissionError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await saveSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (err) {
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Configurações de Notificação
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {hasPermissionError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Atenção</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Há um problema de permissão com o banco de dados. Suas configurações serão salvas apenas localmente até que este problema seja resolvido. Para resolver, solicite ao administrador do sistema para implantar as novas regras de segurança do Firestore.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Habilitar/Desabilitar notificações */}
          <div className="flex items-center justify-between">
            <label htmlFor="enabled" className="font-medium text-gray-700">
              Ativar notificações
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                id="enabled"
                className="sr-only peer" 
                checked={settings.enabled}
                onChange={(e) => updateSettings({ enabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <hr className="border-gray-200" />

          <fieldset className={settings.enabled ? '' : 'opacity-50 pointer-events-none'}>
            <legend className="font-medium text-gray-700 mb-2">Configurações gerais</legend>
            
            {/* Mostrar atividades atrasadas */}
            <div className="mt-4 flex items-center justify-between">
              <label htmlFor="showOverdue" className="text-gray-700">
                Mostrar atividades atrasadas
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="showOverdue"
                  className="sr-only peer" 
                  checked={settings.showOverdue}
                  onChange={(e) => updateSettings({ showOverdue: e.target.checked })}
                  disabled={!settings.enabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Mostrar atividades próximas */}
            <div className="mt-4 flex items-center justify-between">
              <label htmlFor="showUpcoming" className="text-gray-700">
                Notificar atividades próximas
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="showUpcoming"
                  className="sr-only peer" 
                  checked={settings.showUpcoming}
                  onChange={(e) => updateSettings({ showUpcoming: e.target.checked })}
                  disabled={!settings.enabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Configurar limiar de atividades próximas */}
            <div className={`mt-4 ${settings.showUpcoming ? '' : 'opacity-50 pointer-events-none'}`}>
              <label htmlFor="upcomingThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                Considerar "em breve" se faltar: (horas)
              </label>
              <input
                type="range"
                id="upcomingThreshold"
                min={1}
                max={168} // 1 semana em horas
                step={1}
                value={settings.upcomingThreshold}
                onChange={(e) => updateSettings({ upcomingThreshold: Number(e.target.value) })}
                disabled={!settings.enabled || !settings.showUpcoming}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>1h</span>
                <span>24h</span>
                <span>48h</span>
                <span>72h</span>
                <span>1 semana</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 text-center">
                {settings.upcomingThreshold} horas ({Math.floor(settings.upcomingThreshold / 24)} dias e {settings.upcomingThreshold % 24} horas)
              </p>
            </div>

            {/* Tempo de lembrete antes do prazo */}
            <div className="mt-6">
              <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 mb-1">
                Lembrar com antecedência de: (horas)
              </label>
              <input
                type="range"
                id="reminderTime"
                min={1}
                max={72} // 3 dias em horas
                step={1}
                value={settings.reminderTime}
                onChange={(e) => updateSettings({ reminderTime: Number(e.target.value) })}
                disabled={!settings.enabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500 px-1">
                <span>1h</span>
                <span>12h</span>
                <span>24h</span>
                <span>48h</span>
                <span>72h</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 text-center">
                {settings.reminderTime} horas ({Math.floor(settings.reminderTime / 24)} dias e {settings.reminderTime % 24} horas)
              </p>
            </div>

            <hr className="my-6 border-gray-200" />

            {/* Resumo diário */}
            <div className="mt-4 flex items-center justify-between">
              <label htmlFor="dailyDigest" className="text-gray-700">
                Receber resumo diário
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  id="dailyDigest"
                  className="sr-only peer" 
                  checked={settings.dailyDigest}
                  onChange={(e) => updateSettings({ dailyDigest: e.target.checked })}
                  disabled={!settings.enabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Horário do resumo diário */}
            <div className={`mt-4 ${settings.dailyDigest ? '' : 'opacity-50 pointer-events-none'}`}>
              <label htmlFor="dailyDigestTime" className="block text-sm font-medium text-gray-700 mb-1">
                Horário do resumo diário
              </label>
              <input
                type="time"
                id="dailyDigestTime"
                value={settings.dailyDigestTime}
                onChange={(e) => updateSettings({ dailyDigestTime: e.target.value })}
                disabled={!settings.enabled || !settings.dailyDigest}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </fieldset>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              {hasPermissionError 
                ? 'Configurações salvas localmente com sucesso, mas não foram sincronizadas com o servidor devido a um problema de permissões.'
                : 'Configurações salvas com sucesso!'}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPanel; 