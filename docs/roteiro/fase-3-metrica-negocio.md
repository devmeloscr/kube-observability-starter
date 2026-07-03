# Fase 3 — Métrica de negócio: usuários logados

**Objetivo:** mostrar que métrica não é só "coisa de infra". Uma **Gauge** que
sobe no login e desce no logout vira um KPI que o time de produto entende —
e que também pode virar alerta.

⏱️ Tempo estimado: ~8 min.

---

### 1. Rebuild + recarregar no kind + reiniciar o pod

```bash
cd api
docker build -t vagas-api:dev .
kind load docker-image vagas-api:dev --name vagas-metricas
cd ..
kubectl -n demo rollout restart deploy/vagas-api
kubectl -n demo rollout status deploy/vagas-api
```

➡️ Próxima: [Fase 4 — Alertmanager + webhooks (Google Chat / Discord)](./fase-4-alertmanager-webhooks.md)
