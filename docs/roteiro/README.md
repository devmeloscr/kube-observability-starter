# Roteiro — Observabilidade & Monitoramento (Prometheus + Grafana)

Roteiro híbrido para **praticar** uma demo de observabilidade
ponta-a-ponta sobre o cluster Kubernetes local (`kind`).

## Fases

| # | Arquivo | O que demonstra |
|---|---------|-----------------|
| 1 | [fase-1-kube-prometheus-stack.md](./fase-1-kube-prometheus-stack.md) | Subir o stack: Prometheus, Grafana, Alertmanager, exporters |
| 2 | [fase-2-prom-client.md](./fase-2-prom-client.md) | Instrumentar a API Node com `prom-client` (métricas sistêmicas) |
| 3 | [fase-3-metrica-negocio.md](./fase-3-metrica-negocio.md) | Métrica de negócio: usuários logados (gauge) |
| 4 | [fase-4-alertmanager-webhooks.md](./fase-4-alertmanager-webhooks.md) | Alertas → webhook → Google Chat + Discord |

## A cadeia que você vai montar

```
[API Node /metrics] --scrape--> [Prometheus] --regras--> [Alertmanager] --webhook--> [Bridge] --> Google Chat / Discord
        ^   |                          |
        |   `------------------------> [Grafana] (dashboards)
  [vagas-console (React)]  ← painel visual que aciona login/logout e gera tráfego
    prom-client
```

## Pré-checks (rode antes de qualquer fase)

```bash
# Cluster local de pé? (criado na fase de infra)
kubectl config use-context kind-vagas-metricas
kubectl get nodes          # 2 nós Ready (control-plane + worker)

# Ferramentas
helm version
kubectl version --client
docker ps                  # Docker rodando (kind depende dele)
```

Se o cluster não existir, suba com `make up` na raiz do projeto.

## Convenções usadas no roteiro

- **Namespace do stack:** `monitoring`
- **Namespace da app:** `demo`
- **Release Helm:** `kube-prometheus-stack` (os Services herdam esse prefixo)
- **Label mágico** para o Operator descobrir seus recursos: `release: kube-prometheus-stack`
- **Imagem da API:** `vagas-api:dev` (carregada no kind, sem registry)

## Mapa de portas (port-forward) para a demo

| Serviço | Comando | URL |
|---|---|---|
| Grafana | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80` | http://localhost:3000 |
| Prometheus | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090` | http://localhost:9090 |
| Alertmanager | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093` | http://localhost:9093 |
| API | `kubectl -n demo port-forward svc/vagas-api 8080:80` | http://localhost:8080 |
