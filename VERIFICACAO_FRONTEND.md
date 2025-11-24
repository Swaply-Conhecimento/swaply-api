# ✅ Verificação Frontend - Swaply API

> Checklist completo para verificar se o frontend está funcionando corretamente com a API

## 🔐 Autenticação

### 1. Verificar Token JWT

**Endpoint:** `GET /api/auth/verify-token`

**Headers:**
```
Authorization: Bearer <token>
```

**Verificações:**
- [ ] Token está sendo armazenado após login (localStorage/sessionStorage)
- [ ] Token está sendo enviado no header `Authorization` em todas as requisições autenticadas
- [ ] Formato do header está correto: `Bearer <token>` (com espaço após "Bearer")
- [ ] Token é verificado automaticamente ao carregar a aplicação
- [ ] Usuário é redirecionado para login se token for inválido/expirado

**Resposta esperada (200):**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "user": {
      "_id": "...",
      "name": "...",
      "email": "...",
      "avatar": "...",
      "credits": 10,
      "isInstructor": true
    }
  }
}
```

**Erros possíveis:**
- `401 Unauthorized` - Token ausente, inválido ou expirado
- `500 Internal Server Error` - Erro no servidor (verificar logs)

---

## 👤 Rotas de Usuário

### 2. Obter Perfil do Usuário

**Endpoint:** `GET /api/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Verificações:**
- [ ] Requisição retorna dados do usuário autenticado
- [ ] Campos obrigatórios estão presentes: `_id`, `name`, `email`
- [ ] Campo `password` NÃO está na resposta
- [ ] Erro 401 se token não for enviado

**Resposta esperada (200):**
```json
{
  "success": true,
  "message": "Perfil obtido com sucesso",
  "data": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "avatar": "...",
    "bio": "...",
    "skills": [],
    "credits": 10,
    "isInstructor": true,
    "stats": {
      "coursesCompleted": 0,
      "coursesTeaching": 0,
      "totalHours": 0,
      "totalEarnings": 0
    }
  }
}
```

---

### 3. Obter Estatísticas do Usuário

**Endpoint:** `GET /api/users/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Verificações:**
- [ ] Requisição retorna estatísticas do usuário
- [ ] Campos esperados estão presentes:
  - `coursesCompleted`
  - `coursesTeaching`
  - `totalHours`
  - `totalEarnings`
  - `enrolledCourses`
  - `teachingCourses`
  - `currentCredits`
  - `financialSummary`
- [ ] Valores numéricos são números (não strings)
- [ ] Erro 401 se token não for enviado

**Resposta esperada (200):**
```json
{
  "success": true,
  "message": "Estatísticas obtidas com sucesso",
  "data": {
    "coursesCompleted": 0,
    "coursesTeaching": 0,
    "totalHours": 0,
    "totalEarnings": 0,
    "enrolledCourses": 0,
    "teachingCourses": 0,
    "currentCredits": 10,
    "financialSummary": {
      "currentCredits": 10,
      "summary": {
        "credit_purchase": { "totalAmount": 0, "totalCredits": 0, "count": 0 },
        "credit_earned": { "totalAmount": 0, "totalCredits": 0, "count": 0 },
        "credit_spent": { "totalAmount": 0, "totalCredits": 0, "count": 0 },
        "refund": { "totalAmount": 0, "totalCredits": 0, "count": 0 }
      },
      "totalSpent": 0,
      "totalEarned": 0,
      "totalUsed": 0
    }
  }
}
```

---

## 📚 Criação de Cursos

### 4. Criar Curso (JSON)

**Endpoint:** `POST /api/courses`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (campos obrigatórios):**
```json
{
  "title": "Curso de Teste",
  "description": "Descrição do curso com pelo menos 20 caracteres",
  "category": "Programação",
  "level": "Iniciante",
  "pricePerHour": 10,
  "totalHours": 20
}
```

**Verificações:**
- [ ] Curso é criado com sucesso (201)
- [ ] Campo `language` é enviado como `"Português"` (ou outro idioma suportado)
- [ ] Campo `language` é retornado na resposta (não `courseLanguage`)
- [ ] Campo `instructor` é preenchido automaticamente
- [ ] Campo `status` padrão é `"draft"`
- [ ] Validações funcionam (título muito curto, descrição muito curta, etc.)

**Resposta esperada (201):**
```json
{
  "success": true,
  "message": "Curso criado com sucesso",
  "data": {
    "_id": "...",
    "title": "Curso de Teste",
    "description": "...",
    "instructor": {
      "_id": "...",
      "name": "...",
      "avatar": "..."
    },
    "language": "Português",
    "status": "draft",
    "pricePerHour": 10,
    "totalHours": 20,
    "maxStudents": 50,
    "currentStudents": 0
  }
}
```

**⚠️ IMPORTANTE:** O campo `language` é mapeado internamente para `courseLanguage` no banco, mas o frontend sempre envia e recebe `language`.

---

### 5. Criar Curso com Imagem

**Endpoint:** `POST /api/courses`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (FormData):**
- `title`: "Curso de Teste"
- `description`: "Descrição do curso..."
- `category`: "Programação"
- `level`: "Iniciante"
- `pricePerHour`: 10
- `totalHours`: 20
- `language`: "Português"
- `image`: arquivo de imagem (jpg, jpeg, png, webp, máx. 10MB)

**Verificações:**
- [ ] Imagem é enviada corretamente no FormData
- [ ] URL da imagem é retornada na resposta (Cloudinary)
- [ ] Imagem é exibida corretamente após upload
- [ ] Validação de tipo de arquivo funciona (rejeita arquivos inválidos)
- [ ] Validação de tamanho funciona (rejeita arquivos > 10MB)

**Resposta esperada (201):**
```json
{
  "success": true,
  "message": "Curso criado com sucesso",
  "data": {
    "_id": "...",
    "title": "Curso de Teste",
    "image": "https://res.cloudinary.com/.../swaply/courses/...",
    "language": "Português",
    ...
  }
}
```

---

## 🔍 Verificações Gerais

### 6. Interceptor de Requisições

**Verificações:**
- [ ] Axios/Fetch está configurado com interceptor para adicionar token automaticamente
- [ ] Token é adicionado em TODAS as requisições autenticadas
- [ ] Erro 401 é tratado globalmente (redireciona para login)
- [ ] Token é atualizado automaticamente quando expira (se houver refresh token)

**Exemplo de configuração Axios:**
```javascript
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirecionar para login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### 7. Tratamento de Erros

