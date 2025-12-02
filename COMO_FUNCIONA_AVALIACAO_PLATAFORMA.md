# 📝 Como Funciona a Avaliação da Plataforma

## 🎯 Resumo Executivo

Sistema completo de avaliação da plataforma Swaply que:
- ✅ Envia email automático após cadastro
- ✅ Cria notificação in-app
- ✅ Permite usuário enviar feedback detalhado
- ✅ Armazena avaliações no banco de dados
- ✅ Gera estatísticas agregadas

---

## 🔄 Fluxo Completo

```
1. USUÁRIO SE CADASTRA
   ↓
2. Sistema cria conta no banco
   ↓
3. Sistema envia 2 emails:
   - Email de boas-vindas
   - Email pedindo avaliação ⭐
   ↓
4. Sistema cria notificação in-app
   ↓
5. USUÁRIO RECEBE EMAIL/NOTIFICAÇÃO
   ↓
6. Usuário clica no link
   ↓
7. Frontend abre página /feedback/plataforma
   ↓
8. Usuário preenche formulário:
   - Avaliação geral (1-5 estrelas)
   - Categorias (usabilidade, design, performance, suporte)
   - Comentário (opcional)
   - Sugestões (opcional)
   - Se recomendaria (sim/não)
   ↓
9. Frontend envia para API: POST /api/feedback/platform
   ↓
10. Backend salva no banco (modelo PlatformFeedback)
   ↓
11. Usuário recebe confirmação
```

---

## 📧 Email de Solicitação

### **Quando é enviado?**
- **Imediatamente após** o cadastro do usuário

### **O que contém?**
- **Assunto:** "Como está sendo sua experiência no Swaply? 💬"
- **Mensagem:** Personalizada com nome do usuário
- **Botão:** Link para `/feedback/plataforma`
- **Template:** Design responsivo com gradiente roxo

### **Configuração de URL**
- **Padrão:** `${FRONTEND_URL}/feedback/plataforma`
- **Customizável:** Variável `PLATFORM_REVIEW_URL` (opcional)

### **Características**
- ✅ **Não bloqueante:** Se falhar, não impede o cadastro
- ✅ **Personalizado:** Usa nome do usuário
- ✅ **Template profissional:** Design responsivo

---

## 🔔 Notificação In-App

Além do email, o sistema também cria uma notificação in-app:

- **Título:** "Avalie a plataforma"
- **Mensagem:** "Conte para nós como está sendo sua experiência com o Swaply."
- **URL:** `/feedback/plataforma`
- **Action:** `open_platform_review` (para frontend processar)

---

## 📋 Formulário de Avaliação

### **Campos Obrigatórios**
- ✅ **Avaliação geral:** 1 a 5 estrelas

### **Campos Opcionais**
- 📝 **Categorias específicas:**
  - Usabilidade (0-5)
  - Design (0-5)
  - Performance (0-5)
  - Suporte (0-5)
- 💬 **Comentário:** Até 2000 caracteres
- 💡 **Sugestões:** Até 2000 caracteres
- 👍 **Recomendaria:** Sim/Não

---

## 🔌 API Endpoints

### **1. Criar Feedback**
```http
POST /api/feedback/platform
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "categories": {
    "usability": 5,
    "design": 4,
    "performance": 5,
    "support": 4
  },
  "comment": "Excelente plataforma!",
  "suggestions": "Poderia ter mais cursos",
  "wouldRecommend": true
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Feedback enviado com sucesso. Obrigado pela sua avaliação!",
  "data": {
    "_id": "...",
    "userId": "...",
    "rating": 5,
    "categories": {...},
    "comment": "...",
    "status": "pending",
    "createdAt": "..."
  }
}
```

### **2. Obter Meu Feedback**
```http
GET /api/feedback/platform
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Feedback obtido com sucesso",
  "data": {
    "_id": "...",
    "rating": 5,
    ...
  }
}
```

### **3. Obter Estatísticas (Admin)**
```http
GET /api/feedback/stats
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "totalFeedback": 150,
    "averageRating": 4.5,
    "averageUsability": 4.2,
    "averageDesign": 4.3,
    "averagePerformance": 4.4,
    "averageSupport": 4.1,
    "wouldRecommendCount": 130,
    "wouldRecommendPercentage": 87,
    "ratingDistribution": {
      "1": 5,
      "2": 10,
      "3": 20,
      "4": 50,
      "5": 65
    }
  }
}
```

---

## 💾 Banco de Dados

### **Modelo: PlatformFeedback**

**Campos:**
- `userId` (ObjectId) - Referência ao usuário
- `rating` (Number 1-5) - Avaliação geral
- `categories` (Object):
  - `usability` (0-5)
  - `design` (0-5)
  - `performance` (0-5)
  - `support` (0-5)
- `comment` (String, max 2000) - Comentário livre
- `suggestions` (String, max 2000) - Sugestões
- `wouldRecommend` (Boolean) - Se recomendaria
- `status` (String: 'pending', 'reviewed', 'archived')
- `createdAt`, `updatedAt` - Timestamps

