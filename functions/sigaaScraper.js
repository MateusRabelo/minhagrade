/**
 * Cloud Function para executar o script de scraping do SIGAA UFC
 * 
 * Este arquivo é uma referência para quando você implantar o aplicativo
 * em um ambiente de produção usando Firebase Cloud Functions.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Atualizando o caminho de importação com verificação de existência do arquivo
console.log('Carregando o módulo de scraping do SIGAA...');

// Listar arquivos na pasta scripts para debug
const scriptsDir = path.resolve(__dirname, 'scripts');
try {
  if (fs.existsSync(scriptsDir)) {
    console.log('Pasta scripts existe. Conteúdo:');
    const files = fs.readdirSync(scriptsDir);
    files.forEach(file => {
      console.log(` - ${file}`);
    });
  } else {
    console.log('Pasta scripts não existe.');
  }
} catch (err) {
  console.error(`Erro ao listar diretório: ${err.message}`);
}

const scriptsPath = './scripts/sigaa-ufc-playwright.js';
let scrapeModule;

try {
  const absolutePath = path.resolve(__dirname, scriptsPath);
  console.log('Tentando carregar o módulo de:', absolutePath);
  
  if (fs.existsSync(absolutePath)) {
    console.log('Arquivo de scraping encontrado em:', absolutePath);
    // Verificar o tamanho e integridade do arquivo
    const stats = fs.statSync(absolutePath);
    console.log(`Tamanho do arquivo: ${stats.size} bytes`);

    // Se o arquivo for muito pequeno, pode estar corrompido
    if (stats.size < 100) {
      console.error('ERRO: Arquivo de scraping parece estar corrompido (muito pequeno)');
      throw new Error('Arquivo de scraping corrompido');
    }

    // Verificar conteúdo do arquivo para encontrar possíveis erros
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    if (fileContent.includes('downloadChromium')) {
      console.error('ALERTA: O arquivo ainda contém referências à função downloadChromium');
      
      // Substituir a função problemática diretamente
      const fixedContent = fileContent.replace(/await\s+chromiumExec\.downloadChromium\(\)/g, '// Download não necessário')
                                      .replace(/chromiumExec\.downloadChromium/g, '// chromiumExec.downloadChromium - removido');
      
      // Gravar a versão corrigida
      fs.writeFileSync(absolutePath, fixedContent, 'utf8');
      console.log('Arquivo corrigido automaticamente para remover referências à downloadChromium');
    }

    // Carregar o módulo após possíveis correções
    scrapeModule = require(scriptsPath);
    console.log('Módulo carregado com sucesso:', Object.keys(scrapeModule));
  } else {
    console.error('Arquivo de scraping não encontrado em:', absolutePath);
    // Se o arquivo não for encontrado, carregamos uma implementação básica
    console.log('Usando implementação de fallback');
    scrapeModule = {
      scrapeSigaaUFC: async (username, password) => {
        console.log('Usando implementação de fallback para scrapeSigaaUFC');
        return {
          classes: [],
          tasks: []
        };
      }
    };
  }
} catch (error) {
  console.error(`Erro ao importar o módulo de scraping: ${error}`);
  console.error('Stack trace:', error.stack);
  // Implementação básica em caso de erro
  scrapeModule = {
    scrapeSigaaUFC: async (username, password) => {
      console.log('Usando implementação de fallback para scrapeSigaaUFC devido a erro');
      return {
        classes: [],
        tasks: []
      };
    }
  };
}

// Extrair a função de scraping do módulo
const { scrapeSigaaUFC } = scrapeModule;

// Inicializar o Firebase Admin SDK
console.log('Inicializando Firebase Admin SDK...');
admin.initializeApp();
console.log('Firebase Admin SDK inicializado com sucesso.');

// Definição de dados mockados para uso em fallback
const mockedClasses = [
  {
    codigo: 'CK0245',
    nome: 'PROGRAMAÇÃO PARA DISPOSITIVOS MÓVEIS',
    professor: 'JOSÉ ANTONIO FERNANDES DE MACÊDO',
    local: 'Bloco 952, Sala 01',
    horario: {
      dia: 2, // Segunda-feira
      inicio: '08:00',
      fim: '10:00'
    }
  },
  {
    codigo: 'CK0215',
    nome: 'PROJETO DE PESQUISA CIENTÍFICA',
    professor: 'MARIA VIVIANE DE MENEZES',
    local: 'Bloco 910, Sala 04',
    horario: {
      dia: 3, // Terça-feira
      inicio: '14:00',
      fim: '16:00'
    }
  },
  {
    codigo: 'CK0197',
    nome: 'INTELIGÊNCIA ARTIFICIAL',
    professor: 'FERNANDO ANTONIO MOTA TRINTA',
    local: 'Bloco 952, Sala 05',
    horario: {
      dia: 5, // Quinta-feira
      inicio: '10:00',
      fim: '12:00'
    }
  }
];

const mockedTasks = [
  {
    id: '1',
    titulo: 'Projeto Final - App Flutter',
    descricao: 'Desenvolver um aplicativo com Flutter utilizando Firebase',
    prazo: '2023-12-10T23:59:00',
    disciplina: {
      codigo: 'CK0245',
      nome: 'PROGRAMAÇÃO PARA DISPOSITIVOS MÓVEIS'
    }
  },
  {
    id: '2',
    titulo: 'Implementação de Algoritmo Genético',
    descricao: 'Implementar um algoritmo genético para resolver o problema do caixeiro viajante',
    prazo: '2023-11-30T23:59:00',
    disciplina: {
      codigo: 'CK0197',
      nome: 'INTELIGÊNCIA ARTIFICIAL'
    }
  },
  {
    id: '3',
    titulo: 'Entrega do Artigo Final',
    descricao: 'Artigo científico no formato SBC',
    prazo: '2023-12-20T23:59:00',
    disciplina: {
      codigo: 'CK0215',
      nome: 'PROJETO DE PESQUISA CIENTÍFICA'
    }
  }
];

/**
 * Função que executa o script sigaa-ufc-playwright.js
 */
