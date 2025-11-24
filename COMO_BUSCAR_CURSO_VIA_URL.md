# 📚 Como Buscar um Curso via URL - Swaply API

> Guia completo para buscar detalhes de um curso específico usando a API

**Versão da API:** 1.0.0  
**Última atualização:** Janeiro 2025

---

## 🎯 Endpoint

### GET `/api/courses/:id`

Obter detalhes completos de um curso específico pelo seu ID.

**Acesso:** Público (autenticação opcional)

---

## 📋 Informações da Requisição

### Método HTTP
```
GET
```

### URL Base
```
http://localhost:5000/api/courses/:id
```

### Parâmetros de URL

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id` | String (MongoDB ObjectId) | ✅ Sim | ID único do curso |

### Headers

**Opcional (mas recomendado):**
```
Authorization: Bearer <token>
```

**Nota:** Se você enviar o token de autenticação:
- O sistema verifica se você está matriculado no curso (`isEnrolled`)
- O sistema verifica se o curso está nos seus favoritos (`isFavorite`)
- Você recebe informações adicionais personalizadas

**Sem token:**
- A requisição funciona normalmente
- `isEnrolled` será sempre `false`
- `isFavorite` será sempre `false`

---

## ✅ Resposta de Sucesso (200)

### Estrutura da Resposta

```json
{
  "success": true,
  "message": "Curso obtido com sucesso",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Curso de Python para Iniciantes",
    "description": "Aprenda Python do zero de forma prática e objetiva",
    "instructor": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "João Silva",
      "avatar": "https://res.cloudinary.com/...",
      "bio": "Desenvolvedor Python com 10 anos de experiência",
      "stats": {
        "coursesTeaching": 5,
        "coursesCompleted": 0,
        "totalHours": 0,
        "totalEarnings": 0
      }
    },
    "category": "Programação",
    "subcategory": "Backend",
    "level": "Iniciante",
    "language": "Português",
    "pricePerHour": 10,
    "totalHours": 20,
    "maxStudents": 30,
    "currentStudents": 5,
    "rating": 4.8,
    "totalRatings": 15,
    "image": "https://res.cloudinary.com/.../swaply/courses/...",
    "features": [
      "Material complementar",
      "Exercícios práticos",
      "Certificado de conclusão"
    ],
    "curriculum": [
      {
        "id": 1,
        "title": "Introdução ao Python",
        "duration": 3,
        "lessons": [
          "O que é Python?",
          "Instalação e configuração",
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
    "status": "active",
    "isLive": true,
    "enrolledStudents": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Maria Santos",
        "avatar": "https://res.cloudinary.com/..."
      }
    ],
    "totalPrice": 200,
    "spotsAvailable": 25,
    "isEnrolled": false,
    "isFavorite": false,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-20T14:20:00.000Z"
  }
}
```

### Campos Retornados

#### Informações Básicas
- `_id`: ID único do curso
- `title`: Título do curso
- `description`: Descrição completa
- `category`: Categoria principal
- `subcategory`: Subcategoria (opcional)
- `level`: Nível do curso ("Iniciante", "Intermediário", "Avançado")
- `language`: Idioma do curso (ex: "Português", "Inglês", "Espanhol")
- `status`: Status do curso ("draft", "active", "completed", "cancelled")

#### Informações do Instrutor
- `instructor._id`: ID do instrutor
- `instructor.name`: Nome do instrutor
- `instructor.avatar`: URL do avatar
- `instructor.bio`: Biografia do instrutor
- `instructor.stats`: Estatísticas do instrutor

#### Informações Financeiras
- `pricePerHour`: Preço por hora em créditos
- `totalHours`: Total de horas do curso
- `totalPrice`: Preço total calculado (`pricePerHour * totalHours`)

#### Informações de Capacidade
- `maxStudents`: Número máximo de estudantes
- `currentStudents`: Número atual de estudantes matriculados
- `spotsAvailable`: Vagas disponíveis (`maxStudents - currentStudents`)

#### Informações de Avaliação
- `rating`: Nota média (0-5)
- `totalRatings`: Número total de avaliações

#### Conteúdo do Curso
- `image`: URL da imagem do curso (Cloudinary)
- `features`: Array de características do curso
- `curriculum`: Estrutura do currículo
- `schedule`: Horários das aulas
- `requirements`: Pré-requisitos
- `objectives`: Objetivos de aprendizado
- `tags`: Tags para busca

#### Informações Adicionais (Calculadas)
- `totalPrice`: Preço total do curso
- `spotsAvailable`: Vagas disponíveis
- `isEnrolled`: Se o usuário autenticado está matriculado (apenas se autenticado)
- `isFavorite`: Se o curso está nos favoritos do usuário (apenas se autenticado)

#### Estudantes Matriculados
- `enrolledStudents`: Array com informações básicas dos estudantes matriculados
  - `_id`: ID do estudante
  - `name`: Nome do estudante
  - `avatar`: URL do avatar

---

## ❌ Respostas de Erro

### 404 - Curso Não Encontrado

**Quando ocorre:**
- ID do curso não existe no banco de dados
- ID está em formato inválido

**Resposta:**
```json
{
  "success": false,
  "message": "Curso não encontrado"
}
```

### 400 - ID Inválido

**Quando ocorre:**
- ID não está no formato MongoDB ObjectId válido

**Resposta:**
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    {
      "field": "id",
      "message": "ID do curso inválido",
      "value": "invalid-id"
    }
  ]
}
```

