## Repo com três projetos integrados

Este repositório contém a solução para os cases da Bliss. Os três projetos formam uma "caixa fechada":

```
backoffice-api  ←  backoffice-front  ←  playwright-automation
     (case-1)          (extra)                 (case-2)
```

- **`backoffice-api`** — API serverless (AWS CDK + Lambda + DynamoDB). Descrito em [case-1.md](./case-1.md).
- **`backoffice-front`** — Front-end estático que consome a API. Não era requisito, mas foi criado intencionalmente (veja abaixo).
- **`playwright-automation`** — Automação RPA que opera o front para criar requests em lote. Descrito em [case-2.md](./case-2.md).

---

## Por que o front foi criado

O `backoffice-front` não era um requisito do case-1, mas sua criação foi uma decisão consciente por três motivos:

1. **Integração entre os cases** — o case-2 pede automação de uma interface web, não uma chamada direta à API. O front é o alvo real da automação.
2. **Facilita a avaliação** — avaliadores podem testar o fluxo completo pelo browser sem precisar de `curl`.
3. **Custo baixo** — o front foi gerado majoritariamente com IA e não representou esforço significativo.

---

## Como avaliar o projeto

### Ambiente publicado (mais rápido)

- Front: `https://bliss-front.pedrosatin.com`
- API: `https://bliss-api.pedrosatin.com`

### Rodando localmente

**IMPORTANTE:**
Para rodar **local**, você PRECISA ter o **Docker** instalado e rodando, para que o dev-server consiga se conectar ao DynamoDB local.
Você PRECISA ter o **Node** instalado para rodar os scripts npm.
E também PRECISA do **playwright browser** instalado para rodar a automação localmente `npx playwright install chromium`

E o **AWS CLI **configurado para deploy (opcional, apenas para quem quiser testar o deploy na sua própria conta).

Execute cada projeto em um terminal separado:

```bash
# Terminal 1 — API em localhost:3000
cd backoffice-api && cp .env.example .env && npm i && npm run dev

# Terminal 2 — Front em localhost:4173
cd backoffice-front && npx live-server --port=4173

# Na porta 4173, o front consome a API local automaticamente. Você pode testar o fluxo completo pelo browser.

# Terminal 3 — Automação apontando para o front local
cd playwright-automation && cp .env.example .env && npm i && npm run dev
```

O front detecta automaticamente que está rodando em `localhost` e usa a API local por padrão.
A automação já aponta para `localhost:4173` por padrão ao copiar o `.env.example`.

Para rodar a automação contra o ambiente em produção (sem precisar subir a API ou o front localmente):

```bash
cd playwright-automation && npm i && npm run dev:prod
```

Lembrando que é necessário ter o playwright browser instalado para rodar o comando acima.

Recomendo rodar um `npm run clean` após testar o ambiente local do playwright, para limpar os arquivos de teste gerados.

Para detalhes de cada projeto, e também evidências, consulte os READMEs individuais:

1. [`README backoffice-api`](./backoffice-api/README.md)
2. [`README backoffice-front`](./backoffice-front/README.md)
3. [`README playwright-automation`](./playwright-automation/README.md)