**Índices:**
- `userId + createdAt` (composto)
- `rating`
- `status`
- `createdAt`

---

## 📁 Arquivos Envolvidos

### **Backend**

1. **`src/controllers/authController.js`**
   - Dispara email após cadastro (linha 53)
   - Cria notificação in-app (linha 60)

2. **`src/services/emailService.js`**
   - Função `sendPlatformReviewEmail()` (linha 787)
   - Template `platformReviewRequest` (linha 608)

3. **`src/models/PlatformFeedback.js`**
   - Modelo MongoDB para armazenar avaliações
   - Método `getStats()` para estatísticas

4. **`src/controllers/feedbackController.js`**
   - `createPlatformFeedback()` - Criar avaliação
   - `getUserFeedback()` - Obter avaliação do usuário
   - `getFeedbackStats()` - Estatísticas agregadas

5. **`src/routes/feedback.js`**
   - Rotas da API protegidas por autenticação

---

## ⚙️ Configurações

### **Variáveis de Ambiente**

```env
# URL padrão do frontend (obrigatório)
FRONTEND_URL=http://localhost:5173

# URL customizada para avaliação (opcional)
PLATFORM_REVIEW_URL=https://forms.google.com/swaply-review
```

### **Validações**

- Rating: obrigatório, entre 1 e 5
- Categorias: opcionais, entre 0 e 5
- Comentário: opcional, máximo 2000 caracteres
- Sugestões: opcional, máximo 2000 caracteres

---

## 🔍 Limitações Atuais

1. **Timing:** Email enviado logo após cadastro (usuário pode não ter experiência ainda)
2. **Múltiplos feedbacks:** Sistema permite múltiplos feedbacks por usuário (código comentado para limitar)
3. **Erro silencioso:** Falhas no envio de email não são logadas
4. **Sem agendamento:** Email enviado síncronamente (pode atrasar resposta)

---

## ✅ Checklist de Funcionalidades

- [x] Email automático após cadastro
- [x] Notificação in-app
- [x] Formulário de avaliação completo
- [x] Endpoint para criar feedback
- [x] Endpoint para obter feedback do usuário
- [x] Endpoint para estatísticas (admin)
- [x] Validações de dados
- [x] Armazenamento no banco
- [x] Estatísticas agregadas

---

## 🧪 Como Testar

### **1. Testar Cadastro Completo**
```bash
# Criar usuário
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "password": "senha123",
    "confirmPassword": "senha123"
  }'
```

**Verificar:**
- ✅ Email recebido
- ✅ Notificação criada
- ✅ Link funcional

### **2. Testar Envio de Feedback**
```bash
# Enviar avaliação
curl -X POST http://localhost:5000/api/feedback/platform \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "categories": {
      "usability": 5,
      "design": 4
    },
    "comment": "Excelente!",
    "wouldRecommend": true
  }'
```

### **3. Testar Estatísticas**
```bash
# Obter estatísticas
curl -X GET http://localhost:5000/api/feedback/stats \
  -H "Authorization: Bearer {token}"
```

---

## 🎯 Respostas para Dúvidas Comuns

### **P: Quando o email é enviado?**
R: Imediatamente após o cadastro do usuário.

### **P: O que acontece se o email falhar?**
R: O cadastro continua normalmente. O erro é silencioso e não bloqueia o processo.

### **P: O usuário pode enviar múltiplos feedbacks?**
R: Sim, atualmente permite. Para limitar, descomentar código em `feedbackController.js` (linha 30).

### **P: Onde ficam armazenadas as avaliações?**
R: No banco de dados MongoDB, na coleção `platformfeedbacks`.

### **P: Como vejo as estatísticas?**
R: Chamando `GET /api/feedback/stats` (pode adicionar middleware de admin).

### **P: O link do email pode ser customizado?**
R: Sim, usando a variável de ambiente `PLATFORM_REVIEW_URL`.

---

## 📊 Exemplo de Dados

### **Feedback Completo**
```json
{
  "rating": 5,
  "categories": {
    "usability": 5,
    "design": 4,
    "performance": 5,
    "support": 4
  },
  "comment": "Plataforma muito intuitiva e fácil de usar!",
  "suggestions": "Seria interessante ter mais filtros na busca",
  "wouldRecommend": true
}
```

### **Estatísticas Geradas**
```json
{
  "totalFeedback": 150,
  "averageRating": 4.5,
  "wouldRecommendPercentage": 87,
  "ratingDistribution": {
    "1": 5,
    "2": 10,
    "3": 20,
    "4": 50,
    "5": 65
  }
}
```

---

## 🚀 Status

✅ **Sistema completo e funcional**

Todos os componentes estão implementados e funcionando:
- Email automático ✅
- Notificação in-app ✅
- API endpoints ✅
- Armazenamento no banco ✅
- Estatísticas ✅

