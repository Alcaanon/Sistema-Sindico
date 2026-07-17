# 🏢 Sistema do Síndico (Condomínio Hub)

Sistema de governança e gestão condominial desenvolvido para centralizar a administração de condomínios de pequeno porte, substituindo processos informais realizados por aplicativos de mensagens e planilhas.

O projeto foi desenvolvido como parte do Projeto de Extensão **Sistemas de Informação e Sociedade (Estácio)**, aplicando boas práticas de Engenharia de Software, arquitetura em camadas, segurança da informação e governança de dados.

---

# 📖 Visão Geral

A plataforma foi construída para atender às principais necessidades administrativas de um condomínio, organizando as funcionalidades em domínios independentes e permitindo evolução contínua da aplicação.

Os principais objetivos são:

- Centralizar a gestão condominial;
- Garantir transparência nas informações;
- Automatizar processos administrativos;
- Proteger os dados dos moradores;
- Facilitar a manutenção e evolução do sistema.

---

# 🎯 Domínios da Aplicação

## 🔐 Segurança, Cadastros e Governança de Acesso

Responsável pela identidade dos usuários e proteção dos dados.

Funcionalidades:

- Autenticação com **Access Token** e **Refresh Token**
- Rotação automática de Refresh Tokens
- Controle de acesso baseado em funções (**RBAC**)
- Isolamento de dados utilizando **Row Level Security (RLS)**
- Gestão de usuários
- Gestão de unidades habitacionais
- Associação entre moradores e respectivas unidades

---

## 💰 Gestão Financeira

Responsável pelo controle financeiro do condomínio.

Funcionalidades:

- Controle de receitas
- Controle de despesas
- Fluxo de caixa
- Fechamento mensal
- Rateio automático das despesas entre as unidades
- Processamento utilizando transações atômicas
- Visualização individual das cobranças pelo morador

---

## ⚖️ Governança (GRC)

Módulo voltado para transparência e comunicação.

Funcionalidades:

- Ouvidoria
- Registro de ocorrências
- Regimento interno digital
- Canal para sugestões
- Canal para reporte de bugs
- Histórico das ações administrativas

---

## 🛠 Operacional

Gerencia atividades preventivas do condomínio.

Funcionalidades:

- Cronograma de manutenções
- Controle de dedetização
- Limpeza de caixa d'água
- Recarga de extintores
- Alertas automáticos

---

# 🛡 Segurança e Observabilidade

O backend foi desenvolvido seguindo práticas voltadas para Governança, Riscos e Conformidade (GRC), priorizando rastreabilidade, auditoria e controle de acesso.

## Autenticação

- JWT
- Access Token
- Refresh Token
- Rotação automática de Refresh Tokens

## Controle de acesso

- RBAC (Role Based Access Control)
- Row Level Security (RLS)

## Auditoria

Todas as ações críticas podem ser registradas através de logs estruturados, permitindo rastreabilidade das operações realizadas pelos usuários.

Categorias de log:

- `[AUDITORIA]`
- `[SEGURANÇA]`
- `[DEBUG]`
- `[ERRO]`

## Persistência de Logs

Implementação utilizando **Winston** com criação automática do diretório de logs.

Arquivos gerados:

```
logs/
├── combined.log
└── error.log
```

Essa abordagem facilita:

- auditoria;
- diagnóstico de falhas;
- monitoramento da aplicação;
- suporte à conformidade com a LGPD.

---

# 🏗 Arquitetura

O backend segue princípios inspirados em **Domain-Driven Design (DDD)**, separando responsabilidades por domínio de negócio.

