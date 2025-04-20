/**
 * Utilitários para integração com sistemas acadêmicos
 */

import { ImportedClass, ImportedTask } from './academicIntegration';

interface SigaaClassData {
  codigo: string;
  nome: string;
  professor: string;
  local: string;
  horario: {
    dia: number;
    inicio: string;
    fim: string;
  };
}

interface SigaaTaskData {
  id: string;
  titulo: string;
  descricao: string;
  prazo: string;
  disciplina: {
    codigo: string;
    nome: string;
  };
}

/**
 * Converte a saída do script sigaa-ufc-playwright.js para o formato interno do aplicativo
 */
export function convertSigaaData(data: any): { classes: ImportedClass[], tasks: ImportedTask[], isMockData: boolean } {
  // Se nenhum dado válido foi fornecido, retorne arrays vazios
  if (!data || (!data.classes && !data.tasks)) {
    console.warn('Dados inválidos recebidos do script de scraping');
    return { classes: [], tasks: [], isMockData: false };
  }

  console.log('Convertendo dados do SIGAA:', data);

  // Verificar se estamos recebendo dados mockados como fallback
  const isMockData = data.message && data.message.includes('mockados foram carregados como fallback');
  
  if (isMockData) {
    console.log('Detectados dados mockados retornados como fallback da Cloud Function');
  }

  // Converter classes
  const classes = (data.classes || []).map((c: SigaaClassData) => {
    // Extrair sala e bloco do campo "local"
    let room = '', building = '';
    if (c.local) {
      const parts = c.local.split(',');
      if (parts.length >= 2) {
        building = parts[0].trim();
        room = parts[1].trim().replace('Sala ', '');
      } else {
        room = c.local;
      }
    }

    return {
      id: c.codigo,
      title: c.nome,
      professor: c.professor || '',
      room,
      building, 
      dayOfWeek: c.horario?.dia || 1,
      startTime: c.horario?.inicio || '08:00',
      endTime: c.horario?.fim || '10:00'
    };
  });

  // Converter tarefas
  const tasks = (data.tasks || []).map((t: SigaaTaskData) => ({
    id: t.id || `task-${Math.random().toString(36).substring(2, 9)}`,
    title: t.titulo,
    description: t.descricao,
    dueDate: t.prazo,
    classId: t.disciplina?.codigo || '',
    className: t.disciplina?.nome || ''
  }));

  console.log('Dados convertidos:', { classes, tasks, isMockData });
  return { classes, tasks, isMockData };
} 