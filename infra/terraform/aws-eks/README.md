# AWS EKS Terraform Roadmap

This folder is reserved for the cloud upgrade of the project.

Recommended implementation order:

```text
1. VPC
2. Public and private subnets
3. EKS control plane
4. Managed node group
5. IAM roles
6. Kubernetes provider
7. Helm provider
8. ArgoCD installation
9. Metrics stack installation
```

Why this matters:

```text
Minikube proves the workflow locally.
Terraform + EKS proves cloud infrastructure readiness.
ArgoCD proves production-style GitOps deployment.
```
