# Cloud Functions para MeusHorarios

Este diretório contém as Cloud Functions usadas para a integração acadêmica.

## Resolução de Problemas

### Erro: `TypeError: functions.runWith is not a function`

Este erro ocorre quando há problemas de compatibilidade entre as versões do Firebase Functions ou quando o Firebase Admin não é inicializado corretamente.

Para resolver:

1. Instale as dependências corretas:
   ```bash
   cd functions
   npm install firebase-admin@11.8.0 firebase-functions@4.3.1 playwright@1.40.0 dotenv@16.3.1
   ```

2. Verifique se a estrutura do diretório de scripts existe:
   ```bash
   mkdir -p functions/scripts
   ```

3. Copie o script do scraper para o diretório correto:
   ```bash
   cp scraping/sigaa-ufc-playwright.js functions/scripts/
   ```

4. Limpe o cache e reinicie:
   ```bash
   firebase functions:delete scrapeSigaa --force  # (opcional, se já tentou deploy)
   npm cache clean --force
   npm install
   ```

5. Implante novamente:
   ```bash
   firebase deploy --only functions
   ```

### Erro: `Error: User code failed to load.`

Este erro geralmente ocorre quando há problemas na inicialização das funções. Causas comuns:

1. Código síncronico que está bloqueando a inicialização
2. Dependências incompatíveis
3. Problemas com a estrutura do código

Para resolver:

1. Verifique se não há código bloqueante fora das funções
2. Use a versão correta do Node.js (Node 18 é recomendado)
3. Atualize o arquivo package.json para as versões corretas

## Como testar localmente

```bash
# Inicie os emuladores do Firebase
npm run serve

# Em outro terminal, teste a função
curl -X POST -H "Content-Type:application/json" -d '{"data":{"username":"test","password":"test"}}' http://localhost:5001/minhagrade-85a56/us-central1/scrapeSigaa
``` 