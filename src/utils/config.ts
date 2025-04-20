/**
 * Configurações globais da aplicação
 */

// Controla se usamos o scraping diretamente no browser em vez de Cloud Functions
// Defina como FALSE quando você tiver implantado as Cloud Functions e tiver
// um plano Blaze do Firebase configurado
export const USE_BROWSER_SCRAPING = false; // Cloud Functions configuradas e prontas para uso

// Região do Firebase Functions
export const FIREBASE_FUNCTIONS_REGION = 'us-central1';

// Configurações de autenticação
export const AUTH_CONFIG = {
  // Tempo em milissegundos para considerar a sessão expirada (12 horas)
  SESSION_EXPIRY: 12 * 60 * 60 * 1000,
};

// Configurações de integração
export const INTEGRATION_CONFIG = {
  // Tempo máximo de timeout para operações de scraping (em ms)
  // Aumentando para 5 minutos para dar tempo suficiente ao processo de scraping
  SCRAPING_TIMEOUT: 300000, // 5 minutos
  // Intervalo entre tentativas automáticas de integração (em ms)
  RETRY_INTERVAL: 30000,
  // Número máximo de tentativas
  MAX_RETRIES: 3,
}; 