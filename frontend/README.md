# vagas-console

Painel React (Vite) de **telemetria** para deixar a demo visual: dispara
login/logout, mostra em tempo real a métrica de negócio (usuários logados),
gera tráfego em `/work` e exibe um console de eventos ao vivo.

> É só a camada de visualização/controle da `vagas-api`. Não tem nada de
> Prometheus — serve para *acionar* a api para gerar tráfego

## O que o painel faz

- **Contador gigante** `app_logged_in_users` (a gauge da Fase 3), com glow e pulse.
- **Sessões ativas:** form de login, chips de usuários (clique = login/logout) e roster com logout individual.
- **Gerador de tráfego:** `× 10 / 50 / 200` requisições em `/work`, com p95/média e sparkline de latência (client-side) — ótimo para a narrativa do histograma da Fase 2.
- **Console de eventos:** feed estilo terminal de cada ação.
- **Status da API:** online/offline por polling (a cada 2s, simulando o scrape).

## Como rodar

A API precisa estar acessível. Duas opções:

```bash
# Opção A — API no cluster (port-forward, padrão):
kubectl -n demo port-forward svc/vagas-api 8080:80

# Opção B — API rodando local (api/ com npm run dev na porta 3000):
#   export VITE_API_TARGET=http://localhost:3000
```

Depois, em outra aba:

```bash
cd frontend
npm install
npm run dev
# abra http://localhost:5173
```

> O Vite faz **proxy** de `/api/*` para a API (default `http://localhost:8080`),
> evitando CORS. Troque o alvo com `VITE_API_TARGET`.