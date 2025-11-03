# 📚 Documentação Completa da API - Swaply

> Documentação completa de todas as rotas e funcionalidades do backend para implementação do frontend.

**Base URL:** `http://localhost:5000/api`  
**Versão:** 1.0.0  
**Formato de Resposta:** JSON

---

## 📑 Índice

1. [Autenticação e Cadastro](#-autenticação-e-cadastro)
2. [Usuários e Perfil](#-usuários-e-perfil)
3. [Cursos](#-cursos)
4. [Aulas (Classes)](#-aulas-classes)
5. [Avaliações (Reviews)](#-avaliações-reviews)
6. [Notificações](#-notificações)
7. [Instrutores](#-instrutores)
8. [Estruturas de Dados](#-estruturas-de-dados)
9. [Códigos de Status HTTP](#-códigos-de-status-http)
10. [Autenticação JWT](#-autenticação-jwt)

---

## 🔐 Autenticação e Cadastro

### Autenticação JWT

Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer {token}
```

---

### POST `/auth/register`

Registrar novo usuário no sistema.

**Acesso:** Público  
**Rate Limit:** 5 requisições por 15 minutos

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
- `email`: obrigatório, formato válido, único no sistema
- `password`: obrigatório, mínimo 6 caracteres, deve conter letra maiúscula, minúscula e número
- `confirmPassword`: obrigatório, deve ser igual a password

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
      "credits": 10,
      "isInstructor": true,
      "joinDate": "2025-01-22T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erros:**
- `400`: Dados inválidos ou senhas não coincidem
- `400`: E-mail já está em uso
- `429`: Muitas requisições

---

### POST `/auth/login`

Fazer login no sistema.

**Acesso:** Público  
**Rate Limit:** 5 requisições por 15 minutos

**Body:**
```json
{
  "email": "joao@example.com",
  "password": "Senha123"
}
```

**Validações:**
- `email`: obrigatório, formato válido
- `password`: obrigatório

**Resposta (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com",
      "avatar": "https://cloudinary.com/...",
      "bio": "Desenvolvedor Full Stack",
      "credits": 50,
      "isInstructor": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Erros:**
- `400`: Dados inválidos
- `401`: Credenciais inválidas
- `429`: Muitas tentativas de login

---

### GET `/auth/google`

Iniciar autenticação OAuth com Google.

**Acesso:** Público  
**Observação:** Apenas disponível se Google OAuth estiver configurado

**Resposta:**
- Redireciona para página de autenticação do Google
- Ou retorna `501` se não configurado

---

### GET `/auth/google/callback`

Callback do OAuth Google após autenticação.

**Acesso:** Público

**Resposta:**
- Redireciona para `${FRONTEND_URL}/login?token={token}` em caso de sucesso
- Ou `${FRONTEND_URL}/login?error=google_auth_failed` em caso de falha

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

**Validações:**
- `email`: obrigatório, formato válido

**Resposta (200):**
```json
{
  "success": true,
  "message": "E-mail de recuperação enviado com sucesso"
}
```

**Observação:** Token de reset válido por 10 minutos

---

### POST `/auth/reset-password`

Redefinir senha usando token de reset.

**Acesso:** Público

**Body:**
```json
{
  "token": "reset_token_here",
  "password": "NovaSenha123",
  "confirmPassword": "NovaSenha123"
}
```

**Validações:**
- `token`: obrigatório
- `password`: obrigatório, mínimo 6 caracteres, deve conter letra maiúscula, minúscula e número
- `confirmPassword`: obrigatório, deve ser igual a password

**Resposta (200):**
```json
{
  "success": true,
  "message": "Senha redefinida com sucesso"
}
```

**Erros:**
- `400`: Token inválido ou expirado
- `400`: Dados inválidos

---

### POST `/auth/refresh-token`

Renovar token de acesso usando refresh token.

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
  "data": {
    "token": "novo_token_aqui",
    "refreshToken": "novo_refresh_token_aqui"
  }
}
```

**Erros:**
- `401`: Refresh token inválido ou expirado

---

### GET `/auth/verify-token`

Verificar se o token atual é válido.

**Acesso:** Protegido (requer autenticação)

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
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

---

### POST `/auth/logout`

Fazer logout (invalidar refresh token).

**Acesso:** Protegido (requer autenticação)

**Headers:**
```
Authorization: Bearer {token}
```

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
  "message": "Logout realizado com sucesso"
}
```

---

## 👤 Usuários e Perfil

Todas as rotas de usuários requerem autenticação.

---

### GET `/users/profile`

Obter perfil do usuário autenticado.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "João Silva",
    "email": "joao@example.com",
    "avatar": "https://cloudinary.com/...",
    "bio": "Desenvolvedor Full Stack",
    "skills": ["JavaScript", "React", "Node.js"],
    "credits": 50,
    "isInstructor": true,
    "joinDate": "2025-01-22T10:00:00.000Z",
    "stats": {
      "coursesCompleted": 5,
      "coursesTeaching": 3,
      "totalHours": 120,
      "totalEarnings": 500
    }
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
  "bio": "Desenvolvedor Full Stack especializado em React",
  "skills": ["JavaScript", "React", "Node.js", "TypeScript"]
}
```

**Validações:**
- `name`: opcional, 2-100 caracteres
- `bio`: opcional, máximo 500 caracteres
- `skills`: opcional, array de strings

**Resposta (200):**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "João Silva Santos",
    "bio": "Desenvolvedor Full Stack especializado em React",
    "skills": ["JavaScript", "React", "Node.js", "TypeScript"]
  }
}
```

---

### PUT `/users/password`

Alterar senha do usuário.

**Acesso:** Protegido

**Body:**
```json
{
  "currentPassword": "SenhaAntiga123",
  "newPassword": "NovaSenha123",
  "confirmNewPassword": "NovaSenha123"
}
```

**Validações:**
- `currentPassword`: obrigatório
- `newPassword`: obrigatório, mínimo 6 caracteres, deve conter letra maiúscula, minúscula e número
- `confirmNewPassword`: obrigatório, deve ser igual a newPassword

**Resposta (200):**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

**Erros:**
- `400`: Senha atual incorreta
- `400`: Nova senha inválida

---

### POST `/users/avatar`

Upload de avatar do usuário.

**Acesso:** Protegido  
**Content-Type:** `multipart/form-data`

**Body (Form Data):**
- `avatar`: arquivo de imagem (JPG, PNG, máximo 5MB)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avatar atualizado com sucesso",
  "data": {
    "avatar": "https://cloudinary.com/image/upload/..."
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
  "data": {
    "theme": "dark",
    "fontSize": "medium",
    "notifications": {
      "email": true,
      "push": true,
      "classReminders": true,
      "courseUpdates": true
    },
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo"
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
  "notifications": {
    "email": true,
    "push": false,
    "classReminders": true
  },
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo"
}
```

**Validações:**
- `theme`: opcional, enum: `['light', 'dark', 'system']`
- `fontSize`: opcional, enum: `['small', 'medium', 'large']`
- `notifications`: opcional, objeto com propriedades booleanas
- `language`: opcional, string
- `timezone`: opcional, string

**Resposta (200):**
```json
{
  "success": true,
  "message": "Configurações atualizadas com sucesso",
  "data": {
    "settings": {
      "theme": "dark",
      "fontSize": "large"
    }
  }
}
```

---

### GET `/users/credits`

Obter histórico de créditos do usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20, máximo: 100)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "earned",
      "amount": 10,
      "description": "Bônus de boas-vindas",
      "createdAt": "2025-01-22T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "type": "spent",
      "amount": -5,
      "description": "Aula de JavaScript",
      "createdAt": "2025-01-21T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET `/users/credits/balance`

Obter saldo atual de créditos.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "balance": 50
  }
}
```

---

### POST `/users/credits/purchase`

Comprar créditos (endpoint para integração futura).

**Acesso:** Protegido

**Body:**
```json
{
  "amount": 100,
  "paymentMethod": "credit_card"
}
```

**Observação:** Atualmente retorna erro - funcionalidade não implementada ainda.

---

### GET `/users/stats`

Obter estatísticas do usuário.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "coursesCompleted": 5,
    "coursesTeaching": 3,
    "totalHours": 120,
    "totalEarnings": 500,
    "averageRating": 4.8,
    "totalStudents": 25
  }
}
```

---

### GET `/users/favorites`

Listar cursos favoritos do usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de JavaScript",
      "instructor": {
        "name": "Maria Santos"
      },
      "pricePerHour": 10
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### POST `/users/favorites/:courseId`

Adicionar curso aos favoritos.

**Acesso:** Protegido

**Parâmetros:**
- `courseId`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso adicionado aos favoritos"
}
```

**Erros:**
- `404`: Curso não encontrado
- `400`: Curso já está nos favoritos

---

### DELETE `/users/favorites/:courseId`

Remover curso dos favoritos.

**Acesso:** Protegido

**Parâmetros:**
- `courseId`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso removido dos favoritos"
}
```

---

### GET `/users/enrolled-courses`

Listar cursos em que o usuário está matriculado.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de JavaScript",
      "instructor": {
        "name": "Maria Santos",
        "avatar": "https://..."
      },
      "category": "Programação",
      "level": "Iniciante",
      "enrolledAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8
  }
}
```

---

### GET `/users/teaching-courses`

Listar cursos que o usuário está lecionando.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de React Avançado",
      "category": "Programação",
      "studentsCount": 25,
      "averageRating": 4.8,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

---

### POST `/users/become-instructor`

Tornar-se instrutor (marcar usuário como instrutor).

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Você agora é um instrutor"
}
```

**Observação:** Na verdade, todos os usuários já são instrutores por padrão (`isInstructor: true`).

---

### DELETE `/users/account`

Excluir conta do usuário.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "Conta excluída com sucesso"
}
```

**Observação:** Esta ação é irreversível.

---

### GET `/users/calendar`

Obter calendário do usuário (aulas agendadas).

**Acesso:** Protegido  
**Query Parameters:**
- `month`: mês (1-12)
- `year`: ano (2020-2100)

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "month": 1,
    "year": 2025,
    "classes": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Aula de JavaScript",
        "date": "2025-01-25T14:00:00.000Z",
        "duration": 2,
        "status": "scheduled",
        "course": {
          "title": "Curso de JavaScript"
        }
      }
    ]
  }
}
```

