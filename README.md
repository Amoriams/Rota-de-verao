# 🌴 Rota de Verão

> Aplicação web privada, elegante e moderna para planejamento, organização e tomada de decisões de viagens em grupo.

---

## 📌 Sobre o Projeto

O **Rota de Verão** é uma plataforma concebida para substituir o caos de conversas espalhadas em aplicativos de mensagens (WhatsApp), planilhas desatualizadas e notas soltas. Ele centraliza tudo o que é necessário para uma viagem em grupo memorável:

- **Controle de Presença e Casais**: Gestão de confirmações individuais com visão agrupada de casais.
- **Votações Democráticas**: Escolha de hospedagens, passeios, veículos e restaurantes com prazos e opções claras.
- **Passagens e Veículos**: Exibição transparente de trajetos, horários, preços e interessados.
- **Divisão Inteligente de Custos**: Separação clara entre presença, interesse em despesas, valor devido e pagamentos, sem rateios indevidos.
- **Segurança e Simplicidade**: Acesso sem atrito via link ou PIN individual, com controle de acesso rigoroso por perfil (Administradora vs. Participante).

---

## 🎨 Identidade Visual: Coastal Modern

A experiência do usuário é guiada pelo conceito **Coastal Modern**, unindo sofisticação, calor e leveza:

| Cor | Hex | Aplicação |
| :--- | :--- | :--- |
| **Oceano** | `#164E63` | Elementos de destaque, cabeçalhos, tipografia primária |
| **Água** | `#67C5D4` | Destaques secundários, badges ativos, interações |
| **Areia** | `#E9D9BD` | Bordas suaves, divisores, cards neutros |
| **Off-white** | `#FFFDF7` | Fundo principal da aplicação |
| **Coral** | `#EF936F` | Ações de destaque (CTA), alertas amigáveis |

---

## 🏗️ Pilha Tecnológica (Stack Recomendada)

- **Frontend**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Backend & Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Supabase Auth, Row Level Security, Edge Functions)
- **Hospedagem Frontend**: [Cloudflare Pages](https://pages.cloudflare.com/) (ou [Netlify](https://www.netlify.com/)) — Custo mensal R$ 0,00

---

## 📚 Documentação Técnica (Marco 1)

Toda a arquitetura e modelagem do sistema estão descritas nos seguintes documentos na pasta [`docs/`](./docs/):

1. **[Arquitetura do Sistema](./docs/ARQUITETURA.md)**: Visão geral da stack, fluxo de dados, estrutura de diretórios e padrões de projeto.
2. **[Especificação de Requisitos](./docs/REQUISITOS.md)**: Requisitos funcionais (RF), não funcionais (RNF) e matriz de rastreabilidade.
3. **[Modelo de Dados](./docs/MODELO_DE_DADOS.md)**: Esquema relacional SQL completo, tabelas, tipos ENUM, índices e diagrama ER.
4. **[Regras de Negócio](./docs/REGRAS_DE_NEGOCIO.md)**: Detalhamento lógico de casais, rateio de custos, votações e confirmações.
5. **[Segurança e Permissões](./docs/SEGURANCA.md)**: Políticas de RLS (Row Level Security), fluxo de autenticação por PIN/Convite e proteção de segredos.
6. **[Plano de Implementação](./docs/PLANO_DE_IMPLEMENTACAO.md)**: Cronograma detalhado em marcos progressivos (Marco 1 ao Marco 9) e plano de testes.
7. **[Guia do Desenvolvedor e Assistente](./GEMINI.md)**: Diretrizes de desenvolvimento, glossário para aprendizado e regras de condução.

---

## 🚀 Como Executar o Projeto Localmente

O **Marco 2 — Fundação e Interface** está concluído e a aplicação está 100% navegável localmente:

```bash
# 1. Navegar até a pasta do projeto
cd d:/VIAGEM

# 2. Instalar dependências (caso seja a primeira vez)
npm install

# 3. Executar o servidor de desenvolvimento
npm run dev
```

Abra seu navegador em [http://localhost:5173](http://localhost:5173) para interagir com a interface.

Para testar a compilação e gerar o pacote de produção:
```bash
npm run build
npm run preview
```

---

## 👥 Papéis de Usuário

- **Administradora**: Cria viagens, cadastra opções (voos, casas, carros), gerencia participantes e convites, lança despesas e cria votações.
- **Participante**: Acessa via convite/PIN individual, confirma/recusa presença, vota em opções, demonstra interesse em veículos e consulta o extrato individual transparente de despesas.