```
sistema-do-sindico/
├── docs/                       # Engenharia de Requisitos e Atas de Reunião
├── design/                     # Wireframes das telas e recursos visuais
│
├── logs/                       # Logs estruturados de auditoria (Persistência)
│   ├── combined.log            # Todos os registros de eventos do sistema
│   └── error.log               # Registro exclusivo de falhas e exceções (Stack Traces)
│
├── backend/                    # API Restful Modularizada (NestJS + Prisma)
│   ├── prisma/                 # Camada de Persistência, Schema do PostgreSQL e Migrations
│   └── src/
│       ├── auth/               # Autenticação, Gestão de Sessões (Refresh Token) e JWT
│       ├── core/               # Segurança Global, Guards (RBAC), Interceptors e Filtros
│       └── modules/            # Domínios da Aplicação (Business Logic)
│           ├── cadastros/      # Gestão de unidades habitacionais e usuários
│           ├── financeiro/     # Cobranças, despesas, fechamentos e receitas
│           ├── governanca/     # Auditoria, avaliações, ocorrências e regras
│           └── operacional/    # Manutenções preventivas e ordens de serviço
│
└── frontend/                   # Aplicação Web/Mobile (Angular + Ionic)
    └── src/app/
        ├── core/               # Motor da aplicação (Guards de rotas, Interceptors, API Service)
        ├── shared/             # UI genérica e reutilizável (Componentes, Headers, Alertas)
        ├── features/           # As 14 Telas divididas por Domínio
        │   ├── admin/          # Gestão de Unidades e Auditoria
        │   ├── auth/           # Telas 01 e 02: Login e Adequação LGPD
        │   ├── comunicacao/    # Ouvidoria, Mural e Feedbacks do App
        │   ├── dashboard/      # Telas 03 e 10: Dashboards de Síndico e Morador
        │   └── financeiro/     # Telas 04, 05, 06 e 12: Lançamentos, Rateio e Balanço
        ├── app.component.*     # Componente raiz da aplicação
        └── app.routes.ts       # Orquestração de Rotas e Lazy Loading das features
```

Essa organização facilita:

- manutenção;
- escalabilidade;
- testes;
- desacoplamento entre módulos.

---

# 🛠 Stack Tecnológica

| Camada | Tecnologias |
|----------|-------------|
| Frontend | Ionic + Angular (Standalone Components) |
| Estilização | Tailwind CSS |
| Backend | NestJS |
| ORM | Prisma ORM |
| Banco de Dados | PostgreSQL |
| Segurança | Passport-JWT, Bcrypt, Class Validator |
| Observabilidade | Winston |
| Documentação | Swagger (OpenAPI) |

---

# 🚀 Instalação

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm

---

## Backend

Entre na pasta:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Configure o arquivo:

```
.env
```

Execute as migrações:

```bash
npx prisma db push
```

Gere o client do Prisma:

```bash
npx prisma generate
```

Inicie a aplicação:

```bash
npm run start:dev
```

Swagger:

```
http://localhost:3000/api
```

Logs:

```
backend/logs/
```

---

## Frontend

Entre na pasta:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Execute:

```bash
ionic serve
```

Aplicação:

```
http://localhost:8100
```

---

# 📚 Boas Práticas Adotadas

O projeto utiliza práticas modernas de desenvolvimento para facilitar manutenção, evolução e segurança.

## Arquitetura

- Separação por domínio
- Arquitetura modular
- Princípios inspirados em DDD
- Baixo acoplamento
- Alta coesão

## Backend

- DTOs para validação
- Validação utilizando Class Validator
- Guards para autorização
- Interceptors
- Serviços desacoplados
- Prisma ORM
- Transações atômicas
- Tratamento centralizado de exceções

## Segurança

- JWT
- Refresh Token
- RBAC
- RLS
- Hash de senhas com Bcrypt
- Validação de entrada
- Auditoria das operações

## Observabilidade

- Logs estruturados
- Separação por níveis
- Persistência em arquivos
- Rastreabilidade de eventos críticos

---

# 📄 Documentação da API

A API possui documentação interativa gerada automaticamente pelo Swagger.

Após iniciar o backend:

```
http://localhost:3000/api
```

---

# 👨‍💻 Autor

**Thalis Mateus Barcellos Macedo**

Projeto desenvolvido como parte do Projeto de Extensão **Sistemas de Informação e Sociedade**, da Estácio, aplicando conceitos de:

- Engenharia de Software;
- Arquitetura de Software;
- Segurança da Informação;
- Governança de TI;
- Boas práticas de desenvolvimento;
- LGPD;
- Desenvolvimento Full Stack.
