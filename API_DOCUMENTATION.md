# 📚 Documentação da API - Swaply

> Documentação completa de todas as rotas da API Swaply para facilitar a implementação do frontend.

**Base URL:** `http://localhost:5000/api`  
**Versão:** 1.0.0  
**Status:** ✅ Verificada com o código fonte

## ✅ Resumo da Verificação

Esta documentação foi **verificada e validada** contra o código fonte da API. 

**Rotas Implementadas e Documentadas:**
- ✅ **Autenticação:** 9 rotas (register, login, OAuth, reset password, tokens)
- ✅ **Usuários:** 15 rotas (perfil, avatar, configurações, créditos, favoritos)
- ✅ **Cursos:** 13 rotas (CRUD, busca, filtros, matrícula, imagens)
- ✅ **Avaliações:** 6 rotas (criar, editar, útil, reportar, responder)
- ✅ **Notificações:** 7 rotas (listar, marcar lida, deletar, contar)

**Total:** 50 endpoints documentados

**Observações:**
- ⚠️ 3 funções de review existem no código mas não estão expostas (ver seção final)
- ⚠️ 1 inconsistência na rota de criar avaliação (courseId no body + param na URL)

---

## 📑 Índice

1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Cursos](#cursos)
4. [Avaliações](#avaliações)
5. [Notificações](#notificações)
6. [Estruturas de Dados](#estruturas-de-dados)
7. [Códigos de Status](#códigos-de-status)

---

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer {token}
```

### POST `/auth/register`
Registrar novo usuário.

**Acesso:** Público

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "Senha123",
  "confirmPassword": "Senha123"
}
```

**Validações:**
- `name`: obrigatório, 2-100 caracteres
- `email`: obrigatório, formato válido
- `password`: obrigatório, mínimo 6 caracteres, deve conter letra maiúscula, minúscula e número
- `confirmPassword`: deve ser igual a password

**Resposta (201):**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com",
      "avatar": null,
      "bio": "",
      "skills": [],
      "credits": 10,
      "isInstructor": false,
      "joinDate": "2025-01-15T10:30:00.000Z",
      "stats": {
        "coursesCompleted": 0,
        "coursesTeaching": 0,
        "totalHours": 0,
        "totalEarnings": 0
      },
      "settings": {
        "theme": "system",
        "fontSize": "medium",
        "accessibility": {
          "fontSizeControl": true,
          "screenReader": false,
          "audioDescription": false,
          "vlibras": false
        },
        "notifications": {
          "classNotifications": true,
          "interestNotifications": true,
          "newCoursesNotifications": true
        }
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/auth/login`
Fazer login na plataforma.

**Acesso:** Público

**Body:**
```json
{
  "email": "joao@example.com",
  "password": "Senha123"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": { /* objeto do usuário */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erros:**
- `401`: Credenciais inválidas
- `401`: Conta desativada

---

### GET `/auth/google`
Iniciar autenticação com Google OAuth.

**Acesso:** Público

**Comportamento:**
- Redireciona para o Google para autenticação
- Se não configurado, retorna erro 501

---

### GET `/auth/google/callback`
Callback do Google OAuth.

**Acesso:** Público (chamado pelo Google)

**Comportamento:**
- Sucesso: Redireciona para `${FRONTEND_URL}/auth/callback?token={token}&refresh={refreshToken}`
- Erro: Redireciona para `${FRONTEND_URL}/login?error=google_auth_failed`

---

### POST `/auth/forgot-password`
Solicitar reset de senha.

**Acesso:** Público

**Body:**
```json
{
  "email": "joao@example.com"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "E-mail de reset enviado com sucesso"
}
```

**Nota:** O token é válido por 10 minutos e é enviado por e-mail.

---

### POST `/auth/reset-password`
Resetar senha com token.

**Acesso:** Público

**Body:**
```json
{
  "token": "abc123...",
  "password": "NovaSenha123",
  "confirmPassword": "NovaSenha123"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Senha resetada com sucesso"
}
```

**Erros:**
- `400`: Token inválido ou expirado
- `400`: Senhas não coincidem

---

### POST `/auth/refresh-token`
Renovar token de acesso.

**Acesso:** Público

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Token renovado com sucesso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET `/auth/verify-token`
Verificar se o token é válido.

**Acesso:** Protegido

**Headers:**
```
Authorization: Bearer {token}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": { /* objeto do usuário */ }
  }
}
```

---

### POST `/auth/logout`
Fazer logout.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

## 👤 Usuários

### GET `/users/profile`
Obter perfil do usuário autenticado.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Perfil obtido com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "João Silva",
    "email": "joao@example.com",
    "avatar": "https://cloudinary.com/...",
    "bio": "Desenvolvedor Full Stack",
    "skills": ["JavaScript", "React", "Node.js"],
    "credits": 50,
    "isInstructor": true,
    "joinDate": "2025-01-15T10:30:00.000Z",
    "stats": {
      "coursesCompleted": 5,
      "coursesTeaching": 3,
      "totalHours": 120,
      "totalEarnings": 1500
    },
    "favorites": ["courseId1", "courseId2"],
    "settings": { /* configurações */ }
  }
}
```

---

### PUT `/users/profile`
Atualizar perfil do usuário.

**Acesso:** Protegido

**Body:**
```json
{
  "name": "João Silva Santos",
  "bio": "Desenvolvedor Full Stack com 5 anos de experiência",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"]
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": { /* perfil atualizado */ }
}
```

---

### POST `/users/avatar`
Upload de avatar do usuário.

**Acesso:** Protegido

**Content-Type:** `multipart/form-data`

**Body:**
- `avatar`: arquivo de imagem (jpg, jpeg, png, gif, webp)
- Tamanho máximo: 5MB

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avatar atualizado com sucesso",
  "data": {
    "avatar": "https://res.cloudinary.com/..."
  }
}
```

---

### DELETE `/users/avatar`
Remover avatar do usuário.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avatar removido com sucesso"
}
```

---

### GET `/users/settings`
Obter configurações do usuário.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Configurações obtidas com sucesso",
  "data": {
    "theme": "dark",
    "fontSize": "medium",
    "accessibility": {
      "fontSizeControl": true,
      "screenReader": false,
      "audioDescription": false,
      "vlibras": false
    },
    "notifications": {
      "classNotifications": true,
      "interestNotifications": true,
      "newCoursesNotifications": true
    }
  }
}
```

---

### PUT `/users/settings`
Atualizar configurações do usuário.

**Acesso:** Protegido

**Body:**
```json
{
  "theme": "dark",
  "fontSize": "large",
  "accessibility": {
    "vlibras": true
  },
  "notifications": {
    "classNotifications": false
  }
}
```

**Nota:** Apenas os campos enviados serão atualizados (merge parcial).

**Resposta (200):**
```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso",
  "data": { /* configurações atualizadas */ }
}
```

---

### GET `/users/credits`
Obter histórico de créditos.

**Acesso:** Protegido

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)
- `type` (opcional): tipo de transação (purchase, enrollment, earning)
- `startDate` (opcional): data inicial (ISO 8601)
- `endDate` (opcional): data final (ISO 8601)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Histórico de créditos obtido com sucesso",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "type": "enrollment",
      "amount": 50,
      "description": "Matrícula em Curso de React",
      "courseId": "507f1f77bcf86cd799439013",
      "createdAt": "2025-01-20T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET `/users/credits/balance`
Obter saldo de créditos atual.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Saldo de créditos obtido com sucesso",
  "data": {
    "credits": 150,
    "creditPrice": 1
  }
}
```

---

### POST `/users/credits/purchase`
Comprar créditos (não implementado - sistema de moeda virtual).

**Acesso:** Protegido

**Resposta (400):**
```json
{
  "success": false,
  "message": "Créditos são ganhos apenas através de atividades no app (ensinar, completar cursos, etc.)"
}
```

---

### GET `/users/stats`
Obter estatísticas do usuário.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Estatísticas obtidas com sucesso",
  "data": {
    "coursesCompleted": 5,
    "coursesTeaching": 3,
    "totalHours": 120,
    "totalEarnings": 1500,
    "enrolledCourses": 8,
    "teachingCourses": 3,
    "currentCredits": 150,
    "financialSummary": {
      "totalSpent": 500,
      "totalEarned": 1500,
      "balance": 1000
    }
  }
}
```

---

### GET `/users/favorites`
Obter cursos favoritos.

**Acesso:** Protegido

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Favoritos obtidos com sucesso",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de React Avançado",
      "description": "Aprenda React do zero ao avançado",
      "instructor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Maria Silva",
        "avatar": "https://..."
      },
      "pricePerHour": 10,
      "totalHours": 20,
      "rating": 4.8,
      "image": "https://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### POST `/users/favorites/:courseId`
Adicionar curso aos favoritos.

**Acesso:** Protegido

**Params:**
- `courseId`: ID do curso

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso adicionado aos favoritos com sucesso"
}
```

**Erros:**
- `404`: Curso não encontrado
- `400`: Curso já está nos favoritos

---

### DELETE `/users/favorites/:courseId`
Remover curso dos favoritos.

**Acesso:** Protegido

**Params:**
- `courseId`: ID do curso

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso removido dos favoritos com sucesso"
}
```

