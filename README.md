# 🎓 Swaply API

Backend completo da plataforma **Swaply** - Uma plataforma de troca de conhecimentos onde pessoas ensinam e aprendem usando um sistema de créditos.

## 📋 Sobre o Projeto

O Swaply é uma plataforma inovadora que conecta instrutores e estudantes através de um sistema de créditos. Os usuários podem:

- 📚 Explorar cursos em diversas categorias
- 🎯 Agendar aulas individuais ou em grupo
- 💰 Usar créditos para pagar por aulas
- 👨‍🏫 Ensinar e ganhar créditos
- ⭐ Avaliar cursos e instrutores
- 📅 Gerenciar calendário de aulas

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB Atlas** - Banco de dados NoSQL
- **JWT** - Autenticação
- **Stripe** - Processamento de pagamentos
- **Cloudinary** - Armazenamento de imagens
- **Zoom API** - Videoconferências
- **Nodemailer** - Envio de emails
- **Bcrypt** - Hash de senhas
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing

## 📁 Estrutura do Projeto

```
swaply-api/
├── src/
│   ├── config/           # Configurações (DB, Auth, Cloudinary)
│   ├── controllers/      # Controladores da aplicação
│   ├── middleware/       # Middlewares (Auth, Validação, Upload)
│   ├── models/          # Modelos do MongoDB
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços externos (Email, Zoom, Payment)
│   ├── utils/           # Utilitários e constantes
│   └── app.js           # Configuração principal do Express
├── uploads/             # Arquivos temporários de upload
├── .env                 # Variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
├── package.json        # Dependências e scripts
├── README.md           # Documentação
└── server.js           # Ponto de entrada da aplicação
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Conta MongoDB Atlas
- Conta Cloudinary
- Conta Stripe (opcional)
- Conta Zoom (opcional)

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/swaply-api.git
cd swaply-api
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Environment
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/swaply?retryWrites=true&w=majority

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_super_secreta_aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloudinary_name
CLOUDINARY_API_KEY=sua_cloudinary_api_key
CLOUDINARY_API_SECRET=seu_cloudinary_api_secret

# Zoom
ZOOM_API_KEY=sua_zoom_api_key
ZOOM_API_SECRET=sua_zoom_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app

# Stripe
STRIPE_SECRET_KEY=sk_test_sua_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Execute a aplicação

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A API estará disponível em `http://localhost:5000`

## 📚 Documentação da API

### Endpoints Principais

#### 🔐 Autenticação (`/api/auth`)
- `POST /register` - Cadastro de usuário
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /google` - Login com Google
- `POST /forgot-password` - Solicitar reset de senha
- `POST /reset-password` - Resetar senha
- `POST /refresh-token` - Renovar token
- `GET /verify-token` - Verificar token

#### 👤 Usuários (`/api/users`)
- `GET /profile` - Obter perfil
- `PUT /profile` - Atualizar perfil
- `POST /avatar` - Upload de avatar
- `DELETE /avatar` - Remover avatar
- `GET /settings` - Obter configurações
- `PUT /settings` - Atualizar configurações
- `GET /credits` - Histórico de créditos
- `POST /credits/purchase` - Comprar créditos
- `GET /stats` - Estatísticas do usuário
- `GET /favorites` - Cursos favoritos
- `POST /favorites/:courseId` - Adicionar aos favoritos
- `DELETE /favorites/:courseId` - Remover dos favoritos

#### 📚 Cursos (`/api/courses`)
- `GET /` - Listar cursos (com filtros)
- `GET /search` - Buscar cursos
- `GET /categories` - Listar categorias
- `GET /featured` - Cursos em destaque
- `GET /popular` - Cursos populares
- `GET /:id` - Obter curso por ID
- `POST /` - Criar curso (instrutor)
- `PUT /:id` - Atualizar curso (instrutor)
- `DELETE /:id` - Deletar curso (instrutor)
- `POST /:id/enroll` - Matricular-se
- `DELETE /:id/unenroll` - Cancelar matrícula
- `GET /:id/students` - Listar estudantes
- `POST /:id/image` - Upload de imagem
- `GET /:id/reviews` - Avaliações do curso
- `POST /:id/reviews` - Criar avaliação

## 🗄️ Modelos do Banco de Dados

### User (Usuário)
```javascript
{
  name: String,
  email: String,
  password: String,
  avatar: String,
  bio: String,
  skills: [String],
  credits: Number,
  isInstructor: Boolean,
  stats: {
    coursesCompleted: Number,
    coursesTeaching: Number,
    totalHours: Number,
    totalEarnings: Number
  },
  favorites: [ObjectId],
  settings: {
    theme: String,
    fontSize: String,
    accessibility: Object,
    notifications: Object
  }
}
```

### Course (Curso)
```javascript
{
  title: String,
  description: String,
  instructor: ObjectId,
  category: String,
  level: String,
  pricePerHour: Number,
  totalHours: Number,
  maxStudents: Number,
  currentStudents: Number,
  rating: Number,
  image: String,
  features: [String],
  curriculum: [Object],
  schedule: [Object],
  status: String,
  enrolledStudents: [ObjectId]
}
```

### Class (Aula)
```javascript
{
  courseId: ObjectId,
  instructorId: ObjectId,
  studentId: ObjectId,
  date: Date,
  time: String,
  duration: Number,
  status: String,
  zoomLink: String,
  creditsUsed: Number
}
```

### Payment (Pagamento)
```javascript
{
  userId: ObjectId,
  type: String,
  amount: Number,
  credits: Number,
  description: String,
  paymentMethod: String,
  status: String
}
```

## 🔒 Segurança

- **Helmet** - Headers de segurança HTTP
- **CORS** - Configuração de origens permitidas
- **Rate Limiting** - Limitação de requisições
- **JWT** - Tokens seguros com refresh
- **Bcrypt** - Hash de senhas
- **Validação** - Sanitização de dados de entrada
- **Logs** - Registro de atividades

## 🚀 Deploy

### Heroku
```bash
# Login no Heroku
heroku login

# Criar app
heroku create swaply-api

# Configurar variáveis de ambiente
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=sua_mongodb_uri
# ... outras variáveis

# Deploy
git push heroku main
```

### Vercel
```bash
# Instalar CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📈 Monitoramento

- Health Check: `GET /health`
- Logs estruturados
- Métricas de performance
- Error tracking

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Desenvolvedor Backend** - Implementação da API
- **DevOps** - Configuração de deploy e monitoramento
- **Product Manager** - Definição de requisitos

## 🔗 Links Úteis

- [Frontend Swaply](https://github.com/seu-usuario/swaply-frontend)
- [Documentação MongoDB](https://docs.mongodb.com/)
- [Stripe API](https://stripe.com/docs/api)
- [Zoom API](https://marketplace.zoom.us/docs/api-reference/zoom-api)
- [Cloudinary API](https://cloudinary.com/documentation)

---

⭐ **Se este projeto te ajudou, deixe uma estrela no repositório!**