### 500 - Erro Interno do Servidor

**Quando ocorre:**
- Erro no banco de dados
- Erro no processamento

**Resposta:**
```json
{
  "success": false,
  "message": "Erro interno do servidor"
}
```

---

## 💻 Exemplos de Uso

### Exemplo 1: Buscar Curso (JavaScript/Fetch)

```javascript
// Sem autenticação
async function getCourseById(courseId) {
  try {
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Curso:', data.data);
      return data.data;
    } else {
      console.error('Erro:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    return null;
  }
}

// Com autenticação
async function getCourseByIdAuthenticated(courseId, token) {
  try {
    const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('Curso:', data.data);
      console.log('Está matriculado?', data.data.isEnrolled);
      console.log('Está nos favoritos?', data.data.isFavorite);
      return data.data;
    } else {
      console.error('Erro:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
    return null;
  }
}

// Uso
const course = await getCourseById('507f1f77bcf86cd799439011');
```

### Exemplo 2: Buscar Curso (Axios)

```javascript
import axios from 'axios';

// Sem autenticação
async function getCourseById(courseId) {
  try {
    const { data } = await axios.get(
      `http://localhost:5000/api/courses/${courseId}`
    );
    
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('Curso não encontrado');
    } else {
      console.error('Erro:', error.message);
    }
    return null;
  }
}

// Com autenticação (usando interceptor)
// O token será adicionado automaticamente pelo interceptor
async function getCourseByIdAuthenticated(courseId) {
  try {
    const { data } = await apiClient.get(`/courses/${courseId}`);
    
    if (data.success) {
      return data.data;
    }
    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.error('Curso não encontrado');
    } else {
      console.error('Erro:', error.message);
    }
    return null;
  }
}
```

### Exemplo 3: React Hook

```javascript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { courseService } from '../services/api/courses';

function useCourse() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCourse() {
      try {
        setLoading(true);
        const result = await courseService.getCourseById(id);
        
        if (result.success) {
          setCourse(result.course);
        } else {
          setError('Curso não encontrado');
        }
      } catch (err) {
        setError(err.message || 'Erro ao carregar curso');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCourse();
    }
  }, [id]);

  return { course, loading, error };
}

// Uso no componente
function CourseDetails() {
  const { course, loading, error } = useCourse();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!course) return <div>Curso não encontrado</div>;

  return (
    <div>
      <h1>{course.title}</h1>
      <p>{course.description}</p>
      <p>Instrutor: {course.instructor.name}</p>
      <p>Idioma: {course.language}</p>
      <p>Preço Total: {course.totalPrice} créditos</p>
      <p>Vagas Disponíveis: {course.spotsAvailable}</p>
      {course.isEnrolled && <p>✅ Você está matriculado neste curso</p>}
      {course.isFavorite && <p>⭐ Este curso está nos seus favoritos</p>}
    </div>
  );
}
```

### Exemplo 4: cURL

```bash
# Sem autenticação
curl -X GET http://localhost:5000/api/courses/507f1f77bcf86cd799439011