**Erros:**
- `400`: Curso não está nos favoritos

---

### GET `/users/enrolled-courses`
Obter cursos matriculados.

**Acesso:** Protegido

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)
- `status` (opcional): status do curso (active, completed, cancelled)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Cursos matriculados obtidos com sucesso",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de JavaScript",
      "instructor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Pedro Santos",
        "avatar": "https://..."
      },
      "pricePerHour": 8,
      "totalHours": 15,
      "status": "active",
      "progress": 60
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### GET `/users/teaching-courses`
Obter cursos que está ensinando.

**Acesso:** Protegido

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)
- `status` (opcional): status do curso (draft, active, completed, cancelled)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Cursos sendo ensinados obtidos com sucesso",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de Node.js",
      "pricePerHour": 12,
      "totalHours": 25,
      "status": "active",
      "currentStudents": 15,
      "maxStudents": 30,
      "rating": 4.9
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### POST `/users/become-instructor`
Tornar-se instrutor.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Você agora é um instrutor! Pode começar a criar cursos.",
  "data": {
    "isInstructor": true
  }
}
```

**Erros:**
- `400`: Usuário já é instrutor

---

### DELETE `/users/account`
Excluir conta do usuário.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Conta desativada com sucesso"
}
```

**Erros:**
- `400`: Não é possível excluir conta com cursos ativos

