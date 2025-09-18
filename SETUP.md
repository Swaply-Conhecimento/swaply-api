# 🚀 Guia de Configuração Rápida - Swaply API

Este guia te ajudará a configurar e executar a API do Swaply em poucos minutos.

## ⚡ Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados

**MongoDB Atlas (Recomendado):**
1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um cluster
4. Obtenha a string de conexão
5. Substitua `<username>`, `<password>` e `<cluster>` na sua URI

**MongoDB Local:**
```bash
# Instalar MongoDB
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb/brew/mongodb-community
# Ubuntu: sudo apt install mongodb

# Iniciar serviço
mongod
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as configurações mínimas:

```env
# CONFIGURAÇÃO MÍNIMA PARA DESENVOLVIMENTO
NODE_ENV=development
PORT=5000

# Database (OBRIGATÓRIO)
MONGODB_URI=mongodb://localhost:27017/swaply
# OU para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/swaply

# JWT (OBRIGATÓRIO)
JWT_SECRET=minha_chave_jwt_super_secreta_para_desenvolvimento_123456
JWT_REFRESH_SECRET=minha_chave_refresh_super_secreta_para_desenvolvimento_123456

# Frontend URL (OBRIGATÓRIO)
FRONTEND_URL=http://localhost:3000

# CONFIGURAÇÕES OPCIONAIS (podem ser configuradas depois)
# Email (para reset de senha)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app

# Cloudinary (para upload de imagens)
CLOUDINARY_CLOUD_NAME=seu_cloudinary_name
CLOUDINARY_API_KEY=sua_cloudinary_api_key
CLOUDINARY_API_SECRET=sua_cloudinary_api_secret

# Stripe (para pagamentos)
STRIPE_SECRET_KEY=sk_test_sua_stripe_secret_key

# Zoom (para videoconferências)
ZOOM_API_KEY=sua_zoom_api_key
ZOOM_API_SECRET=sua_zoom_api_secret

# Google OAuth (para login social)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### 4. Executar a Aplicação

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

### 5. Testar a API

Acesse: http://localhost:5000/health

Você deve ver:
```json
{
  "success": true,
  "message": "Servidor funcionando",
  "timestamp": "2023-...",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🔧 Configurações Detalhadas

### MongoDB Atlas (Recomendado)

1. **Criar Conta:** https://www.mongodb.com/cloud/atlas
2. **Criar Cluster:**
   - Escolha o plano gratuito (M0)
   - Selecione a região mais próxima
   - Aguarde a criação (2-3 minutos)

3. **Configurar Acesso:**
   - Crie um usuário de banco de dados
   - Adicione seu IP à whitelist (ou 0.0.0.0/0 para desenvolvimento)

4. **Obter String de Conexão:**
   - Clique em "Connect" → "Connect your application"
   - Copie a string de conexão
   - Substitua `<password>` pela senha do usuário

### Cloudinary (Upload de Imagens)

1. **Criar Conta:** https://cloudinary.com/
2. **Obter Credenciais:**
   - Dashboard → Account Details
   - Copie: Cloud Name, API Key, API Secret

### Stripe (Pagamentos)

1. **Criar Conta:** https://stripe.com/
2. **Obter Chaves de Teste:**
   - Dashboard → Developers → API Keys
   - Copie a "Secret key" (começa com sk_test_)

### Email (Gmail)

1. **Habilitar 2FA:** Configurações Google → Segurança → Verificação em duas etapas
2. **Gerar Senha de App:**
   - Configurações Google → Segurança → Senhas de app
   - Selecione "Email" e "Outro"
   - Use a senha gerada no `.env`

### Zoom API

1. **Criar App:** https://marketplace.zoom.us/develop/create
2. **Tipo:** JWT
3. **Obter Credenciais:** API Key e API Secret

### Google OAuth

1. **Console:** https://console.developers.google.com/
2. **Criar Projeto:** Novo projeto
3. **Habilitar API:** Google+ API
4. **Criar Credenciais:** OAuth 2.0 Client ID
5. **Configurar URLs:**
   - Authorized origins: http://localhost:5000
   - Authorized redirects: http://localhost:5000/api/auth/google/callback

## 🎯 Testando Funcionalidades

### 1. Criar Usuário
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "password": "123456",
    "confirmPassword": "123456"
  }'
```

### 2. Fazer Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "password": "123456"
  }'
```

### 3. Listar Cursos
```bash
curl -X GET http://localhost:5000/api/courses
```

## ❌ Problemas Comuns

### Erro de Conexão com MongoDB
```
MongoNetworkError: failed to connect to server
```
**Solução:** Verifique se o MongoDB está rodando ou se a URI do Atlas está correta.

### Erro de CORS
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solução:** Verifique se `FRONTEND_URL` está configurado corretamente no `.env`.

### Erro de JWT
```
JsonWebTokenError: invalid token
```
**Solução:** Verifique se `JWT_SECRET` está configurado no `.env`.

### Porta em Uso
```
Error: listen EADDRINUSE :::5000
```
**Solução:** 
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

## 🔍 Logs e Debug

### Habilitar Logs Detalhados
```env
NODE_ENV=development
DEBUG=*
```

### Verificar Status dos Serviços
Ao iniciar o servidor, você verá:
```
📧 Email Service: ✅ OK / ❌ ERRO
📹 Zoom API: ✅ OK / ❌ ERRO  
☁️  Cloudinary: ✅ OK / ❌ ERRO
💳 Stripe: ✅ OK / ❌ ERRO
```

## 📱 Próximos Passos

1. **Frontend:** Configure o frontend React do Swaply
2. **Dados de Teste:** Popule o banco com dados de exemplo
3. **Testes:** Execute os testes automatizados
4. **Deploy:** Configure deploy em produção

## 🆘 Ajuda

- **Documentação Completa:** README.md
- **Issues:** https://github.com/seu-usuario/swaply-api/issues
- **Discord:** [Link do servidor Discord]
- **Email:** suporte@swaply.com

---

🚀 **Agora você está pronto para desenvolver com a Swaply API!**
