# Resume Points

## Project Title

Cloud-Native CI/CD Platform for Automated Kubernetes Deployments

## Strong Resume Bullets

- Built a production-style DevOps automation platform using Jenkins, Docker, Kubernetes, Helm, and Minikube to automate container image delivery and Kubernetes deployments.
- Implemented a CI/CD pipeline with dependency installation, automated tests, Docker image build, Trivy image scanning, Docker Hub publishing, Helm validation, rollout verification, and smoke testing.
- Containerized a Node.js microservice with health checks, readiness checks, Prometheus-compatible metrics, JSON structured logging, Docker healthcheck, and non-root container execution.
- Designed Kubernetes and Helm deployment templates with rolling updates, resource requests and limits, security contexts, HPA, PodDisruptionBudget, ConfigMap-based configuration, and Prometheus scrape annotations.
- Prepared the architecture for advanced GitOps and cloud deployment using ArgoCD, Prometheus/Grafana, Argo Rollouts, and AWS EKS with Terraform.

## Interview Talking Points

- Explain why Jenkins should handle CI and ArgoCD should handle GitOps-based CD.
- Explain why `/health` and `/ready` are separate endpoints.
- Explain how Helm `--atomic --wait` improves deployment safety.
- Explain how HPA uses resource requests to calculate autoscaling.
- Explain how smoke tests catch broken deployments after rollout.
