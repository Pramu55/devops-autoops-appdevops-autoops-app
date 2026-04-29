pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    timestamps()
  }

  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    IMAGE_NAME = 'devops-app'
    IMAGE_TAG = "${BUILD_NUMBER}"
    HELM_RELEASE = 'devops-release'
    HELM_CHART = 'helm/devops-chart'
  }

  stages {
    stage('Clone Repo') {
      steps {
        checkout scm
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
        retry(3) {
          sh '''
            echo "${DOCKERHUB_CREDS_PSW}" | docker login -u "${DOCKERHUB_CREDS_USR}" --password-stdin
          '''
        }
      }
    }

    stage('Push Image') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          sh '''
            docker push ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG}
          '''
        }
      }
    }

    stage('Deploy using Helm') {
      steps {
        sh '''
          helm upgrade --install ${HELM_RELEASE} ${HELM_CHART} \
            --set image.repository=${DOCKERHUB_CREDS_USR}/${IMAGE_NAME} \
            --set image.tag=${IMAGE_TAG} \
            --force
        '''
      }
    }

    stage('Verify') {
      steps {
        sh '''
          kubectl get pods
        '''
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
    }
  }
}
