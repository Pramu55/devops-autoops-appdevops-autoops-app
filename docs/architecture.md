# Architecture

## Current CI/CD Flow

```text
Developer pushes code to GitHub
        |
        v
Jenkins pulls repository
        |
        v
npm ci and npm test
        |
        v
Docker image build
        |
        v
Trivy image scan
        |
        v
Docker Hub push
        |
        v
Helm chart validation
        |
        v
Helm upgrade --install --atomic --wait
        |
        v
Kubernetes rollout verification
        |
        v
Smoke test through Kubernetes service
```

## Kubernetes Runtime

```text
Service: NodePort
Deployment: 2 replicas
Autoscaling: HPA, 2 to 5 replicas
Availability: PodDisruptionBudget
Health: /health and /ready
Observability: /metrics and Prometheus annotations
Security: non-root container and dropped Linux capabilities
```

## Next Advanced Architecture

```text
Jenkins handles CI only
ArgoCD handles CD using GitOps
Prometheus and Grafana provide monitoring
Argo Rollouts handles canary or blue-green releases
Terraform provisions AWS EKS infrastructure
```
