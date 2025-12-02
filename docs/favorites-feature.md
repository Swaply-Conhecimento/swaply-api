# Favoritos - Resumo da funcionalidade

Este documento descreve a implementação que permite ao backend retornar informação de "favorito" (isFavorite) para cada curso, e as rotas existentes que permitem ao usuário marcar/desmarcar cursos como favoritos.

## Objetivo

Permitir que o frontend saiba, para cada curso retornado pela API, se ele está marcado como favorito pelo usuário que fez a requisição. Isso melhora a experiência do usuário (ex.: mostrar ícone preenchido para favoritos) sem precisar fazer múltiplas chamadas separadas.

## O que foi implementado

- A propriedade `favorites` já existe no schema `User` (array de ObjectId referenciando `Course`).
- O controller de listagem/consulta de cursos (`src/controllers/courseController.js`) foi atualizado para incluir a flag `isFavorite` em cada curso quando `req.user` estiver presente.
- As rotas públicas de listagem e busca de cursos em `src/routes/courses.js` agora aceitam autenticação opcional (`optionalAuth`). Quando o frontend envia o header `Authorization: Bearer <token>`, o backend popula `req.user` e a resposta inclui `isFavorite` (true/false) para cada curso.

## Endpoints relevantes

- GET /api/courses
  - Lista cursos (mesmo comportamento anterior). Se o cliente enviar um token válido no header `Authorization`, cada curso conterá `isFavorite: true|false`.

- GET /api/courses/search
  - Busca por texto com mesmo comportamento (suporta token opcional para isFavorite).

- GET /api/courses/:id
  - Retorna detalhes do curso. Quando autenticado, a resposta já inclui `isFavorite` e `isEnrolled`.

- POST /api/users/favorites/:courseId
  - Endpoint existente para adicionar um curso nos favoritos do usuário (é necessário estar autenticado).

- DELETE /api/users/favorites/:courseId
  - Endpoint existente para remover um curso dos favoritos do usuário (é necessário estar autenticado).

> Observação: os endpoints de marcação/desmarcação de favoritos fazem parte do `users` controller/rotas e já existem. A atualização feita aqui é para enriquecer as respostas de cursos com o status de favorito.

## Formato de resposta (exemplo)

- Requisição sem token:

  GET /api/courses

  Cada curso retornado NÃO terá `isFavorite: true` (ou terá `isFavorite: false`).

- Requisição com token válido:

  GET /api/courses  (Header: Authorization: Bearer SEU_JWT)

  Resposta (cada item de curso):

  ```json
  {
    "_id": "69251f870696bc697a3ca3b8",
    "title": "Design UX/UI para Iniciantes",
    "status": "active",
    "isFavorite": true,
    "totalPrice": 72,
    "spotsAvailable": 20,
    "instructor": { "name": "...", "avatar": "..." }
  }
  ```

## Como o frontend deve enviar o token

- Header HTTP: `Authorization: Bearer <SEU_JWT_AQUI>`

Exemplo (curl):

```bash
curl -H "Authorization: Bearer SEU_JWT_AQUI" http://localhost:5000/api/courses
```

Exemplo (PowerShell):

```powershell
#$headers = @{ Authorization = 'Bearer SEU_JWT_AQUI' }
#Invoke-RestMethod -Uri http://localhost:5000/api/courses -Method GET -Headers $headers
```

## Notas de implementação e performance

- A lógica atual lê `req.user.favorites` (já populada no middleware de autenticação) e compara os IDs de curso retornados com esse array para montar `isFavorite`. Isso é eficiente para a maioria dos casos, especialmente quando o número de favoritos por usuário é pequeno.
- Para listas muito grandes ou casos de escala, podemos otimizar usando uma agregação no MongoDB que marque favoritos diretamente na query (ex.: $lookup + $in) ou limitar os campos retornados.

## Testes manuais recomendados

1. Faça login no frontend / gere um JWT válido.
2. Chame `GET /api/courses` sem token — verifique que `isFavorite` não aparece como `true`.
3. Chame `GET /api/courses` com token — verifique que `isFavorite` está `true` apenas para os cursos que estão em `user.favorites`.
4. Use `POST /api/users/favorites/:courseId` para adicionar um favorito e repita o passo 3.
5. Use `DELETE /api/users/favorites/:courseId` para remover o favorito e verifique novamente.

## Próximos passos (opcionais)

- Adicionar endpoint que retorna apenas os cursos favoritos do usuário (ex.: GET /api/users/favorites) com paginação.
- Criar testes automatizados que cubram: listagem sem token, listagem com token e operações de adicionar/remover favoritos.
- Implementar agregação no servidor para marcar favoritos em grandes listas sem carregar todo o array de favoritos em memória.

---

Arquivo criado automaticamente para documentar a funcionalidade de favoritos nas listagens de cursos.
