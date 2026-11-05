# 📋 Especificação de Requisitos do Sistema — Rota de Verão

> Este documento estabelece os requisitos funcionais e não funcionais do projeto **Rota de Verão**, servindo como contrato de escopo para as etapas de desenvolvimento e critérios de aceitação.

---

## 1. Requisitos Funcionais (RF)

### 1.1. Módulo de Autenticação e Acesso Simplificado
- **RF01 — Convites Individuais**: O sistema deve permitir que a Administradora crie convites únicos para cada participante, gerando um link direto e um código PIN de 6 dígitos.
- **RF02 — Autenticação sem Burocracia**: O convidado deve acessar a aplicação informando apenas seu código PIN ou clicando no link direto do convite, sem necessidade de preencher cadastros longos ou CPF.
- **RF03 — Sessão Segura e Persistente**: A autenticação simplificada deve gerar um token JWT legítimo no Supabase Auth, mantendo o usuário conectado com segurança no dispositivo.
- **RF04 — Identificação Unívoca**: Toda ação (voto, confirmação, manifestação de interesse em veículo) deve ser vinculada à identidade real do participante logado.
- **RF05 — Revogação de Acesso**: A Administradora deve poder revogar convites a qualquer momento, invalidando sessões ativas imediatamente.

### 1.2. Módulo de Viagem e Dashboard
- **RF06 — Informações da Viagem**: O sistema deve exibir nome da viagem, destino, datas de início e fim, foto de capa em alta definição e avisos gerais.
- **RF07 — Gestão Administrativa da Viagem**: Apenas a Administradora pode editar o destino, as datas e os parâmetros gerais da viagem.
- **RF08 — Dashboard Personalizado por Perfil**:
  - *Participante*: Visualiza contagem regressiva, status da sua confirmação e do seu par, próximos eventos, enquetes abertas e extrato financeiro pessoal.
  - *Administradora*: Visualiza métricas consolidadas de confirmação, total arrecadado/estimado, alertas de pendências e atalhos rápidos de gestão.

### 1.3. Módulo de Participantes e Organização por Casais
- **RF09 — Cadastro de Participantes**: A Administradora cadastra nome, apelido, telefone/WhatsApp (opcional) de cada participante.
- **RF10 — Agrupamento de Casais**: O sistema deve permitir associar dois participantes a um mesmo grupo de casal.
- **RF11 — Confirmação Individual e Independente**: Cada integrante do casal deve confirmar ou recusar sua presença de maneira individual no MVP (estados: *Pendente*, *Confirmada*, *Recusada*). A confirmação de um não altera o status do outro.
- **RF12 — Resumo Visual Duplo**: A interface deve disponibilizar dois modos de visualização:
  1. *Lista Individual*: Todos os participantes em ordem alfabética ou por status.
  2. *Visão de Casais*: Exibição agregada indicando se o casal está *Confirmado* (ambos confirmaram), *Parcialmente Confirmado* (apenas 1), *Pendente* (nenhum respondeu) ou *Recusado* (ambos recusaram).
- **RF13 — Não Confundir Presença com Pagamento**: O sistema deve deixar explícito que confirmar presença não implica compra de passagem, quitação de diária ou pagamento efetuado.

### 1.4. Módulo de Passagens e Monitoramento de Preços
- **RF14 — Cadastro Manual de Passagens**: A Administradora pode cadastrar opções de voos com companhia aérea, aeroporto de origem/destino, datas, horários, franquia de bagagem, preço e link para compra externa.
- **RF15 — Consulta de Voos**: Os participantes podem consultar todas as opções cadastradas e seus links de compra. Nenhuma transação financeira ocorre dentro do app.
- **RF16 — Configuração de Alerta de Preço-Alvo**: A Administradora pode cadastrar rotas desejadas e um valor teto (ex: São Paulo -> Fortaleza por até R$ 900,00).
- **RF17 — Arquitetura para Provedores de Preço**: O sistema deve isolar as fontes de consulta através de interfaces para permitir integração com APIs oficiais no futuro, sem uso de técnicas ilegais de web scraping.

### 1.5. Módulo de Hospedagem
- **RF18 — Cadastro de Hospedagens**: A Administradora pode cadastrar opções de casas/hotéis com fotos, endereço, capacidade de quartos/leitos, valor total, valor estimado por pessoa e link externo.
- **RF19 — Enquetes de Escolha de Hospedagem**: As opções cadastradas podem ser submetidas a votação direta entre os participantes.

