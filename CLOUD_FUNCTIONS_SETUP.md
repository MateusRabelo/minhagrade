# Configuração das Cloud Functions

Este guia descreve como configurar e implantar as Cloud Functions necessárias para a integração acadêmica.

## Pré-requisitos

1. Node.js instalado (v16 ou superior)
2. Firebase CLI instalado: `npm install -g firebase-tools`
3. Conta no Firebase com um projeto criado
4. Git (para clonar o repositório)

## Estrutura de diretórios

Certifique-se de que sua estrutura de diretórios está correta:

```
meushorarios/
  ├── functions/
  │   ├── node_modules/
  │   ├── scripts/
  │   │   └── sigaa-ufc-playwright.js  # Script de scraping
  │   ├── index.js                     # Exportação das funções
  │   ├── sigaaScraper.js              # Implementação da Cloud Function
  │   └── package.json                 # Dependências
  └── scraping/
      └── sigaa-ufc-playwright.js      # Script original
```

## Passos para configuração

### 1. Preparar o ambiente de desenvolvimento

```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto Firebase (se ainda não estiver inicializado)
firebase init
```

Durante a inicialização, selecione:
- Functions
- Use an existing project
- JavaScript
- ESLint: No (opcional)
- Install dependencies: Yes

### 2. Configurar a pasta functions

```bash
# Navegar para a pasta functions
cd functions

# Instalar dependências necessárias
npm install --save firebase-admin firebase-functions playwright dotenv
```

### 3. Copiar os scripts necessários

Certifique-se de que o sigaa-ufc-playwright.js está disponível em `functions/scripts/`:

```bash
# Criar a pasta scripts se não existir
mkdir -p functions/scripts

# Copiar o script original
cp scraping/sigaa-ufc-playwright.js functions/scripts/
```

### 4. Verificar arquivos de configuração

Use o script de verificação para garantir que todos os arquivos estão nos lugares corretos:

```bash
node verify-functions.js
```

Ele vai informar se está tudo correto ou o que precisa ser corrigido.

### 5. Implantar as Cloud Functions

```bash
# Implantar todas as functions
firebase deploy --only functions

# Ou apenas a function específica
firebase deploy --only functions:scrapeSigaa
```

### 6. Verificar implantação

1. Acesse o console do Firebase: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Navegue até seu projeto
3. Clique em "Functions" no menu lateral
4. Verifique se a função "scrapeSigaa" está listada e com status "Ativo"

## Solução de problemas

### Erro de permissão ao implantar

Se você receber erro de permissão ao implantar, verifique:
- Se você está logado na conta correta do Firebase (`firebase login`)
- Se você tem permissão de Editor no projeto Firebase

### Erro na execução da função

Se a função for implantada mas retornar erro ao executar:

1. Verifique os logs no console do Firebase
2. Certifique-se de que o arquivo sigaa-ufc-playwright.js funciona localmente
3. Verifique se todas as dependências estão instaladas
4. O Playwright pode precisar de dependências adicionais no ambiente de Cloud Functions

### Erro de timeout

A execução do Playwright pode ser demorada. Aumente o timeout da função no arquivo sigaaScraper.js:

```javascript
exports.scrapeSigaa = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutos
    memory: '2GB',      // Mais memória para o Playwright
  })
```

## Testes locais

Para testar as Cloud Functions localmente:

```bash
# Executar o emulador de Functions
firebase emulators:start --only functions

# Em outro terminal, testar a função com curl ou outro cliente HTTP
```

## Precisa de ajuda?

- Documentação do Firebase: [https://firebase.google.com/docs/functions](https://firebase.google.com/docs/functions)
- Documentação do Playwright: [https://playwright.dev/docs/intro](https://playwright.dev/docs/intro) 