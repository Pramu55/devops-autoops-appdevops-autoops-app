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
    GITHUB_REPO = 'github.com/Pramu55/devops-autoops-appdevops-autoops-app.git'
    ARGOCD_APP = 'devops-autoops-app'

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

    stage('Update GitOps Image Tag') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-creds', usernameVariable: 'GIT_USERNAME', passwordVariable: 'GIT_TOKEN')]) {
          sh '''
            set -e

            sed -i "s|^  repository: .*|  repository: ${DOCKERHUB_CREDS_USR}/${IMAGE_NAME}|" ${HELM_CHART}/values.yaml
            sed -i "s|^  tag: .*|  tag: '${IMAGE_TAG}'|" ${HELM_CHART}/values.yaml

            helm lint ${HELM_CHART}
            helm template ${HELM_RELEASE} ${HELM_CHART} > rendered-manifests.yaml

            git config user.name "jenkins"
            git config user.email "jenkins@local"

            git add ${HELM_CHART}/values.yaml
            git commit -m "Update image tag to ${IMAGE_TAG} [skip ci]" || echo "No Git changes to commit"
            git push https://${GIT_USERNAME}:${GIT_TOKEN}@${GITHUB_REPO} HEAD:main
          '''
        }
      }
    }

    stage('Verify ArgoCD Deployment') {
      steps {
        sh '''
          set -e

          NEW_COMMIT=$(git rev-parse HEAD)

          for i in $(seq 1 60); do
            SYNC=$(kubectl get application ${ARGOCD_APP} -n argocd -o jsonpath='{.status.sync.status}' || true)
            HEALTH=$(kubectl get application ${ARGOCD_APP} -n argocd -o jsonpath='{.status.health.status}' || true)
            REVISION=$(kubectl get application ${ARGOCD_APP} -n argocd -o jsonpath='{.status.sync.revision}' || true)

            echo "ArgoCD status: sync=${SYNC}, health=${HEALTH}, revision=${REVISION}"

            if [ "${SYNC}" = "Synced" ] && [ "${HEALTH}" = "Healthy" ] && [ "${REVISION}" = "${NEW_COMMIT}" ]; then
              break
            fi

            sleep 5
          done

          kubectl rollout status deployment/${K8S_SERVICE_NAME} --timeout=300s
          kubectl get pods -l app.kubernetes.io/instance=${HELM_RELEASE}
          kubectl get svc ${K8S_SERVICE_NAME}
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          set -e
          kubectl port-forward svc/${K8S_SERVICE_NAME} ${SMOKE_TEST_PORT}:3000 > port-forward.log 2>&1 &
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
        kubectl describe deployment/${K8S_SERVICE_NAME} || true
      '''
    }
  }
}
