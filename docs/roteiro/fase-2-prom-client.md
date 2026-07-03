# Fase 2 — Instrumentar a API com prom-client

### 1. Adicionar a dependência

```bash
cd api
npm install prom-client
```

### 2. Rebuild + recarregar no kind + aplicar os manifests

```bash
cd api
docker build -t vagas-api:dev .
kind load docker-image vagas-api:dev --name vagas-metricas
cd ..
kubectl apply -f api/k8s/namespace.yaml
kubectl apply -f api/k8s/deployment.yaml
kubectl apply -f api/k8s/service.yaml
kubectl -n demo rollout status deploy/vagas-api
```

> ```bash
> # Terminal 1 — expõe a API localmente
> kubectl -n demo port-forward svc/vagas-api 8080:80
> ```

### 3. Criar o `ServiceMonitor` (a peça de observabilidade)

```bash
kubectl create namespace demo
kubectl apply -f api/k8s/servicemonitor.yaml
```

➡️ Próxima: [Fase 3 — Métrica de negócio](./fase-3-metrica-negocio.md)