**Nota:** A conta é desativada (soft delete), não deletada permanentemente.

---

## 📚 Cursos

### GET `/courses`
Listar todos os cursos com filtros.

**Acesso:** Público

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)
- `category` (opcional): filtrar por categoria
- `subcategory` (opcional): filtrar por subcategoria
- `level` (opcional): filtrar por nível (Iniciante, Intermediário, Avançado)
- `minPrice` (opcional): preço mínimo por hora
- `maxPrice` (opcional): preço máximo por hora
- `search` (opcional): busca por texto (título, descrição, tags)
- `sortBy` (opcional): campo para ordenação (padrão: createdAt)
- `sortOrder` (opcional): ordem (asc, desc) (padrão: desc)
- `instructor` (opcional): ID do instrutor
- `status` (opcional): status do curso (padrão: active)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Cursos obtidos com sucesso",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Desenvolvimento Web Completo",
      "description": "Aprenda HTML, CSS, JavaScript e mais",
      "instructor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Ana Costa",
        "avatar": "https://..."
      },
      "category": "Programação",
      "subcategory": "Web Development",
      "level": "Intermediário",
      "language": "Português",
      "pricePerHour": 10,
      "totalHours": 30,
      "totalPrice": 300,
      "maxStudents": 50,
      "currentStudents": 23,
      "spotsAvailable": 27,
      "rating": 4.7,
      "totalRatings": 45,
      "image": "https://...",
      "tags": ["html", "css", "javascript"],
      "status": "active",
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

### GET `/courses/search`
Buscar cursos por termo.

**Acesso:** Público

**Query Params:**
- `q` (obrigatório): termo de busca
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)
- Aceita também os filtros de `/courses`

**Resposta (200):**
```json
{
  "success": true,
  "message": "Busca realizada com sucesso",
  "data": [ /* array de cursos */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "searchTerm": "javascript"
  }
}
```

**Nota:** Resultados ordenados por relevância (score do MongoDB text search) e rating.

---

### GET `/courses/categories`
Obter lista de categorias e subcategorias.

**Acesso:** Público

**Resposta (200):**
```json
{
  "success": true,
  "message": "Categorias obtidas com sucesso",
  "data": [
    {
      "name": "Programação",
      "subcategories": ["Web Development", "Mobile", "Backend", "Frontend"]
    },
    {
      "name": "Design",
      "subcategories": ["UI/UX", "Gráfico", "Motion"]
    },
    {
      "name": "Marketing",
      "subcategories": ["Digital", "Redes Sociais", "SEO"]
    }
  ]
}
```

---

### GET `/courses/featured`
Obter cursos em destaque.

**Acesso:** Público

**Query Params:**
- `limit` (opcional): quantidade de cursos (padrão: 6)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Cursos em destaque obtidos com sucesso",
  "data": [ /* array de cursos com rating >= 4.0 e currentStudents >= 5 */ ]
}
```

---

### GET `/courses/popular`
Obter cursos populares.

**Acesso:** Público

**Query Params:**
- `limit` (opcional): quantidade de cursos (padrão: 6)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Cursos populares obtidos com sucesso",
  "data": [ /* array de cursos ordenados por currentStudents e rating */ ]
}
```

