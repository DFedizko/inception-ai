# To Do — streaming / geração da resposta

## Geração resiliente à prova de serverless (fila/worker)

**Status hoje:** quando o cliente desconecta no meio (F5, aba fechada), o `streamingReplyResponse`
(`streaming-response.ts`) blinda `enqueue`/`close`, então a geração **continua no servidor** até
persistir a resposta e o `responseDurationMs`. Isso vale **rodando sob Node** (`next start`), onde o
event loop mantém o trabalho assíncrono vivo após a resposta HTTP fechar.

**To Do:** tornar isso **garantido também em serverless** (onde o runtime pode matar a função assim
que a resposta termina). Desacoplar a geração do request HTTP:

- Disparar a geração como um **job** (fila/worker dedicado) que roda independente da conexão.
- O cliente acompanha por **stream/subscribe** enquanto está aberto; ao reabrir, lê o resultado já persistido.
- Medir o `responseDurationMs` no worker (mesma semântica de hoje).

Escopo intencionalmente fora do MVP — a decisão de virar serviço/worker é de deployment, habilitada
pelo desacoplamento dos bounded contexts.
