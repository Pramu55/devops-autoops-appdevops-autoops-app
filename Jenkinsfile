pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    IMAGE_NAME = 'devops-app'
    IMAGE_TAG = "${BUILD_NUMBER}"
    HELM_RELEASE = 'devops-release'
    HELM_CHART = 'helm/devops-chart'
    K8S_SERVICE_NAME = 'devops-release-devops-chart'
    SMOKE_TEST_PORT = '18080'
    GITHUB_REPO = 'github.com/Pramu55/devops-autoops-app.git'
  }

  stages {

    stage('Clone Repo') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          if command -v node >/dev/null 2>&1; then
            node --version
            npm --version
            npm ci
          else
            echo "Node.js not found, skipping install"
          fi
        '''
      }
    }

    stage('Run Tests') {
      steps {
        sh '''
          if command -v npm >/dev/null 2>&1; then
            npm test || true
          else
            echo "Skipping tests (Node not available)"
          fi
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build -t ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG} .
        '''
      }
    }

    stage('Login to Docker Hub') {
      steps {
        sh '''
          echo "${DOCKERHUB_CREDS_PSW}" | docker login -u "${DOCKERHUB_CREDS_USR}" --password-stdin
        '''
      }
    }

    stage('Push Image') {
      steps {
        sh '''
          docker push ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG}
        '''
      }
    }

    stage('Update Helm Values') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USERNAME', passwordVariable: 'GIT_TOKEN')]) {
          sh '''
            set -e

            sed -i "s|repository: .*|repository: ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}|" ${HELM_CHART}/values.yaml
            sed -i "s|tag: .*|tag: '${IMAGE_TAG}'|" ${HELM_CHART}/values.yaml

            git config user.name "jenkins"
            git config user.email "jenkins@local"

            git add ${HELM_CHART}/values.yaml
            git commit -m "Update image tag to ${IMAGE_TAG} [skip ci]" || echo "No changes"

            git push https://${GIT_USERNAME}:${GIT_TOKEN}@${GITHUB_REPO} HEAD:main
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh '''
          helm upgrade --install ${HELM_RELEASE} ${HELM_CHART} \
            --set image.repository=${DOCKERHUB_CREDS_USR}/${IMAGE_NAME} \
            --set image.tag=${IMAGE_TAG} \
            --wait
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          kubectl port-forward svc/${K8S_SERVICE_NAME} ${SMOKE_TEST_PORT}:3000 > port-forward.log 2>&1 &
          PF_PID=$!
          sleep 8

          curl -f http://127.0.0.1:${SMOKE_TEST_PORT}/health || exit 1

          kill ${PF_PID} || true
        '''
      }
    }
  }

  post {
    always {
      sh '''
        docker logout || true
        rm -f port-forward.log || true
      '''
    }

    failure {
      sh '''
        echo "Pipeline failed. Debug info:"
        kubectl get pods || true
      '''
    }
  }
}