---

### GET `/courses/:id`
Obter detalhes de um curso.

**Acesso:** Público (autenticação opcional)

**Params:**
- `id`: ID do curso

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso obtido com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Curso Completo de React",
    "description": "Domine React do básico ao avançado...",
    "instructor": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Carlos Souza",
      "avatar": "https://...",
      "bio": "Desenvolvedor há 10 anos",
      "stats": {
        "coursesTeaching": 5,
        "totalHours": 200
      }
    },
    "category": "Programação",
    "subcategory": "Frontend",
    "level": "Intermediário",
    "language": "Português",
    "pricePerHour": 12,
    "totalHours": 40,
    "totalPrice": 480,
    "maxStudents": 50,
    "currentStudents": 35,
    "spotsAvailable": 15,
    "rating": 4.9,
    "totalRatings": 67,
    "image": "https://...",
    "features": [
      "Acesso vitalício",
      "Certificado de conclusão",
      "Suporte do instrutor"
    ],
    "curriculum": [
      {
        "id": 1,
        "title": "Introdução ao React",
        "duration": 5,
        "lessons": [
          "O que é React?",
          "Instalação e setup",
          "Primeiro componente"
        ]
      }
    ],
    "schedule": [
      {
        "day": "Segunda",
        "time": "19:00-21:00"
      },
      {
        "day": "Quarta",
        "time": "19:00-21:00"
      }
    ],
    "requirements": [
      "Conhecimento básico de JavaScript",
      "HTML e CSS"
    ],
    "objectives": [
      "Criar aplicações React completas",
      "Dominar hooks e context API"
    ],
    "tags": ["react", "javascript", "frontend"],
    "status": "active",
    "isLive": true,
    "zoomSettings": {
      "recurringMeeting": true
    },
    "enrolledStudents": [ /* array de IDs ou objetos de estudantes */ ],
    "isEnrolled": false,
    "isFavorite": false,
    "createdAt": "2025-01-05T10:00:00.000Z",
    "updatedAt": "2025-01-20T15:30:00.000Z"
  }
}
```

**Nota:** `isEnrolled` e `isFavorite` só aparecem se o usuário estiver autenticado.

---

### GET `/courses/:id/reviews`
Obter avaliações de um curso.

**Acesso:** Público

**Params:**
- `id`: ID do curso

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)
- `sortBy` (opcional): campo para ordenação (padrão: createdAt)
- `sortOrder` (opcional): ordem (asc, desc) (padrão: desc)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliações do curso obtidas com sucesso",
  "data": {
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "studentId": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Maria Santos",
          "avatar": "https://..."
        },
        "rating": 5,
        "comment": "Curso excelente! Muito bem explicado.",
        "isAnonymous": false,
        "helpfulCount": 12,
        "instructorResponse": {
          "response": "Obrigado pelo feedback!",
          "respondedAt": "2025-01-21T10:00:00.000Z"
        },
        "createdAt": "2025-01-20T14:30:00.000Z"
      }
    ],
    "stats": {
      "averageRating": 4.8,
      "totalReviews": 67,
      "ratingDistribution": {
        "5": 45,
        "4": 15,
        "3": 5,
        "2": 1,
        "1": 1
      }
    }
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 67,
    "totalPages": 7
  }
}
```

---

### GET `/courses/recommended/:userId`
Obter cursos recomendados para um usuário.

**Acesso:** Protegido

**Params:**
- `userId`: ID do usuário

**Query Params:**
- `limit` (opcional): quantidade de cursos (padrão: 6)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Cursos recomendados obtidos com sucesso",
  "data": [ /* array de cursos baseados nas categorias dos favoritos */ ]
}
```

---

### POST `/courses`
Criar novo curso.

**Acesso:** Protegido (requer ser instrutor)

**Body:**
```json
{
  "title": "Curso de Python para Iniciantes",
  "description": "Aprenda Python do zero de forma prática e objetiva",
  "category": "Programação",
  "subcategory": "Backend",
  "level": "Iniciante",
  "language": "Português",
  "pricePerHour": 8,
  "totalHours": 20,
  "maxStudents": 30,
  "features": [
    "Material complementar",
    "Exercícios práticos",
    "Certificado"
  ],
  "curriculum": [
    {
      "id": 1,
      "title": "Introdução ao Python",
      "duration": 3,
      "lessons": [
        "O que é Python?",
        "Instalação",
        "Primeiro programa"
      ]
    }
  ],
  "schedule": [
    {
      "day": "Segunda",
      "time": "20:00-22:00"
    }
  ],
  "requirements": [
    "Computador com acesso à internet"
  ],
  "objectives": [
    "Aprender fundamentos de Python",
    "Criar programas básicos"
  ],
  "tags": ["python", "programação", "backend"],
  "status": "draft"
}
```

**Resposta (201):**
```json
{
  "success": true,
  "message": "Curso criado com sucesso",
  "data": { /* objeto do curso criado */ }
}
```

---

### PUT `/courses/:id`
Atualizar curso.

**Acesso:** Protegido (requer ser dono do curso)

**Params:**
- `id`: ID do curso

**Body:** Mesmos campos de POST (todos opcionais)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso atualizado com sucesso",
  "data": { /* curso atualizado */ }
}
```