**Verificações:**
- [ ] Erros 400 (validação) são exibidos de forma amigável
- [ ] Erros 401 (não autenticado) redirecionam para login
- [ ] Erros 403 (sem permissão) são exibidos claramente
- [ ] Erros 500 (servidor) são tratados graciosamente
- [ ] Mensagens de erro são exibidas ao usuário

**Exemplo de tratamento:**
```javascript
try {
  const response = await api.get('/users/stats');
  // Sucesso
} catch (error) {
  if (error.response?.status === 401) {
    // Não autenticado
  } else if (error.response?.status === 400) {
    // Erro de validação
    const errors = error.response.data.errors;
  } else {
    // Erro genérico
  }
}
```

---

### 8. Campos de Curso

**Verificações:**
- [ ] Campo `language` é usado no formulário (não `courseLanguage`)
- [ ] Campo `language` é exibido na listagem de cursos
- [ ] Campo `language` é exibido nos detalhes do curso
- [ ] Campo `language` é salvo corretamente ao criar/editar curso

**⚠️ LEMBRE-SE:** O backend mapeia `language` ↔ `courseLanguage` automaticamente. O frontend sempre usa `language`.

---

## 📋 Checklist Completo

### Autenticação
- [ ] Login funciona e retorna token
- [ ] Token é armazenado após login
- [ ] Token é enviado em todas as requisições autenticadas
- [ ] Verificação de token funciona ao carregar app
- [ ] Logout remove token e redireciona

### Perfil do Usuário
- [ ] GET `/api/users/profile` funciona
- [ ] GET `/api/users/stats` funciona
- [ ] PUT `/api/users/profile` funciona
- [ ] Upload de avatar funciona
- [ ] Dados são atualizados após edição

### Criação de Cursos
- [ ] Criar curso sem imagem funciona
- [ ] Criar curso com imagem funciona
- [ ] Campo `language` é enviado e recebido corretamente
- [ ] Validações de campos obrigatórios funcionam
- [ ] Mensagens de erro são exibidas corretamente
- [ ] Curso criado aparece na listagem

### Listagem de Cursos
- [ ] GET `/api/courses` funciona
- [ ] Campo `language` é exibido corretamente
- [ ] Filtros funcionam (categoria, nível, etc.)
- [ ] Paginação funciona
- [ ] Busca funciona

### Detalhes do Curso
- [ ] GET `/api/courses/:id` funciona
- [ ] Campo `language` é exibido
- [ ] Informações do instrutor são exibidas
- [ ] Matrícula funciona (se aplicável)

---

## 🐛 Problemas Comuns

### Erro 401 em todas as rotas
**Causa:** Token não está sendo enviado ou está inválido
**Solução:**
1. Verificar se token está sendo armazenado após login
2. Verificar se interceptor está adicionando token no header
3. Verificar formato do header: `Bearer <token>` (com espaço)
4. Fazer login novamente para obter novo token

### Campo `language` não aparece
**Causa:** Backend pode estar retornando `courseLanguage` em vez de `language`
**Solução:** Verificar se o backend está mapeando corretamente (já corrigido)

### Erro ao criar curso com imagem
**Causa:** FormData não está sendo enviado corretamente
**Solução:**
1. Verificar se `Content-Type` não está sendo definido manualmente (deixar o navegador definir)
2. Verificar se arquivo está sendo adicionado ao FormData
3. Verificar tamanho do arquivo (máx. 10MB)

### Estatísticas não carregam
**Causa:** Erro na query do banco ou serviço de pagamentos
**Solução:**
1. Verificar logs do servidor
2. Verificar se usuário tem dados no banco
3. Verificar se serviço de pagamentos está funcionando

---

## 🔗 URLs de Teste

**Base URL:** `http://localhost:5000/api`

**Endpoints principais:**
- `POST /auth/login` - Login
- `GET /auth/verify-token` - Verificar token
- `GET /users/profile` - Perfil do usuário
- `GET /users/stats` - Estatísticas
- `POST /courses` - Criar curso
- `GET /courses` - Listar cursos

---

## 📝 Notas Importantes

1. **Campo `language`:** O frontend sempre usa `language`, o backend mapeia para `courseLanguage` internamente
2. **Autenticação:** Todas as rotas `/api/users/*` requerem autenticação
3. **Imagens:** Upload de imagens usa `multipart/form-data`, não `application/json`
4. **Tokens:** Tokens JWT expiram, implementar refresh token se necessário
5. **Erros:** Sempre tratar erros 401, 400, 500 de forma apropriada

---

**Última atualização:** Janeiro 2025  
**Versão da API:** 1.0.0