---

### GET `/users/reviews`

Listar avaliações feitas pelo usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "rating": 5,
      "comment": "Excelente curso!",
      "course": {
        "title": "Curso de JavaScript"
      },
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

### GET `/users/reviews/received`

Listar avaliações recebidas pelo usuário (como instrutor).

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "rating": 5,
      "comment": "Ótimo instrutor!",
      "user": {
        "name": "João Silva",
        "avatar": "https://..."
      },
      "course": {
        "title": "Curso de React"
      },
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

### GET `/users/reviews/stats`

Obter estatísticas de avaliações do instrutor.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "totalReviews": 25,
    "averageRating": 4.8,
    "ratingDistribution": {
      "5": 18,
      "4": 5,
      "3": 2,
      "2": 0,
      "1": 0
    }
  }
}
```

---

## 📚 Cursos

### Rotas Públicas (não requerem autenticação)

---

### GET `/courses`

Listar todos os cursos com filtros e paginação.

**Acesso:** Público  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20, máximo: 100)
- `category`: filtrar por categoria
- `level`: filtrar por nível (`Iniciante`, `Intermediário`, `Avançado`)
- `minPrice`: preço mínimo por hora
- `maxPrice`: preço máximo por hora
- `sort`: ordenação (`createdAt`, `price`, `rating`, `popularity`)
- `order`: direção (`asc`, `desc`)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de JavaScript Completo",
      "description": "Aprenda JavaScript do zero ao avançado",
      "instructor": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Maria Santos",
        "avatar": "https://..."
      },
      "category": "Programação",
      "subcategory": "JavaScript",
      "level": "Iniciante",
      "language": "Português",
      "pricePerHour": 10,
      "totalHours": 40,
      "image": "https://cloudinary.com/...",
      "rating": 4.8,
      "totalReviews": 125,
      "studentsCount": 500,
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET `/courses/search`

Buscar cursos por termo.

**Acesso:** Público  
**Query Parameters:**
- `q`: termo de busca (obrigatório)
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso de JavaScript",
      "description": "...",
      "instructor": {
        "name": "Maria Santos"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

---

### GET `/courses/categories`

Listar todas as categorias disponíveis.

**Acesso:** Público

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    "Programação",
    "Design",
    "Marketing",
    "Negócios",
    "Fotografia"
  ]
}
```