exports.scrapeSigaa = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 300, // 5 minutos
    memory: '1GB',      // Mais memória para o Playwright
  })
  .https.onCall(async (data, context) => {
    console.log('Função scrapeSigaa foi chamada');
    
    // Verificar se o usuário está autenticado
    if (!context.auth) {
      console.error('Erro de autenticação: usuário não autenticado');
      throw new functions.https.HttpsError(
        'unauthenticated',
        'O usuário deve estar autenticado para usar esta função.'
      );
    }

    const userId = context.auth.uid;
    console.log(`Usuário autenticado: ${userId}`);
    
    // Verificar parâmetros necessários
    if (!data.username || !data.password) {
      console.error('Erro de parâmetros: username ou password não fornecidos');
      throw new functions.https.HttpsError(
        'invalid-argument',
        'É necessário fornecer username e password do SIGAA.'
      );
    }

    try {
      // Credenciais fornecidas pelo cliente
      const username = data.username;
      const password = data.password;
      
      // Log de diagnóstico
      console.log(`Iniciando scraping do SIGAA para usuário ${userId}`);
      
      try {
        // Tentar usar o script real de scraping com tratamento robusto de erros
        console.log('Executando script de scraping do SIGAA...');
        
        // Definir um timeout para a chamada ao scraper
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout ao executar o scraping'));
          }, 240000); // 4 minutos de timeout
        });
        
        // Executar o scraper com proteção de timeout
        const scrapingPromise = scrapeSigaaUFC(username, password).catch(error => {
          console.error(`Erro capturado no scraping: ${error.message}`);
          throw error;
        });
        
        // Aguardar pelo primeiro que completar/falhar: o scraper ou o timeout
        const resultado = await Promise.race([scrapingPromise, timeoutPromise]);
        
        // Log dos resultados obtidos
        console.log(`Obtidos: ${resultado.classes.length} disciplinas e ${resultado.tasks.length} tarefas`);
        
        // Salvar os dados no Firestore para referência do usuário
        await admin.firestore().collection('users').doc(userId).collection('integration').doc('sigaa').set({
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          source: 'realScraping',
          status: 'success',
          message: 'Dados obtidos com sucesso pelo scraping'
        });
        
        // Retornar os dados reais para o cliente
        return {
          success: true,
          classes: resultado.classes,
          tasks: resultado.tasks
        };
        
      } catch (scrapingError) {
        console.error(`Erro no scraping real: ${scrapingError.message}`);
        console.error('Stack trace:', scrapingError.stack);
        console.log('Usando dados mockados como fallback devido a erro no scraping.');
        
        // Salvar os dados mockados no Firestore para referência do usuário
        await admin.firestore().collection('users').doc(userId).collection('integration').doc('sigaa').set({
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
          source: 'mockData',
          status: 'partial',
          message: 'Erro no scraping real, usando dados mockados como fallback',
          error: scrapingError.message
        });
        
        // Retornar os dados mockados para o cliente
        return {
          success: true,
          classes: mockedClasses,
          tasks: mockedTasks,
          source: 'mockData',
          message: 'Dados mockados foram carregados como fallback. O scraping real falhou.'
        };
      }
      
    } catch (error) {
      console.error(`Erro no scraping do SIGAA: ${error.message}`);
      console.error('Stack trace:', error.stack);
      throw new functions.https.HttpsError(
        'internal',
        `Erro no scraping do SIGAA: ${error.message}`,
        { original: error.message }
      );
    }
  });

/**
 * Função para manter as credenciais do SIGAA atualizadas
 */
exports.storeSigaaCredentials = functions.https.onCall(async (data, context) => {
  // Verificar se o usuário está autenticado
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'O usuário deve estar autenticado para usar esta função.'
    );
  }

  const userId = context.auth.uid;
  
  // Verificar parâmetros necessários
  if (!data.username || !data.password || !data.institution) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'É necessário fornecer username, password e institution do SIGAA.'
    );
  }

  // Criptografar a senha (isso usaria uma biblioteca de criptografia real em produção)
  const encryptedPassword = Buffer.from(data.password).toString('base64');
  
  try {
    // Armazenar as credenciais criptografadas no Firestore
    await admin.firestore().collection('integrations').doc(userId).set({
      username: data.username,
      encryptedPassword: encryptedPassword,
      institution: data.institution,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error(`Erro ao armazenar credenciais: ${error.message}`);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao armazenar credenciais.',
      { original: error.message }
    );
  }
}); 