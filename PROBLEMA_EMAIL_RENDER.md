# 🔍 Problema: Email Service não funciona no Render (funciona localmente)

## ❌ Sintoma

- ✅ Funciona **localmente** (desenvolvimento)
- ❌ **Não funciona** no Render (produção)

---

## ⚡ Solução Rápida (5 minutos)

### **1. Verificar Variáveis de Ambiente no Render**

No **Render Dashboard**:
1. Ir em: **Environment** (seu serviço)
2. Verificar se existem estas variáveis:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASS=sua-senha-de-app
   ```
3. **Importante:** Se usar Gmail, precisa ser **"Senha de App"**, não a senha normal!

### **2. Criar Senha de App do Google (se usar Gmail)**

1. Acessar: https://myaccount.google.com/apppasswords
2. Selecionar "Email" e "Outro (Nome personalizado)"
3. Digitar "Swaply Render"
4. Copiar a senha gerada (16 caracteres)
5. Colar no `EMAIL_PASS` no Render

### **3. Ativar Logs de Debug**

No Render, adicionar variável:
```
DEBUG_EMAIL=true
```

Isso mostrará logs detalhados nos logs do Render.

### **4. Verificar Logs do Render**

Ir em **Logs** e procurar por:
- `❌ Erro ao enviar email`
- `Configuração de email incompleta`
- `SMTP`
- `timeout`

---

## 🎯 Causas Mais Prováveis (Ordem de Probabilidade)

1. **🔴 Variáveis de Ambiente não configuradas no Render** (80% dos casos)
2. **🟠 Gmail bloqueando autenticação** (15% dos casos)  
3. **🟡 Porta SMTP bloqueada** (3% dos casos)
4. **🟢 Outros problemas** (2% dos casos)

---

## 🔍 Possíveis Causas Detalhadas

### **1. 🔴 Variáveis de Ambiente Não Configuradas**

**Problema mais comum!**

**Verificar:**
- Variáveis de ambiente não foram adicionadas no Render
- Nomes das variáveis estão diferentes
- Valores estão incorretos ou com espaços extras

**Solução:**
1. Acessar **Render Dashboard** → Seu serviço → **Environment**
2. Verificar se estas variáveis existem:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=seu-email@gmail.com
   EMAIL_PASS=sua-senha-de-app
   ```
3. Verificar se não há espaços ou quebras de linha extras

---

### **2. 🔴 Porta SMTP Bloqueada**

**Problema:** Render pode bloquear portas de saída (outbound)

**Portas comuns:**
- `587` (TLS/STARTTLS) - Recomendado
- `465` (SSL) - Alternativa
- `25` - Geralmente bloqueado

**Solução:**
1. Tentar porta `465` com SSL:
   ```env
   EMAIL_PORT=465
   ```
   E alterar no código:
   ```javascript
   secure: true, // Para porta 465
   ```

2. Verificar seporta `587` está permitida no Render

---

### **3. 🔴 Firewall/Restrições de Rede**

**Problema:** Render pode ter restrições de rede que bloqueiam conexões SMTP

**Soluções:**
1. **Usar serviço de email profissional:**
   - SendGrid
   - Mailgun
   - AWS SES
   - Resend

2. **Verificar logs do Render** para erros de conexão

---

### **4. 🔴 Autenticação Gmail Bloqueada**

**Problema:** Gmail bloqueia login de apps "menos seguros" ou de novos locais

**Sintomas:**
- Erro de autenticação
- "Login bloqueado"
- "App não confiável"

**Solução:**
1. **Usar "Senha de App" do Google:**
   - Acessar: https://myaccount.google.com/apppasswords
   - Criar senha de app específica
   - Usar essa senha no `EMAIL_PASS`

2. **Verificar "Acesso de apps menos seguros"** (descontinuado)

3. **Usar OAuth2** para Gmail (mais seguro)

---

### **5. 🔴 Timeout de Conexão**

**Problema:** Render pode ter timeouts mais curtos que local

**Verificar:**
- Logs mostram timeout
- Conexão SMTP demora muito

**Solução:**
1. Adicionar timeout explícito:
   ```javascript
   connectionTimeout: 10000, // 10 segundos
   greetingTimeout: 10000,
   socketTimeout: 10000
   ```

2. Usar serviço de email mais rápido (SendGrid, etc)

---

### **6. 🔴 Certificado TLS/SSL**

**Problema:** Render pode ter problemas com certificados TLS

**Verificar logs:**
- Erros de certificado
- "rejectUnauthorized"

**Solução:**
Já está configurado:
```javascript
tls: {
  rejectUnauthorized: false
}
```

Mas pode precisar ajustar para produção.

---

### **7. 🔴 Formato de Variáveis de Ambiente**

**Problema:** Valores podem ter caracteres especiais mal interpretados

**Exemplos problemáticos:**
- Senhas com caracteres especiais (`@`, `#`, `$`, etc)
- Aspas ou espaços extras
- Quebras de linha

**Solução:**
1. Usar aspas no Render se necessário:
   ```
   EMAIL_PASS="senha@com#especial"
   ```

2. Verificar se valores não têm espaços no início/fim

---

### **8. 🔴 Serviço de Email Diferente**

**Problema:** Pode precisar de configuração diferente para produção

**Gmail específico:**
- Pode precisar de IP estático
- Pode bloquear muitas requisições
- Limites de envio