---

### GET `/courses/featured`

Listar cursos em destaque.

**Acesso:** Público

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso em Destaque",
      "description": "...",
      "instructor": {
        "name": "Maria Santos"
      },
      "isFeatured": true
    }
  ]
}
```

---

### GET `/courses/popular`

Listar cursos mais populares.

**Acesso:** Público

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso Popular",
      "studentsCount": 1000,
      "rating": 4.9
    }
  ]
}
```

---

### GET `/courses/:id`

Obter detalhes de um curso específico.

**Acesso:** Público (autenticação opcional para verificar se usuário está matriculado)

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Curso de JavaScript Completo",
    "description": "Aprenda JavaScript do zero ao avançado...",
    "instructor": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Maria Santos",
      "avatar": "https://...",
      "bio": "Desenvolvedora Full Stack",
      "rating": 4.9,
      "totalReviews": 200
    },
    "category": "Programação",
    "subcategory": "JavaScript",
    "level": "Iniciante",
    "language": "Português",
    "pricePerHour": 10,
    "totalHours": 40,
    "image": "https://cloudinary.com/...",
    "curriculum": [
      {
        "id": 1,
        "title": "Introdução ao JavaScript",
        "duration": 2,
        "lessons": ["Variáveis", "Tipos de dados", "Operadores"]
      }
    ],
    "schedule": [
      {
        "day": "Segunda",
        "time": "09:00-11:00"
      },
      {
        "day": "Quarta",
        "time": "09:00-11:00"
      }
    ],
    "rating": 4.8,
    "totalReviews": 125,
    "studentsCount": 500,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00.000Z",
    "isEnrolled": false,
    "isFavorite": false
  }
}
```

**Observação:** Se usuário autenticado, `isEnrolled` e `isFavorite` indicam se está matriculado/favorito.

---

### GET `/courses/:id/reviews`

Listar avaliações de um curso.

**Acesso:** Público  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "rating": 5,
      "comment": "Excelente curso!",
      "user": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "João Silva",
        "avatar": "https://..."
      },
      "helpfulCount": 10,
      "isHelpful": false,
      "createdAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 125
  }
}
```

