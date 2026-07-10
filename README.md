# 🏢 Sistema do Síndico (Condomínio Hub)

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-green)
![Angular](https://img.shields.io/badge/Angular-Standalone-DD0031?logo=angular)
![Ionic](https://img.shields.io/badge/Ionic-Mobile_First-3880FF?logo=ionic)
![NestJS](https://img.shields.io/badge/NestJS-Backend-E0234E?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger)

O **Sistema do Síndico** é uma plataforma de governança e gestão condominial modularizada, responsiva e orientada à transparência. Desenvolvido como Projeto de Extensão *Sistemas de Informação e Sociedade*, o sistema foi arquitetado para centralizar a administração de edifícios de pequeno porte, erradicando a gestão informal via WhatsApp e planilhas isoladas.

## 🎯 Domínios de Negócio e Funcionalidades

A API foi dividida em 5 domínios, operando sob um rigoroso **Controle de Acesso Baseado em Funções (RBAC)** e **Segurança de Nível de Linha (RLS)** para garantir o isolamento de dados entre os moradores:

### 🔐 Segurança & Cadastros
* **Autenticação Dupla:** Uso de Access Tokens e Refresh Tokens.
* **Gestão de Unidades e Usuários:** Controle dinâmico de ocupação e vínculo direto de moradores às suas respectivas frações ideais.

### 💰 Gestão Financeira
* **Fluxo de Caixa:** Lançamento de receitas e despesas.
* **Automação de Rateio:** O sistema consolida as despesas do mês e divide automaticamente o valor pelas 4 unidades no fechamento mensal.
* **Isolamento de Cobranças:** O morador tem acesso exclusivo ao seu próprio boleto/cota, podendo anexar o comprovante PIX direto pelo app.

### ⚖️ Governança & Transparência (GRC)
* **Ouvidoria:** Mural de transparência para abertura de chamados: vazamentos, barulho, etc. Visível para todos, mas tramitado apenas pelo Síndico.
* **Regimento Interno:** Mural digital com as regras de convivência do condomínio sempre à mão.
* **Auditoria:** Trilha de logs invisível e imutável registrando ações críticas no sistema.
* **Avaliações (App):** Canal direto para os moradores reportarem bugs e sugestões de melhoria.

### 🛠️ Operacional
* **Manutenções Preventivas:** Cronograma inteligente para dedetização, limpeza de caixa d'água e recarga de extintores.

---

## 🛠️ Stack Tecnológica

O projeto adota uma arquitetura desacoplada, estruturada em **Domain-Driven Design (DDD)**.

### Frontend (Interface do Cliente)
* **Framework:** [Ionic](https://ionicframework.com/) integrado com **Angular (Standalone Components)**.
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first e Mobile-first).
* **Comunicação:** `HttpClient` do Angular com interceptadores JWT.

### Backend (API e Regras de Negócio)
* **Framework:** [NestJS](https://nestjs.com/).
* **ORM:** [Prisma ORM](https://www.prisma.io/).
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/).
* **Segurança:** `passport-jwt` + `bcrypt` + `class-validator`.
* **Documentação:** Swagger UI interativo.

---

## 📂 Estrutura do Projeto

O projeto adota uma arquitetura modular baseada em Domain-Driven Design, separando claramente as responsabilidades de infraestrutura, regras de negócio e interfaces visuais.

```text
sistema-do-sindico/
├── docs/                        # Engenharia de Requisitos e Atas de Reunião
├── design/                      # Wireframes das telas e recursos visuais
│
├── backend/                     # API Restful Modularizada (NestJS + Prisma)
│   ├── prisma/                  # Camada de Persistência, Schema do PostgreSQL e Migrations
│   └── src/
│       ├── auth/                # Autenticação, Gestão de Sessões (Session Cron) e JWT
│       ├── core/                # Segurança Global, Guards (RBAC), Interceptors e Filtros
│       └── modules/             # Domínios da Aplicação (Business Logic)
│           ├── cadastros/       # Gestão de unidades habitacionais e usuários
│           ├── financeiro/      # Cobranças, despesas, fechamentos e receitas (GRC Financeiro)
│           ├── governanca/      # Auditoria, avaliações, ocorrências e regras
│           └── operacional/     # Manutenções e operações do dia a dia
│
└── frontend/                    # Aplicação Web/Mobile (Angular + Ionic)
    └── src/app/
        ├── core/                # Motor da aplicação (Guards de rotas, Interceptors, API Service)
        ├── shared/              # UI genérica e reutilizável (Componentes, Headers, Alertas)
        ├── features/            # As 14 Telas divididas por Domínio
        │   ├── auth/            # Telas 01 e 02: Login e Adequação LGPD
        │   ├── dashboard/       # Telas 03 e 10: Dashboards de Síndico e Morador
        │   ├── financeiro/      # Telas 04, 05, 06 e 12: Lançamentos, Rateio e Balanço
        │   ├── admin/           # Telas 07 e 09: Gestão de Unidades e Auditoria
        │   └── comunicacao/     # Telas 08, 11, 13 e 14: Ouvidoria, Mural e Feedbacks do App
        ├── app.component.* # Componente raiz da aplicação
        └── app.routes.ts        # Orquestração de Rotas e Lazy Loading das features
```
---

## 🚀 Instalação e Execução Local

### Pré-requisitos

* [Node.js](https://nodejs.org/) (Versão 18+ LTS ou v24)
* [PostgreSQL](https://www.postgresql.org/) (Local ou nuvem)

### 1. Configurando o Backend (API)

```bash
# Clonar o repositório e entrar na pasta do backend
git clone [https://github.com/SeuUsuario/Sistema-Sindico.git](https://github.com/SeuUsuario/Sistema-Sindico.git)
cd sistema-do-sindico/backend

# Instalar dependências
npm install

# Configurar Variáveis de Ambiente
# Crie um arquivo .env na raiz da pasta backend:
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_do_sindico?schema=public"
# JWT_ACCESS_SECRET="sua_chave_secreta"
# JWT_REFRESH_SECRET="sua_chave_longa"

# Rodar migrações, gerar Prisma Client e injetar dados base (Síndico e Unidades)
npx prisma db push
npx prisma generate
npx prisma db seed

# Iniciar o servidor
npm run start:dev

```

> Acesse a documentação interativa e teste as rotas em: **`http://localhost:3000/api`**

### 2. Configurando o Frontend (App)

Em um novo terminal, acesse a pasta do frontend:

```bash
cd sistema-do-sindico/frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento do Ionic
ionic serve

```

> A aplicação abrirá no navegador em: **`http://localhost:8100`**

---

## 📄 Autoria e Contexto

Projeto arquitetado e desenvolvido por **Thalis Mateus Barcellos Macedo** como parte do projeto de extensão universitária *Sistemas de Informação e Sociedade* da Estácio.

Este software foi projetado visando a entrega de valor tecnológico real para a comunidade, seguindo rigorosamente as melhores práticas de Engenharia de Software, Governança, Riscos e Conformidade (GRC) e adequação às normativas de privacidade (LGPD).

```

```