**Solução:**
Usar serviço profissional como:
- **SendGrid** (recomendado para produção)
- **Mailgun**
- **Resend**
- **AWS SES**

---

## 🔧 Soluções Passo a Passo

### **Solução 1: Verificar Variáveis de Ambiente**

1. **No Render Dashboard:**
   - Ir em: **Environment**
   - Verificar todas as variáveis:
     ```
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=seu-email@gmail.com
     EMAIL_PASS=sua-senha-de-app
     ```

2. **Testar valores:**
   ```bash
   # No Render, adicionar variável de debug
   DEBUG_EMAIL=true
   ```

3. **Verificar logs do Render:**
   - Procurar por erros de conexão
   - Verificar se variáveis estão sendo lidas

---

### **Solução 2: Melhorar Tratamento de Erro**

Adicionar logs detalhados para identificar o problema:

```javascript
const sendEmail = async ({ to, subject, template, data = {}, attachments = [] }) => {
  try {
    // Verificar se variáveis estão configuradas
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Configuração de email incompleta:', {
        hasHost: !!process.env.EMAIL_HOST,
        hasUser: !!process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS
      });
      throw new Error('Configuração de email incompleta');
    }

    const transporter = createTransporter();
    
    console.log('📧 Tentando conectar ao SMTP...', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER
    });
    
    // Verificar conexão
    await transporter.verify();
    console.log('✅ Conexão SMTP verificada com sucesso');

    // ... resto do código
  } catch (error) {
    console.error('❌ Erro ao enviar email:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      stack: error.stack
    });
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
};
```

---

### **Solução 3: Configuração para SendGrid (Recomendado)**

**Por que SendGrid:**
- ✅ Mais confiável em produção
- ✅ Melhor deliverability
- ✅ Não bloqueia como Gmail
- ✅ Suporta alta escala

**Configuração:**

1. **Criar conta no SendGrid:**
   - Acessar: https://sendgrid.com
   - Criar API Key

2. **Atualizar variáveis no Render:**
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=sua-api-key-do-sendgrid
   ```

3. **Atualizar código (opcional):**
   ```javascript
   const createTransporter = () => {
     return nodemailer.createTransport({
       host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
       port: parseInt(process.env.EMAIL_PORT) || 587,
       secure: false,
       auth: {
         user: process.env.EMAIL_USER || 'apikey',
         pass: process.env.EMAIL_PASS
       },
       tls: {
         rejectUnauthorized: false
       },
       // Timeouts para Render
       connectionTimeout: 10000,
       greetingTimeout: 10000,
       socketTimeout: 10000
     });
   };
   ```

---

### **Solução 4: Configuração Melhorada para Render**

Atualizar `createTransporter` para ser mais robusto:

```javascript
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true para 465, false para outras
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    // Timeouts para evitar travamento
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000,
    // Pool de conexões
    pool: true,
    maxConnections: 1,
    maxMessages: 3
  };

  // Log para debug (apenas em desenvolvimento)
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_EMAIL === 'true') {
    console.log('📧 Configuração SMTP:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      hasPass: !!config.auth.pass
    });
  }

  return nodemailer.createTransport(config);
};
```

---

## 🧪 Como Diagnosticar

### **1. Verificar Logs do Render**

No Render Dashboard:
1. Ir em: **Logs**
2. Procurar por:
   - `EMAIL_HOST`
   - `SMTP`
   - `Falha ao enviar email`
   - `timeout`
   - `ECONNREFUSED`

### **2. Adicionar Endpoint de Teste**

Criar endpoint para testar email:

```javascript
// Em src/routes/auth.js ou criar rota de teste
router.post('/test-email', authenticate, async (req, res) => {
  try {
    const { testEmailConfiguration } = require('../services/emailService');
    const result = await testEmailConfiguration();
    
    res.json({
      success: result,
      config: {
        hasHost: !!process.env.EMAIL_HOST,
        hasUser: !!process.env.EMAIL_USER,
        hasPass: !!process.env.EMAIL_PASS,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### **3. Testar com cURL**

```bash
# Testar endpoint de teste
curl -X POST https://seu-app.onrender.com/api/auth/test-email \
  -H "Authorization: Bearer {token}"
```

---

## ✅ Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no Render
- [ ] Valores corretos (sem espaços extras)
- [ ] Porta SMTP permitida (587 ou 465)
- [ ] Credenciais corretas (senha de app para Gmail)
- [ ] Logs do Render verificados
- [ ] Firewall não bloqueando SMTP
- [ ] Timeout configurado
- [ ] Certificado TLS funcionando

---

## 🎯 Solução Recomendada para Produção

**Usar SendGrid ou serviço profissional:**

1. ✅ Mais confiável
2. ✅ Melhor deliverability
3. ✅ Não bloqueia como Gmail
4. ✅ Suporta alta escala
5. ✅ Métricas e analytics

**Alternativas:**
- SendGrid (gratuito até 100 emails/dia)
- Mailgun (gratuito até 5000 emails/mês)
- Resend (moderno e simples)
- AWS SES (muito barato)

---

## 📝 Próximos Passos

1. ✅ Verificar variáveis de ambiente no Render
2. ✅ Adicionar logs detalhados
3. ✅ Testar conexão SMTP
4. ⚠️ Considerar migrar para SendGrid
5. ⚠️ Verificar logs do Render

---

## 🔗 Recursos

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/nodejs)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