---

### GET `/courses/:id/availability`

Verificar disponibilidade de horários do curso.

**Acesso:** Público

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "availableSlots": [
      {
        "date": "2025-01-25",
        "time": "14:00",
        "available": true
      },
      {
        "date": "2025-01-26",
        "time": "10:00",
        "available": false
      }
    ]
  }
}
```

---

### Rotas Protegidas (requerem autenticação)

---

### GET `/courses/recommended/:userId`

Obter cursos recomendados para um usuário.

**Acesso:** Protegido

**Parâmetros:**
- `userId`: ID do usuário (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Curso Recomendado",
      "instructor": {
        "name": "Maria Santos"
      },
      "reason": "Baseado nos seus interesses"
    }
  ]
}
```

---

### POST `/courses/:id/enroll`

Matricular-se em um curso.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Matriculado no curso com sucesso"
}
```

**Erros:**
- `400`: Já está matriculado no curso
- `400`: Créditos insuficientes
- `404`: Curso não encontrado

---

### DELETE `/courses/:id/unenroll`

Cancelar matrícula em um curso.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Matrícula cancelada com sucesso"
}
```

---

### POST `/courses`

Criar novo curso.

**Acesso:** Protegido

**Body:**
```json
{
  "title": "Curso de JavaScript Completo",
  "description": "Aprenda JavaScript do zero ao avançado",
  "category": "Programação",
  "subcategory": "JavaScript",
  "level": "Iniciante",
  "language": "Português",
  "pricePerHour": 10,
  "totalHours": 40,
  "curriculum": [
    {
      "id": 1,
      "title": "Introdução ao JavaScript",
      "duration": 2,
      "lessons": ["Variáveis", "Tipos de dados"]
    }
  ],
  "schedule": [
    {
      "day": "Segunda",
      "time": "09:00-11:00"
    }
  ]
}
```

**Validações:**
- `title`: obrigatório, máximo 200 caracteres
- `description`: obrigatório, máximo 2000 caracteres
- `category`: obrigatório
- `level`: obrigatório, enum: `['Iniciante', 'Intermediário', 'Avançado']`
- `pricePerHour`: obrigatório, mínimo 1
- `totalHours`: obrigatório, mínimo 1
- `curriculum`: opcional, array de objetos
- `schedule`: opcional, array de objetos

**Resposta (201):**
```json
{
  "success": true,
  "message": "Curso criado com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Curso de JavaScript Completo",
    "instructor": "507f1f77bcf86cd799439012",
    "createdAt": "2025-01-22T10:00:00.000Z"
  }
}
```

---

### PUT `/courses/:id`

Atualizar curso (apenas dono do curso).

**Acesso:** Protegido (requer ser dono do curso)

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Body:**
```json
{
  "title": "Curso Atualizado",
  "description": "Nova descrição",
  "pricePerHour": 15,
  "isActive": true
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso atualizado com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Curso Atualizado"
  }
}
```

**Erros:**
- `403`: Não tem permissão para editar este curso
- `404`: Curso não encontrado

---

### DELETE `/courses/:id`

Excluir curso (apenas dono do curso).

**Acesso:** Protegido (requer ser dono do curso)

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Curso excluído com sucesso"
}
```

---

### GET `/courses/:id/students`

Listar estudantes de um curso (apenas dono do curso).

**Acesso:** Protegido (requer ser dono do curso)  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "João Silva",
      "email": "joao@example.com",
      "avatar": "https://...",
      "enrolledAt": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

---

### POST `/courses/:id/image`

Upload de imagem do curso (apenas dono do curso).

**Acesso:** Protegido (requer ser dono do curso)  
**Content-Type:** `multipart/form-data`

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Body (Form Data):**
- `image`: arquivo de imagem (JPG, PNG, máximo 5MB)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Imagem do curso atualizada com sucesso",
  "data": {
    "image": "https://cloudinary.com/image/upload/..."
  }
}
```

