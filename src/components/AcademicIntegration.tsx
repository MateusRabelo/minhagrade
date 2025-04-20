import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { IntegrationCredentials } from '../types/User';
import SigaaIntegrationStatus from './SigaaIntegrationStatus';
import { USE_BROWSER_SCRAPING } from '../utils/config';

// Lista de instituições academicas suportadas
const SUPPORTED_INSTITUTIONS = [
  { id: 'ufc', name: 'Universidade Federal do Ceará', systemType: 'sigaa' },
  { id: 'usp', name: 'Universidade de São Paulo', systemType: 'moodle' },
  { id: 'unicamp', name: 'Universidade Estadual de Campinas', systemType: 'moodle' },
  { id: 'ufmg', name: 'Universidade Federal de Minas Gerais', systemType: 'moodle' },
  { id: 'unb', name: 'Universidade de Brasília', systemType: 'sigaa' }
];

const AcademicIntegration: React.FC = () => {
  const { userProfile, startIntegration, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showReintegration, setShowReintegration] = useState(false);
  const [credentials, setCredentials] = useState<IntegrationCredentials>({
    username: '',
    password: '',
    institution: userProfile?.institution || ''
  });

  // Reset UI state when userProfile changes
  useEffect(() => {
    if (userProfile?.integrationStatus === 'complete') {
      setLoading(false);
      setSuccess(true);
    } else if (userProfile?.integrationStatus === 'error' || userProfile?.integrationStatus === 'none') {
      setLoading(false);
      
      if (userProfile?.integrationStatus === 'error') {
        setError('Ocorreu um erro durante a integração. Por favor, tente novamente.');
      }
    }
  }, [userProfile?.integrationStatus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  // Verificar se a instituição selecionada é a UFC (SIGAA)
  const isUfcSigaa = credentials.institution.includes('Federal do Ceará');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validações básicas
      if (!credentials.username || !credentials.password || !credentials.institution) {
        throw new Error('Todos os campos são obrigatórios');
      }

      await startIntegration(credentials);
      // Não setamos success aqui, pois ele virá do useEffect quando o userProfile mudar
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a integração');
      setLoading(false);
    }
  };
  
  const handleReintegration = () => {
    setSuccess(false);
    setShowReintegration(true);
  };

  // Se já completou a integração, mostrar status
  if (userProfile?.integrationStatus === 'complete' && !showReintegration) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Integração Ativa</h2>
          <p className="text-sm text-gray-600 mt-1">
            {userProfile.institution}
            {userProfile.studentId && ` - Matrícula: ${userProfile.studentId}`}
          </p>
          {userProfile.lastSync && (
            <p className="text-xs text-gray-500 mt-1">
              Última sincronização: {new Date(userProfile.lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleReintegration}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sincronizar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Se está em processo de integração
  if (userProfile?.integrationStatus === 'pending' || loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Processando Integração</h2>
          <p className="text-sm text-gray-600 mt-1">
            Estamos conectando sua conta acadêmica. Isso pode levar alguns instantes...
          </p>
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              setLoading(false);
              setError('');
              updateUserProfile({ integrationStatus: 'none' });
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancelar Integração
          </button>
        </div>
      </div>
    );
  }

  // Formulário de integração
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Integração Acadêmica</h2>
      
      {success ? (
        <div className="bg-green-100 p-4 rounded-md mb-4">
          <p className="text-green-700">Integração concluída com sucesso!</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <p className="text-gray-600 mb-4">
          Conecte sua conta acadêmica para sincronizar automaticamente suas disciplinas e tarefas.
        </p>
      )}
      
      {isUfcSigaa && (
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <h3 className="text-blue-800 text-sm font-medium mb-2">Informações sobre integração com SIGAA UFC:</h3>
          <ul className="text-blue-700 text-xs space-y-1">
            <li>• A integração com o SIGAA UFC usa automação web para acessar suas disciplinas e tarefas</li>
            <li>• Suas credenciais são usadas apenas para autenticação e não são armazenadas em texto simples</li>
            <li>• O processo pode levar alguns minutos para ser concluído</li>
            <li>• Você receberá uma notificação quando a sincronização for concluída</li>
          </ul>
        </div>
      )}
      
      {/* Exibir o status da integração e informações sobre o modo de scraping */}
      <div className="mt-2 mb-4">
        <SigaaIntegrationStatus useCloudFunctions={!USE_BROWSER_SCRAPING} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
            Instituição Acadêmica
          </label>
          <select
            id="institution"
            name="institution"
            value={credentials.institution}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Selecione sua instituição</option>
            {SUPPORTED_INSTITUTIONS.map(inst => (
              <option key={inst.id} value={inst.name}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Matrícula ou Login
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Sua senha é usada apenas para autenticação e não será armazenada permanentemente.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Conectar Conta Acadêmica'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AcademicIntegration; 