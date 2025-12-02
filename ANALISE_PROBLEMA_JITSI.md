# Análise do Problema: Jitsi não está funcionando

## Problemas Identificados

### 1. ❌ **Formato Incorreto da URL do Jitsi**

**Localização**: `src/services/jitsiService.js` linha 165

**Problema Atual**:
```javascript
buildMeetingUrl(roomName, token) {
  return `https://${this.baseUrl}/${this.appId}/${roomName}?jwt=${token}`;
}
```

**URL gerada**: `https://8x8.vc/vpaas-magic-cookie-.../swaply-...?jwt=...`

**Problema**: Para Jitsi JaaS (8x8.vc), o formato correto da URL **NÃO inclui o appId** no caminho. O appId é usado apenas para autenticação via JWT.

**Formato Correto**: `https://8x8.vc/{roomName}?jwt={token}`

---

### 2. ❌ **Bug no Cálculo de Expiração do Token JWT**

**Localização**: `src/services/jitsiService.js` linha 42

**Problema Atual**:
```javascript
const now = new Date();
const exp = Math.round(now.setHours(now.getHours() + 3) / 1000);
```

**Problema**: 
- `setHours()` modifica o objeto `now` e retorna um timestamp em milissegundos
- Mas o cálculo pode estar incorreto se houver mudança de dia/hora
- Deveria criar uma nova data para evitar efeitos colaterais

**Correção Sugerida**:
```javascript
const now = new Date();
const exp = Math.round((now.getTime() + (3 * 60 * 60 * 1000)) / 1000); // 3 horas em segundos
```

---

### 3. ⚠️ **Chave Privada de Exemplo em Uso**

**Localização**: `src/services/jitsiService.js` linhas 30-34

**Problema**: O código está usando uma chave privada de exemplo que **não funcionará** em produção. Isso fará com que os tokens JWT sejam rejeitados pelo Jitsi.

**Solução**: Configurar a variável de ambiente `JITSI_PRIVATE_KEY` com a chave privada real do Jitsi JaaS.

---

### 4. ⚠️ **Validação de Configuração Pode Não Detectar Problemas**

**Localização**: `src/services/jitsiService.js` linha 209

**Problema**: A validação verifica se a chave contém o texto da chave de exemplo, mas pode não detectar outros problemas de configuração.

---

### 5. ⚠️ **Formato do Payload JWT**

**Localização**: `src/services/jitsiService.js` linhas 45-67

**Verificação Necessária**: 
- O campo `iss: 'chat'` pode precisar ser ajustado dependendo da configuração do Jitsi JaaS
- O campo `sub` deve conter o `appId` completo (incluindo a parte após a barra)
- O campo `kid` no header deve corresponder ao `apiKey` completo

---

## Correções Aplicadas ✅

### ✅ **1. Formato da URL Corrigido**

**Antes**:
```javascript
buildMeetingUrl(roomName, token) {
  return `https://${this.baseUrl}/${this.appId}/${roomName}?jwt=${token}`;
}
```

**Depois**:
```javascript
buildMeetingUrl(roomName, token) {
  return `https://${this.baseUrl}/${roomName}?jwt=${token}`;
}
```

**Resultado**: A URL agora está no formato correto para Jitsi JaaS: `https://8x8.vc/{roomName}?jwt={token}`

---

### ✅ **2. Cálculo de Expiração do Token Corrigido**

**Antes**:
```javascript
const now = new Date();
const exp = Math.round(now.setHours(now.getHours() + 3) / 1000);
```

**Depois**:
```javascript
const now = new Date();
const exp = Math.round((now.getTime() + (3 * 60 * 60 * 1000)) / 1000);
```

**Resultado**: Cálculo mais seguro e preciso da expiração do token

---

### ✅ **3. Validação de Configuração Melhorada**

- Agora detecta valores de exemplo nas variáveis de ambiente
- Verifica formato da chave privada
- Adiciona avisos para configurações suspeitas
- Valida formato do appId e apiKey

---

### ✅ **4. Logs Detalhados Adicionados**

- Logs de sucesso ao gerar tokens (apenas em desenvolvimento)
- Logs de erro com mais detalhes
- Logs ao criar salas Jitsi
- Informações sobre configuração nos erros

---

## Ações Necessárias do Usuário

### 🔴 **CRÍTICO - Configurar Variáveis de Ambiente**

Para que o Jitsi funcione, você **DEVE** configurar as seguintes variáveis de ambiente:

```bash
JITSI_APP_ID=seu-app-id-aqui
JITSI_API_KEY=seu-app-id/seu-key-id
JITSI_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

**Onde obter**:
1. Acesse o [Jitsi JaaS Dashboard](https://jaas.8x8.vc/)
2. Crie uma conta ou faça login
3. Crie uma nova aplicação
4. Copie o `App ID` e `API Key`
5. Baixe a chave privada (arquivo `.pem`)

**Importante**: 
- A chave privada deve incluir as quebras de linha (`\n`)
- Em produção, use variáveis de ambiente, nunca hardcode
- A chave de exemplo **NÃO funcionará** em produção

---

## Como Testar

1. **Verificar configuração**:
   ```bash
   # Verificar se as variáveis estão configuradas
   echo $JITSI_APP_ID
   echo $JITSI_API_KEY
   echo $JITSI_PRIVATE_KEY
   ```

2. **Testar criação de sala**:
   - Agendar uma aula
   - Verificar se a URL gerada está no formato correto
   - Tentar acessar a URL no navegador

3. **Verificar logs**:
   - Procurar por erros relacionados a JWT
   - Verificar se os tokens estão sendo gerados corretamente

---

## Referências

- [Jitsi JaaS Documentation](https://jaas.8x8.vc/)
- [Jitsi JWT Token Format](https://jaas.8x8.vc/docs/jaasjwt)