---

## 🎓 Aulas (Classes)

Todas as rotas de aulas requerem autenticação.

---

### POST `/classes/schedule`

Agendar nova aula.

**Acesso:** Protegido

**Body:**
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "date": "2025-01-25T14:00:00.000Z",
  "duration": 2,
  "notes": "Aula sobre arrays e objetos"
}
```

**Validações:**
- `courseId`: obrigatório, MongoDB ObjectId válido
- `date`: obrigatório, formato ISO8601, deve ser no futuro
- `duration`: opcional, entre 0.5 e 4 horas
- `notes`: opcional, máximo 1000 caracteres

**Resposta (201):**
```json
{
  "success": true,
  "message": "Aula agendada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "courseId": "507f1f77bcf86cd799439012",
    "date": "2025-01-25T14:00:00.000Z",
    "duration": 2,
    "status": "scheduled",
    "zoomLink": "https://zoom.us/j/123456789",
    "zoomMeetingId": "123456789",
    "creditsUsed": 20
  }
}
```

---

### GET `/classes/scheduled`

Listar aulas agendadas do usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)
- `status`: filtrar por status (`scheduled`, `in_progress`, `completed`, `cancelled`, `missed`)
- `startDate`: data inicial (ISO8601)
- `endDate`: data final (ISO8601)
- `courseId`: filtrar por curso (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "courseId": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Curso de JavaScript",
        "instructor": {
          "name": "Maria Santos"
        }
      },
      "date": "2025-01-25T14:00:00.000Z",
      "duration": 2,
      "status": "scheduled",
      "zoomLink": "https://zoom.us/j/123456789",
      "creditsUsed": 20
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

---

### GET `/classes/upcoming`

Obter próximas aulas do usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `limit`: número de aulas (padrão: 5, máximo: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Aula de JavaScript",
      "date": "2025-01-25T14:00:00.000Z",
      "duration": 2,
      "course": {
        "title": "Curso de JavaScript",
        "instructor": {
          "name": "Maria Santos"
        }
      }
    }
  ]
}
```

---

### GET `/classes/history`

Obter histórico de aulas do usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Aula de JavaScript",
      "date": "2025-01-20T14:00:00.000Z",
      "status": "completed",
      "rating": 5,
      "feedback": "Ótima aula!"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25
  }
}
```

---

### GET `/classes/:id`

Obter detalhes de uma aula específica.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da aula (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "courseId": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Curso de JavaScript",
      "instructor": {
        "name": "Maria Santos",
        "avatar": "https://..."
      }
    },
    "date": "2025-01-25T14:00:00.000Z",
    "duration": 2,
    "status": "scheduled",
    "zoomLink": "https://zoom.us/j/123456789",
    "zoomMeetingId": "123456789",
    "notes": "Aula sobre arrays e objetos",
    "creditsUsed": 20,
    "attendance": {
      "student": false,
      "instructor": false
    },
    "feedback": {
      "student": {
        "rating": null,
        "comment": null
      },
      "instructor": {
        "rating": null,
        "comment": null
      }
    }
  }
}
```

---

### DELETE `/classes/:id/cancel` ou PUT `/classes/:id/cancel`

Cancelar aula.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da aula (MongoDB ObjectId)

**Body (opcional):**
```json
{
  "reason": "Imprevisto pessoal"
}
```

**Validações:**
- `reason`: opcional, máximo 500 caracteres

**Resposta (200):**
```json
{
  "success": true,
  "message": "Aula cancelada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "cancelled"
  }
}
```

**Erros:**
- `400`: Não é possível cancelar aula que já foi concluída
- `403`: Apenas estudante ou instrutor podem cancelar

---

### PUT `/classes/:id/complete`

Marcar aula como concluída.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da aula (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Aula marcada como concluída",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "completed"
  }
}
```

---

### POST `/classes/:id/attendance`

Marcar presença na aula.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da aula (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Presença marcada com sucesso",
  "data": {
    "attendance": {
      "student": true,
      "instructor": false
    }
  }
}
```

---

### PUT `/classes/:id/rating`

Avaliar aula.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da aula (MongoDB ObjectId)

**Body:**
```json
{
  "rating": 5,
  "feedback": "Excelente aula, muito didático!"
}
```

