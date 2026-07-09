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
                        url: 'git@github.com:AnchorPointHopitality/anchor-point-backend.git'
                    ]]
                )
            }
        }
        stage('Start Containers with Docker Compose') {
            steps {
                script {
                    echo 'Bringing up containers with Docker Compose...'
                    sh "docker-compose -f deployment/dev-docker-compose.yml up -d --build"
                    sh "docker image prune -a -f"
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