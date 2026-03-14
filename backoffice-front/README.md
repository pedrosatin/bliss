# Front-end estático para `case-1`

Front simples em `HTML/CSS/JS` para consumir a API do `backoffice-api`.

## Páginas

- `index.html`: lista requests com filtros por `createdBy` e `status`
- `create.html`: cria uma nova request via `POST /requests`
- `request.html?id=<id>`: mostra os detalhes da request por id

## Configuração da API

Edite `backoffice-front/assets/config.js`:

- `LOCAL_API_BASE_URL`: usado quando o front roda em `localhost`
- `DEPLOY_API_BASE_URL`: usado quando o front roda em domínio publicado

Exemplo:

```js
const LOCAL_API_BASE_URL = 'http://localhost:3000'
const DEPLOY_API_BASE_URL = 'https://bliss-api.pedrosatin.com/requests/'
```

O front aceita tanto a URL raiz da API quanto a URL já terminando em `/requests/`.

### Alternar entre `local` e `prod`

No front existe um seletor simples de ambiente com duas opções:

- `Local`: usa `http://localhost:3000`
- `Produção`: usa `https://bliss-api.pedrosatin.com/requests/`

O padrão do projeto é `Produção`.

### Override dinâmico com `localStorage`

Você não precisa editar o arquivo toda vez. O front lê a chave `bliss.frontend.apiBaseUrl` do `localStorage`.

Exemplos no console do navegador:

```js
localStorage.setItem('bliss.frontend.apiBaseUrl', 'local')
location.reload()
```

```js
localStorage.setItem('bliss.frontend.apiBaseUrl', 'deploy')
location.reload()
```

```js
localStorage.setItem(
  'bliss.frontend.apiBaseUrl',
  'https://bliss-api.pedrosatin.com/requests/',
)
location.reload()
```

Para voltar ao comportamento padrão do ambiente:

```js
localStorage.removeItem('bliss.frontend.apiBaseUrl')
location.reload()
```

Regras:

- `local` usa `http://localhost:3000`
- `deploy` ou `prod` usa a URL publicada da AWS
- qualquer outra string é tratada como URL customizada

## Rodando localmente

Você pode servir os arquivos com qualquer servidor estático. Exemplo com `live-server`:

```bash
cd /Users/satin/Work/bliss/backoffice-front
npx live-server --port=4173 --host=localhost --no-browser
```

Depois acesse:

- `http://localhost:4173/`
- `http://localhost:4173/create.html`
- `http://localhost:4173/request.html?id=<id>`

## Deploy estático

### GitHub Pages

- o workflow está em `.github/workflows/deploy-backoffice-front.yml`
- ele publica somente a pasta `backoffice-front/`
- ele só roda em `push` para `main` quando houver mudanças em `backoffice-front/**`
- mudanças apenas em `backoffice-api/`, `playwright-automation/` ou outros diretórios não disparam esse deploy
- também existe `workflow_dispatch` para disparo manual quando você quiser
- como as páginas são arquivos reais (`index.html`, `create.html`, `request.html`), não há dependência de SPA routing

Passos no repositório:

- em `Settings > Pages`, selecione `GitHub Actions` como source
- faça merge/push em `main` alterando algo dentro de `backoffice-front/`
- o artifact publicado será exatamente o conteúdo estático dessa pasta

### Cloudflare Pages

- conecte o repositório e configure o diretório de output como `backoffice-front`
- ajuste `DEPLOY_API_BASE_URL` antes do deploy
- aponte o subdomínio desejado no painel da Cloudflare

## Observação

A API atual não oferece `PUT` ou `PATCH`, então a tela por id é de detalhe. Se você adicionar update no backend, a `request.html` pode ser adaptada para edição com poucas mudanças.