**Validações:**
- `rating`: obrigatório, inteiro entre 1 e 5
- `feedback`: opcional, máximo 500 caracteres

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação registrada com sucesso",
  "data": {
    "feedback": {
      "student": {
        "rating": 5,
        "comment": "Excelente aula, muito didático!"
      }
    }
  }
}
```

---

## ⭐ Avaliações (Reviews)

### POST `/courses/:id/reviews`

Criar avaliação de um curso.

**Acesso:** Protegido (requer estar matriculado no curso)

**Parâmetros:**
- `id`: ID do curso (MongoDB ObjectId)

**Body:**
```json
{
  "rating": 5,
  "comment": "Excelente curso, muito bem explicado!"
}
```

**Validações:**
- `rating`: obrigatório, inteiro entre 1 e 5
- `comment`: opcional, máximo 1000 caracteres

**Resposta (201):**
```json
{
  "success": true,
  "message": "Avaliação criada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "rating": 5,
    "comment": "Excelente curso, muito bem explicado!",
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "João Silva",
      "avatar": "https://..."
    },
    "courseId": "507f1f77bcf86cd799439013",
    "helpfulCount": 0,
    "createdAt": "2025-01-22T10:00:00.000Z"
  }
}
```

**Erros:**
- `400`: Já existe uma avaliação para este curso
- `403`: Não está matriculado no curso

---

### PUT `/courses/reviews/:reviewId`

Atualizar avaliação de um curso.

**Acesso:** Protegido (requer ser autor da avaliação)

**Parâmetros:**
- `reviewId`: ID da avaliação (MongoDB ObjectId)

**Body:**
```json
{
  "rating": 4,
  "comment": "Bom curso, mas poderia ter mais exemplos"
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação atualizada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "rating": 4,
    "comment": "Bom curso, mas poderia ter mais exemplos"
  }
}
```

---

### DELETE `/courses/reviews/:reviewId`

Excluir avaliação de um curso.

**Acesso:** Protegido (requer ser autor da avaliação)

**Parâmetros:**
- `reviewId`: ID da avaliação (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação excluída com sucesso"
}
```

---

### POST `/courses/reviews/:reviewId/helpful`

Marcar avaliação como útil.

**Acesso:** Protegido

**Parâmetros:**
- `reviewId`: ID da avaliação (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Avaliação marcada como útil",
  "data": {
    "helpfulCount": 11
  }
}
```

---

### DELETE `/courses/reviews/:reviewId/helpful`

Remover marcação de útil da avaliação.

**Acesso:** Protegido

**Parâmetros:**
- `reviewId`: ID da avaliação (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Marca de útil removida",
  "data": {
    "helpfulCount": 10
  }
}
```

---

### POST `/courses/reviews/:reviewId/report`

Reportar avaliação inadequada.

**Acesso:** Protegido

**Parâmetros:**
- `reviewId`: ID da avaliação (MongoDB ObjectId)

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

Responder avaliação (apenas instrutor do curso).

**Acesso:** Protegido (requer ser instrutor do curso)

**Parâmetros:**
- `reviewId`: ID da avaliação (MongoDB ObjectId)

**Body:**
```json
{
  "response": "Obrigado pelo feedback! Vou considerar suas sugestões."
}
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Resposta adicionada com sucesso",
  "data": {
    "instructorResponse": {
      "response": "Obrigado pelo feedback! Vou considerar suas sugestões.",
      "respondedAt": "2025-01-22T10:30:00.000Z"
    }
  }
}
```

---

## 🔔 Notificações

Todas as rotas de notificações requerem autenticação.

---

### GET `/notifications`

Listar notificações do usuário.

**Acesso:** Protegido  
**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)
- `status`: filtrar por status (`all`, `unread`, `read`)
- `type`: filtrar por tipo (`all`, `class`, `course`, `credit`, `system`)
- `sort`: ordenação (`asc`, `desc` - padrão: `desc`)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "class_reminder",
      "title": "Lembrete de Aula",
      "message": "Você tem uma aula em 1 hora",
      "data": {
        "classId": "507f1f77bcf86cd799439012",
        "courseId": "507f1f77bcf86cd799439013"
      },
      "isRead": false,
      "createdAt": "2025-01-22T13:00:00.000Z"
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
  "unreadCount": 12
}
```

**Tipos de notificação:**
- `class_reminder`: Lembrete de aula
- `class_cancelled`: Aula cancelada
- `class_scheduled`: Nova aula agendada
- `new_course`: Novo curso disponível
- `course_update`: Curso atualizado
- `credit_earned`: Crédito ganho
- `credit_spent`: Crédito gasto
- `new_student`: Novo estudante matriculado
- `instructor_message`: Mensagem do instrutor
- `system`: Notificação do sistema

---

### GET `/notifications/recent`

Buscar notificações recentes (para dropdown).

**Acesso:** Protegido  
**Query Parameters:**
- `limit`: número de notificações (padrão: 5)

**Resposta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "type": "class_reminder",
      "title": "Lembrete de Aula",
      "message": "Você tem uma aula em 1 hora",
      "isRead": false,
      "createdAt": "2025-01-22T13:00:00.000Z"
    }
  ],
  "unreadCount": 12
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
    "unreadCount": 12
  }
}
```

