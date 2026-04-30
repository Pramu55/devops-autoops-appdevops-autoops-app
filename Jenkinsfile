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
    SERVICE_NAME = 'devops-release-devops-chart'
    SMOKE_TEST_PORT = '18080'
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
          node --version
          npm --version
          npm ci
        '''
      }
    }

    stage('Run Tests') {
      steps {
        sh '''
          npm test
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

    stage('Scan Docker Image') {
      steps {
        sh '''
          if command -v trivy >/dev/null 2>&1; then
            trivy image --no-progress --severity HIGH,CRITICAL --exit-code 0 ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}:${IMAGE_TAG}
          else
            echo "Trivy is not installed in this Jenkins image. Rebuild the Jenkins Docker image to enable image scanning."
          fi
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

    stage('Validate Helm Chart') {
      steps {
        sh '''
          helm lint ${HELM_CHART}
          helm template ${HELM_RELEASE} ${HELM_CHART} \
            --set image.repository=${DOCKERHUB_CREDS_USR}/${IMAGE_NAME} \
            --set image.tag=${IMAGE_TAG} > rendered-manifests.yaml
        '''
      }
    }

    stage('Deploy using Helm') {
      steps {
        sh '''
          helm upgrade --install ${HELM_RELEASE} ${HELM_CHART} \
            --set image.repository=${DOCKERHUB_CREDS_USR}/${IMAGE_NAME} \
            --set image.tag=${IMAGE_TAG} \
            --atomic \
            --wait \
            --timeout 5m
        '''
      }
    }

    stage('Verify') {
      steps {
        sh '''
          kubectl rollout status deployment/${SERVICE_NAME} --timeout=180s
          kubectl get pods -l app.kubernetes.io/instance=${HELM_RELEASE}
          kubectl get svc ${SERVICE_NAME}
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          set -e
          kubectl port-forward svc/${SERVICE_NAME} ${SMOKE_TEST_PORT}:3000 > port-forward.log 2>&1 &
          PF_PID=$!
          trap "kill ${PF_PID} || true" EXIT
          sleep 8

          if ! SMOKE_TEST_URL=http://127.0.0.1:${SMOKE_TEST_PORT} npm run smoke; then
            echo "Smoke test failed. Port-forward logs:"
            cat port-forward.log || true
            exit 1
          fi
        '''
      }
    }
  }

  post {
    always {
      sh '''
        docker logout || true
        rm -f rendered-manifests.yaml port-forward.log || true
      '''
    }

    failure {
      sh '''
        echo "Pipeline failed. Last Kubernetes state:"
        kubectl get pods -l app.kubernetes.io/instance=${HELM_RELEASE} || true
        kubectl describe deployment/${SERVICE_NAME} || true
      '''
    }
  }
}
