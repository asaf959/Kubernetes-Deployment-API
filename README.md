# Kubernetes Deployment API

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

A production-quality REST API built with **NestJS + TypeScript** that accepts a deployment request and generates complete **Kubernetes manifests** on the fly. It produces every required K8s resource (Namespace, Deployment, Service, Ingress, ConfigMap) plus three bonus resources (HPA, NetworkPolicy, RBAC) — fully validated, Dockerized, and documented with Swagger UI.

> **Get started in 30 seconds:** `make up` → open `http://localhost:3000/docs`.

---

## Features

| Required (always generated) | Bonus (opt-in flags) |
|---|---|
| Namespace | HPA (`hpa.enabled: true`) |
| ConfigMap | NetworkPolicy (`networkPolicy.enabled: true`) |
| Deployment (with probes + securityContext) | RBAC: ServiceAccount + Role + RoleBinding (`rbac.enabled: true`) |
| Service (ClusterIP) | Docker + docker-compose |
| Ingress (`ingress.enabled: true`) | Swagger UI at `/docs` |
| 5 REST endpoints | Comprehensive Jest unit + e2e tests |

---

## Quick Start

```bash
git clone <repo>
cd k8s-deployment-api
make up
# Open http://localhost:3000/docs
```

That's it — the API is now running in Docker on port 3000 with Swagger UI available.

---

## Local Development

```bash
npm install
make dev          # nest start --watch (hot reload)
# Open http://localhost:3000/docs
```

Other useful commands:

| Command | Description |
|---|---|
| `make install` | Install dependencies |
| `make dev` | Run in watch mode |
| `make build` | Compile TypeScript to `dist/` |
| `make up` | Build & start in Docker (detached) |
| `make down` | Stop the Docker container |
| `make logs` | Tail Docker container logs |
| `make test` | Run unit tests |
| `make test-cov` | Run tests with coverage |
| `make test-e2e` | Run e2e tests |
| `make lint` | Run ESLint --fix |
| `make format` | Run Prettier |
| `make clean` | Remove `dist`, `node_modules`, `coverage` |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET`    | `/health`                                | Health check + deployment count |
| `POST`   | `/api/v1/deployments`                    | Create a deployment, generate manifests |
| `GET`    | `/api/v1/deployments`                    | List all deployments (filter by `?namespace=` or `?status=`) |
| `GET`    | `/api/v1/deployments/:id`                | Get a single deployment by UUID |
| `GET`    | `/api/v1/deployments/:id/manifests`      | Download all manifests as a single YAML file |
| `DELETE` | `/api/v1/deployments/:id`                | Delete a deployment record |

Full interactive docs: **http://localhost:3000/docs**

---

## Sample Requests

### Minimal deployment

```bash
curl -X POST http://localhost:3000/api/v1/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-app",
    "namespace": "production",
    "image": "nginx:1.25",
    "replicas": 2
  }'
```

### Full deployment with all bonus features

```bash
curl -X POST http://localhost:3000/api/v1/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "full-app",
    "namespace": "staging",
    "image": "myrepo/myapp:v2.1.0",
    "replicas": 3,
    "ports": { "containerPort": 3000, "servicePort": 80 },
    "envVars": { "NODE_ENV": "staging", "LOG_LEVEL": "debug" },
    "configMapData": { "DB_HOST": "postgres-svc", "CACHE_TTL": "300" },
    "resources": {
      "cpuRequest": "250m", "cpuLimit": "1000m",
      "memoryRequest": "256Mi", "memoryLimit": "1Gi"
    },
    "ingress": {
      "enabled": true,
      "host": "full-app.example.com",
      "path": "/",
      "tlsEnabled": true,
      "tlsSecretName": "full-app-tls"
    },
    "hpa": {
      "enabled": true,
      "minReplicas": 2,
      "maxReplicas": 10,
      "cpuUtilizationThreshold": 60
    },
    "networkPolicy": {
      "enabled": true,
      "allowNamespaces": ["monitoring"],
      "allowIngressPorts": [3000]
    },
    "rbac": {
      "enabled": true,
      "serviceAccountName": "full-app-sa",
      "clusterRole": false,
      "rules": [
        { "apiGroups": [""], "resources": ["configmaps", "secrets"], "verbs": ["get", "list"] }
      ]
    }
  }'
