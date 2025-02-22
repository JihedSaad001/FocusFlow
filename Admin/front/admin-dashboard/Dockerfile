# Use Node.js as the base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the frontend
RUN npm run build

# Install a lightweight web server
RUN npm install -g serve

# Expose the frontend port (change if needed)
EXPOSE 3001

# Start the frontend
CMD ["serve", "-s", "dist"]
