# DevOps AutoOps App

Node.js Express app with Docker, Kubernetes, Helm, and Jenkins CI/CD.

App runs on port 3000.

Main route:
`/` returns `DevOps AutoOps App is Running!`

Health route:
`/health` returns `{ "status": "ok" }`

Docker build:
`docker build -t <dockerhub-username>/devops-app:v1 .`

Kubernetes deploy:
`kubectl apply -f k8s/deployment.yaml -f k8s/service.yaml`

Helm deploy:
`helm upgrade --install devops-release helm/devops-chart --set image.repository=<dockerhub-username>/devops-app --set image.tag=v1 --force`

Jenkins:
Use `jenkins/docker-compose.yml` to run Jenkins in Docker.

Security:
Do not commit kubeconfig or secrets. Use Jenkins credentials for Docker Hub.
