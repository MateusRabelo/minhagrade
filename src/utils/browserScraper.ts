/**
 * Adaptador para execução de scraping no cliente
 * Esta é uma solução temporária até que as Cloud Functions sejam configuradas
 */

import { ImportedClass, ImportedTask } from './academicIntegration';

/**
 * Executa o scraping do SIGAA diretamente no navegador 
 * Limitado em funcionalidade comparado à versão de Cloud Function
 */
export async function runBrowserScraping(username: string, password: string): Promise<{
  classes: any[];
  tasks: any[];
}> {
  console.log('Iniciando scraping no browser para SIGAA...');
  console.log('AVISO: Esta é uma solução temporária com funcionalidade limitada');
  
  try {
    // Tentar autenticar diretamente via API simples
    console.log('Simulando autenticação no SIGAA...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simular delay de rede
    
    // Em um ambiente real, não fazemos scraping diretamente no browser por questões
    // de segurança e limitações técnicas de CORS e browser sandboxing
    console.log('Autenticação concluída (simulação)');
    
    // Retornar dados mockados porque não podemos executar o script real de scraping no browser
    // Em um ambiente de produção, isso seria feito via Cloud Functions
    return {
      classes: getMockClasses(),
      tasks: getMockTasks()
    };
  } catch (error) {
    console.error('Erro no scraping do browser:', error);
    throw new Error('Falha no scraping direto: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Gera disciplinas de exemplo para desenvolvimento
 */
function getMockClasses(): any[] {
  // Dados mockados baseados no seu script original, mas com campos específicos do SIGAA
  return [
    {
      codigo: 'CK0084',
      nome: 'Programação para Dispositivos Móveis',
      professor: 'João Silva',
      local: 'Bloco 922, Sala 101',
      horario: {
        dia: 2, // Terça
        inicio: '08:00',
        fim: '10:00'
      }
    },
    {
      codigo: 'CK0101',
      nome: 'Banco de Dados',
      professor: 'Maria Oliveira',
      local: 'Bloco 910, Sala 302',
      horario: {
        dia: 4, // Quinta
        inicio: '13:30',
        fim: '15:30'
      }
    },
    {
      codigo: 'CK0152',
      nome: 'Inteligência Artificial',
      professor: 'Pedro Santos',
      local: 'Bloco 915, Sala 405',
      horario: {
        dia: 3, // Quarta
        inicio: '15:30',
        fim: '17:30'
      }
    }
  ];
}

/**
 * Gera tarefas de exemplo para desenvolvimento
 */
function getMockTasks(): any[] {
  return [
    {
      id: 'task1',
      titulo: 'Projeto Final - SIGAA',
      descricao: 'Desenvolver um aplicativo que integra com o SIGAA.',
      prazo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      disciplina: {
        codigo: 'CK0084',
        nome: 'Programação para Dispositivos Móveis'
      }
    },
    {
      id: 'task2',
      titulo: 'Lista de Exercícios 3',
      descricao: 'Resolver os exercícios da página 45 a 60 do livro texto.',
      prazo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      disciplina: {
        codigo: 'CK0101',
        nome: 'Banco de Dados'
      }
    },
    {
      id: 'task3',
      titulo: 'Implementação de Algoritmo',
      descricao: 'Implementar um algoritmo de busca A* e comparar com outros algoritmos de busca.',
      prazo: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      disciplina: {
        codigo: 'CK0152',
        nome: 'Inteligência Artificial'
      }
    }
  ];
} 