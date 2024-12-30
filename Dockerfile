# Stage 1: Build the application
FROM node:22 AS builder

WORKDIR /app

# Instalar pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar arquivos de configuração necessários para instalação das dependências
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar dependências de desenvolvimento
RUN pnpm install

# Copiar o restante do código-fonte
COPY . .

# Construir a aplicação
RUN pnpm build

# Stage 2: Create production image
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm globalmente no contêiner final
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copiar apenas os arquivos necessários da etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Instalar apenas as dependências de produção
RUN pnpm install --prod

# Expor a porta da aplicação
EXPOSE 3333

# Comando para iniciar a aplicação
CMD ["node", "dist/src/main"]
