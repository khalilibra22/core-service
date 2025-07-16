# Use official Node.js LTS (Long Term Support) image as the base image
FROM node:alpine3.18

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy .env file
COPY .env ./

# Copy only the obfuscated JavaScript code
COPY dist-obfuscated ./dist-obfuscated

EXPOSE 5001

CMD ["node", "dist-obfuscated/index.js"]
