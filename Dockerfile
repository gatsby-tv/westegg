FROM node:12.18.3

# Create app directory
WORKDIR /usr/src/app

# Copy over package files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Build app source
RUN npm run build

EXPOSE 3001

# Run the server
CMD ["node", "dist"]