---

### DELETE `/courses/:id`
Deletar curso.

**Acesso:** Protegido (requer ser dono do curso)

**Params:**
- `id`: ID do curso

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso deletado com sucesso"
}
```

**Erros:**
- `400`: Não é possível deletar curso com estudantes matriculados

---

### POST `/courses/:id/enroll`
Matricular-se em um curso.

**Acesso:** Protegido

**Params:**
- `id`: ID do curso

**Resposta (200):**
```json
{
  "success": true,
  "message": "Matrícula realizada com sucesso"
}
```

**Erros:**
- `404`: Curso não encontrado
- `400`: Curso não está ativo
- `400`: Você não pode se matricular no seu próprio curso
- `400`: Curso lotado
- `400`: Estudante já matriculado

---

### DELETE `/courses/:id/unenroll`
Cancelar matrícula em um curso.

**Acesso:** Protegido

**Params:**
- `id`: ID do curso

**Resposta (200):**
```json
{
  "success": true,
  "message": "Matrícula cancelada com sucesso"
}
```

**Erros:**
- `404`: Curso não encontrado
- `400`: Estudante não está matriculado

---

### GET `/courses/:id/students`
Listar estudantes do curso.

**Acesso:** Protegido (requer ser dono do curso)

**Params:**
- `id`: ID do curso

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 10)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Estudantes do curso obtidos com sucesso",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "avatar": "https://...",
      "joinDate": "2025-01-15T10:00:00.000Z",
      "stats": {
        "coursesCompleted": 3,
        "totalHours": 45
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 35,
    "totalPages": 4
  }
}
```

---

### POST `/courses/:id/image`
Upload de imagem do curso.

**Acesso:** Protegido (requer ser dono do curso)

**Content-Type:** `multipart/form-data`

**Params:**
- `id`: ID do curso

**Body:**
- `image`: arquivo de imagem (jpg, jpeg, png, gif, webp)
- Tamanho máximo: 10MB

**Resposta (200):**
```json
{
  "success": true,
  "message": "Imagem do curso atualizada com sucesso",
  "data": {
    "image": "https://res.cloudinary.com/..."
  }
}
```

---

## ⭐ Avaliações

### POST `/courses/:id/reviews`
Criar avaliação para um curso.

**Acesso:** Protegido (requer estar matriculado)

**Params:**
- `id`: ID do curso (validado, mas não utilizado - usar courseId no body)

**Body:**
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "rating": 5,
  "comment": "Curso excelente! Aprendi muito.",
  "isAnonymous": false
}
```

**Validações:**
- `courseId`: **obrigatório**, MongoID válido
- `rating`: obrigatório, número de 1 a 5
- `comment`: opcional, string (máximo 1000 caracteres)
- `isAnonymous`: opcional, boolean (padrão: false)

**⚠️ Nota:** Embora o endpoint tenha `:id` na URL, o `courseId` deve ser enviado no body.

**Resposta (201):**
```json
{
  "success": true,
  "message": "Avaliação criada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "courseId": { /* curso */ },
    "studentId": {
      "name": "Maria Santos",
      "avatar": "https://..."
    },
    "rating": 5,
    "comment": "Curso excelente! Aprendi muito.",
    "isAnonymous": false,
    "helpfulCount": 0,
    "createdAt": "2025-01-22T10:00:00.000Z"
  }
}
```

**Erros:**
- `404`: Curso não encontrado
- `403`: Você deve estar matriculado no curso para avaliá-lo
- `400`: Você já avaliou este curso

---

### PUT `/courses/reviews/:reviewId`
Atualizar avaliação.

**Acesso:** Protegido (requer ser dono da avaliação)

**Params:**
- `reviewId`: ID da avaliação

**Body:**
```json
{
  "rating": 4,
  "comment": "Curso muito bom, mas poderia ter mais exemplos práticos.",
  "isAnonymous": true
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação atualizada com sucesso",
  "data": { /* avaliação atualizada */ }
}
```

---

### DELETE `/courses/reviews/:reviewId`
Deletar avaliação.

**Acesso:** Protegido (requer ser dono da avaliação ou instrutor do curso)

**Params:**
- `reviewId`: ID da avaliação

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação deletada com sucesso"
}
```

