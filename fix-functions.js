/**
 * Script para corrigir problemas com Cloud Functions
 * Execute com: node fix-functions.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️ Iniciando correção das Cloud Functions...');

// Verificar se a pasta functions existe
if (!fs.existsSync('./functions')) {
  console.error('❌ Pasta "functions" não encontrada. Verifique se você está no diretório raiz do projeto.');
  process.exit(1);
}

// Passo 1: Verificar o package.json
console.log('1️⃣ Verificando package.json...');
try {
  const packageJsonPath = './functions/package.json';
  const packageJson = require(packageJsonPath);
  
  // Atualizar versões das dependências
  packageJson.dependencies = {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1",
    "playwright": "^1.40.0",
    "dotenv": "^16.3.1",
    ...(packageJson.dependencies || {})
  };
  
  // Definir a versão do Node.js para 18
  packageJson.engines = {
    "node": "18"
  };
  
  // Salvar alterações
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ package.json atualizado com sucesso.');
} catch (error) {
  console.error('❌ Erro ao atualizar package.json:', error.message);
}

// Passo 2: Verificar e corrigir o arquivo sigaaScraper.js
console.log('2️⃣ Verificando sigaaScraper.js...');
try {
  const sigaaScraperPath = './functions/sigaaScraper.js';
  if (fs.existsSync(sigaaScraperPath)) {
    let content = fs.readFileSync(sigaaScraperPath, 'utf8');
    
    // Verificar e corrigir a linha da função runWith
    if (!content.includes('.region(')) {
      content = content.replace(
        'exports.scrapeSigaa = functions',
        'exports.scrapeSigaa = functions\n  .region(\'us-central1\')'
      );
      fs.writeFileSync(sigaaScraperPath, content);
      console.log('✅ sigaaScraper.js corrigido com sucesso.');
    } else {
      console.log('✅ sigaaScraper.js já está correto.');
    }
  } else {
    console.error('❌ Arquivo sigaaScraper.js não encontrado.');
  }
} catch (error) {
  console.error('❌ Erro ao corrigir sigaaScraper.js:', error.message);
}

// Passo 3: Verificar e criar pasta de scripts
console.log('3️⃣ Verificando pasta de scripts...');
try {
  const scriptsPath = './functions/scripts';
  if (!fs.existsSync(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
    console.log('✅ Pasta scripts criada com sucesso.');
  } else {
    console.log('✅ Pasta scripts já existe.');
  }
  
  // Copiar script de scraping
  const sourceScriptPath = './scraping/sigaa-ufc-playwright.js';
  const targetScriptPath = './functions/scripts/sigaa-ufc-playwright.js';
  
  if (fs.existsSync(sourceScriptPath) && !fs.existsSync(targetScriptPath)) {
    fs.copyFileSync(sourceScriptPath, targetScriptPath);
    console.log('✅ Script de scraping copiado com sucesso.');
  } else if (fs.existsSync(targetScriptPath)) {
    console.log('✅ Script de scraping já existe no diretório correto.');
  } else {
    console.error('❌ Script de scraping não encontrado em ./scraping/');
  }
} catch (error) {
  console.error('❌ Erro ao configurar scripts:', error.message);
}

// Passo 4: Sugerir comandos para atualização
console.log('\n🔄 Próximos passos para atualizar as dependências:');
console.log('1. Execute os seguintes comandos:');
console.log('   cd functions');
console.log('   npm install');
console.log('2. Após a instalação, implante as funções:');
console.log('   firebase deploy --only functions');

// Passo 5: Atualizar configuração do projeto para usar browser scraping temporário
console.log('\n🔧 Configurando modo temporário de scraping no navegador...');
try {
  const configPath = './src/utils/config.ts';
  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');
    content = content.replace(
      'export const USE_BROWSER_SCRAPING = false;',
      'export const USE_BROWSER_SCRAPING = true; // Usando modo temporário até resolver Cloud Functions'
    );
    fs.writeFileSync(configPath, content);
    console.log('✅ Modo de scraping no navegador ativado temporariamente.');
  } else {
    console.log('❓ Arquivo de configuração não encontrado. Verifique o caminho correto.');
  }
} catch (error) {
  console.error('❌ Erro ao atualizar configuração:', error.message);
}

console.log('\n✨ Correções concluídas!');
console.log('Sua aplicação está configurada para usar o modo de scraping no navegador temporariamente,');
console.log('enquanto você resolve os problemas com as Cloud Functions.'); 