# 🔔 API de Notificações - Swaply

## 📋 **Rotas Implementadas**

Todas as rotas seguem o padrão de resposta:
```json
{
  "success": boolean,
  "message": string,
  "data": object/array,
  "pagination": object (quando aplicável)
}
```

### **🔐 Autenticação**
Todas as rotas requerem autenticação via JWT:
```
Authorization: Bearer <token>
```

---

## 🛣️ **Endpoints Disponíveis**

### **1. GET /api/notifications**
**Listar notificações do usuário com filtros e paginação**

**Query Parameters:**
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 20, máx: 100)
- `status` (string): 'all', 'unread', 'read' (padrão: 'all')
- `type` (string): 'all', 'class', 'course', 'credit', 'system' (padrão: 'all')
- `sort` (string): 'asc', 'desc' (padrão: 'desc')

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "userId": "64f...",
      "type": "class_reminder",
      "title": "Lembrete de Aula",
      "message": "Você tem uma aula de JavaScript em 30 minutos",
      "isRead": false,
      "data": {
        "courseTitle": "JavaScript Avançado",
        "instructorName": "João Silva"
      },
      "createdAt": "2024-09-18T19:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "unreadCount": 5
}
```

### **2. GET /api/notifications/recent**
**Buscar notificações recentes para dropdown**

**Query Parameters:**
- `limit` (number): Número de notificações (padrão: 5)

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f...",
      "type": "credit_earned",
      "title": "Créditos Recebidos",
      "message": "Você ganhou 2 créditos por ensinar",
      "isRead": false,
      "createdAt": "2024-09-18T19:30:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

### **3. GET /api/notifications/unread-count**
**Contar notificações não lidas (para badge)**

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 7
  }
}
```

### **4. PUT /api/notifications/:id/read**
**Marcar notificação específica como lida**

**Exemplo de Resposta:**
```json
{
  "success": true,
  "message": "Notificação marcada como lida",
  "data": {
    "_id": "64f...",
    "isRead": true,
    "updatedAt": "2024-09-18T19:35:00.000Z"
  }
}
```

### **5. PUT /api/notifications/mark-all-read**
**Marcar todas as notificações como lidas**

**Exemplo de Resposta:**
```json
{
  "success": true,
  "message": "5 notificações marcadas como lidas",
  "data": {
    "modifiedCount": 5
  }
}
```

### **6. DELETE /api/notifications/:id**
**Excluir notificação específica**

**Exemplo de Resposta:**
```json
{
  "success": true,
  "message": "Notificação excluída com sucesso"
}
```

### **7. DELETE /api/notifications/clear-all**
**Excluir todas as notificações lidas**

**Exemplo de Resposta:**
```json
{
  "success": true,
  "message": "8 notificações excluídas",
  "data": {
    "deletedCount": 8
  }
}
```

### **8. POST /api/notifications**
**Criar nova notificação (sistema interno)**

**Body Parameters:**
```json
{
  "userId": "64f...",
  "type": "system",
  "title": "Título da notificação",
  "message": "Mensagem da notificação",
  "data": {
    "customField": "valor"
  }
}
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "message": "Notificação criada com sucesso",
  "data": {
    "_id": "64f...",
    "userId": "64f...",
    "type": "system",
    "title": "Título da notificação",
    "message": "Mensagem da notificação",
    "isRead": false,
    "createdAt": "2024-09-18T19:40:00.000Z"
  }
}
```

---

## 🏷️ **Tipos de Notificação**

| Tipo | Descrição | Uso |
|------|-----------|-----|
| `class_reminder` | Lembrete de aula | 30 min antes da aula |
| `class_cancelled` | Aula cancelada | Quando aula é cancelada |
| `class_scheduled` | Aula agendada | Quando aula é marcada |
| `new_course` | Novo curso | Curso adicionado na categoria de interesse |
| `course_update` | Curso atualizado | Curso matriculado foi atualizado |
| `credit_earned` | Créditos recebidos | Instrutor ganha créditos |
| `credit_spent` | Créditos gastos | Estudante gasta créditos |
| `new_student` | Novo aluno | Aluno se matricula no curso |
| `instructor_message` | Mensagem do instrutor | Comunicação direta |
| `system` | Sistema | Manutenções, atualizações |

