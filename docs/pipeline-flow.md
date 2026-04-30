# Pipeline Flow

## What Each Stage Does

| Stage | Purpose |
| --- | --- |
| Clone Repo | Pulls latest source code from GitHub |
| Install Dependencies | Installs exact versions from `package-lock.json` |
| Run Tests | Verifies app endpoints before building an image |
| Build Docker Image | Creates deployable container artifact |
| Scan Docker Image | Checks image for known vulnerabilities |
| Login to Docker Hub | Authenticates using Jenkins credentials |
| Push Image | Publishes versioned image using Jenkins build number |
| Validate Helm Chart | Checks Kubernetes templates before deployment |
| Deploy using Helm | Applies release with rollback support |
| Verify | Waits for Kubernetes rollout to become healthy |
| Smoke Test | Confirms the deployed service responds correctly |

## Common Errors

| Error | Meaning | Fix |
| --- | --- | --- |
| `npm.ps1 cannot be loaded` | PowerShell execution policy blocks npm script wrapper | Use `npm.cmd` on Windows or run from WSL/Git Bash |
| `ImagePullBackOff` | Kubernetes cannot pull Docker image | Check Docker Hub image name, tag, and credentials |
| `CrashLoopBackOff` | Container starts then crashes repeatedly | Check `kubectl logs <pod>` |
| `helm upgrade failed` | Rendered chart or rollout failed | Run `helm lint`, `helm template`, and check pod events |
| `kubectl connection refused` | Jenkins cannot reach Kubernetes API | Verify mounted kubeconfig and Minikube IP access |
| `trivy not installed` | Jenkins image does not include Trivy yet | Rebuild Jenkins image from `jenkins/Dockerfile` |