---

### PUT `/notifications/:id/read`

Marcar notificação específica como lida.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da notificação (MongoDB ObjectId)

**Resposta (200):**
```json
{
  "success": true,
  "message": "Notificação marcada como lida",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "isRead": true
  }
}
```

---

### PUT `/notifications/mark-all-read`

Marcar todas as notificações como lidas.

**Acesso:** Protegido

**Resposta (200):**
```json
{
  "success": true,
  "message": "5 notificações marcadas como lidas",
  "data": {
    "modifiedCount": 5
  }
}
```

---

### DELETE `/notifications/:id`

Excluir notificação específica.

**Acesso:** Protegido

**Parâmetros:**
- `id`: ID da notificação (MongoDB ObjectId)

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
  "message": "15 notificações excluídas",
  "data": {
    "deletedCount": 15
  }
}
```

---

### POST `/notifications`

Criar nova notificação (para sistema interno).

**Acesso:** Protegido

**Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "type": "system",
  "title": "Bem-vindo!",
  "message": "Bem-vindo à plataforma Swaply",
  "data": {
    "customField": "customValue"
  }
}
```

**Validações:**
- `userId`: obrigatório
- `type`: obrigatório, enum de tipos válidos
- `title`: obrigatório
- `message`: obrigatório

**Resposta (201):**
```json
{
  "success": true,
  "message": "Notificação criada com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "type": "system",
    "title": "Bem-vindo!",
    "message": "Bem-vindo à plataforma Swaply"
  }
}
```

---

## 👨‍🏫 Instrutores

### GET `/instructors/:id/calendar`

Obter calendário público de um instrutor.

**Acesso:** Público

**Parâmetros:**
- `id`: ID do instrutor (MongoDB ObjectId)

**Query Parameters:**
- `month`: mês (1-12) - obrigatório
- `year`: ano (2020-2100) - obrigatório

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "instructor": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Maria Santos",
      "avatar": "https://..."
    },
    "month": 1,
    "year": 2025,
    "availableSlots": [
      {
        "date": "2025-01-25",
        "time": "09:00-11:00",
        "available": true
      },
      {
        "date": "2025-01-26",
        "time": "14:00-16:00",
        "available": false
      }
    ]
  }
}
```

---

## 📊 Estruturas de Dados

### User (Usuário)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "João Silva",
  "email": "joao@example.com",
  "avatar": "https://cloudinary.com/...",
  "bio": "Desenvolvedor Full Stack",
  "skills": ["JavaScript", "React", "Node.js"],
  "credits": 50,
  "isInstructor": true,
  "joinDate": "2025-01-22T10:00:00.000Z",
  "stats": {
    "coursesCompleted": 5,
    "coursesTeaching": 3,
    "totalHours": 120,
    "totalEarnings": 500
  },
  "settings": {
    "theme": "dark",
    "fontSize": "medium",
    "notifications": {
      "email": true,
      "push": true,
      "classReminders": true,
      "courseUpdates": true
    },
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo"
  }
}
```

### Course (Curso)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Curso de JavaScript Completo",
  "description": "Aprenda JavaScript do zero ao avançado",
  "instructor": "507f1f77bcf86cd799439012",
  "category": "Programação",
  "subcategory": "JavaScript",
  "level": "Iniciante",
  "language": "Português",
  "pricePerHour": 10,
  "totalHours": 40,
  "image": "https://cloudinary.com/...",
  "curriculum": [
    {
      "id": 1,
      "title": "Introdução ao JavaScript",
      "duration": 2,
      "lessons": ["Variáveis", "Tipos de dados", "Operadores"]
    }
  ],
  "schedule": [
    {
      "day": "Segunda",
      "time": "09:00-11:00"
    }
  ],
  "rating": 4.8,
  "totalReviews": 125,
  "studentsCount": 500,
  "isActive": true,
  "isFeatured": false,
  "createdAt": "2025-01-15T10:00:00.000Z"
}
```

### Class (Aula)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "instructorId": "507f1f77bcf86cd799439013",
  "studentId": "507f1f77bcf86cd799439014",
  "title": "Aula de JavaScript",
  "date": "2025-01-25T14:00:00.000Z",
  "time": "14:00",
  "duration": 2,
  "status": "scheduled",
  "zoomLink": "https://zoom.us/j/123456789",
  "zoomMeetingId": "123456789",
  "zoomPassword": "abc123",
  "recordingUrl": null,
  "notes": "Aula sobre arrays e objetos",
  "creditsUsed": 20,
  "attendance": {
    "student": false,
    "instructor": false
  },
  "feedback": {
    "student": {
      "rating": null,
      "comment": null
    },
    "instructor": {
      "rating": null,
      "comment": null
    }
  },
  "createdAt": "2025-01-20T10:00:00.000Z"
}
```

