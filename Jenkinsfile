pipeline {
    agent any

    options {
        // Mantém o histórico de builds mais limpo
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timestamps()
    }

    triggers {
        // Executa a pipeline a cada hora, no minuto 0
        cron('0 * * * *')
    }

    environment {
        // Ajuste se necessário no Jenkins
        NODE_ENV = 'test'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Instalar dependências') {
            steps {
                script {
                    // Usa npm ci se o package-lock.json existir, senão npm install
                    if (fileExists('package-lock.json')) {
                        bat 'npm ci'
                    } else {
                        bat 'npm install'
                    }
                }
            }
        }

        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }

        stage('Testes') {
            steps {
                bat 'npm test'
            }
        }

        stage('Build') {
            steps {
                // Atualmente o script de build apenas exibe uma mensagem (ver package.json)
                bat 'npm run build'
            }
        }
    }

    post {
        success {
            echo 'Pipeline concluída com sucesso.'
        }
        failure {
            echo 'Pipeline falhou. Verifique os logs dos stages.'
        }
        always {
            echo "Build finalizado com status: ${currentBuild.currentResult}"
        }
    }
}