# Com autenticação
curl -X GET http://localhost:5000/api/courses/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer seu_token_aqui"
```

### Exemplo 5: Postman/Insomnia

**Configuração:**
- **Método:** GET
- **URL:** `http://localhost:5000/api/courses/:id`
- **Parâmetros:**
  - `id`: `507f1f77bcf86cd799439011`
- **Headers (opcional):**
  - `Authorization`: `Bearer seu_token_aqui`

---

## 🔍 Informações Adicionais

### Autenticação Opcional

A rota usa o middleware `optionalAuth`, que significa:

1. **Sem token:** A requisição funciona normalmente, mas:
   - `isEnrolled` será sempre `false`
   - `isFavorite` será sempre `false`

2. **Com token válido:** Você recebe informações adicionais:
   - `isEnrolled`: Indica se você está matriculado no curso
   - `isFavorite`: Indica se o curso está nos seus favoritos

### Mapeamento de Campos

**⚠️ IMPORTANTE:** O campo `language` é retornado na resposta, mas internamente no banco de dados é armazenado como `courseLanguage`. O mapeamento é automático e transparente.

### Populate Automático

A rota automaticamente popula (preenche) os seguintes campos:

- `instructor`: Informações completas do instrutor
- `enrolledStudents`: Lista de estudantes matriculados (apenas nome e avatar)

### Campos Calculados

A rota adiciona automaticamente campos calculados:

- `totalPrice`: `pricePerHour * totalHours`
- `spotsAvailable`: `maxStudents - currentStudents`
- `isEnrolled`: Verifica se o usuário autenticado está na lista de `enrolledStudents`
- `isFavorite`: Verifica se o curso está na lista de favoritos do usuário

---

## 🎯 Casos de Uso

### 1. Visualizar Detalhes do Curso
```javascript
// Usuário clica em um curso na listagem
const courseId = '507f1f77bcf86cd799439011';
const course = await getCourseById(courseId);
// Exibe página de detalhes com todas as informações
```

### 2. Verificar Matrícula
```javascript
// Verificar se usuário está matriculado
const course = await getCourseByIdAuthenticated(courseId, token);
if (course.isEnrolled) {
  // Mostrar conteúdo do curso
} else {
  // Mostrar botão de matrícula
}
```

### 3. Verificar Favoritos
```javascript
// Verificar se curso está nos favoritos
const course = await getCourseByIdAuthenticated(courseId, token);
if (course.isFavorite) {
  // Mostrar ícone de favorito preenchido
} else {
  // Mostrar ícone de favorito vazio
}
```

### 4. Verificar Vagas Disponíveis
```javascript
// Verificar se há vagas disponíveis
const course = await getCourseById(courseId);
if (course.spotsAvailable > 0) {
  // Permitir matrícula
} else {
  // Mostrar "Curso lotado"
}
```

---

## 📝 Notas Importantes

1. **ID Válido:** O ID deve ser um MongoDB ObjectId válido (24 caracteres hexadecimais)

2. **Autenticação Opcional:** Você pode buscar cursos sem estar autenticado, mas perderá informações personalizadas

3. **Performance:** A rota faz populate de `instructor` e `enrolledStudents`, então pode ser um pouco mais lenta para cursos com muitos estudantes

4. **Cache:** Considere implementar cache no frontend para evitar requisições desnecessárias

5. **Tratamento de Erros:** Sempre trate os casos de erro (404, 400, 500) adequadamente

---

## 🔗 Endpoints Relacionados

- `GET /api/courses` - Listar todos os cursos
- `GET /api/courses/search` - Buscar cursos por termo
- `GET /api/courses/featured` - Cursos em destaque
- `GET /api/courses/popular` - Cursos populares
- `POST /api/courses/:id/enroll` - Matricular-se no curso
- `GET /api/courses/:id/reviews` - Avaliações do curso

---

## 📚 Referências

- [Documentação Completa da API](./API_DOCUMENTATION.md)
- [Modelo de Curso](./src/models/Course.js)
- [Controller de Cursos](./src/controllers/courseController.js)
- [Rotas de Cursos](./src/routes/courses.js)

---

**Última atualização:** Janeiro 2025  
**Versão da API:** 1.0.0

