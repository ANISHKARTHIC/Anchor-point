pipeline {
    agent any
    
    environment {
        AWS_REGION = credentials('aws-region')
        ECR_REPO = credentials('ecr-backend-repo-name')
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        URL_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    }
    
    stages {
        stage('SCM Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: 'github-key',
                        url: 'git@github.com:AnchorPointHopitality/anchor-point-backend.git'
                    ]]
                ])
            }
        }
        
        stage('Build and Push Docker Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'ecr-creds', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                        // Authenticating ECR
                       sh """
                            aws ecr get-login-password --region ${AWS_REGION} | \
                            docker login --username AWS --password-stdin ${URL_REGISTRY}
                        """
 
 
                        // Build Docker image
                        sh "docker-compose -f deployment/prod-docker-compose.yml build"
 
                        // Push Docker image to ECR
                        sh "docker push ${URL_REGISTRY}/${ECR_REPO}:latest"
                        
                        //cleanup the unused images
                        sh "docker rmi ${URL_REGISTRY}/${ECR_REPO}:latest"
                    }
                }
            }
        }
    }
    post {
        success {
            echo "Docker image successfully pushed to ECR"
        }
        failure {
            echo "Pipeline failed. Please check the logs for errors."
        }
    }
}