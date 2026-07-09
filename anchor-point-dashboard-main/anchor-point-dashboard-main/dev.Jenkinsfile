pipeline {
    agent any
    parameters {
        string(name: 'BRANCH_TO_BUILD', defaultValue: 'dev', description: 'Git branch to checkout')
    }
    stages {
        stage('Checkout Code') {
            steps {
                echo "Checking out code from branch: ${params.BRANCH}"
                checkout scmGit(
                    branches: [[name: "*/${params.BRANCH_TO_BUILD}"]],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: 'github-key',
                        url: 'git@github.com:AnchorPointHopitality/anchor-point-dashboard.git'
                    ]]
                )
            }
        }
        stage('Start Containers with Docker Compose') {
            steps {
                script {
                    echo 'Bringing up containers with Docker Compose...'
                    sh "docker system prune -f"
                    sh "docker-compose up -d --build anchorpoint-frontend"
                }
            }
        }
    }
    post {
        failure {
            echo 'Build failed! Please check the logs for errors.'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
    }
}