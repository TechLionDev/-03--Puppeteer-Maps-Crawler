# Use the official Playwright image as the base image
FROM mcr.microsoft.com/playwright

# Set the working directory
WORKDIR /app

# Copy the project files into the container
COPY . .

# Install project dependencies using Yarn
RUN yarn install

# Install Playwright browser binaries
RUN npx playwright install

# Specify the command to run your script with xvfb-run
CMD ["node", "test.js"]
