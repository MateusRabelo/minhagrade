// Script de teste para o SIGAA UFC usando Playwright
// Este teste simula um navegador real para evitar problemas de deslogamento automático

// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();
console.log('Arquivo .env encontrado em:', process.cwd() + '/.env');

// Verificar se as credenciais estão presentes
const hasCredentials = process.env.SIGAA_USER && process.env.SIGAA_PASS;
console.log(`Configuração encontrada - SIGAA_USER: ${hasCredentials ? 'Sim' : 'Não'}, SIGAA_PASS: ${hasCredentials ? 'Sim' : 'Não'}`);

// Configurar credenciais
const username = process.env.SIGAA_USER || 'teeusr';
const password = process.env.SIGAA_PASS || 'password';

// Importar módulos necessários
const { chromium } = require('playwright-core');
const chromiumExec = require('@sparticuz/chromium');
const fs = require('fs');
const path = require('path');

console.log(`Usando credenciais: ${username} / ${'*'.repeat(password.length)}`);

// Função principal de teste
async function testarSigaaUFCComPlaywright() {
  console.log('Iniciando o teste de integração com o SIGAA da UFC usando Playwright...');
  
  try {
    // Verificar se a função downloadChromium existe antes de usar
    // Algumas versões do pacote não possuem essa função
    if (typeof chromiumExec.downloadChromium === 'function') {
      console.log('Fazendo download do Chromium...');
      try {
        await chromiumExec.downloadChromium();
        console.log('Download do Chromium concluído.');
      } catch (downloadError) {
        console.warn('Erro ao baixar Chromium:', downloadError.message);
        console.log('Tentando continuar com o caminho existente...');
      }
    } else {
      console.log('Função downloadChromium não disponível nesta versão do pacote. Usando executável existente.');
    }
    
    // Obter o caminho executável do Chrome com await
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
      headless: true, // Mostrar o navegador (mude para true em produção)
      executablePath: chromePath,
      args: chromiumExec.args,
    });
    console.log('Navegador iniciado com sucesso.');
    
    try {
      // Criar uma nova guia/contexto com timeout maior
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 }, // Aumentar resolução
        bypassCSP: true, // Permitir bypass de Content Security Policy
        javaScriptEnabled: true,
        // Definir tempos limite maiores
        navigationTimeout: 60000,
        // Opções adicionais para persistir cookies entre sessões - verificar se o arquivo existe
        ...(fs.existsSync('./storage.json') ? { storageState: './storage.json' } : {})
      });
      
      // Configurar tempos limite mais longos globalmente
      context.setDefaultTimeout(60000); // 60 segundos de timeout
      
      // Diretório para salvar os arquivos baixados
      const downloadDir = path.join(process.cwd(), 'downloads');
      // Criar diretório se não existir
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }
      
      // Criar uma nova página
      const page = await context.newPage();
      
      // Configurar listeners para logs e erros da página
      page.on('console', msg => console.log(`[Navegador Log]: ${msg.text()}`));
      page.on('pageerror', err => console.error(`[Erro na Página]: ${err.message}`));
      
      // Interceptar requisições para garantir carregamento de recursos importantes
      await page.route('**/*.{png,jpg,jpeg,css,js}', route => {
        route.continue();
      });
      
      try {
        console.log('Etapa 1: Acessando página de login do SIGAA UFC...');
        await page.goto('https://si3.ufc.br/sigaa/verTelaLogin.do', { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        console.log('Página de login carregada com sucesso.');
        
        // Pequena pausa para garantir que tudo foi carregado
        await page.waitForTimeout(3000);
        
        // Salvar screenshot para debug
        await page.screenshot({ path: path.join(downloadDir, 'login_page.png') });
        
        console.log('Etapa 2: Preenchendo credenciais de login...');
        // Preencher campos de login
        await page.fill('input[name="user.login"]', username);
        await page.fill('input[name="user.senha"]', password);
        
        // Aguardar um momento antes de clicar no botão (comportamento humano)
        await page.waitForTimeout(2000);
        
        console.log('Etapa 3: Enviando formulário de login...');
        // Clicar no botão de login e aguardar a navegação
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 })
            .catch(e => console.log('Timeout esperando navegação após login, mas continuando...')),
          page.click('input[type="submit"][value="Entrar"]')
        ]);
        
        // Aguardar um pouco depois do login
        await page.waitForTimeout(5000);
        
        // Salvar screenshot após login
        await page.screenshot({ path: path.join(downloadDir, 'after_login.png') });
        
        // Verificar se estamos na página principal após o login
        console.log(`URL atual: ${page.url()}`);
        
        // Verificar se o login foi bem-sucedido procurando elementos na página
        const loggedIn = await page.evaluate(() => {
          // Verificar vários padrões que indicam login bem-sucedido
          return document.body.innerText.includes('Portal do Discente') || 
                 document.body.innerText.includes('Módulos') ||
                 document.body.innerText.includes('Bem-vindo') ||
                 document.body.innerText.includes('Sondagem Cultural UFC') ||
                 document.body.innerText.includes('Continuar >>') ||
                 document.body.innerText.includes('Tempo de Sessão') ||
                 document.body.innerText.includes('SAIR') ||
                 // Verificar se há um nome de usuário exibido no topo
                 document.querySelectorAll('.usuario, .destaque, .dadosUsuario').length > 0;
        });
        
        // Obter a URL atual para diagnóstico
        const currentUrl = page.url();
        console.log(`URL atual: ${currentUrl}`);
        
        // Página de aviso ou sondagem cultural - precisamos clicar em continuar
        if (currentUrl.includes('telaAvisoLogon.jsf') || await page.$('input[value="Continuar >>"]')) {
          console.log('Detectada tela de aviso ou sondagem. Clicando em Continuar...');
          try {
            // Tente clicar no botão continuar se existir
            const continuarBtn = await page.$('input[value="Continuar >>"]');
            if (continuarBtn) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 })
                  .catch(e => console.log('Timeout esperando navegação após clicar em Continuar, mas continuando...')),
                continuarBtn.click()
              ]);
              console.log('Clicado no botão Continuar. Prosseguindo...');
              
              // Aguardar um pouco para a próxima página carregar
              await page.waitForTimeout(3000);
            }
          } catch (e) {
            console.log(`Erro ao tentar clicar no botão Continuar: ${e.message}`);
          }
        }
        
        if (loggedIn) {
          console.log('Login realizado com sucesso!');
          
          // Obter nome do usuário
          const userName = await page.evaluate(() => {
            // Localizar o nome do usuário em algum elemento da página
            const userElement = document.querySelector('.usuario span') || 
                               document.querySelector('#perfil-docente') ||
                               document.querySelector('p.painel-usuario') ||
                               document.querySelector('.destaque');
            return userElement ? userElement.innerText.trim() : 'Nome não encontrado';
          });
          
          console.log(`Nome do usuário: ${userName}`);
          
          try {
            // Navegar para a página de turmas/disciplinas
            console.log('Navegando para página de disciplinas...');
            
            // Aguardar antes de navegar (estabilizar sessão)
            await page.waitForTimeout(3000);
            
            // Acessar página de disciplinas
            try {
              // Tentar clicar em um link para turmas ou portal do aluno
              const discButton = await page.$('a:has-text("Turmas")') || 
                                await page.$('a:has-text("Portal do Discente")') ||
                                await page.$('a:has-text("Ensino")');
              
              if (discButton) {
                await Promise.all([
                  page.waitForNavigation({ waitUntil: 'networkidle' }),
                  discButton.click()
                ]);
                
                console.log('Página de disciplinas acessada com sucesso.');
                
                // Obter IDs e nomes das disciplinas - MELHORADO
                const disciplinas = await page.evaluate(() => {
                  // Diferentes estratégias para identificar disciplinas
                  let disciplinasArray = [];
                  
                  // Estratégia 1: Tentar encontrar disciplinas via tabela de turmas (layout mais comum)
                  let disciplinasElements = document.querySelectorAll('table.listagem tr td a[onclick*="detalhes"]');
                  
                  if (disciplinasElements.length === 0) {
                    // Estratégia 2: Buscar links com nome de disciplinas específicos
                    disciplinasElements = document.querySelectorAll('td a[href*="turma.jsf"]');
                  }
                  
                  if (disciplinasElements.length === 0) {
                    // Estratégia 3: Usar o código da disciplina como identificador (RUS0081, etc.)
                    disciplinasElements = document.querySelectorAll('tr td a[class*="rich-menu-item"], td:first-child a');
                  }
                  
                  if (disciplinasElements.length === 0) {
                    // Estratégia 4: Procurar por padrões de texto de disciplinas
                    const allLinks = document.querySelectorAll('a');
                    disciplinasElements = Array.from(allLinks).filter(el => {
                      const text = el.textContent.trim();
                      // Procurar por padrões como "RUS0081 - MATEMATICA COMPUTACIONAL"
                      return /^[A-Z]{2,3}\d{4,6}\s+[-–]\s+.+/.test(text);
                    });
                  }
                  
                  if (disciplinasElements.length === 0) {
                    // Estratégia 5: Tentar identificar pelos componentes curriculares
                    const componentesTitulos = document.querySelectorAll('.componenteCurricular');
                    if (componentesTitulos.length > 0) {
                      disciplinasArray = Array.from(componentesTitulos).map(el => {
                        return {
                          id: el.id || 'comp-' + Math.random().toString(36).substring(2, 9),
                          nome: el.textContent.trim(),
                          element: el
                        };
                      });
                    }
                  }
                  
                  // Se as estratégias anteriores não funcionaram, construa a lista com o que encontrou
                  if (disciplinasArray.length === 0 && disciplinasElements.length > 0) {
                    disciplinasArray = Array.from(disciplinasElements).map(el => {
                      return {
                        id: el.id || el.href || 'disc-' + Math.random().toString(36).substring(2, 9),
                        nome: el.textContent.trim(),
                        element: el
                      };
                    });
                  }
                  
                  // Última estratégia: buscar por qualquer elemento da tabela de turmas
                  if (disciplinasArray.length === 0) {
                    // Se chegarmos aqui, vamos tentar pegar qualquer elemento da tabela
                    const todasLinhasTabela = document.querySelectorAll('table tr');
                    // Pular a primeira linha (cabeçalho)
                    const linhasDeConteudo = Array.from(todasLinhasTabela).slice(1);
                    
                    disciplinasArray = linhasDeConteudo
                      .filter(row => {
                        // Filtrar apenas linhas que parecem conter disciplinas
                        const cells = row.querySelectorAll('td');
                        return cells.length >= 2; // Pelo menos 2 células (código e nome)
                      })
                      .map(row => {
                        const cells = row.querySelectorAll('td');
                        // Tentar extrair código e nome da disciplina
                        const codigoCell = cells[0];
                        const nomeCell = cells.length > 1 ? cells[1] : cells[0];
                        
                        let nome = '';
                        // Tentar diferentes abordagens para extrair o nome
                        if (nomeCell) {
                          const link = nomeCell.querySelector('a');
                          if (link) {
                            nome = link.textContent.trim();
                          } else {
                            nome = nomeCell.textContent.trim();
                          }
                        }
                        
                        return {
                          id: codigoCell ? codigoCell.textContent.trim() : 'row-' + Math.random().toString(36).substring(2, 9),
                          nome: nome,
                          element: row
                        };
                      })
                      .filter(item => item.nome && item.nome.length > 0);
                  }
                  
                  // Último caso: se ainda não encontrou, tente analisar toda a página
                  if (disciplinasArray.length === 0) {
                    console.log("Nenhuma disciplina encontrada pelos métodos padrão. Registrando HTML para debug.");
                    // Aqui apenas retornamos um array vazio, mas na implementação real poderíamos
                    // analisar o HTML inteiro e buscar padrões
                    
                    // Tenta extrair de qualquer elemento que pareça um título de disciplina
                    const allElements = document.querySelectorAll('*');
                    const potentialDisciplinas = Array.from(allElements)
                      .filter(el => {
                        const text = el.textContent.trim();
                        return text.length > 5 && 
                               (/[A-Z]{2,3}\d{4}/.test(text) || // Código de disciplina
                                /COMPUTACIONAL|SOFTWARE|REDES|PROBABILIDADE/.test(text)); // Palavras comuns em disciplinas
                      })
                      .map(el => {
                        return {
                          id: 'el-' + Math.random().toString(36).substring(2, 9),
                          nome: el.textContent.trim(),
                          element: el
                        };
                      });
                    
                    if (potentialDisciplinas.length > 0) {
                      disciplinasArray = potentialDisciplinas;
                    }
                  }
                  
                  // Remover duplicatas baseado no nome
                  const disciplinasUnicas = [];
                  const nomesVistos = new Set();
                  
                  for (const disc of disciplinasArray) {
                    if (!nomesVistos.has(disc.nome)) {
                      nomesVistos.add(disc.nome);
                      disciplinasUnicas.push(disc);
                    }
                  }
                  
                  return disciplinasUnicas;
                });
                
                // Debug: salvar HTML da página para análise
                await page.evaluate(() => {
                  console.log("Conteúdo HTML da página de disciplinas:", document.documentElement.outerHTML);
                });
                
                console.log(`Total de disciplinas encontradas: ${disciplinas.length}`);
                
                if (disciplinas.length > 0) {
                  console.log('Lista de disciplinas:');
                  disciplinas.forEach((disc, index) => {
                    console.log(`  ${index+1}. ${disc.nome}`);
                  });
                  
                  // Criar diretório para armazenar informações das tarefas
                  const tarefasDir = path.join(downloadDir, 'tarefas');
                  if (!fs.existsSync(tarefasDir)) {
                    fs.mkdirSync(tarefasDir, { recursive: true });
                  }
                  
                  // Salvar HTML da página para análise offline
                  const paginaHTML = await page.content();
                  fs.writeFileSync(path.join(tarefasDir, 'pagina_disciplinas.html'), paginaHTML);
                  
                  // Criar uma variável global para controlar se já expandimos o menu Atividades antes
                  let menuAtividadesJaExpandido = false;
                  
                  // Para cada disciplina, entrar e buscar tarefas
                  for (let i = 0; i < disciplinas.length; i++) {
                    const disciplina = disciplinas[i];
                    console.log(`\nAcessando disciplina: ${disciplina.nome} (${i+1}/${disciplinas.length})`);
                    
                    // Criar diretório para a disciplina
                    const disciplinaDir = path.join(tarefasDir, `${i+1}_${disciplina.nome.replace(/[^a-z0-9]/gi, '_')}`);
                    if (!fs.existsSync(disciplinaDir)) {
                      fs.mkdirSync(disciplinaDir, { recursive: true });
                    }
                    
                    try {
                      // Estratégia melhorada para entrar na disciplina
                      // Primeiro, tentamos clicar diretamente no nome da disciplina
                      let entrou = false;
                      
                      // Estratégia 1: Procurar pelo texto exato da disciplina
                      const links = await page.$$('a, td');
                      
                      for (const link of links) {
                        const texto = await link.textContent();
                        
                        if (texto && texto.trim() === disciplina.nome) {
                          try {
                            // Tentar clicar no elemento
                            await Promise.all([
                              page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
                              link.click()
                            ]);
                            entrou = true;
                            console.log(`Entrou na disciplina: ${disciplina.nome}`);
                            break;
                          } catch (e) {
                            console.log(`Não conseguiu clicar diretamente no elemento: ${e.message}`);
                          }
                        }
                      }
                      
                      // Estratégia 2: Se não funcionou, procurar pelo código da disciplina
                      if (!entrou) {
                        // Extrair código da disciplina (ex: RUS0081)
                        const codigoMatch = disciplina.nome.match(/^([A-Z]{2,3}\d{4,6})/);
                        if (codigoMatch) {
                          const codigo = codigoMatch[1];
                          console.log(`Tentando entrar usando o código: ${codigo}`);
                          
                          const codigoLinks = await page.$$(`a:has-text("${codigo}"), td:has-text("${codigo}")`);
                          
                          for (const link of codigoLinks) {
                            try {
                              await Promise.all([
                                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
                                link.click()
                              ]);
                              entrou = true;
                              console.log(`Entrou na disciplina pelo código: ${codigo}`);
                              break;
                            } catch (e) {
                              console.log(`Não conseguiu clicar no elemento com código: ${e.message}`);
                            }
                          }
                        }
                      }
                      
                      // Estratégia 3: Último recurso - SIGAA às vezes usa imagens para abrir detalhes
                      if (!entrou) {
                        const imgLinks = await page.$$('img[src*="detalhes"], img[alt*="detalhes"], img[title*="detalhe"]');
                        
                        for (const img of imgLinks) {
                          const parentRow = await img.evaluateHandle(node => node.closest('tr'));
                          const rowText = await parentRow.evaluate(row => row.textContent);
                          
                          if (rowText.includes(disciplina.nome) || 
                              (disciplina.id && rowText.includes(disciplina.id))) {
                            try {
                              await Promise.all([
                                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {}),
                                img.click()
                              ]);
                              entrou = true;
                              console.log(`Entrou na disciplina via ícone de detalhes`);
                              break;
                            } catch (e) {
                              console.log(`Erro ao clicar no ícone: ${e.message}`);
                            }
                          }
                        }
                      }
                      
                      if (!entrou) {
                        console.log(`Não foi possível acessar a disciplina: ${disciplina.nome}`);
                        // Salvar screenshot para debug
                        await page.screenshot({ path: path.join(disciplinaDir, 'erro_acesso.png') });
                        continue;
                      }
                    } catch (error) {
                      console.error(`Erro ao tentar acessar disciplina ${disciplina.nome}: ${error.message}`);
                      await page.screenshot({ path: path.join(disciplinaDir, 'erro_acesso.png') });
                      continue;
                    }
                    
                    // Aguardar carregamento da página da disciplina
                    await page.waitForTimeout(2000);
                    
                    // Tentar acessar Tarefas
                    try {
                      // Acessar a página de Tarefas - Código mais robusto
                      console.log('Buscando a seção Atividades primeiro...');
                      
                      // Verificar se é a primeira disciplina ou se ainda não expandimos o menu
                      if (!menuAtividadesJaExpandido) {
                        // Estratégia 1: Clicar primeiro em "Atividades" no painel lateral
                        const atividadesBtn = await page.$('div.rich-panelbar-header.itemMenuHeaderAtividades, div[id="rich-panelbar-header-3"], div[aria-expanded="false"][role="button"]:has-text("Atividades")');
                        
                        if (atividadesBtn) {
                          // Verificar se o menu já está expandido
                          const estaExpandido = await page.evaluate(el => {
                            return el.getAttribute('aria-expanded') === 'true';
                          }, atividadesBtn);
                          
                          if (!estaExpandido) {
                            console.log('Encontrada seção de Atividades. Clicando para expandir...');
                            // Clicar no botão Atividades para expandir o menu
                            await atividadesBtn.click();
                            
                            // Aguardar para o menu expandir
                            await page.waitForTimeout(1000);
                          } else {
                            console.log('Menu Atividades já está expandido.');
                          }
                          
                          // Marcar que o menu Atividades já foi expandido
                          menuAtividadesJaExpandido = true;
                        }
                      } else {
                        console.log('Pulando expansão do menu Atividades - já foi expandido anteriormente.');
                      }
                      
                      // Agora procurar pelo link de Tarefas, independente de ter expandido o menu ou não
                      console.log('Procurando pelo link de Tarefas...');
                      
                      // Abordagem mais robusta para encontrar e clicar no link de Tarefas
                      try {
                        // Aguardar um pouco para garantir que a página está estabilizada
                        await page.waitForTimeout(2000);
                        
                        // Verificar se o link está presente com uma espera explícita
                        await page.waitForSelector('div.itemMenu:has-text("Tarefas"), a:has-text("Tarefas")', 
                          { state: 'attached', timeout: 5000 })
                            .catch(() => console.log('Timeout esperando pelo seletor de Tarefas, tentando mesmo assim...'));
                        
                        // Usar avaliateHandle para verificar e clicar diretamente no DOM
                        const tarefasClicado = await page.evaluate(() => {
                          // Tentar encontrar o link por diferentes seletores
                          const seletores = [
                            'div.itemMenu:has-text("Tarefas")',
                            'a:has-text("Tarefas")',
                            '.itemMenu:contains("Tarefas")',
                            'a[href*="tarefa"]',
                            'a[onclick*="tarefa"]'
                          ];
                          
                          // Tentar cada seletor
                          for (const seletor of seletores) {
                            try {
                              const elementos = document.querySelectorAll(seletor);
                              for (const el of elementos) {
                                if (el && el.textContent && el.textContent.includes('Tarefa')) {
                                  // Verificar se o elemento está visível
                                  const rect = el.getBoundingClientRect();
                                  if (rect.width > 0 && rect.height > 0) {
                                    // Clicar usando o evento nativo
                                    el.click();
                                    return true;
                                  }
                                }
                              }
                            } catch (e) {
                              console.error(`Erro com seletor ${seletor}: ${e}`);
                            }
                          }
                          return false;
                        });
                        
                        if (tarefasClicado) {
                          console.log('Clique em Tarefas executado via JavaScript do navegador.');
                          // Esperar a navegação completar
                          await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
                            .catch(e => console.log('Timeout aguardando navegação após clicar em Tarefas, mas continuando...'));
                          
                          // Aguardar carregamento adicional
                          await page.waitForTimeout(5000);
                          console.log('Página de Tarefas acessada.');
                        } else {
                          console.log('Não foi possível clicar via JavaScript, tentando método do Playwright...');
                          
                          // Tentar novamente com o método padrão do Playwright como fallback
                          let tarefasLink = await page.$('div.itemMenu:has-text("Tarefas"), a:has-text("Tarefas")');
                          
                          if (tarefasLink) {
                            console.log('Encontrado link de Tarefas. Clicando...');
                            // Clicar no link de Tarefas
                            await Promise.all([
                              page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 })
                                .catch(e => console.log('Timeout aguardando navegação após clicar em Tarefas, mas continuando...')),
                              tarefasLink.click().catch(e => {
                                console.log(`Erro ao clicar: ${e.message}`);
                                return page.click('div.itemMenu:has-text("Tarefas"), a:has-text("Tarefas")');
                              })
                            ]);
                            
                            // Aguardar carregamento
                            await page.waitForTimeout(5000);
                            console.log('Página de Tarefas acessada via método Playwright.');
                          }
                        }
                      } catch (error) {
                        console.error(`Erro ao procurar e clicar no link de Tarefas: ${error.message}`);
                        await page.screenshot({ path: path.join(disciplinaDir, 'erro_tarefas_navegacao.png') });
                      }
                      
                      // Independentemente do método usado para clicar, processar a página de tarefas se carregou
                      
                      // Salvar screenshot para verificar se chegamos na página de tarefas
                      await page.screenshot({ path: path.join(disciplinaDir, 'depois_click_tarefas.png') });
                      
                      try {
                        // Verificar tarefas disponíveis
                        const tarefasInfo = await page.evaluate(() => {
                          const hoje = new Date();
                          hoje.setHours(0, 0, 0, 0); // Normalizar para início do dia
                          
                          // Verificar se há mensagem de "Nenhum item foi encontrado"
                          const nenhumItemMsg = document.body.innerText.includes('Nenhum item foi encontrado');
                          if (nenhumItemMsg) {
                            return { nenhumItem: true };
                          }
                          
                          // Procurar pela tabela com classe "listing" que contém as tarefas
                          const tabelaTarefas = document.querySelector('table.listing');
                          
                          if (!tabelaTarefas) {
                            console.log('Tabela de tarefas não encontrada. Elemento procurado: table.listing');
                            
                            // Registrar o HTML da página para debug
                            console.log('HTML da página atual:', document.documentElement.outerHTML);
                            
                            return [];
                          }
                          
                          // Obter todas as linhas com dados (ignorando cabeçalho)
                          const linhasTarefas = tabelaTarefas.querySelectorAll('tbody tr');
                          
                          if (!linhasTarefas || linhasTarefas.length === 0) {
                            console.log('Nenhuma linha de tarefa encontrada na tabela.');
                            return [];
                          }
                          
                          // Array para armazenar os dados das tarefas
                          const tarefas = [];
                          
                          // Para cada linha de tarefa (elas vêm em pares: título/dados e descrição)
                          for (let i = 0; i < linhasTarefas.length; i += 2) {
                            const linhaTitulo = linhasTarefas[i];
                            const linhaDescricao = i + 1 < linhasTarefas.length ? linhasTarefas[i + 1] : null;
                            
                            if (!linhaTitulo) continue;
                            
                            // Extrair os campos da tarefa
                            const colunas = linhaTitulo.querySelectorAll('td');
                            
                            if (colunas.length < 2) continue;
                            
                            // Extrair título
                            const titulo = colunas[0]?.textContent?.trim() || 'Sem título';
                            
                            // Extrair período de entrega
                            const periodoEntrega = colunas[1]?.textContent?.trim() || '';
                            
                            // Verificar se tem data de entrega e se ainda não venceu
                            let naoVencida = false;
                            if (periodoEntrega) {
                              const match = periodoEntrega.match(/a\s+(\d{2})\/(\d{2})\/(\d{4})/);
                              if (match) {
                                const [_, dia, mes, ano] = match;
                                const dataFim = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 23, 59, 59);
                                naoVencida = dataFim >= hoje;
                              }
                            }
                            
                            // Extrair descrição da tarefa
                            let descricao = '';
                            if (linhaDescricao) {
                              const descCell = linhaDescricao.querySelector('td.first');
                              descricao = descCell ? descCell.innerHTML : '';
                            }
                            
                            // Verificar se há link para enviar tarefa
                            const temEnvio = !!linhaTitulo.querySelector('a[title="Enviar tarefa"]');
                            
                            // Link de visualização de detalhes
                            const visualizarLink = linhaTitulo.querySelector('a[title="Visualizar tarefa"]');
                            const visualizarUrl = visualizarLink ? visualizarLink.getAttribute('href') : null;
                            
                            // Obter link para enviar tarefa
                            const enviarLink = linhaTitulo.querySelector('a[title="Enviar tarefa"]');
                            const enviarUrl = enviarLink ? enviarLink.getAttribute('href') : null;
                            
                            // Registrar a tarefa
                            tarefas.push({
                              titulo,
                              periodoEntrega,
                              descricao,
                              naoVencida,
                              temEnvio,
                              visualizarUrl,
                              enviarUrl
                            });
                          }
                          
                          return tarefas;
                        });
                        
                        // Verificar se não encontrou nenhum item
                        if (tarefasInfo.nenhumItem) {
                          console.log('Mensagem "Nenhum item foi encontrado" detectada. Voltando para o Menu Discente...');
                          
                          // Navegar diretamente para o Menu Discente
                          try {
                            await page.goto('https://si3.ufc.br/sigaa/verPortalDiscente.do', {
                              waitUntil: 'domcontentloaded',
                              timeout: 15000
                            });
                            
                            console.log('Voltou para o Menu Discente.');
                            await page.waitForTimeout(3000);
                            
                            // Salvar screenshot após voltar
                            await page.screenshot({ path: path.join(disciplinaDir, 'voltou_menu_discente.png') });
                            
                            // Pular para a próxima disciplina
                            continue;
                          } catch (e) {
                            console.error(`Erro ao navegar para o Menu Discente: ${e.message}`);
                            
                            // Tentar URL alternativa como último recurso
                            try {
                              console.log('Tentando URL alternativa para o portal do discente...');
                              await page.goto('https://si3.ufc.br/sigaa/portais/discente/discente.jsf', {
                                waitUntil: 'domcontentloaded',
                                timeout: 15000
                              });
                              await page.waitForTimeout(3000);
                              continue;
                            } catch (finalError) {
                              console.error(`Erro ao tentar URL alternativa: ${finalError.message}`);
                              continue;
                            }
                          }
                        } else {
                          // Se não houver mensagem de "Nenhum item encontrado", processar as tarefas normalmente
                          console.log(`Encontradas ${tarefasInfo.length} tarefas no total.`);
                          const tarefasAtivas = tarefasInfo.filter(t => t.naoVencida);
                          console.log(`Das quais ${tarefasAtivas.length} ainda não venceram.`);
                          
                          // Salvar informações das tarefas em um arquivo JSON
                          fs.writeFileSync(
                            path.join(disciplinaDir, 'tarefas_info.json'), 
                            JSON.stringify(tarefasInfo, null, 2)
                          );
                          
                          // Para cada tarefa, salvar descrição HTML completa em arquivos separados
                          for (let j = 0; j < tarefasInfo.length; j++) {
                            const tarefa = tarefasInfo[j];
                            
                            // Criar nome de arquivo limpo baseado no título
                            const tituloLimpo = tarefa.titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
                            const tarefaDir = path.join(disciplinaDir, `tarefa_${j+1}_${tituloLimpo}`);
                            
                            if (!fs.existsSync(tarefaDir)) {
                              fs.mkdirSync(tarefaDir, { recursive: true });
                            }
                            
                            // Salvar informações da tarefa em JSON
                            fs.writeFileSync(
                              path.join(tarefaDir, 'info.json'),
                              JSON.stringify(tarefa, null, 2)
                            );
                            
                            // Salvar a descrição HTML completa
                            if (tarefa.descricao) {
                              fs.writeFileSync(
                                path.join(tarefaDir, 'descricao.html'),
                                tarefa.descricao
                              );
                              
                              // Extrair texto da descrição HTML
                              const descricaoTexto = tarefa.descricao
                                .replace(/<[^>]*>/g, ' ') // Remover tags HTML
                                .replace(/\s+/g, ' ')    // Normalizar espaços
                                .trim();
                              
                              fs.writeFileSync(
                                path.join(tarefaDir, 'descricao.txt'),
                                descricaoTexto
                              );
                            }
                            
                            console.log(`Informações da tarefa ${j+1} salvas em: ${tarefaDir}`);
                          }
                        }
                      } catch (tarefasError) {
                        console.error(`Erro ao processar página de tarefas: ${tarefasError.message}`);
                        await page.screenshot({ path: path.join(disciplinaDir, 'erro_processamento_tarefas.png') });
                      }
                      
                      // Tentar URL direta para tarefas como último recurso se nada mais funcionou
                      if (!(await page.$('table tr')) && !(await page.$('input[value="Voltar"]'))) {
                        console.log('Nenhuma tabela de tarefas encontrada. Tentando URL direta...');
                        try {
                          // URL direta para tarefas
                          console.log('Tentando acessar tarefas via URL direta...');
                          await page.goto(`https://si3.ufc.br/sigaa/ava/tarefas/participante/listar.jsf`, { timeout: 20000 })
                            .catch(e => console.log('Erro ao navegar diretamente para tarefas, continuando...'));
                          
                          await page.waitForTimeout(3000);
                          await page.screenshot({ path: path.join(disciplinaDir, 'tarefas_url_direta.png') });
                        } catch (directError) {
                          console.error(`Erro ao tentar URL direta: ${directError.message}`);
                        }
                      }
                    } catch (error) {
                      console.error(`Erro ao acessar tarefas da disciplina ${disciplina.nome}: ${error.message}`);
                      await page.screenshot({ path: path.join(disciplinaDir, 'erro_tarefas.png') });
                    }
                    
                    // Voltar para a página de disciplinas
                    console.log('Tentando voltar para o Menu Discente...');
                    
                    // Salvar screenshot antes de voltar
                    await page.screenshot({ path: path.join(disciplinaDir, 'antes_voltar.png') });
                    
                    // Navegar diretamente para o Menu Discente
                    try {
                      console.log('Navegando diretamente para o Menu Discente...');
                      await page.goto('https://si3.ufc.br/sigaa/verPortalDiscente.do', { 
                        waitUntil: 'domcontentloaded',
                        timeout: 15000 
                      });
                      
                      await page.waitForTimeout(3000);
                      
                      // Verificar se voltou para o portal do discente
                      const urlAtual = page.url();
                      console.log(`URL atual após voltar: ${urlAtual}`);
                      
                      // Salvar screenshot depois de voltar
                      await page.screenshot({ path: path.join(disciplinaDir, 'depois_voltar.png') });
                    } catch (e) {
                      console.error(`Erro ao navegar para o Menu Discente: ${e.message}`);
                      
                      // Tentar URL alternativa como último recurso
                      try {
                        console.log('Tentando URL alternativa para o portal do discente...');
                        await page.goto('https://si3.ufc.br/sigaa/portais/discente/discente.jsf', {
                          waitUntil: 'domcontentloaded',
                          timeout: 15000
                        });
                        await page.waitForTimeout(3000);
                      } catch (finalError) {
                        console.error(`Erro ao tentar URL alternativa: ${finalError.message}`);
                      }
                    }
                    
                    console.log(`Concluída disciplina: ${disciplina.nome}`);
                    await page.waitForTimeout(3000);
                  }
                  
                  console.log('\nColeta de tarefas finalizada com sucesso!');
                  console.log(`Arquivos salvos em: ${tarefasDir}`);
                }
              } else {
                console.log('Não foi possível encontrar o link para disciplinas. Estrutura da página pode ter mudado.');
              }
            } catch (error) {
              console.error(`Erro ao acessar disciplinas: ${error.message}`);
              if (error.stack) console.error(error.stack);
            }
            
            // Manter a sessão ativa (não fazer logout)
            console.log('\nSessão mantida ativa. O navegador permanecerá aberto para interação manual.');
            console.log('Para encerrar o teste, pressione Ctrl+C no terminal ou feche o navegador manualmente.');
            
            // Aguardar indefinidamente - a sessão permanecerá ativa até que o script seja interrompido
            // ou o navegador seja fechado manualmente
            await new Promise(resolve => {
              // Este código mantém o script rodando até ser interrompido manualmente
              console.log('Para encerrar o teste e fechar o navegador, pressione Ctrl+C...');
              
              // Adicionar um handler para Ctrl+C para fechar o navegador
              process.on('SIGINT', async () => {
                console.log('Recebido sinal de interrupção. Encerrando navegador...');
                
                // Salvar o estado da sessão antes de fechar
                try {
                  await context.storageState({ path: './storage.json' });
                  console.log('Estado da sessão salvo com sucesso.');
                } catch (e) {
                  console.error('Erro ao salvar estado da sessão:', e);
                }
                
                await browser.close();
                resolve();
                process.exit(0);
              });
            });
          } catch (navigationError) {
            console.error(`Erro durante a navegação: ${navigationError}`);
            await browser.close();
            process.exit(1);
          }
        } else {
          console.log('Login não foi bem-sucedido. Verifique suas credenciais.');
        }
      } finally {
        // Fechar todos os contextos e navegador
        await context.close();
        await browser.close();
      }
    } catch (e) {
      console.error(`Erro ao configurar navegador: ${e.message}`);
      await browser.close();
      throw e;
    }
  } catch (e) {
    console.error(`Erro global: ${e.message}`);
    throw e;
  }
}

testarSigaaUFCComPlaywright();
