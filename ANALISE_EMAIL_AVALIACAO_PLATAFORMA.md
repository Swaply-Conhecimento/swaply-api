# Análise: Lógica do Email de Avaliação da Plataforma

## 📧 Visão Geral

O sistema envia um email de solicitação de avaliação da plataforma automaticamente quando um novo usuário se cadastra.

---

## 🔄 Fluxo Completo

### 1. **Momento do Disparo**

O email é enviado durante o processo de registro do usuário:

```
Cadastro de Usuário → authController.register()
  ├─ Criar usuário no banco
  ├─ Enviar email de boas-vindas
  ├─ Enviar email de avaliação da plataforma ⭐
  └─ Criar notificação in-app
```

**Localização:** `src/controllers/authController.js` (linhas 50-71)

---

## 📝 Implementação

### **2. Função de Envio**

**Arquivo:** `src/services/emailService.js` (linhas 786-800)

```javascript
const sendPlatformReviewEmail = async (user) => {
  const platformReviewUrl =
    process.env.PLATFORM_REVIEW_URL ||
    `${process.env.FRONTEND_URL}/feedback/plataforma`;

  return await sendEmail({
    to: user.email,
    template: 'platformReviewRequest',
    data: {
      name: user.name,
      platformReviewUrl
    }
  });
};
```

**Características:**
- ✅ Recebe o objeto `user` completo
- ✅ Gera URL dinamicamente (pode usar variável de ambiente ou padrão)
- ✅ Usa template pré-definido `platformReviewRequest`
- ✅ Personaliza com nome do usuário

---

### **3. Template do Email**

**Arquivo:** `src/services/emailService.js` (linhas 607-646)

**Assunto:** `"Como está sendo sua experiência no Swaply? 💬"`

**Conteúdo:**
- Design responsivo com gradiente roxo
- Mensagem personalizada com nome do usuário
- Texto explicativo sobre a importância da avaliação
- Botão destacado para avaliar
- Link para: `/feedback/plataforma`

**Variáveis do Template:**
- `{{name}}` - Nome do usuário
- `{{platformReviewUrl}}` - URL para avaliação

---

### **4. Onde é Chamado**

**Arquivo:** `src/controllers/authController.js` (linhas 50-56)

```javascript
// Enviar email de boas-vindas e link para avaliação da plataforma
try {
  await sendAccountCreatedEmail(user);
  await sendPlatformReviewEmail(user);  // ⭐ AQUI
} catch (emailError) {
  // Não falha o registro se o email não funcionar
}
```

**Características Importantes:**
- ✅ Enviado logo após criação da conta
- ✅ Não bloqueia o registro se falhar (try/catch)
- ✅ Enviado junto com email de boas-vindas
- ✅ Falha silenciosa (não interrompe o fluxo)

---

### **5. Notificação In-App (Complementar)**

Além do email, também é criada uma notificação in-app:

**Arquivo:** `src/controllers/authController.js` (linhas 58-71)

```javascript
try {
  await NotificationService.createSystemNotification(
    user._id,
    'Avalie a plataforma',
    'Conte para nós como está sendo sua experiência com o Swaply.',
    {
      url: '/feedback/plataforma',
      action: 'open_platform_review'
    }
  );
} catch (notificationError) {
  // Notificação falhou, mas não deve impedir o cadastro
}
```

**Características:**
- ✅ Notificação do tipo `system`
- ✅ URL: `/feedback/plataforma`
- ✅ Action: `open_platform_review` (para o frontend processar)
- ✅ Também não bloqueia o cadastro se falhar

---

## 🔗 Configuração de URL

### **Variáveis de Ambiente**

1. **`PLATFORM_REVIEW_URL`** (opcional)
   - Se configurada, usa esta URL customizada
   - Exemplo: `https://forms.google.com/swaply-review`

2. **`FRONTEND_URL`** (padrão)
   - Se `PLATFORM_REVIEW_URL` não estiver configurada, usa:
   - `${FRONTEND_URL}/feedback/plataforma`
   - Exemplo: `http://localhost:5173/feedback/plataforma`

---

## 📊 Fluxo de Dados

```
1. Usuário se registra
   ↓
2. authController.register() cria usuário
   ↓
3. sendPlatformReviewEmail(user) é chamado
   ↓
4. EmailService monta email com template
   ↓
5. Email enviado para user.email
   ↓
6. Usuário clica no link
   ↓
7. Redireciona para /feedback/plataforma (frontend)
   ↓
8. Usuário preenche formulário
   ↓
9. Frontend envia para POST /api/feedback/platform
   ↓
10. Backend salva no modelo PlatformFeedback
```

---

## ✅ Pontos Positivos

1. **Não bloqueante**: Falha silenciosa, não impede cadastro
2. **Personalizado**: Usa nome do usuário no email
3. **Configurável**: URL pode ser customizada via variável de ambiente
4. **Dupla abordagem**: Email + Notificação in-app
5. **Template profissional**: Design responsivo e atrativo

---

## ⚠️ Pontos de Atenção

1. **Timing**: Enviado imediatamente após cadastro (usuário pode não ter experiência ainda)
   - **Sugestão**: Poderia ser enviado após alguns dias ou após primeira interação

2. **Sem controle de reenvio**: Não verifica se já enviou antes
   - **Sugestão**: Adicionar flag no usuário para evitar spam

3. **Erro silencioso**: Falhas não são logadas
   - **Sugestão**: Adicionar logging para monitorar taxa de envio

4. **Sem agendamento**: Enviado síncronamente (pode atrasar resposta)
   - **Sugestão**: Usar fila de jobs (Bull/Agenda) para envio assíncrono

---

## 🔧 Como Testar

### 1. **Teste Manual**

```bash
# Criar novo usuário via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuário",
    "email": "teste@example.com",
    "password": "senha123",
    "confirmPassword": "senha123"
  }'
```

**Verificar:**
- Email recebido em `teste@example.com`
- Assunto: "Como está sendo sua experiência no Swaply? 💬"
- Link funcional para `/feedback/plataforma`
- Notificação in-app criada

### 2. **Teste de Falha**

```javascript
// Simular falha no envio de email
// Email não deve bloquear o registro
```

### 3. **Verificar URL Customizada**

```bash
# Configurar variável de ambiente
PLATFORM_REVIEW_URL=https://forms.google.com/swaply-review
```

---

## 📁 Arquivos Envolvidos

1. **`src/controllers/authController.js`**
   - Chama a função de envio (linha 53)

2. **`src/services/emailService.js`**
   - Função `sendPlatformReviewEmail()` (linha 787)
   - Template `platformReviewRequest` (linha 608)

3. **`src/models/PlatformFeedback.js`**
   - Modelo que armazena a avaliação (quando usuário responde)

4. **`src/controllers/feedbackController.js`**
   - Endpoint que recebe a avaliação (`POST /api/feedback/platform`)

5. **`src/routes/feedback.js`**
   - Rota para receber feedback da plataforma

---

## 🎯 Resumo

**Quando:** Imediatamente após cadastro de novo usuário

**Onde:** `authController.register()` → `sendPlatformReviewEmail()`

**O que:** Email HTML com template profissional pedindo avaliação

**Para onde:** Link para `/feedback/plataforma` no frontend

**Como:** Não bloqueante, falha silenciosa, dupla abordagem (email + notificação)

**Status:** ✅ Funcional e implementado

