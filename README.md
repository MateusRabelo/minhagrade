# Meus Horários

Aplicativo para gerenciar horários acadêmicos e atividades.

## Características

- Gerenciamento de horários de aulas
- Acompanhamento de atividades e prazos
- Integração com sistemas acadêmicos (SIGAA UFC e outros)
- Notificações de tarefas próximas

## Configuração da Integração com SIGAA

O aplicativo inclui suporte para integração com o Sistema Integrado de Gestão de Atividades Acadêmicas (SIGAA) da Universidade Federal do Ceará (UFC) e outras instituições.

### Para Usuários

1. Navegue até a tela principal do aplicativo após login
2. Clique no botão "Fazer Integração" 
3. Selecione sua instituição na lista
4. Insira seu nome de usuário e senha
5. Clique em "Conectar Conta Acadêmica"

O aplicativo irá sincronizar suas disciplinas e atividades automaticamente.

### Para Desenvolvedores

A integração com o SIGAA requer a configuração de uma Cloud Function para executar o script de web scraping de forma segura e eficiente.

#### Configuração do Firebase Cloud Functions

1. Configure o Firebase CLI:
   ```
   npm install -g firebase-tools
   firebase login
   firebase init functions
   ```

2. Copie os arquivos de exemplo da pasta `functions/` para o seu projeto Firebase
3. Instale as dependências:
   ```
   cd functions
   npm install
   ```

4. Configure as variáveis de ambiente:
   ```
   firebase functions:config:set sigaa.secret_key="sua_chave_secreta_para_criptografia"
   ```

5. Implante as funções:
   ```
   firebase deploy --only functions
   ```

#### Script de Scraping

O script `scraping/sigaa-ufc-playwright.js` pode ser executado localmente para testes:

```
cd scraping
npm install playwright dotenv
node sigaa-ufc-playwright.js
```

Para executar o script, crie um arquivo `.env` com as seguintes variáveis:

```
SIGAA_USER=seu_usuario
SIGAA_PASS=sua_senha
```

## Deploy das Cloud Functions

Para implantar as Cloud Functions corretamente no Windows, siga estes passos:

1. **Verificar arquivos necessários**
   
   Execute o script de verificação que irá analisar se todos os arquivos estão no lugar certo:
   ```bash
   node verify-deploy.js
   ```

2. **Corrigir problemas automaticamente**
   
   Se a verificação mostrar problemas, execute o script de correção:
   ```bash
   node fix-deploy.js
   ```

3. **Deploy das funções**
   
   Após corrigir os problemas, faça o deploy:
   ```bash
   cd functions
   npm run deploy
   ```

### Problemas comuns

* **Arquivo sigaa-ufc-playwright.js não encontrado**: O script `fix-deploy.js` copia automaticamente o arquivo da pasta `scraping` para `functions/scripts`.
  
* **Problema de importação**: Se o sigaaScraper.js não conseguir encontrar o módulo, o script de correção ajusta os caminhos de importação.

* **Dependências ausentes**: O script de correção verifica e adiciona as dependências necessárias ao package.json das funções.

### Otimização para Google Cloud Functions

Para otimizar o deploy da aplicação no Google Cloud Functions, foram implementadas as seguintes melhorias:

1. **Uso do `playwright-core` e `@sparticuz/chromium`**:
   - Substituição do pacote completo `playwright` pelo mais leve `playwright-core`
   - Adição do `@sparticuz/chromium`, uma versão compactada do Chrome otimizada para ambientes serverless

2. **Configurações específicas para Cloud Functions**:
   - Aumento da memória alocada para 1GB
   - Configuração de timeout estendido (300 segundos)
   - Argumentos especiais para o Chrome em ambiente serverless

3. **Tratamento de erros aprimorado**:
   - Gerenciamento adequado de exceções
   - Fallback para dados mockados em caso de falha no scraping

Para executar um deploy otimizado no Google Cloud Functions:

```bash
cd functions
npm install
npm run deploy
```

## Tecnologias Utilizadas

- React
- TypeScript
- Firebase (Authentication, Firestore, Cloud Functions)
- Playwright (para automação da web)
- TailwindCSS

## Configuração Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Inicie o servidor de desenvolvimento: `npm run dev`
4. Acesse o aplicativo em http://localhost:5173
