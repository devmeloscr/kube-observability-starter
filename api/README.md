# vagas-api

API Node.js (Express) que sustenta a demo de observabilidade. Já vem **instrumentada
com `prom-client`** e funciona de ponta a ponta — expõe `/metrics` no formato
Prometheus, com métricas sistêmicas (via `collectDefaultMetrics`) e de negócio.
O passo a passo de como se chega a essa instrumentação está em
[`docs/roteiro/`](../docs/roteiro/README.md).

## Endpoints

- `GET /` — info do serviço + nº de logados
- `GET /metrics` — métricas no formato Prometheus
- `GET /healthz` — usado pelos probes do Kubernetes
- `GET /work` — latência variável (alimenta o histograma da Fase 2)
- `POST /login` `{ "user": "ana" }` — registra sessão
- `POST /logout` `{ "user": "ana" }` — encerra sessão
- `GET /users` — estado atual das sessões
- `POST /estacionamentos/:id/reservar` — reserva de vaga (gera tráfego)

## Métricas expostas

- `app_logged_in_users` (gauge) — usuários com sessão ativa
- `app_user_registrations_total` (counter) — total de cadastros
- métricas padrão do processo Node (CPU, memória, event loop, etc.)

## Rodar local (sem Kubernetes)

```bash
cd api
npm install
npm run dev            # reinicia ao salvar (node --watch)

# em outra aba:
curl localhost:3000/
curl localhost:3000/metrics
curl -XPOST localhost:3000/login -H 'content-type: application/json' -d '{"user":"ana"}'
curl localhost:3000/users
```

## Rodar no cluster (kind)

```bash
# build + carga no kind (sem registry)
cd api
docker build -t vagas-api:dev .
kind load docker-image vagas-api:dev --name vagas-metricas
cd ..

# aplicar
kubectl apply -f api/k8s/namespace.yaml
kubectl apply -f api/k8s/deployment.yaml
kubectl apply -f api/k8s/service.yaml
kubectl apply -f api/k8s/servicemonitor.yaml   # faz o Prometheus descobrir a /metrics
kubectl -n demo rollout status deploy/vagas-api

# acessar
kubectl -n demo port-forward svc/vagas-api 8080:80
curl localhost:8080/
curl localhost:8080/metrics
```

> Ao alterar o `server.js`, refaça o ciclo:
> `docker build` → `kind load` → `kubectl -n demo rollout restart deploy/vagas-api`.
