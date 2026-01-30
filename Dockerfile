# Use Node.js 18 LTS
FROM node:18-alpine

# Install Python for code execution
RUN apk add --no-cache python3 py3-pip

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install && npm run build

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