# Use an official Node.js runtime as the base image
FROM node:18
# Set the working directory in the container
WORKDIR /anchor-point-dashboard
# Copy the package.json and package-lock.json files
COPY /var/lib/jenkins/workspace/Anchorpoint-Development/Frontend/package*.json ./
# Install the dependencies
RUN npm install
# Copy the entire project to the container
COPY /var/lib/jenkins/workspace/Anchorpoint-Development/Frontend .
# Build the React application
# Copy env file to container
COPY /home/ubuntu/anchorpoint_secrets/dev/anchorpoint-frontend/dev.env .env
RUN npm run build
# Expose the port that the application will run on
EXPOSE 3000
# Define the command to start the application
CMD [ "npm", "run", "preview" ]