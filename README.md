# DevOps AutoOps Platform

Production-style DevOps and cloud portfolio project for a containerized Node.js microservice.

This project demonstrates CI/CD automation, Docker image delivery, Helm-based Kubernetes deployment, health checks, observability hooks, autoscaling, and secure deployment defaults.

## Service Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/` | Main application response |
| `/health` | Liveness probe for Kubernetes |
| `/ready` | Readiness probe for Kubernetes |
| `/metrics` | Prometheus-compatible metrics |

Expected root response:

```text
DevOps AutoOps App is Running!
```

## Local Commands

Install dependencies:

```bash
npm ci
```

Run tests:

```bash
npm test
```

Run locally:

```bash
npm start
```

Run smoke test:

```bash
SMOKE_TEST_URL=http://127.0.0.1:3000 npm run smoke
```

## Docker

Build image:

```bash
docker build -t <dockerhub-username>/devops-app:v1 .
```

Run container:

```bash
docker run --rm -p 3000:3000 <dockerhub-username>/devops-app:v1
```

## Kubernetes

Apply static manifests:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/pdb.yaml
```

Check status:

```bash
kubectl get pods -n devops-autoops
kubectl get svc -n devops-autoops
```

## Helm

Validate chart:

```bash
helm lint helm/devops-chart
helm template devops-release helm/devops-chart
```

Deploy chart:

```bash
helm upgrade --install devops-release helm/devops-chart \
  --set image.repository=<dockerhub-username>/devops-app \
  --set image.tag=v1 \
  --atomic \
  --wait \
  --timeout 5m
```

Open service with Minikube:

```bash
minikube service devops-release-devops-chart
```

Port-forward:

```bash
kubectl port-forward svc/devops-release-devops-chart 8080:3000
```

## Jenkins CI/CD

Jenkins pipeline stages:

```text
Clone Repo
Install Dependencies
Run Tests
Build Docker Image
Scan Docker Image
Login to Docker Hub
Push Image
Validate Helm Chart
Deploy using Helm
Verify
Smoke Test
```

Jenkins runs in Docker from:

```text
jenkins/docker-compose.yml
```

Required Jenkins credential:

```text
dockerhub-creds
```

## Security Notes

Do not commit:

```text
node_modules/
.env
kubeconfig
jenkins/jenkins-kube/
```

Use Jenkins credentials for Docker Hub authentication.

## Project Strength

This is no longer only a beginner CI/CD demo. It now includes:

```text
Health and readiness probes
Prometheus metrics endpoint
Automated tests
Smoke testing
Docker healthcheck
Helm chart validation
Atomic Helm deploys with rollback support
Rolling updates
Resource requests and limits
Pod security context
Horizontal Pod Autoscaler
PodDisruptionBudget
Prometheus scrape annotations
```
