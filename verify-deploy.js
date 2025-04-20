/**
 * Script para verificar e corrigir problemas de deploy
 * 
 * Execute este script antes do deploy para garantir que todos os arquivos 
 * necessários sejam copiados corretamente.
 */
const fs = require('fs');
const path = require('path');

// Caminhos dos arquivos
const sourceScraperPath = path.join(__dirname, 'scraping', 'sigaa-ufc-playwright.js');
const destDir = path.join(__dirname, 'functions', 'scripts');
const destScraperPath = path.join(destDir, 'sigaa-ufc-playwright.js');

console.log('Verificando arquivos para deploy...');

// Verificar se o arquivo de origem existe
if (!fs.existsSync(sourceScraperPath)) {
  console.error(`ERRO: Arquivo de origem não encontrado: ${sourceScraperPath}`);
  process.exit(1);
}

// Criar diretório de destino se não existir
if (!fs.existsSync(destDir)) {
  console.log(`Criando diretório: ${destDir}`);
  fs.mkdirSync(destDir, { recursive: true });
}

// Copiar o arquivo
try {
  fs.copyFileSync(sourceScraperPath, destScraperPath);
  console.log(`Arquivo copiado com sucesso: ${sourceScraperPath} -> ${destScraperPath}`);
} catch (error) {
  console.error(`ERRO ao copiar arquivo: ${error.message}`);
  process.exit(1);
}

// Verificar o conteúdo do arquivo para garantir que foi copiado corretamente
const sourceContent = fs.readFileSync(sourceScraperPath, 'utf8');
const destContent = fs.readFileSync(destScraperPath, 'utf8');

if (sourceContent.length !== destContent.length) {
  console.error('AVISO: O conteúdo do arquivo copiado não corresponde ao original!');
  console.log(`Tamanho do arquivo original: ${sourceContent.length} bytes`);
  console.log(`Tamanho do arquivo copiado: ${destContent.length} bytes`);
} else {
  console.log('Verificação de conteúdo: OK');
}

// Verificar a importação no arquivo sigaaScraper.js
const scraperPath = path.join(__dirname, 'functions', 'sigaaScraper.js');
if (fs.existsSync(scraperPath)) {
  const scraperContent = fs.readFileSync(scraperPath, 'utf8');
  if (scraperContent.includes("require('./scripts/sigaa-ufc-playwright')")) {
    console.log('Importação no sigaaScraper.js: OK');
  } else {
    console.error('AVISO: A importação no sigaaScraper.js pode estar incorreta!');
  }
}

// Verificar dependências otimizadas para Cloud Functions
const packageJsonPath = path.join(__dirname, 'functions', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies.playwright) {
    console.error('AVISO: Usando o pacote completo "playwright" em vez do "playwright-core"!');
    console.log('Recomendação: Substitua por "playwright-core" para otimizar o tamanho do deploy.');
  } else if (!packageJson.dependencies['playwright-core']) {
    console.error('AVISO: Dependência "playwright-core" não encontrada no package.json!');
  } else {
    console.log('Dependência playwright-core: OK');
  }
  
  if (!packageJson.dependencies['@sparticuz/chromium']) {
    console.error('AVISO: Dependência "@sparticuz/chromium" não encontrada no package.json!');
    console.log('Recomendação: Adicione @sparticuz/chromium para otimizar o deploy no Cloud Functions.');
  } else {
    console.log('Dependência @sparticuz/chromium: OK');
  }
}

// Verificar se o script usa playwright-core
if (fs.existsSync(destScraperPath)) {
  const scriptContent = fs.readFileSync(destScraperPath, 'utf8');
  
  if (scriptContent.includes("require('playwright')") && !scriptContent.includes("require('playwright-core')")) {
    console.error('AVISO: O script está usando "playwright" em vez de "playwright-core"!');
    console.log('Recomendação: Execute fix-deploy.js para atualizar o script.');
  } else if (scriptContent.includes("require('playwright-core')")) {
    console.log('Uso de playwright-core no script: OK');
    
    if (!scriptContent.includes("require('@sparticuz/chromium')")) {
      console.error('AVISO: O script não está usando @sparticuz/chromium!');
      console.log('Recomendação: Atualize o script para usar o Chromium otimizado.');
    } else {
      console.log('Uso de @sparticuz/chromium no script: OK');
    }
  }
}

console.log('Verificação concluída! Você agora pode executar o deploy das funções.');
console.log('Se encontrou avisos, execute "node fix-deploy.js" para corrigir automaticamente os problemas.'); 