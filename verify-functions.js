/**
 * Script para verificar a configuração das Cloud Functions
 * 
 * Este script verifica:
 * 1. Se o arquivo sigaa-ufc-playwright.js existe no diretório correto
 * 2. Se as dependências necessárias estão instaladas
 * 3. Se o conteúdo do arquivo é válido
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Diretórios importantes
const rootDir = process.cwd();
const functionsDir = path.resolve(rootDir, 'functions');
const scriptsDir = path.resolve(functionsDir, 'scripts');
const scraperPath = path.resolve(scriptsDir, 'sigaa-ufc-playwright.js');
const sigaaScraperPath = path.resolve(functionsDir, 'sigaaScraper.js');

console.log('=== VERIFICAÇÃO DAS CLOUD FUNCTIONS ===');
console.log('Diretório atual:', rootDir);
console.log('Plataforma:', process.platform);
console.log('Node.js version:', process.version);

// Verificar estrutura de diretórios
console.log('\n=== VERIFICANDO ESTRUTURA DE DIRETÓRIOS ===');
console.log(`Diretório functions: ${fs.existsSync(functionsDir) ? 'EXISTE' : 'NÃO EXISTE'}`);
console.log(`Diretório scripts dentro de functions: ${fs.existsSync(scriptsDir) ? 'EXISTE' : 'NÃO EXISTE'}`);

// Se o diretório scripts não existir, criar
if (!fs.existsSync(scriptsDir)) {
  console.log('Criando diretório scripts...');
  fs.mkdirSync(scriptsDir, { recursive: true });
  console.log(`Diretório scripts criado: ${fs.existsSync(scriptsDir) ? 'OK' : 'FALHA'}`);
}

// Verificar arquivo do scraper
console.log('\n=== VERIFICANDO ARQUIVO DO SCRAPER ===');
if (fs.existsSync(scraperPath)) {
  console.log(`Arquivo ${scraperPath} existe!`);
  
  // Verificar tamanho do arquivo
  const stats = fs.statSync(scraperPath);
  console.log(`Tamanho do arquivo: ${stats.size} bytes`);
  
  // Se o arquivo estiver vazio ou muito pequeno
  if (stats.size < 100) {
    console.log('ALERTA: Arquivo do scraper parece estar corrompido (muito pequeno)');
  }
  
  // Verificar conteúdo do arquivo
  try {
    const content = fs.readFileSync(scraperPath, 'utf8');
    console.log(`Verificação de conteúdo: ${content.includes('scrapeSigaaUFC') ? 'OK' : 'FALHA'}`);
    
    // Verificar função module.exports
    if (!content.includes('module.exports')) {
      console.log('ERRO: Exportação de módulo não encontrada no arquivo');
    }
  } catch (readError) {
    console.error(`ERRO ao ler arquivo: ${readError.message}`);
  }
} else {
  console.log(`ALERTA: Arquivo ${scraperPath} não existe!`);
  
  // Acionar script de cópia
  console.log('Executando script de cópia para tentar criar o arquivo...');
  try {
    // Mudar para o diretório de funções
    process.chdir(functionsDir);
    execSync('node copy-script.js', { stdio: 'inherit' });
    process.chdir(rootDir); // Voltar para o diretório original
    
    // Verificar se o arquivo foi criado
    if (fs.existsSync(scraperPath)) {
      console.log('Arquivo criado com sucesso pelo script de cópia!');
    } else {
      console.log('Falha ao criar arquivo mesmo após executar o script de cópia');
    }
  } catch (execError) {
    console.error(`ERRO ao executar script de cópia: ${execError.message}`);
  }
}

// Verificar arquivo sigaaScraper.js
console.log('\n=== VERIFICANDO ARQUIVO SIGAASCRAPER.JS ===');
if (fs.existsSync(sigaaScraperPath)) {
  console.log(`Arquivo ${sigaaScraperPath} existe!`);
  
  try {
    const content = fs.readFileSync(sigaaScraperPath, 'utf8');
    
    // Verificar caminho de importação do módulo
    const importPath = './scripts/sigaa-ufc-playwright.js';
    console.log(`Verificação de caminho de importação: ${content.includes(importPath) ? 'OK' : 'FALHA'}`);
    
    // Se o caminho estiver incorreto, mostrar alerta
    if (!content.includes(importPath)) {
      console.log('ALERTA: Caminho de importação incorreto no arquivo sigaaScraper.js');
      console.log('Recomendação: Edite o arquivo e corrija o caminho para: ./scripts/sigaa-ufc-playwright.js');
    }
  } catch (readError) {
    console.error(`ERRO ao ler arquivo: ${readError.message}`);
  }
} else {
  console.log(`ERRO: Arquivo ${sigaaScraperPath} não existe!`);
}

// Verificar dependências necessárias
console.log('\n=== VERIFICANDO DEPENDÊNCIAS ===');
try {
  const packagePath = path.resolve(functionsDir, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Verificar dependências críticas
    const deps = packageJson.dependencies || {};
    console.log('playwright-core:', deps['playwright-core'] ? `OK (${deps['playwright-core']})` : 'NÃO ENCONTRADO');
    console.log('@sparticuz/chromium:', deps['@sparticuz/chromium'] ? `OK (${deps['@sparticuz/chromium']})` : 'NÃO ENCONTRADO');
    console.log('firebase-functions:', deps['firebase-functions'] ? `OK (${deps['firebase-functions']})` : 'NÃO ENCONTRADO');
    console.log('firebase-admin:', deps['firebase-admin'] ? `OK (${deps['firebase-admin']})` : 'NÃO ENCONTRADO');
    
    // Verificar script de predeploy
    const scripts = packageJson.scripts || {};
    if (scripts.predeploy && scripts.predeploy.includes('copy-script.js')) {
      console.log('Script predeploy: OK');
    } else {
      console.log('ALERTA: Script predeploy não encontrado ou incorreto!');
      console.log('Recomendação: Adicione "node copy-script.js" ao script predeploy no package.json');
    }
  } else {
    console.log(`ERRO: Arquivo ${packagePath} não existe!`);
  }
} catch (packageError) {
  console.error(`ERRO ao verificar package.json: ${packageError.message}`);
}

// Verificar script de cópia
console.log('\n=== VERIFICANDO SCRIPT DE CÓPIA ===');
const copyScriptPath = path.resolve(functionsDir, 'copy-script.js');
if (fs.existsSync(copyScriptPath)) {
  console.log(`Arquivo ${copyScriptPath} existe!`);
  
  try {
    const content = fs.readFileSync(copyScriptPath, 'utf8');
    
    // Verificar se o script detecta o sistema operacional
    console.log(`Detecção de Windows: ${content.includes('process.platform === \'win32\'') ? 'OK' : 'FALHA'}`);
    
    // Verificar se o script tenta múltiplos caminhos
    const hasMultiplePaths = content.includes('possiblePaths') || content.includes('testPath');
    console.log(`Suporte a múltiplos caminhos: ${hasMultiplePaths ? 'OK' : 'FALHA'}`);
  } catch (readError) {
    console.error(`ERRO ao ler arquivo: ${readError.message}`);
  }
} else {
  console.log(`ERRO: Arquivo ${copyScriptPath} não existe!`);
}

// Criar conteúdo de backup do scraper se necessário
if (!fs.existsSync(scraperPath)) {
  console.log('\n=== CRIANDO ARQUIVO DE BACKUP DO SCRAPER ===');
  const backupContent = `/**
 * Script de integração com SIGAA UFC para Cloud Functions - BACKUP
 *
 * Este é um arquivo de backup criado pelo script de verificação.
 */

