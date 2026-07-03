# vagas-api

API Node.js (Express) que sustenta a demo de observabilidade. É a **app base**:
funciona de ponta a ponta, mas **não tem instrumentação Prometheus** — isso é
exercício seu, guiado por [`docs/roteiro/`](../docs/roteiro/README.md).

## O que já vem pronto

- `GET /` — info do serviço + nº de logados
- `GET /healthz` — usado pelos probes do Kubernetes
- `GET /work` — latência variável (alimenta o histograma da Fase 2)
- `POST /login` `{ "user": "ana" }` — registra sessão
- `POST /logout` `{ "user": "ana" }` — encerra sessão
- `GET /users` — estado atual das sessões

## Rodar local (sem Kubernetes)

```bash
cd api
npm install
npm run dev            # reinicia ao salvar (node --watch)

# em outra aba:
curl localhost:3000/
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
kubectl -n demo rollout status deploy/vagas-api

# acessar
kubectl -n demo port-forward svc/vagas-api 8080:80
curl localhost:8080/
```

> Após editar o `server.js` para adicionar métricas, refaça:
> `docker build` → `kind load` → `kubectl -n demo rollout restart deploy/vagas-api`.