### 1.6. Módulo de Veículos
- **RF20 — Cadastro de Veículos de Aluguel**: A Administradora cadastra modelo, categoria, capacidade de passageiros, capacidade de malas, valor da diária, número de diárias e local de retirada/devolução.
- **RF21 — Manifestação de Interesse**: Os participantes podem assinalar interesse em utilizar determinado veículo.
- **RF22 — Divisão Exclusiva do Veículo**: O custo do veículo será dividido **exclusivamente** entre os participantes que manifestarem interesse e forem alocados a ele, nunca sobre a totalidade do grupo.

### 1.7. Módulo Financeiro e Divisão de Custos
- **RF23 — Lançamento de Despesas**: Cadastro de despesas com nome, categoria (Hospedagem, Veículos, Passeios, Alimentação, Outros), valor total, data e comprovante opcional.
- **RF24 — Critérios de Divisão Flexíveis**: O sistema deve suportar os seguintes critérios:
  - *Individual*: Custo atribuído a uma única pessoa (ex: passagem comprada pela organizadora).
  - *Divisão Igualitária entre Elegíveis*: Custo dividido estritamente entre a lista de participantes selecionados.
  - *Divisão de Veículo*: Custo dividido estritamente entre os ocupantes daquele veículo.
- **RF25 — Exclusão Automática de Não-Confirmados**: Participantes pendentes ou recusados não podem ser inseridos compulsoriamente em despesas compartilhadas até sua confirmação.
- **RF26 — Extrato Individual Transparente**: Cada participante terá uma tela mostrando exatamente:
  - O que é de sua responsabilidade;
  - Como o cálculo de cada item foi feito (ex: *"R$ 3.000 / 6 pessoas = R$ 500,00"*);
  - Status do pagamento (Pendente / Pago / Comprovado).

### 1.8. Módulo de Votações Democráticas
- **RF27 — Criação de Votações**: A Administradora cria votações com título, descrição, prazo de encerramento e opções de escolha com fotos ou links.
- **RF28 — Voto Único por Participante**: Cada participante pode votar uma única vez por enquete, com opção configurável pela Administradora de permitir ou bloquear alteração do voto antes do encerramento.
- **RF29 — Apuração em Tempo Real**: Exibição de gráficos e porcentagens atualizadas instantaneamente.

### 1.9. Módulo de Histórico e Auditoria
- **RF30 — Log de Auditoria Imutável**: O sistema deve registrar eventos críticos (quem alterou a data da viagem, quem confirmou/recusou presença, quem votou e quem lançou despesas) com data/hora (timestamp).
- **RF31 — Consulta Administrativa de Logs**: Apenas a Administradora tem acesso ao painel de auditoria.

### 1.10. Módulo de Notificações
- **RF32 — Notificações Internas (In-App)**: Feed de novidades na aplicação avisando sobre novas votações abertas, alterações de data/destino e alertas de preços.

---

## 2. Requisitos Não Funcionais (RNF)

- **RNF01 — Custo Operacional Zero (R$ 0,00)**: Toda a arquitetura do projeto deve operar nos planos gratuitos perpétuos do Supabase, Cloudflare Pages ou Netlify e GitHub. Nenhuma funcionalidade deve exigir cartão de crédito ou planos pagos para funcionar.
- **RNF02 — Segurança no Banco (Row Level Security)**: Todas as tabelas do PostgreSQL devem ter RLS ativado. A verificação de permissões da Administradora deve ser validada no banco de dados, e não apenas no frontend.
- **RNF03 — Responsividade e Usabilidade (Mobile-First)**: A interface deve ser desenhada com foco em smartphones (onde a maioria dos convidados acessará via WhatsApp), com áreas de clique confortáveis (mínimo 44x44px) e layout responsivo para desktop.
- **RNF04 — Identidade Visual Coastal Modern**: A interface deve obedecer à paleta definida: Oceano (`#164E63`), Água (`#67C5D4`), Areia (`#E9D9BD`), Off-white (`#FFFDF7`) e Coral (`#EF936F`), com tipografia elegante e sensação de leveza.
- **RNF05 — Tempo de Carregamento e Performance**: Carregamento da página inicial em menos de 1,5 segundos em conexões 4G, com bundle otimizado via Vite.
- **RNF06 — Integridade e Legalidade**: Nenhuma rotina de captura de preços deve infringir termos de uso de companhias aéreas ou quebrar proteções anti-bot (CAPTCHAs). Caso não haja API oficial gratuita, a ferramenta manterá o cadastro manual assistido.
- **RNF07 — Código Limpo e Manutenibilidade**: 100% do código em TypeScript, com regras de ESLint, sem duplicações de código e com documentação clara para aprendizado contínuo.

