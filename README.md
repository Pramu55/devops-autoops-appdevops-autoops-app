# AutoOps Platform

Production-grade monorepo for the AutoOps DevOps platform. Built with **pnpm workspaces** and **Turborepo**, written in **TypeScript strict mode**.

## Repository Layout

```text
autoops-platform/
├── apps/
│   ├── api/            Express API — health, readiness, Prometheus metrics
│   ├── dashboard/      Next.js operational visibility dashboard
│   └── worker/         Background job processor foundation
├── packages/
│   └── shared/         Shared TypeScript types and utilities
├── infra/
│   ├── docker/         Docker and Jenkins configurations
│   │   └── jenkins/    Custom Jenkins image + docker-compose
│   ├── helm/           Helm chart for Kubernetes deployments
│   │   └── devops-chart/
│   ├── k8s/            Raw Kubernetes manifests (namespace, deploy, svc…)
│   ├── monitoring/     Prometheus / Grafana configuration notes
│   └── terraform/      AWS EKS infrastructure (Terraform)
├── docs/               Architecture and pipeline documentation
├── Jenkinsfile         CI pipeline (build → test → push → deploy)
├── argocd-devops-app.yaml  ArgoCD GitOps application
├── turbo.json          Turborepo task pipeline
├── pnpm-workspace.yaml Workspace package globs
└── tsconfig.base.json  Shared TypeScript compiler options
```

## Prerequisites

| Tool        | Minimum version |
|-------------|----------------|
| Node.js     | 18             |
| pnpm        | 9              |
| Docker      | 20             |
| kubectl     | 1.28           |
| helm        | 3              |

## Getting Started

```bash
# Install all workspace dependencies
pnpm install

# Build all packages in dependency order
pnpm build

# Run all tests
pnpm test

# Start API in development mode (hot-reload)
pnpm --filter @autoops/api dev

# Start dashboard in development mode
pnpm --filter @autoops/dashboard dev
```

## Applications

### `apps/api`

Express service serving:

| Endpoint  | Purpose                          |
|-----------|----------------------------------|
| `GET /`   | Root — confirms service is live  |
| `GET /health` | Liveness probe (Kubernetes) |
| `GET /ready`  | Readiness probe (Kubernetes) |
| `GET /metrics` | Prometheus text-format metrics |

```bash
# Run tests
pnpm --filter @autoops/api test

# Build TypeScript
pnpm --filter @autoops/api build

# Start production server
pnpm --filter @autoops/api start
```

### `apps/dashboard`

Next.js 15 operational dashboard (foundation). Displays service status and links to live API endpoints.

```bash
pnpm --filter @autoops/dashboard dev   # http://localhost:3001
pnpm --filter @autoops/dashboard build
```

### `apps/worker`

Background job processor. Currently a foundation — extend to connect to a queue (Redis, SQS, etc.) and implement job handlers.

## Docker

The API Docker image is built from the **repo root** context:

```bash
docker build -f apps/api/Dockerfile -t devops-app:local .
docker run -p 3000:3000 devops-app:local
curl http://localhost:3000/health
```

## CI/CD

### Jenkins (CI)

Pipeline stages defined in `Jenkinsfile`:

1. **Checkout** → clone repository
2. **Install Dependencies** → `pnpm install --frozen-lockfile`
3. **Typecheck** → `pnpm --filter @autoops/api typecheck`
4. **Test** → `pnpm --filter @autoops/api test`
5. **Build Docker Image** → `docker build -f apps/api/Dockerfile .`
6. **Login to Docker Hub** → credential injection
7. **Push Image** → Docker Hub
8. **Deploy to Kubernetes** → `helm upgrade --install`
9. **Verify Deployment** → `kubectl rollout status`
10. **Smoke Test** → `curl /health` through port-forward

Start Jenkins locally:

```bash
cd infra/docker/jenkins
docker-compose up -d
# Jenkins available at http://localhost:8081
```

### ArgoCD (CD)

GitOps application defined in `argocd-devops-app.yaml`. Watches `infra/helm/devops-chart` on the `main` branch and automatically syncs to the cluster.

## Infrastructure

### Kubernetes (raw manifests)

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/
```

### Helm

```bash
helm upgrade --install devops-release infra/helm/devops-chart \
  --values infra/helm/devops-chart/values-prod.yaml
```

### Terraform

AWS EKS provisioning — see `infra/terraform/aws-eks/README.md` for the roadmap.

## Monitoring

The API exposes Prometheus metrics at `/metrics`. A Prometheus Operator `ServiceMonitor` is included in the Helm chart (`serviceMonitor.enabled: true`).

See `infra/monitoring/README.md` for `scrape_configs` and PromQL examples.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the CI/CD flow and Kubernetes runtime topology.
