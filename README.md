# Kube Observability Starter

Starter kit **hands-on de Observabilidade e Monitoramento** sobre Kubernetes:
`kube-prometheus-stack` (Prometheus + Grafana + Alertmanager), uma API Node.js
instrumentada com `prom-client`, um painel React que gera tráfego, e uma
_bridge_ que transforma alertas em mensagens no Google Chat e no Discord.

> Do zero a **diversos alertas e dashboards** sobre o seu serviço em **menos de
> 40 minutos** — num cluster Kubernetes local (`kind`), sem custo e sem nuvem.

Este repositório nasceu de uma apresentação sobre observabilidade: sair de um
cenário em que **não temos domínio nenhum** sobre o que acontece agora na
aplicação, para um cenário de **visibilidade completa**, com alertas que avisam
quando algo sai do esperado — antes que o cliente sinta.

Duas perguntas que este lab ajuda a responder com um **"sim, com certeza"**:

1. Se o meu sistema parar de responder, **eu serei o primeiro a saber?**
2. Consigo dizer, agora, **qual a latência média da rota X** num pico?

---

## A cadeia que você vai montar

```
[API Node /metrics] --scrape--> [Prometheus] --regras--> [Alertmanager] --webhook--> [Bridge] --> Google Chat / Discord
        ^   |                          |
        |   `------------------------> [Grafana] (dashboards)
  [vagas-console (React)]  ← painel visual que aciona login/logout e gera tráfego
    prom-client
```

## Componentes

| Diretório | O que é |
|---|---|
| [`api/`](./api/) | API Node.js (Express) instrumentada com `prom-client` — expõe `/metrics`, métricas sistêmicas + de negócio (usuários logados, cadastros). |
| [`frontend/`](./frontend/) | `vagas-console`, painel React (Vite) que aciona login/logout/reservas e gera tráfego para as métricas. |
| [`bridge/`](./bridge/) | Serviço que recebe o webhook do Alertmanager e reposta os alertas no Google Chat e no Discord. |
| [`k8s/`](./k8s/) | Cluster local via [`kind`](https://kind.sigs.k8s.io/) (1 control-plane + 1 worker). |
| [`monitoring/`](./monitoring/) | Regras de alerta (`PrometheusRule`) e config do Alertmanager (roteamento → bridge). |
| [`docs/`](./docs/) | **Roteiro guiado em 4 fases** + dashboard do Grafana pronto para importar. |

## O roteiro (comece por aqui)

O passo a passo completo está em **[`docs/roteiro/`](./docs/roteiro/README.md)**,
dividido em 4 fases:

| # | Fase | O que demonstra |
|---|------|-----------------|
| 1 | [kube-prometheus-stack](./docs/roteiro/fase-1-kube-prometheus-stack.md) | Subir o stack: Prometheus, Grafana, Alertmanager, exporters |
| 2 | [prom-client](./docs/roteiro/fase-2-prom-client.md) | Instrumentar a API Node com métricas sistêmicas |
| 3 | [métrica de negócio](./docs/roteiro/fase-3-metrica-negocio.md) | Gauge de usuários logados |
| 4 | [alertas & webhooks](./docs/roteiro/fase-4-alertmanager-webhooks.md) | Alertas → webhook → Google Chat + Discord |

---

## Pré-requisitos

- [Docker](https://www.docker.com/) em execução
- [`kind`](https://kind.sigs.k8s.io/), [`kubectl`](https://kubernetes.io/docs/tasks/tools/) e [`helm`](https://helm.sh/) (ex.: via Homebrew: `brew install kind kubectl helm`)
- [Node.js](https://nodejs.org/) 18+ (para rodar API e frontend fora do cluster)

## Início rápido

### 1. Subir o cluster local

```bash
kind create cluster --config k8s/kind-config.yaml   # cria o cluster "vagas-metricas"
kubectl config use-context kind-vagas-metricas
kubectl get nodes                                    # 2 nós Ready
```

### 2. Instalar o kube-prometheus-stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace
```

Siga a [Fase 1](./docs/roteiro/fase-1-kube-prometheus-stack.md) para os detalhes.

### 3. Buildar e subir a API

```bash
cd api
docker build -t vagas-api:dev .
kind load docker-image vagas-api:dev --name vagas-metricas
cd ..

kubectl apply -f api/k8s/namespace.yaml
kubectl apply -f api/k8s/deployment.yaml
kubectl apply -f api/k8s/service.yaml
kubectl apply -f api/k8s/servicemonitor.yaml       # faz o Prometheus descobrir a /metrics
kubectl -n demo rollout status deploy/vagas-api
```

### 4. Rodar a API localmente (sem Kubernetes)

```bash
cd api
npm install
npm run dev            # reinicia ao salvar (node --watch)
curl localhost:3000/metrics
```

### 5. Rodar o painel React

```bash
cd frontend
npm install
npm run dev            # Vite em http://localhost:5173
```

## Acessando as ferramentas (port-forward)

| Serviço | Comando | URL |
|---|---|---|
| Grafana | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80` | http://localhost:3000 |
| Prometheus | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090` | http://localhost:9090 |
| Alertmanager | `kubectl -n monitoring port-forward svc/kube-prometheus-stack-alertmanager 9093:9093` | http://localhost:9093 |
| API | `kubectl -n demo port-forward svc/vagas-api 8080:80` | http://localhost:8080 |

> Credenciais padrão do Grafana: usuário `admin`, senha obtida com
> `kubectl -n monitoring get secret kube-prometheus-stack-grafana -o jsonpath='{.data.admin-password}' | base64 -d`.

O dashboard de exemplo está em
[`docs/dashboards/nodejs-app.json`](./docs/dashboards/nodejs-app.json) — importe-o
no Grafana (Dashboards → Import).

## Alertas → Google Chat / Discord

A [`bridge/`](./bridge/) recebe o webhook do Alertmanager e reposta os alertas.
Configure as URLs de webhook via variáveis de ambiente (**não commite URLs reais**):

```bash
cp bridge/.env.example bridge/.env   # e preencha os valores
```

No cluster, edite `bridge/k8s/deployment.yaml` substituindo os placeholders
`WEBHOOK_URL_GCHAT_AQUI` / `WEBHOOK_URL_DISCORD_AQUI` (idealmente por um `Secret`).
Detalhes na [Fase 4](./docs/roteiro/fase-4-alertmanager-webhooks.md).

## Convenções

- **Namespace do stack:** `monitoring`
- **Namespace da app:** `demo`
- **Release Helm:** `kube-prometheus-stack`
- **Label** que o Operator usa para descobrir recursos: `release: kube-prometheus-stack`
- **Imagem da API:** `vagas-api:dev` (carregada no kind, sem registry)

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Info do serviço + nº de logados |
| `GET` | `/metrics` | Métricas no formato Prometheus |
| `GET` | `/healthz` | Liveness/health (probes do Kubernetes) |
| `GET` | `/work` | Latência variável (alimenta o histograma) |
| `POST` | `/login` | `{ "user": "ana" }` — registra sessão |
| `POST` | `/logout` | `{ "user": "ana" }` — encerra sessão |
| `GET` | `/users` | Estado atual das sessões |
| `POST` | `/estacionamentos/:id/reservar` | Reserva de vaga (gera tráfego) |

## Licença

[MIT](./LICENSE)
