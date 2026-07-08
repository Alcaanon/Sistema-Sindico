# 🏢 Sistema do Síndico

![Status do Projeto](https://img.shields.io/badge/Status-Em_Desenvolvimento-green)
![Angular](https://img.shields.io/badge/Angular-Standalone-DD0031?logo=angular)
![Ionic](https://img.shields.io/badge/Ionic-Mobile_First-3880FF?logo=ionic)
![NestJS](https://img.shields.io/badge/NestJS-Backend-E0234E?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)

O **Sistema do Síndico** é uma plataforma de governança e gestão condominial modularizada, responsiva (Mobile-First) e orientada à transparência. Desenvolvido como Projeto de Extensão (*Sistemas de Informação e Sociedade*), o sistema foi arquitetado para centralizar a administração de edifícios de pequeno porte (foco inicial em 4 unidades habitacionais), erradicando a gestão informal via WhatsApp e planilhas isoladas.

## 🎯 Principais Funcionalidades

A plataforma é dividida em dois painéis distintos, garantindo Controle de Acesso Baseado em Funções (RBAC):

### 🛡️ Visão do Síndico (Painel de Gestão)
* **Gestão de Fluxo de Caixa:** Registro de receitas (cotas condominiais) e despesas com upload de comprovantes.
* **Automação de Rateio:** Cálculo exato de rateio (Soma das despesas + Fundo de Reserva ÷ 4 unidades).
* **Consolidação Mensal:** Congelamento do mês vigente, cálculo de saldo atualizado e geração de relatórios e PDFs.
* **Controle de Ocupação:** Gestão dinâmica do status das unidades (`Proprietário`, `Inquilino`, `Vazio`).
* **Auditoria (GRC):** Registro imutável de todas as ações financeiras e administrativas realizadas no sistema.

### 📱 Visão do Morador (Portal de Transparência)
* **Status da Cota:** Acompanhamento mensal da cota condominial e envio de comprovante PIX.
* **Prestação de Contas:** Acesso ao histórico detalhado do caixa consolidado e recibos digitalizados.
* **Ouvidoria Oficial:** Abertura e acompanhamento de ocorrências (substituindo grupos de WhatsApp).
* **Mural Digital:** Acesso permanente às regras de convivência, coleta de lixo, silêncio e garagem.
* **Conformidade LGPD:** Controle de consentimento para tratamento de dados pessoais.

---

## 🛠️ Stack Tecnológica

O projeto adota uma arquitetura desacoplada, separando completamente a interface de usuário do servidor de banco de dados.

### Frontend (Interface do Cliente)
* **Framework:** [Ionic](https://ionicframework.com/) integrado com **Angular (Standalone Components)**.
* **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first e Mobile-first).
* **Comunicação:** `HttpClient` do Angular com interceptadores JWT.

### Backend (API e Regras de Negócio)
* **Framework:** [NestJS](https://nestjs.com/) (Node.js com TypeScript e Domain-Driven Design).
* **ORM:** [Prisma ORM](https://www.prisma.io/) (Tipagem estrita e segurança relacional).
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (Modelagem robusta com integridade ACID).
* **Autenticação:** JSON Web Token (JWT) + *Guards/Middlewares*.

---

## 📂 Estrutura do Projeto

```text
sistema-do-sindico/
├── docs/                       # Engenharia de Requisitos e Atas de Reunião
├── design/                     # Wireframes das 14 telas e recursos visuais
├── backend/                    # API Restful Modularizada (NestJS + Prisma)
│   ├── src/                    # Controladores, Serviços, Módulos e Regras de Negócio
│   └── prisma/                 # Schema do PostgreSQL e migrações
└── frontend/                   # Aplicação Web/Mobile (Angular + Ionic)
    └── src/                    # Páginas standalone, componentes de UI e serviços

```

---

## 🚀 Instalação e Execução Local

### Pré-requisitos

Certifique-se de ter instalado em sua máquina:

* [Node.js](https://nodejs.org/) (Versão 18+ LTS)
* [PostgreSQL](https://www.postgresql.org/) (Em execução local ou em nuvem)

### 1. Clonando o Repositório

```bash
git clone https://github.com/Alcaanon/Sistema-Sindico.git
cd sistema-do-sindico

```

### 2. Configurando o Backend (API)

```bash
cd backend

# Instalar dependências
npm install

# Configurar Variáveis de Ambiente
# Crie um arquivo .env na raiz da pasta backend e adicione sua URL do PostgreSQL:
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_do_sindico?schema=public"

# Rodar as migrações do banco de dados e gerar o Prisma Client
npx prisma migrate dev --name init
npx prisma generate

# Iniciar o servidor de desenvolvimento
npm run start:dev

```

> O backend estará rodando em `http://localhost:3000`

### 3. Configurando o Frontend (App)

Em um novo terminal, volte para a raiz do projeto e acesse a pasta do frontend:

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento do Ionic/Angular
ionic serve

```

> A aplicação abrirá automaticamente no seu navegador, rodando em `http://localhost:8100`

---

## 📄 Licença e Créditos

Projeto arquitetado e desenvolvido por **Thalis Mateus Barcellos Macedo** como parte do projeto de extensão universitária *Sistemas de Informação e Sociedade*.

Este software foi projetado visando a entrega de valor tecnológico real para a comunidade, seguindo as melhores práticas de Análise e Desenvolvimetno de Software, governança de dados (GRC) e adequação às normativas de privacidade (LGPD).

```

```