```

### Download generated manifests as a YAML file

```bash
curl http://localhost:3000/api/v1/deployments/<ID>/manifests -o my-app-manifests.yaml
kubectl apply -f my-app-manifests.yaml   # apply to a real cluster
```

### Filter by namespace / status

```bash
curl "http://localhost:3000/api/v1/deployments?namespace=staging"
curl "http://localhost:3000/api/v1/deployments?status=ready"
```

### Delete a deployment record

```bash
curl -X DELETE http://localhost:3000/api/v1/deployments/<ID>
```

---

## Generated Kubernetes Resources

| Resource | API Version | Required / Bonus | When generated |
|---|---|---|---|
| Namespace                | `v1`                          | Required | Always |
| ConfigMap                | `v1`                          | Required | Always |
| Deployment               | `apps/v1`                     | Required | Always |
| Service (ClusterIP)      | `v1`                          | Required | Always |
| Ingress                  | `networking.k8s.io/v1`        | Required | When `ingress.enabled = true` |
| HorizontalPodAutoscaler  | `autoscaling/v2`              | Bonus    | When `hpa.enabled = true` |
| NetworkPolicy            | `networking.k8s.io/v1`        | Bonus    | When `networkPolicy.enabled = true` |
| ServiceAccount + Role + RoleBinding | `rbac.authorization.k8s.io/v1` | Bonus | When `rbac.enabled = true` |

Two complete sample outputs are committed in `manifests-output/`:

- `manifests-output/minimal-example.yaml` — minimal request → 4 resources
- `manifests-output/full-example.yaml`    — every flag enabled → 10 resources

---

## Running Tests

```bash
make test          # unit tests (Jest)
make test-cov      # unit tests with coverage report
make test-e2e      # e2e tests against the live HTTP layer (Supertest)
```

The e2e suite hits all 5 endpoints, asserts that generated YAML is valid multi-document YAML, and verifies that bonus resources appear only when their feature flag is enabled.

---

## Architecture

```
HTTP (Express)
   │
   ▼
┌─────────────────────┐    ┌──────────────────────┐
│ DeploymentsModule   │──▶ │  ManifestsModule     │
│  - Controller       │    │   - ManifestsService │
│  - Service          │    │   - 8 generators     │
│  - In-memory store  │    │     (one per K8s     │
└─────────────────────┘    │      resource type)  │
                           └──────────────────────┘
```

- **Module-driven NestJS layout** — each domain (deployments, manifests, health) is its own module so it can be replaced or scaled independently.
- **Generator pattern** — every K8s resource type lives in its own pure function under `src/manifests/generators/` that takes a `CreateDeploymentDto` and returns a plain JS object. `ManifestsService` orchestrates them and converts to YAML with `js-yaml`.
- **In-memory store** — deployments are kept in a `Map<id, DeploymentRecord>` inside `DeploymentsService`. No DB needed for the demo, but easy to swap in TypeORM/Redis later.
- **Validation everywhere** — every request is validated via `class-validator` decorators on the DTOs and a strict global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform).
- **Swagger** — all endpoints, DTOs and response shapes are documented automatically via `@nestjs/swagger`.

---

## Assumptions and Limitations

- Deployments are stored **in memory** and do not persist across restarts. A production version would back this with PostgreSQL (TypeORM) or Redis.
- The API **generates** manifests only — it does not **apply** them to a live cluster. Use `kubectl apply -f output.yaml` or a GitOps pipeline (ArgoCD / Flux) for that.
- Ingress assumes an **nginx-ingress-controller** is installed in the target cluster (`ingressClassName: nginx`).
- HPA uses `autoscaling/v2`, which requires Kubernetes ≥ 1.23.
- No authentication or authorization is implemented. A production version would add JWT guards via `@nestjs/passport`.
- Resource names must follow **RFC 1123 DNS label** rules (lowercase alphanumeric + hyphens, no leading/trailing hyphen).
- The default `readOnlyRootFilesystem: true` security context may need to be relaxed for apps that write to disk; this is intentional and a sensible secure default.
- Probes assume the workload exposes a `GET /health` endpoint on the container port.

---

## Future Improvements

- Persistent store (PostgreSQL via TypeORM, or Redis for ephemeral)
- AuthN/AuthZ via JWT + RBAC roles in the API itself
- Apply manifests directly to a configured cluster via the official `@kubernetes/client-node`
- Pluggable templating engine (Helm chart / Kustomize output) instead of just raw YAML
- Versioning of deployment requests + diff between revisions
- Webhook / event stream for deployment lifecycle (`pending → ready → applied`)
- Multi-tenancy and per-tenant quotas
- OpenTelemetry tracing + Prometheus metrics
- Generate Secret resources from `secretData` (currently only ConfigMap)
- Add PDB (PodDisruptionBudget) and ResourceQuota generators

---

## License

MIT
