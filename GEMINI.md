# 🧭 GEMINI.md — Guia de Engenharia e Princípios do Projeto

> Este documento serve como manual de instruções contínuo para o assistente de IA e desenvolvedores que atuarem no projeto **Rota de Verão**.

---

## 🎯 1. Filosofia do Projeto

1. **Simplicidade com Rigor**: Menos código é melhor código. Priorizar bibliotecas estáveis e evitar soluções superdimensionadas (overengineering).
2. **Didática e Transparência**: A responsável pelo projeto está aprendendo programação. Toda decisão de arquitetura, refatoração ou escolha de biblioteca deve ser explicada em português claro, destacando o *porquê* e os conceitos envolvidos.
3. **Custo Zero (R$ 0,00)**: O projeto deve operar integralmente em tiers gratuitos comprovados (Supabase Free, Cloudflare Pages/Netlify Free). Não ativar serviços pagos ou suscitar custos sem aprovação explícita.
4. **Segurança por Padrão (Security by Default)**: Nunca confiar apenas no frontend para esconder dados ou ações. Toda proteção deve ser assegurada no banco de dados via **Row Level Security (RLS)** do PostgreSQL.
5. **Progresso por Marcos**: Nenhuma etapa do projeto pode ser adiantada sem a conclusão, teste e aprovação formal do marco anterior.

---

## 📖 2. Glossário Didático para Aprendizado

Para facilitar o acompanhamento da responsável pelo projeto, apresentamos os conceitos essenciais utilizados:

- **Frontend**: A interface visual com a qual o usuário interage diretamente no navegador (botões, formulários, cores, transições).
- **Backend**: O servidor ou serviço que roda nos bastidores, processando regras de negócio e interagindo com o banco de dados.
- **Banco de Dados Relacional (PostgreSQL)**: Sistema onde as informações são guardadas em tabelas organizadas com linhas e colunas, ligadas por relacionamentos (como uma planilha inteligente e segura).
- **Supabase**: Plataforma moderna de "Backend-as-a-Service" (BaaS) que oferece banco de dados PostgreSQL gratuito na nuvem, autenticação, armazenamento e APIs automáticas.
- **RLS (Row Level Security)**: Recurso do PostgreSQL onde definimos regras em cada linha da tabela. Exemplo: *"Um participante só pode alterar a linha de presença correspondente ao seu próprio ID"*.
- **JWT (JSON Web Token)**: Um "crachá digital" criptografado emitido quando o usuário faz login. O navegador envia esse crachá a cada requisição para provar quem ele é.
- **Vite**: Uma ferramenta de desenvolvimento ultrarrápida para empacotar e rodar projetos modernos em React.
- **TypeScript**: Uma extensão do JavaScript que adiciona tipos estáticos (ex: garantir que um preço seja sempre um número e nunca um texto com letras), evitando erros bobos em tempo de execução.
- **Tailwind CSS**: Framework utilitário de CSS que permite estilizar a aplicação direto no código visual, com classes prontas e padronizadas.
- **MVP (Minimum Viable Product)**: "Produto Mínimo Viável", ou seja, a versão mais enxuta e funcional da aplicação que entrega o valor principal com rapidez e segurança.

---

## 🛠️ 3. Regras de Desenvolvimento e Conduta da IA

Ao trabalhar neste repositório:
- **Idioma**: Responder e documentar sempre em **português (Brasil)**.
- **Inspeção Prévia**: Antes de alterar ou criar arquivos, inspecionar a estrutura existente.
- **Sem Segredos Expostos**: Jamais colocar tokens de API, chaves `service_role` ou senhas no código versionado. Usar arquivos `.env.local` e variáveis de ambiente.
- **Código Limpo e Tipado**: Todo código TypeScript deve conter tipagem explícita e tratamento de erros compreensível.
- **Zero Alucinação de APIs**: Não inventar rotas de companhias aéreas ou locadoras se não houver documentação e credenciais válidas.
- **Validação Contínua**: Executar testes e comandos de build a cada alteração relevante.

---

## 🗺️ 4. Roadmap de Marcos (Milestones)

- [x] **Marco 1 — Planejamento e Documentação**: Estrutura conceitual, modelo relacional, arquitetura, segurança, regras e requisitos.
- [x] **Marco 2 — Fundação e Interface**: Configuração do React 18, TypeScript, Vite, Tailwind CSS com tema Coastal Modern, 9 páginas navegáveis e dados fictícios identificados.
- [ ] **Marco 3 — Banco de Dados e Autenticação**: Scripts SQL no Supabase, RLS, fluxo de autenticação por PIN/link individual.
- [ ] **Marco 4 — Participantes e Casais**: Gestão de membros, agrupamento de casais e tela de confirmações com visão dupla.
- [ ] **Marco 5 — Opções e Votações**: Cadastro de passagens, acomodações, veículos e motor de enquetes democráticas.
- [ ] **Marco 6 — Despesas e Rateio**: Lançamento de despesas, critérios de divisão individual/coletiva e extrato individual.
- [ ] **Marco 7 — Administração e Auditoria**: Painel de controle da organizadora, logs de auditoria e revogação de convites.
- [ ] **Marco 8 — Monitoramento de Preços**: Estudo e integração com fontes oficiais viáveis ou consolidação do modo manual inteligente.
- [ ] **Marco 9 — Testes e Publicação**: Bateria de testes de ponta a ponta, auditoria de segurança e deploy em Cloudflare Pages / Netlify.

