# 📋 The Admins - Deployment Guide

## Deploy no Render (Frontend)

### Passo 1: Preparar o Repositório
```bash
# Criar um novo repositório no GitHub
git init
git add .
git commit -m "Initial commit - The Admins Cybersecurity Platform"
git remote add origin https://github.com/seu-usuario/theadmins.git
git push -u origin main
```

### Passo 2: Criar Conta no Render
1. Acesse https://render.com
2. Crie uma conta gratuita
3. Conecte sua conta do GitHub

### Passo 3: Deploy do Frontend no Render
1. Clique em "New" → "Static Site"
2. Selecione o repositório do GitHub
3. Configure:
   - **Name**: theadmins-frontend
   - **Root Directory**: frontend
   - **Build Command**: `yarn install && yarn build`
   - **Publish Directory**: `build`
4. Adicione variável de ambiente:
   - `REACT_APP_BACKEND_URL`: URL do backend (será definida depois)
5. Clique em "Create Static Site"

---

## Deploy no Koyeb (Backend)

### Passo 1: Criar Conta no Koyeb
1. Acesse https://app.koyeb.com
2. Crie uma conta gratuita
3. Conecte sua conta do GitHub

### Passo 2: Criar Novo App
1. Clique em "Create App"
2. Selecione "GitHub" como fonte
3. Escolha o repositório e branch

### Passo 3: Configurar o Backend
1. Configure:
   - **Name**: theadmins-backend
   - **Instance type**: Free tier
   - **Region**: Washington, D.C. (us-east)
   - **Builder**: Dockerfile (ou Buildpack)
   - **Port**: 8001
   - **Health check path**: /api/

### Passo 4: Variáveis de Ambiente
Adicione as seguintes variáveis:
```
MONGO_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=theadmins_db
JWT_SECRET=sua-chave-secreta-muito-segura
EMERGENT_LLM_KEY=sk-emergent-sua-chave
CORS_ORIGINS=https://seu-frontend.onrender.com
```

### Passo 5: Deploy
1. Clique em "Deploy"
2. Aguarde o build finalizar
3. Copie a URL do backend

### Passo 6: Atualizar Frontend
1. Volte ao Render
2. Atualize a variável `REACT_APP_BACKEND_URL` com a URL do Koyeb
3. Redeploy o frontend

---

## MongoDB Atlas (Banco de Dados Gratuito)

### Passo 1: Criar Conta
1. Acesse https://www.mongodb.com/atlas
2. Crie uma conta gratuita

### Passo 2: Criar Cluster
1. Clique em "Build a Database"
2. Escolha "M0 Sandbox" (Free Forever)
3. Selecione a região mais próxima
4. Clique em "Create Cluster"

### Passo 3: Configurar Acesso
1. Vá em "Database Access"
2. Clique em "Add New Database User"
3. Configure:
   - **Authentication Method**: Password
   - **Username**: theadmins_user
   - **Password**: (gere uma senha forte)
   - **Database User Privileges**: Read and write to any database
4. Clique em "Add User"

### Passo 4: Network Access
1. Vá em "Network Access"
2. Clique em "Add IP Address"
3. Escolha "Allow Access from Anywhere" (0.0.0.0/0)
4. Clique em "Confirm"

### Passo 5: Obter Connection String
1. Vá em "Database" → "Connect"
2. Escolha "Connect your application"
3. Copie a connection string:
```
mongodb+srv://theadmins_user:<password>@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
4. Substitua `<password>` pela senha criada

---

## Dockerfile para Backend (Koyeb)

Crie um arquivo `Dockerfile` na pasta `/backend`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## Verificação Final

### Checklist:
- [ ] MongoDB Atlas configurado e acessível
- [ ] Backend deployado no Koyeb com variáveis corretas
- [ ] Frontend deployado no Render
- [ ] CORS configurado corretamente
- [ ] API funcionando (teste: `curl https://seu-backend.koyeb.app/api/`)
- [ ] Login/Registro funcionando
- [ ] Chat com IA funcionando

### URLs Finais:
- **Frontend**: https://theadmins-frontend.onrender.com
- **Backend**: https://theadmins-backend.koyeb.app
- **API Base**: https://theadmins-backend.koyeb.app/api

---

## Solução de Problemas

### Erro de CORS
Verifique se a variável `CORS_ORIGINS` no backend contém a URL do frontend.

### Erro de Conexão MongoDB
1. Verifique se o IP está liberado no Network Access
2. Verifique se username/password estão corretos
3. Teste a conexão string localmente

### Frontend não carrega dados
1. Verifique se `REACT_APP_BACKEND_URL` está correto
2. Verifique os logs do backend no Koyeb
3. Abra o DevTools do navegador e verifique a aba Network

---

## Notas Importantes

1. **Tier Gratuito do Render**: Sites estáticos são sempre gratuitos
2. **Tier Gratuito do Koyeb**: 1 app com 512MB RAM
3. **Tier Gratuito do MongoDB Atlas**: 512MB de armazenamento
4. **A Emergent LLM Key** já está incluída no projeto
