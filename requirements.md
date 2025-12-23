# The Admins - Sistema de Missões de Cibersegurança

## 📋 Problema Original
Sistema de missões de cibersegurança para a empresa "The Admins" com as seguintes funcionalidades:
- Buscar e listar sites de golpes, fraudes, conteúdo ilegal na internet
- Membros aceitam missões para combater crimes cibernéticos
- Sistema verifica automaticamente se sites estão no ar (200) ou fora (404)
- Missão só conclui quando site cai
- Chat com IA para ajudar membros
- Área admin para adicionar ferramentas externas (trojans, spywares, etc.)
- Sistema de denúncias com aceitar/rejeitar
- Níveis de acesso: Admin, Tenente, Elite, Soldado, Externo

## 🏗️ Arquitetura

### Backend (FastAPI + MongoDB)
- **Autenticação**: JWT com níveis de acesso
- **Endpoints**:
  - `/api/auth/*` - Registro, Login, Perfil
  - `/api/users/*` - CRUD de usuários, Ranking
  - `/api/missions/*` - CRUD de missões, Aceitar, Concluir
  - `/api/reports/*` - CRUD de denúncias, Aceitar, Rejeitar
  - `/api/tools/*` - CRUD de ferramentas
  - `/api/chat/*` - Mensagens e Chat com IA (ARIA)
  - `/api/stats/*` - Estatísticas gerais
  - `/api/site-check` - Verificação de status de sites

### Frontend (React + TailwindCSS)
- **Páginas**:
  - Login/Registro
  - Dashboard com estatísticas
  - Missões (listar, aceitar, concluir)
  - Denúncias (criar, aceitar, rejeitar)
  - Chat da equipe com IA
  - Ferramentas (por categoria)
  - Painel Admin
  - Perfil com ranking

### Banco de Dados (MongoDB)
- **Collections**:
  - `users` - Usuários do sistema
  - `missions` - Missões de cibersegurança
  - `reports` - Denúncias
  - `tools` - Ferramentas
  - `chat_messages` - Mensagens do chat

## ✅ Tarefas Concluídas

### Backend
- [x] Autenticação JWT com níveis de acesso
- [x] CRUD completo de usuários
- [x] Sistema de missões com status de site
- [x] Sistema de denúncias
- [x] Biblioteca de ferramentas
- [x] Chat com IA (ARIA - GPT-5.2)
- [x] Verificação automática de sites (background task)
- [x] Sistema de ranking e pontos

### Frontend
- [x] Design cyberpunk/hacker com tema escuro
- [x] Página de Login/Registro
- [x] Dashboard com estatísticas
- [x] Página de Missões
- [x] Página de Denúncias
- [x] Chat com IA
- [x] Página de Ferramentas
- [x] Painel Admin
- [x] Perfil do usuário

## 📝 Próximas Tarefas

### Funcionalidades Futuras
- [ ] Upload de arquivos para ferramentas
- [ ] App mobile para usuários externos fazerem denúncias
- [ ] Notificações em tempo real (WebSocket)
- [ ] Dashboard de analytics avançado
- [ ] Sistema de badges e conquistas
- [ ] Integração com APIs de threat intelligence
- [ ] Exportação de relatórios em PDF
- [ ] Sistema de chat privado entre membros

### Melhorias
- [ ] Rate limiting nas APIs
- [ ] Cache com Redis
- [ ] Logs mais detalhados
- [ ] Testes automatizados E2E
- [ ] PWA para acesso offline

## 🔧 Configuração

### Variáveis de Ambiente (Backend)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=theadmins_db
JWT_SECRET=sua-chave-secreta
EMERGENT_LLM_KEY=sk-emergent-xxx
CORS_ORIGINS=*
```

### Variáveis de Ambiente (Frontend)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## 📦 Dependências Principais

### Backend
- FastAPI
- Motor (MongoDB async)
- PyJWT
- bcrypt
- httpx
- emergentintegrations (IA)

### Frontend
- React 19
- TailwindCSS
- Shadcn/UI
- Lucide Icons
- Axios
- React Router