### Review (Avaliação)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439013",
  "rating": 5,
  "comment": "Excelente curso!",
  "helpfulCount": 10,
  "helpfulUsers": ["507f1f77bcf86cd799439014"],
  "isReported": false,
  "instructorResponse": {
    "response": "Obrigado pelo feedback!",
    "respondedAt": "2025-01-22T10:30:00.000Z"
  },
  "createdAt": "2025-01-20T10:00:00.000Z",
  "updatedAt": "2025-01-22T10:30:00.000Z"
}
```

### Notification (Notificação)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "type": "class_reminder",
  "title": "Lembrete de Aula",
  "message": "Você tem uma aula em 1 hora",
  "data": {
    "classId": "507f1f77bcf86cd799439013",
    "courseId": "507f1f77bcf86cd799439014"
  },
  "isRead": false,
  "createdAt": "2025-01-22T13:00:00.000Z"
}
```

---

## 📝 Códigos de Status HTTP

### Sucesso
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso

### Erros do Cliente
- `400 Bad Request`: Dados inválidos ou requisição malformada
- `401 Unauthorized`: Não autenticado ou token inválido
- `403 Forbidden`: Não tem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já cadastrado)
- `422 Unprocessable Entity`: Dados válidos mas não processáveis
- `429 Too Many Requests`: Muitas requisições (rate limit)

### Erros do Servidor
- `500 Internal Server Error`: Erro interno do servidor
- `501 Not Implemented`: Funcionalidade não implementada
- `503 Service Unavailable`: Serviço temporariamente indisponível

### Formato de Erro Padrão

```json
{
  "success": false,
  "message": "Mensagem de erro descritiva",
  "errors": [
    {
      "field": "email",
      "message": "E-mail inválido"
    }
  ]
}
```

---

## 🔑 Autenticação JWT

### Como Funciona

1. **Login/Registro**: O usuário recebe dois tokens:
   - `token`: Token de acesso (válido por tempo limitado)
   - `refreshToken`: Token de renovação (válido por mais tempo)

2. **Uso do Token**: Enviar no header de todas as requisições protegidas:
   ```
   Authorization: Bearer {token}
   ```

3. **Renovação**: Quando o token expirar, usar o `refreshToken` em `/auth/refresh-token` para obter novos tokens.

4. **Logout**: Enviar o `refreshToken` para `/auth/logout` para invalidá-lo.

### Exemplo de Uso

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const { data } = await response.json();
localStorage.setItem('token', data.token);
localStorage.setItem('refreshToken', data.refreshToken);

// Requisição Autenticada
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

---

## 📌 Observações Importantes

1. **Rate Limiting**: 
   - Rotas gerais: 100 requisições por 15 minutos
   - Rotas de autenticação: 5 requisições por 15 minutos

2. **Upload de Arquivos**:
   - Avatar: máximo 5MB, formatos JPG/PNG
   - Imagem de curso: máximo 5MB, formatos JPG/PNG
   - Use `multipart/form-data` para uploads

3. **Paginação**:
   - Padrão: página 1, 20 itens por página
   - Máximo: 100 itens por página
   - Resposta inclui metadados de paginação

4. **Datas**:
   - Formato: ISO8601 (`2025-01-25T14:00:00.000Z`)
   - Fuso horário: UTC

5. **IDs**:
   - Todos os IDs são MongoDB ObjectIds (24 caracteres hexadecimais)
   - Exemplo: `507f1f77bcf86cd799439011`

6. **Validações**:
   - Todas as rotas têm validação de entrada
   - Erros de validação retornam array detalhado de erros

7. **CORS**:
   - Configurado para aceitar requisições de origens específicas
   - Credenciais habilitadas

---

## 🔗 Links Úteis

- **Health Check**: `GET /health`
- **Informações da API**: `GET /api`
- **Base URL**: `http://localhost:5000/api`

---

**Última atualização:** 22 de Janeiro de 2025  
**Versão da API:** 1.0.0

