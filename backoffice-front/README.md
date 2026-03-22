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

Esse site está publicado em `https://bliss-front.pedrosatin.com` usando o serviço de hosting do github pages e fazendo um redirect do domínio customizado para a URL do github pages.

---

## Por que este front foi criado

O `backoffice-front` não era um requisito do case-1. A decisão de criá-lo foi intencional:

- **Integra os três projetos** — o case-2 pede automação de uma interface web. Sem o front, a automação seria uma chamada direta à API, o que desvirtuaria o propósito do case.
- **Facilita a avaliação** — avaliadores podem testar o fluxo completo pelo browser sem precisar de `curl`.
- **Custo baixo** — o front foi gerado majoritariamente com IA e não representou esforço significativo.
- **Controle de acesso** — com API e front no mesmo domínio próprio, é possível restringir o CORS da API para aceitar apenas este front.

---

## Limitações conhecidas

- O botão "Limpar filtros" reseta o seletor de ambiente para "Local" em vez de manter o ambiente atual selecionado.
- Dark mode não implementado. Poderia seguir a preferência do sistema operacional via `prefers-color-scheme`.
