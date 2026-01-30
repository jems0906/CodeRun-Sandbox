# Use Node.js 18 LTS
FROM node:18-alpine

# Install Python for code execution
RUN apk add --no-cache python3

# Create app directory
WORKDIR /app

# Copy root package.json and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy server package.json and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy client package.json and install dependencies, then build
COPY client/package*.json ./client/
RUN cd client && npm install --production=false && npm run build

# Copy source code
COPY . .

# Create temp directory for code execution
RUN mkdir -p temp

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
CMD ["npm", "start"]