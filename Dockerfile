# ---- Development stage ----
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Build the app (Vite reads .env automatically)
RUN npm run build

# Expose Vite dev server port
EXPOSE 8081

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8081"]