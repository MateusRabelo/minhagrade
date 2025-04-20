/**
 * Arquivo principal das Cloud Functions
 * 
 * INSTRUÇÕES PARA IMPLANTAÇÃO:
 * 1. Instale as dependências necessárias:
 *    npm install --save firebase-admin firebase-functions dotenv
 * 
 * 2. Implante as funções com o Firebase CLI:
 *    firebase deploy --only functions
 * 
 * 3. Certifique-se de configurar as variáveis de ambiente no Firebase:
 *    firebase functions:config:set sigaa.temp_dir="/tmp"
 */

// Importar as funções do módulo sigaaScraper
const sigaaScraper = require('./sigaaScraper');

// Exportar todas as funções
exports.scrapeSigaa = sigaaScraper.scrapeSigaa;
exports.storeSigaaCredentials = sigaaScraper.storeSigaaCredentials;

// Você pode adicionar mais funções aqui conforme necessário 