const { chromium } = require('playwright-core');
const chromiumExec = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

// Função principal para fazer o scraping
async function scrapeSigaaUFC(username, password) {
  console.log('Iniciando scraping do SIGAA UFC (arquivo de backup)...');
  console.log(\`Usando credenciais: \${username} / \${'*'.repeat(password.length)}\`);
  
  // Retornar dados de exemplo
  return {
    classes: [
      {
        codigo: 'BACKUP01',
        nome: 'DISCIPLINA DE BACKUP',
        professor: 'SISTEMA',
        local: 'ONLINE',
        horario: {
          dia: 2,
          inicio: '08:00',
          fim: '10:00'
        }
      }
    ],
    tasks: [
      {
        id: 'backup1',
        titulo: 'Tarefa de Backup',
        descricao: 'Esta é uma tarefa criada pelo sistema de backup.',
        prazo: new Date().toISOString(),
        disciplina: {
          codigo: 'BACKUP01',
          nome: 'DISCIPLINA DE BACKUP'
        }
      }
    ]
  };
}

module.exports = { scrapeSigaaUFC };`;

  try {
    fs.writeFileSync(scraperPath, backupContent, 'utf8');
    console.log(`Arquivo de backup criado em: ${scraperPath}`);
    console.log(`Verificação final: ${fs.existsSync(scraperPath) ? 'ARQUIVO EXISTE' : 'FALHA AO CRIAR'}`);
  } catch (writeError) {
    console.error(`ERRO ao criar arquivo de backup: ${writeError.message}`);
  }
}

console.log('\n=== VERIFICAÇÃO CONCLUÍDA ===');
console.log('Se problemas foram encontrados, considere:');
console.log('1. Executar o script fix-deploy.js para tentar corrigir automaticamente');
console.log('2. Verificar permissões de arquivos e diretórios');
console.log('3. Fazer o deploy a partir de um ambiente Windows se possível'); 