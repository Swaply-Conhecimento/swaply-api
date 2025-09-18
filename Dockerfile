# Usar imagem oficial do Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Criar diretório para uploads
RUN mkdir -p uploads/temp

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S swaply -u 1001

# Alterar proprietário dos arquivos
RUN chown -R swaply:nodejs /app
USER swaply

# Expor porta
EXPOSE 5000

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Comando de inicialização
CMD ["node", "server.js"]
