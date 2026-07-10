# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json
COPY server/package.json ./

# Install dependencies
RUN npm install

# Copy server code
COPY server/ ./

# Expose ports
EXPOSE 3000 3001

# Start both servers (this is for demo, in production use separate containers)
CMD ["node", "server1.js"]
