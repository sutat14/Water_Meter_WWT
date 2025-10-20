# Use Node.js official image
FROM node:22

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the backend files
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the Express server
CMD ["node", "server.js"]