---

### POST `/courses/reviews/:reviewId/helpful`
Marcar avaliação como útil.

**Acesso:** Protegido

**Params:**
- `reviewId`: ID da avaliação

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação marcada como útil",
  "data": {
    "helpfulCount": 13
  }
}
```

**Erros:**
- `400`: Você já marcou esta avaliação como útil

---

### DELETE `/courses/reviews/:reviewId/helpful`
Desmarcar avaliação como útil.

**Acesso:** Protegido

**Params:**
- `reviewId`: ID da avaliação

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação desmarcada como útil",
  "data": {
    "helpfulCount": 12
  }
}
```

---

### POST `/courses/reviews/:reviewId/report`
Reportar avaliação.

**Acesso:** Protegido

**Params:**
- `reviewId`: ID da avaliação

**Body:**
```json
{
  "reason": "Conteúdo ofensivo"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação reportada com sucesso"
}
```

---

### POST `/courses/reviews/:reviewId/respond`
Responder a uma avaliação (instrutor).

**Acesso:** Protegido (requer ser instrutor do curso)

**Params:**
- `reviewId`: ID da avaliação

**Body:**
```json
{
  "response": "Obrigado pelo feedback! Vou adicionar mais exemplos práticos."
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Resposta adicionada com sucesso",
  "data": {
    /* avaliação com resposta do instrutor */
    "instructorResponse": {
      "response": "Obrigado pelo feedback! Vou adicionar mais exemplos práticos.",
      "respondedAt": "2025-01-22T14:00:00.000Z"
    }
  }
}
```

---

## 🔔 Notificações

Todas as rotas de notificações requerem autenticação.

### GET `/notifications`
Listar notificações do usuário com filtros e paginação.

**Acesso:** Protegido

**Query Params:**
- `page` (opcional): número da página (padrão: 1)
- `limit` (opcional): itens por página (padrão: 20)
- `status` (opcional): filtrar por status (all, unread, read) (padrão: all)
- `type` (opcional): filtrar por tipo (all, class, course, credit, system) (padrão: all)
- `sort` (opcional): ordem (asc, desc) (padrão: desc)

**Tipos de notificação:**
- `class`: class_reminder, class_cancelled, class_scheduled
- `course`: new_course, course_update
- `credit`: credit_earned, credit_spent
- `system`: system, new_student, instructor_message

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "type": "class_reminder",
      "title": "Aula em 1 hora",
      "message": "Sua aula de React começa em 1 hora",
      "data": {
        "courseId": "507f1f77bcf86cd799439013",
        "classTime": "2025-01-22T19:00:00.000Z"
      },
      "isRead": false,
      "createdAt": "2025-01-22T18:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "unreadCount": 8
}
```

---

### GET `/notifications/recent`
Buscar notificações recentes para o dropdown.

**Acesso:** Protegido

**Query Params:**
- `limit` (opcional): quantidade de notificações (padrão: 5)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "new_student",
      "title": "Novo estudante matriculado",
      "message": "João Silva se matriculou em seu curso",
      "isRead": false,
      "createdAt": "2025-01-22T16:30:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

---

### GET `/notifications/unread-count`
Contar notificações não lidas.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 8
  }
}
```

---

### PUT `/notifications/:id/read`
Marcar notificação específica como lida.

**Acesso:** Protegido

**Params:**
- `id`: ID da notificação

**Resposta (200):**
```json
{
  "success": true,
  "message": "Notificação marcada como lida",
  "data": { /* notificação atualizada */ }
}
```

**Erros:**
- `404`: Notificação não encontrada

---

### PUT `/notifications/mark-all-read`
Marcar todas as notificações como lidas.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "15 notificações marcadas como lidas",
  "data": {
    "modifiedCount": 15
  }
}
```

---

### DELETE `/notifications/:id`
Excluir notificação específica.

**Acesso:** Protegido

**Params:**
- `id`: ID da notificação

**Resposta (200):**
```json
{
  "success": true,
  "message": "Notificação excluída com sucesso"
}
```

---

### DELETE `/notifications/clear-all`
Excluir todas as notificações lidas.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "25 notificações excluídas",
  "data": {
    "deletedCount": 25
  }
}
```

