# Kubernetes local (kind)

Infra mínima para rodar Kubernetes na máquina via [kind](https://kind.sigs.k8s.io/)
(Kubernetes em containers Docker).

## Pré-requisitos
- Docker em execução
- `kind`, `kubectl` (instalados via Homebrew)

## Uso

```bash
make up        # cria o cluster local (se não existir)
make status    # lista nós e pods
make context   # aponta o kubectl para o cluster local
make down      # destrói o cluster
make recreate  # destrói e recria do zero
```

## Detalhes
- Cluster: `vagas-metricas` — 1 control-plane + 1 worker.
- Config em [`kind-config.yaml`](./kind-config.yaml): portas 80/443 do host
  mapeadas e label `ingress-ready=true`, prontas para um Ingress controller.
- Contexto do kubectl: `kind-vagas-metricas`.

> Ainda não há aplicação. Quando houver, os manifests / charts entram aqui em `k8s/`.
