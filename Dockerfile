# Use a lightweight Node image
FROM node:22-slim

# Install ffmpeg and yt-dlp dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Run the app
CMD ["node", "src/index.js"]