---

### POST `/notifications`
Criar nova notificação (uso interno do sistema).

**Acesso:** Protegido

**Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "type": "class_reminder",
  "title": "Aula amanhã",
  "message": "Não esqueça da aula de Python amanhã às 20h",
  "data": {
    "courseId": "507f1f77bcf86cd799439013"
  }
}
```

**Validações:**
- `userId`: obrigatório
- `type`: obrigatório, deve ser um tipo válido
- `title`: obrigatório
- `message`: obrigatório
- `data`: opcional, objeto com dados extras

**Resposta (201):**
```json
{
  "success": true,
  "message": "Notificação criada com sucesso",
  "data": { /* notificação criada */ }
}
```

---

## 📊 Estruturas de Dados

### User Object
```typescript
{
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string;
  skills: string[];
  credits: number;
  isInstructor: boolean;
  joinDate: string; // ISO 8601
  stats: {
    coursesCompleted: number;
    coursesTeaching: number;
    totalHours: number;
    totalEarnings: number;
  };
  favorites: string[]; // IDs dos cursos
  settings: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    accessibility: {
      fontSizeControl: boolean;
      screenReader: boolean;
      audioDescription: boolean;
      vlibras: boolean;
    };
    notifications: {
      classNotifications: boolean;
      interestNotifications: boolean;
      newCoursesNotifications: boolean;
    };
  };
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Course Object
```typescript
{
  _id: string;
  title: string;
  description: string;
  instructor: string | User; // ID ou objeto populado
  category: string;
  subcategory?: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  language: string;
  pricePerHour: number;
  totalHours: number;
  totalPrice: number; // calculado: pricePerHour * totalHours
  maxStudents: number;
  currentStudents: number;
  spotsAvailable: number; // calculado: maxStudents - currentStudents
  rating: number; // 0-5
  totalRatings: number;
  image: string | null;
  features: string[];
  curriculum: Curriculum[];
  schedule: Schedule[];
  requirements: string[];
  objectives: string[];
  tags: string[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  isLive: boolean;
  zoomSettings?: {
    meetingId?: string;
    password?: string;
    recurringMeeting: boolean;
  };
  enrolledStudents: string[]; // IDs dos estudantes
  isEnrolled?: boolean; // apenas se autenticado
  isFavorite?: boolean; // apenas se autenticado
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Curriculum Object
```typescript
{
  id: number;
  title: string;
  duration: number; // em horas
  lessons: string[];
}
```

### Schedule Object
```typescript
{
  day: 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';
  time: string; // formato: "HH:MM-HH:MM"
}
```

### Review Object
```typescript
{
  _id: string;
  courseId: string | Course;
  studentId: string | User;
  instructorId: string;
  rating: number; // 1-5
  comment: string;
  isAnonymous: boolean;
  helpfulCount: number;
  helpfulBy: string[]; // IDs dos usuários
  instructorResponse?: {
    response: string;
    respondedAt: string; // ISO 8601
  };
  reports: Array<{
    userId: string;
    reason: string;
    reportedAt: string; // ISO 8601
  }>;
  status: 'active' | 'hidden' | 'deleted';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Notification Object
```typescript
{
  _id: string;
  userId: string;
  type: 'class_reminder' | 'class_cancelled' | 'class_scheduled' | 
        'new_course' | 'course_update' | 
        'credit_earned' | 'credit_spent' | 
        'new_student' | 'instructor_message' | 'system';
  title: string;
  message: string;
  data?: object; // dados extras específicos do tipo
  isRead: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

---

## 📋 Códigos de Status

### Sucesso
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso

### Erros do Cliente
- `400 Bad Request`: Dados inválidos ou requisição mal formada
- `401 Unauthorized`: Não autenticado ou token inválido
- `403 Forbidden`: Não autorizado (sem permissão)
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já existe)
- `429 Too Many Requests`: Limite de requisições excedido

### Erros do Servidor
- `500 Internal Server Error`: Erro interno do servidor
- `501 Not Implemented`: Funcionalidade não implementada
- `503 Service Unavailable`: Serviço temporariamente indisponível

---

## 🔒 Segurança

### Rate Limiting
- **API Geral:** 100 requisições por 15 minutos
- **Login/Register:** 5 requisições por 15 minutos

### Headers de Segurança
A API implementa headers de segurança via Helmet, incluindo:
- Content Security Policy
- XSS Protection
- CORS configurado para origens específicas

### Autenticação JWT
- **Access Token:** Válido por 7 dias
- **Refresh Token:** Válido por 30 dias

---

## 🌐 CORS

Origens permitidas:
- `process.env.FRONTEND_URL`
- `http://localhost:3000`
- `http://localhost:3001`
- `https://swaply.vercel.app`

---

## 📝 Formato de Resposta Padrão

### Sucesso
```json
{
  "success": true,
  "message": "Mensagem descritiva",
  "data": { /* dados da resposta */ },
  "pagination": { /* apenas em listas paginadas */ }
}
```

### Erro
```json
{
  "success": false,
  "message": "Mensagem de erro",
  "errors": [ /* array de erros de validação, se aplicável */ ]
}
```

---

## 🚀 Exemplo de Uso (JavaScript/TypeScript)

### Configurar Cliente HTTP
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Com Axios
import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.data.token}`;
          return axios(error.config);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### Exemplos de Requisições

#### Registrar Usuário
```javascript
const register = async (userData) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  } catch (error) {
    throw error.response?.data?.message || 'Erro ao registrar';
  }
};
```

#### Listar Cursos com Filtros
```javascript
const getCourses = async (filters) => {
  try {
    const { data } = await api.get('/courses', { params: filters });
    return {
      courses: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    throw error.response?.data?.message || 'Erro ao buscar cursos';
  }
};

// Uso
const { courses, pagination } = await getCourses({
  page: 1,
  limit: 10,
  category: 'Programação',
  level: 'Intermediário',
});
```

#### Upload de Avatar
```javascript
const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  
  try {
    const { data } = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.avatar;
  } catch (error) {
    throw error.response?.data?.message || 'Erro ao fazer upload';
  }
};
```

#### Matricular em Curso
```javascript
const enrollInCourse = async (courseId) => {
  try {
    const { data } = await api.post(`/courses/${courseId}/enroll`);
    return data;
  } catch (error) {
    throw error.response?.data?.message || 'Erro ao matricular';
  }
};
```

---

## ⚠️ Funcionalidades Implementadas mas Não Expostas

As seguintes funcionalidades existem nos controllers mas **NÃO** possuem rotas expostas. Elas podem ser implementadas futuramente:

### Avaliações de Usuário

#### GET `/users/reviews` (NÃO IMPLEMENTADO)
**Função existe:** `getUserReviews` em `reviewController.js`
**Descrição:** Obter todas as avaliações feitas pelo usuário autenticado
**Uso esperado:** Listar avaliações que o usuário criou em seus cursos matriculados

#### GET `/users/reviews/received` (NÃO IMPLEMENTADO)
**Função existe:** `getReceivedReviews` em `reviewController.js`
**Descrição:** Obter avaliações recebidas pelo instrutor
**Uso esperado:** Instrutor visualizar todas as avaliações recebidas em seus cursos

#### GET `/users/reviews/stats` (NÃO IMPLEMENTADO)
**Função existe:** `getInstructorReviewStats` em `reviewController.js`
**Descrição:** Obter estatísticas de avaliações do instrutor
**Uso esperado:** Dashboard do instrutor com métricas de avaliações

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Estatísticas de avaliações obtidas com sucesso",
  "data": {
    "totalReviews": 125,
    "averageRating": 4.7,
    "ratingDistribution": {
      "1": 2,
      "2": 5,
      "3": 15,
      "4": 38,
      "5": 65
    }
  }
}
```

---

## 🔍 Observações Importantes

### Inconsistências Conhecidas

1. **POST `/courses/:id/reviews`**: A rota recebe `:id` como parâmetro mas o controller espera `courseId` no body. Ambos devem ser enviados, embora o parâmetro da URL não seja utilizado.

2. **Funções de Review não expostas**: Existem 3 funções completas no `reviewController.js` que não estão disponíveis via API REST. Considere implementar as rotas correspondentes.

### Recomendações para o Frontend

1. **Sempre envie `courseId` no body** ao criar avaliações, mesmo que já esteja na URL
2. **Use o endpoint `/courses/:id/reviews`** para obter avaliações de um curso específico
3. **Implemente polling ou WebSockets** para notificações em tempo real (atualmente apenas REST)
4. **Armazene tokens com segurança** (nunca em localStorage, prefira httpOnly cookies ou state management seguro)

---

## 📞 Suporte

Para dúvidas ou problemas com a API, entre em contato:
- **Email:** suporte@swaply.com
- **GitHub:** [github.com/swaply/api](https://github.com/swaply/api)

---

**Última atualização:** 22 de Janeiro de 2025  
**Versão da API:** 1.0.0  
**Status da Documentação:** ✅ Verificada e validada com o código fonte

