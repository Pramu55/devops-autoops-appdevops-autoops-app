pipeline {
  agent any

  options {
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    IMAGE_NAME      = 'devops-app'
    IMAGE_TAG       = "${BUILD_NUMBER}"
    HELM_RELEASE    = 'devops-release'
    HELM_CHART      = 'infra/helm/devops-chart'
    K8S_SERVICE_NAME = 'devops-release-devops-chart'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh '''
          corepack enable
          pnpm install --frozen-lockfile
        '''
      }
    }

    stage('Typecheck') {
      steps {
        sh 'pnpm --filter @autoops/api typecheck'
      }
    }

    stage('Test') {
      steps {
        sh 'pnpm --filter @autoops/api test'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh '''
          docker build \
            -t ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG} \
            -f apps/api/Dockerfile \
            .
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

    stage('Verify Deployment') {
      steps {
        sh '''
          kubectl rollout status deployment/${K8S_SERVICE_NAME} --timeout=120s
          kubectl get pods
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          kubectl port-forward svc/${K8S_SERVICE_NAME} 18080:3000 > /dev/null 2>&1 &
          sleep 5
          curl -f http://127.0.0.1:18080/health
        '''
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }

    failure {
      sh 'kubectl get pods || true'
    }
  }
}
