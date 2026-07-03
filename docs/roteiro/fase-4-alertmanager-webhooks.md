# Fase 4 — Alertmanager + webhooks (Google Chat / Discord)

## ⚠️ O detalhe que quase todo mundo esquece


> "O Prometheus detecta a condição e marca o alerta como **firing**. Mas quem
> **notifica** é o Alertmanager — ele agrupa, de-duplica, silencia e **roteia**.
> Um ponto que pega muita gente: o Alertmanager tem um formato de payload próprio,
> que não é o que o Google Chat nem o Discord esperam. Então eu coloco no meio um
> **bridge** que traduz. Vou escrever esse bridge no mesmo Node — em umas 30
> linhas — para mostrar que integrar uma ferramenta nova na stack é barato."

---

## ⌨️ Mãos à obra

### Parte 1 — Deploy do bridge

> 🟢 O bridge já está implementado em `bridge/`. Só precisa configurar as URLs e subir.

#### 1. Colocar as URLs dos webhooks no deployment

Abra `bridge/k8s/deployment.yaml` e substitua os valores das variáveis de ambiente:

- **Google Chat** → espaço → *Gerenciar webhooks*
- **Discord** → canal → *Configurações → Integrações → Webhooks → Copiar URL*

#### 2. Build + carga no kind

```bash
cd bridge
docker build -t alert-bridge:dev .
kind load docker-image alert-bridge:dev --name vagas-metricas
cd ..
```

```bash
kubectl apply -f bridge/k8s/deployment.yaml
kubectl -n monitoring rollout status deploy/alert-bridge
```

> 🔧 Teste o bridge isolado antes de plugar o Alertmanager:
> ```bash
> kubectl -n monitoring port-forward svc/alert-bridge 8088:8080
> curl -s -XPOST localhost:8088/alert -H 'content-type: application/json' \
>   -d '{"alerts":[{"status":"firing","labels":{"alertname":"Teste","severity":"warning"},"annotations":{"summary":"ping do bridge"}}]}'
> ```
> Deve cair uma mensagem no Google Chat e no Discord.

### Parte 2 — Configurar o Alertmanager (via Helm values)

#### 8. Aplicar a config no stack

```bash
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  -n monitoring \
  -f monitoring/values-alertmanager.yaml
```

> 🔧 O Operator recarrega o Alertmanager sozinho. Confirme em
> http://localhost:9093 → **Status** → veja a config aplicada com o receiver `bridge`.

### Parte 3 — Criar os alertas (`PrometheusRule`)

#### 9. `monitoring/prometheusrule.yaml`

```bash
kubectl apply -f monitoring/prometheusrule.yaml
```

---

⬅️ Voltar ao [índice](./README.md)
