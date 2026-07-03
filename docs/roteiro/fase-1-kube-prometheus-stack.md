# Fase 1 — Subir o kube-prometheus-stack

**Objetivo:** com um único `helm install`, ter Prometheus, Grafana, Alertmanager,
Node Exporter e Kube State Metrics rodando e já coletando o cluster.

⏱️ Tempo estimado: ~5 min (mais o download das imagens na primeira vez).

## ⌨️ Mãos à obra

### 0. Criar o cluster kind e setar o contexto

```bash
kind create cluster --name vagas-metricas
kubectl config use-context kind-vagas-metricas
```
### 1. Adicionar o repositório Helm

> **O que é o Helm?**
> Helm é o gerenciador de pacotes do Kubernetes — a mesma ideia do `apt` no Ubuntu
> ou `npm` no Node. Um **chart** é um pacote com todos os manifests YAML necessários
> para subir uma aplicação (Deployments, Services, ConfigMaps, CRDs…), parametrizados
> via `values.yaml`.

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### 2. Criar o namespace

```bash
kubectl create namespace monitoring
```

### 3. Instalar o chart

```bash
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### 4. Acompanhar a subida

```bash
kubectl -n monitoring get pods -w
```

```bash
kubectl -n monitoring rollout status deploy/kube-prometheus-stack-grafana
kubectl -n monitoring wait --for=condition=Ready pods --all --timeout=180s
```

### 5. Abrir as UIs (deixe cada um numa aba)

```bash
# Grafana
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
# Prometheus
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
# Alertmanager
kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093
```