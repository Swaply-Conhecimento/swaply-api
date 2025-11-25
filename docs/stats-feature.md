# Estatísticas - Resumo da nova funcionalidade

Este documento descreve a nova funcionalidade adicionada à API: endpoints para obter a quantidade de cursos e usuários ativos.

## Objetivo

Fornecer endpoints públicos simples que retornam contagens agregadas para uso em dashboards, health checks e painéis administrativos.

## Arquivos adicionados

- `src/controllers/statsController.js` — controller que executa consultas ao MongoDB e formata a resposta.
- `src/routes/stats.js` — rotas que expõem os endpoints ao aplicativo.
- `src/app.js` — registro da rota em `/api/stats`.

## Endpoints

- GET /api/stats
  - Descrição: Retorna contagens de cursos ativos e usuários ativos.
  - Resposta (200):
    ```json
    {
      "success": true,
      "message": "Contagens obtidas com sucesso",
      "data": {
        "activeCourses": 12,
        "activeUsers": 345
      }
    }
    ```

- GET /api/stats/courses
  - Descrição: Retorna apenas a quantidade de cursos com `status: 'active'`.
  - Resposta (200): `{ "success": true, "data": { "activeCourses": 12 } }`

- GET /api/stats/users
  - Descrição: Retorna apenas a quantidade de usuários com `isActive: true`.
  - Resposta (200): `{ "success": true, "data": { "activeUsers": 345 } }`

## Critérios de 'ativo'

- Cursos ativos: documentos `Course` com o campo `status` igual a `'active'`.
- Usuários ativos: documentos `User` com o campo `isActive` igual a `true`.

Se o critério de "ativo" mudar (por ex. considerar `isLive` ou `currentStudents > 0`), a query no controller deve ser ajustada.

## Autenticação / Permissões

Atualmente as rotas são públicas. Caso deseje restrição (apenas administradores ou usuários autenticados), adicione o middleware `authenticate` ou um middleware de autorização nas rotas em `src/routes/stats.js`.

## Como testar localmente

1. Inicie o servidor:

```powershell
npm run dev
# ou
node server.js
```

2. Requisições de exemplo (PowerShell):

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/stats -Method GET
Invoke-RestMethod -Uri http://localhost:5000/api/stats/courses -Method GET
Invoke-RestMethod -Uri http://localhost:5000/api/stats/users -Method GET
```

Ou com curl:

```powershell
curl http://localhost:5000/api/stats
```

## Observações e próximos passos

- Testar os endpoints contra a base de dados real para confirmar contagens.
- Se necessário, adicionar paginação ou filtros (por período, por categoria, por instrutor).
- Implementar controle de acesso (apenas admins) se as contagens não forem públicas.
- Adicionar testes unitários/integrados que cubram os controllers.

## Histórico de alterações

- 2025-11-25: Implementada funcionalidade inicial (controllers, rotas e registro em app).

---

Arquivo gerado automaticamente pelo sistema de desenvolvimento para documentar a funcionalidade `stats`.