---

## 🔧 **NotificationService - Métodos Automáticos**

### **Métodos Disponíveis:**
```javascript
// Lembrete de aula (30 min antes)
await NotificationService.createClassReminder(userId, courseTitle, instructorName, 30);

// Créditos recebidos (após ensinar)
await NotificationService.createCreditEarned(userId, credits, courseTitle);

// Novo curso disponível
await NotificationService.createNewCourse(userId, courseTitle, category);

// Aula agendada
await NotificationService.createClassScheduled(userId, courseTitle, date, time);

// Novo aluno matriculado
await NotificationService.createNewStudent(instructorId, studentName, courseTitle);

// Créditos gastos
await NotificationService.createCreditSpent(userId, credits, courseTitle);

// Aula cancelada
await NotificationService.createClassCancelled(userId, courseTitle, refundedCredits);

// Notificação do sistema
await NotificationService.createSystemNotification(userId, title, message, data);

// Mensagem do instrutor
await NotificationService.createInstructorMessage(userId, instructorName, message, courseTitle);

// Notificar todos os usuários
await NotificationService.notifyAllUsers(title, message, data);
```

---

## 🔄 **Jobs Automáticos (Cron)**

### **1. Limpeza de Notificações**
- **Frequência:** Domingos às 2h
- **Ação:** Remove notificações lidas com mais de 30 dias

### **2. Lembretes de Aula**
- **Frequência:** A cada 5 minutos
- **Ação:** Envia lembretes 30 minutos antes das aulas

### **3. Notificações de Novos Cursos**
- **Frequência:** A cada hora
- **Ação:** Notifica usuários sobre cursos na categoria de interesse

---

## 🧪 **Exemplos de Uso no Frontend**

### **NotificationBell Component:**
```javascript
// Buscar contador de não lidas
const { data } = await api.get('/api/notifications/unread-count');
setBadgeCount(data.unreadCount);

// Buscar notificações recentes
const { data } = await api.get('/api/notifications/recent?limit=5');
setRecentNotifications(data.data);

// Marcar como lida
await api.put(`/api/notifications/${notificationId}/read`);

// Marcar todas como lidas
await api.put('/api/notifications/mark-all-read');
```

### **Página de Notificações:**
```javascript
// Listar com filtros
const { data } = await api.get('/api/notifications', {
  params: {
    page: 1,
    limit: 20,
    status: 'unread',
    type: 'class',
    sort: 'desc'
  }
});

// Deletar notificação
await api.delete(`/api/notifications/${notificationId}`);

// Limpar todas as lidas
await api.delete('/api/notifications/clear-all');
```

---

## 📊 **Performance e Índices**

### **Índices MongoDB Criados:**
```javascript
// Para performance otimizada
{ userId: 1, createdAt: -1 }           // Listagem por usuário
{ userId: 1, isRead: 1, createdAt: -1 } // Filtro por status
{ userId: 1, type: 1, createdAt: -1 }   // Filtro por tipo
```

### **Limitações:**
- Máximo 100 notificações por página
- Notificações antigas (30+ dias, lidas) são removidas automaticamente
- Rate limiting aplicado (100 requests/15min)

---

## 🎯 **Status da Implementação**

### ✅ **Funcionalidades Completas:**
- [x] 8 rotas de notificações implementadas
- [x] Sistema de filtros (status, tipo, ordenação)
- [x] Paginação completa
- [x] NotificationService com 10+ métodos
- [x] Jobs automáticos (cron)
- [x] Integração com sistema de emails
- [x] Testes automatizados
- [x] Performance otimizada

### ✅ **Compatibilidade Frontend:**
- [x] NotificationBell component suportado
- [x] Página de notificações suportada
- [x] Filtros e ordenação
- [x] Contador de badge
- [x] Marcar como lida individual/todas
- [x] Excluir individual/limpeza geral

**🎊 Sistema de notificações 100% implementado e testado!** 🚀
