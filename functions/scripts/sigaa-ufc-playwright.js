/**
 * Script de integração com SIGAA UFC para Cloud Functions
 * 
 * Este script é uma versão adaptada do sigaa-ufc-playwright.js original
 * para funcionar no ambiente de Cloud Functions.
 */

const { chromium } = require('playwright-core');
const chromiumExec = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

// Função principal para fazer o scraping
async function scrapeSigaaUFC(username, password) {
  console.log('Iniciando scraping do SIGAA UFC...');
  console.log(`Usando credenciais: ${username} / ${'*'.repeat(password.length)}`);
  
  try {
    // Obter o caminho executável do Chrome
    console.log('Obtendo caminho do executável do Chromium...');
    const chromePath = await chromiumExec.executablePath();
    console.log('Caminho do executável do Chromium:', chromePath);
    
    // Verificar se o arquivo executável existe
    if (!fs.existsSync(chromePath)) {
      console.error('ERRO: Executável do Chromium não encontrado no caminho:', chromePath);
      // Tentar encontrar em localizações alternativas
      const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
      console.log('Procurando Chromium em diretório temporário:', tempDir);
    }
    
    // Configurações do navegador otimizadas para Cloud Functions
    console.log('Iniciando navegador...');
    const browser = await chromium.launch({ 
      headless: true,
      executablePath: chromePath,
      args: chromiumExec.args,
    });
    console.log('Navegador iniciado com sucesso.');
    
    // Resultados a serem retornados
    const resultados = {
      classes: [],
      tasks: []
    };
    
    try {
      // Criar um novo contexto de navegador
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        bypassCSP: true,
        javaScriptEnabled: true,
        navigationTimeout: 60000
      });
      
      // Configurar timeout global mais longo
      context.setDefaultTimeout(60000);
      
      // Diretório temporário para downloads
      const downloadDir = path.join('/tmp', 'downloads');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }
      
      // Criar uma nova página
      const page = await context.newPage();
      
      // Configurar listeners para logs da página
      page.on('console', msg => console.log(`[Browser Log]: ${msg.text()}`));
      page.on('pageerror', err => console.error(`[Page Error]: ${err.message}`));
      
      try {
        console.log('Acessando página de login do SIGAA UFC...');
        await page.goto('https://si3.ufc.br/sigaa/verTelaLogin.do', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Preencher campos de login
        await page.fill('input[name="user.login"]', username);
        await page.fill('input[name="user.senha"]', password);
        
        // Fazer login
        console.log('Enviando credenciais de login...');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
          page.click('input[type="submit"][value="Entrar"]')
        ]);
        
        // Verificar se o login foi bem-sucedido
        const loggedIn = await page.evaluate(() => {
          return document.body.innerText.includes('Portal do Discente') || 
                 document.body.innerText.includes('Módulos') ||
                 document.body.innerText.includes('Bem-vindo');
        });
        
        if (!loggedIn) {
          throw new Error('Falha no login. Verifique suas credenciais.');
        }
        
        console.log('Login realizado com sucesso! Buscando disciplinas...');
        
        // Implementar código para extrair disciplinas e tarefas
        // ...
        
        // Dados de exemplo para retorno
        resultados.classes = [
          {
            codigo: 'EXEMP01',
            nome: 'DISCIPLINA DE EXEMPLO 1',
            professor: 'PROFESSOR EXEMPLO',
            local: 'SALA VIRTUAL',
            horario: {
              dia: 2,
              inicio: '08:00',
              fim: '10:00'
            }
          }
        ];
        
        resultados.tasks = [
          {
            id: 'tarefa1',
            titulo: 'Tarefa Exemplo',
            descricao: 'Descrição da tarefa exemplo',
            prazo: new Date().toISOString(),
            disciplina: {
              codigo: 'EXEMP01',
              nome: 'DISCIPLINA DE EXEMPLO 1'
            }
          }
        ];
        
      } catch (error) {
        console.error(`Erro durante o login: ${error}`);
        throw error;
      } finally {
        await context.close();
        await browser.close();
      }
    } catch (contextError) {
      console.error(`Erro ao criar contexto: ${contextError}`);
      await browser.close();
      throw contextError;
    }
    
    return resultados;
    
  } catch (globalError) {
    console.error(`Erro global: ${globalError}`);
    throw globalError;
  }
}

module.exports = { scrapeSigaaUFC };
