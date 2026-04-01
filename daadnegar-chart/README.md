# Daadnegar Helm Chart

Helm chart for deploying the **daadnegar** (daadnegar) Next.js application on Kubernetes with MySQL, MinIO, RabbitMQ, and a background worker.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner (e.g. local-path or default storage class)
- [helm-secrets](https://github.com/jkroepke/helm-secrets) plugin
- SOPS and a GPG key for encrypting secrets

## Components

| Component    | Description                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **App**      | Next.js app (port 3000) with Better Auth                                                                                                                                                                         |
| **MySQL**    | Database (daadnegar)                                                                                                                                                                                             |
| **MinIO**    | Object storage for uploads                                                                                                                                                                                       |
| **RabbitMQ** | Message queue for background jobs                                                                                                                                                                                |
| **Worker**   | Consumes RabbitMQ, runs cron jobs                                                                                                                                                                                |
| **Grafana**  | Optional UI (subchart, ClusterIP); add datasources (e.g. Loki) as needed                                                                                                                                         |
| **Loki**     | Optional log aggregation (subchart, ClusterIP); needs a log shipper (this chart uses **Alloy**) or another client                                                                                                |
| **Alloy**    | Optional [Grafana Alloy](https://grafana.com/docs/alloy/latest/) — ships pod logs to Loki (Promtail is deprecated; see [Migrate to Alloy](https://grafana.com/docs/loki/latest/setup/migrate/migrate-to-alloy/)) |

**Do you need Loki?** Only if you want **logs in Grafana** (Explore, dashboards). Grafana alone does not collect or store logs. For **metrics** you would add Prometheus (not included here), not Loki.

## Setup

### 1. Install Dependencies

```bash
# Fetch Grafana / Loki / Alloy subcharts (after clone or Chart.yaml dependency changes)
helm dependency update ./daadnegar-chart

# Helm Secrets plugin
helm plugin install https://github.com/jkroepke/helm-secrets

# SOPS
# macOS:
brew install sops
# Linux:
curl -LO https://github.com/getsops/sops/releases/download/v3.10.2/sops-v3.10.2.linux.amd64
sudo mv sops-v3.10.2.linux.amd64 /usr/local/bin/sops
sudo chmod +x /usr/local/bin/sops
```

### 2. Generate a GPG Key (if needed)

```bash
gpg --full-generate-key
gpg --list-keys
gpg --export-secret-keys --armor KEY_ID | base64
```

### 3. Configure SOPS

Update `daadnegar-chart/.sops.yaml` with your GPG key fingerprint:

```yaml
keys:
  - &pgp-key YOUR_GPG_KEY_FINGERPRINT
creation_rules:
  - path_regex: .*secrets\.yaml$
    pgp: *pgp-key
```

### 4. Generate and Encrypt Secrets

Generate secrets with secure random values:

```bash
./daadnegar-chart/scripts/generate-secrets.sh > daadnegar-chart/secrets.yaml
```

Set your production domain (optional):

```bash
YOUR_DOMAIN=app.example.com ./daadnegar-chart/scripts/generate-secrets.sh > daadnegar-chart/secrets.yaml
```

Then encrypt (uses key from `.sops.yaml`):

```bash
sops -e --input-type yaml --output-type yaml --output secrets.yaml secrets.yaml.dec
SOPS_CONFIG=.sops-stage.yaml sops -e --input-type yaml --output-type yaml --output secrets-stage.yaml secrets-stage.yaml.dec
```

Or edit in place (SOPS decrypts, opens editor, re-encrypts on save):

```bash
sops daadnegar-chart/secrets.yaml
```

### 5. GitHub Actions Secrets

For CI/CD, add these repository secrets:

| Secret                  | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `GPG_PRIVATE_KEY`       | Base64-encoded GPG private key: `gpg --export-secret-keys KEY_ID \| base64` |
| `KUBE_CONFIG`           | kubeconfig for the target cluster                                           |
| `NX_CLOUD_ACCESS_TOKEN` | Optional Nx Cloud token                                                     |

## Configuration

### Main Parameters

| Parameter                   | Description            | Default             |
| --------------------------- | ---------------------- | ------------------- |
| `replicaCount`              | App replicas           | `1`                 |
| `image.repository`          | Image name             | `daadnegar`         |
| `image.tag`                 | Image tag              | `""`                |
| `image.pullPolicy`          | Pull policy            | `IfNotPresent`      |
| `service.type`              | Service type           | `ClusterIP`         |
| `service.port`              | App port               | `3000`              |
| `database.enabled`          | Enable MySQL           | `true`              |
| `database.persistence.size` | MySQL PVC size         | `10Gi`              |
| `minio.enabled`             | Enable MinIO           | `true`              |
| `minio.persistence.size`    | MinIO PVC size         | `10Gi`              |
| `rabbitmq.enabled`          | Enable RabbitMQ        | `true`              |
| `worker.enabled`            | Enable worker          | `false`             |
| `grafana.enabled`           | Grafana subchart       | `false`             |
| `loki.enabled`              | Loki subchart          | `false`             |
| `alloy.enabled`             | Grafana Alloy (→ Loki) | `false`             |
| `autoscaling.enabled`       | HPA                    | `false`             |
| `ingress.enabled`           | Ingress                | `true` (see values) |

### Secrets (in secrets.yaml)

| Parameter                 | Description                        |
| ------------------------- | ---------------------------------- |
| `database.rootPassword`   | MySQL root password                |
| `database.password`       | App DB user password               |
| `database.database`       | Database name                      |
| `database.user`           | DB username                        |
| `minio.rootUser`          | MinIO access key                   |
| `minio.rootPassword`      | MinIO secret key                   |
| `rabbitmq.user`           | RabbitMQ username                  |
| `rabbitmq.password`       | RabbitMQ password                  |
| `grafana.adminUser`       | Grafana login user (often `admin`) |
| `grafana.adminPassword`   | Grafana admin password             |
| `env.BETTER_AUTH_SECRET`  | Better Auth secret (32+ bytes)     |
| `env.BOOTSTRAP_SECRET`    | Bootstrap API secret               |
| `env.BETTER_AUTH_URL`     | Auth callback URL                  |
| `env.FRONTEND_URL`        | Frontend URL                       |
| `env.NEXT_PUBLIC_APP_URL` | Public app URL                     |
| `env.NODE_ENV`            | `production`                       |

## Install / Upgrade

```bash
# Install
helm secrets upgrade --install daadnegar ./daadnegar-chart \
  -f daadnegar-chart/secrets.yaml \
  --set image.tag=v1.0.0 \
  --wait --timeout 5m

# Upgrade (e.g. with new image tag)
helm secrets upgrade daadnegar ./daadnegar-chart \
  -f daadnegar-chart/secrets.yaml \
  --set image.tag=v1.0.1 \
  --wait --timeout 5m
```

Images are pulled from `ghcr.io/<owner>/daadnegar` (set in GitHub Actions workflow).

## Access the Application

Port-forward:

```bash
kubectl port-forward service/daadnegar 3000:3000
```

Open http://localhost:3000

MinIO console (if enabled):

```bash
kubectl port-forward service/daadnegar-minio 9001:9001
```

RabbitMQ management:

```bash
kubectl port-forward service/daadnegar-rabbitmq 15672:15672
```

Grafana (enable with `grafana.enabled=true`; not exposed via Ingress by default):

```bash
# Admin password: kubectl get secret <release>-grafana -o jsonpath='{.data.admin-password}' | base64 -d
kubectl port-forward service/<release>-grafana 3001:80
```

Open http://127.0.0.1:3001 (local port 3001 avoids clashing with the app on 3000).

**Loki + Alloy** (optional; enable with `loki.enabled=true` and `alloy.enabled=true`). Alloy runs as a **single-replica Deployment** that tails pod logs via the Kubernetes API and pushes to Loki (see [Collect Kubernetes logs](https://grafana.com/docs/alloy/latest/collect/logs-in-kubernetes/)). Loki stays ClusterIP-only; you normally do not port-forward it. With `grafana.sidecar.datasources.enabled=true` (default in chart values), a ConfigMap provisions the **Loki** datasource in Grafana pointing at `http://<release>-loki:3100`.

For larger clusters you may want more replicas, a [clustered Alloy](https://grafana.com/docs/alloy/latest/get-started/clustering/) setup, or a DaemonSet with per-node `discovery.kubernetes` selectors (as in the doc above) instead of one global collector.

The bundled Loki values use **`loki.useTestSchema: true`** for a minimal filesystem single-binary setup—fine for trying the stack; for long-term production retention, plan a proper [Loki schema](https://grafana.com/docs/loki/latest/operations/storage/schema/) and storage.

## Ingress

```bash
helm secrets upgrade daadnegar ./daadnegar-chart \
  -f daadnegar-chart/secrets.yaml \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.hosts[0].host=app.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix \
  --wait
```

## Decrypt / Re-encrypt Secrets

```bash
# Decrypt to stdout
helm secrets decrypt daadnegar-chart/secrets.yaml

# Edit in place (SOPS)
sops daadnegar-chart/secrets.yaml
```

## Troubleshooting

### 404 when visiting the site

If you see 404 on the root URL, common causes:

1. **Missing DATABASE_URL** – The app requires `DATABASE_URL` for Prisma. The chart injects it from the MySQL secret's `mysql-url` key. When using `database.existingSecret`, ensure your secret includes `mysql-url` with the full connection string: `mysql://USER:PASSWORD@HOST:3306/DATABASE` (replace HOST with `daadnegar-mysql` or `RELEASE-mysql` in your namespace).

2. **Pods not ready** – Check that the app pods are running: `kubectl get pods -l app.kubernetes.io/name=daadnegar-chart`. If they're in CrashLoopBackOff, inspect logs: `kubectl logs -l app.kubernetes.io/component=app --tail=100`

3. **Migrations failed** – The init container runs `prisma migrate deploy` before the app starts. If it fails, the pod won't become ready. Check init container logs: `kubectl logs <pod-name> -c prisma-migrate`

4. **DNS / www** – The ingress serves both `daadnegar.com` and `www.daadnegar.com`. Ensure your DNS points to the cluster's ingress controller.
