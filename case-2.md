# Automação com Playwright (redução de trabalho humano)

### Cenário (operacional) - Escolher um portal e tentar aplicar algum cenário descrito.

Hoje existe uma pessoa que todo dia precisa executar um fluxo de **conferência/cadastro/atualização** em um sistema web (interno ou SaaS).
Queremos automatizar isso com Playwright, com foco em confiabilidade.

### Opção de fluxo

O candidato pode escolher um fluxo relevante como:

- Conferência de pedidos: acessar página, filtrar “pendentes”, abrir detalhes, validar campos obrigatórios e marcar como “revisado”
- Cadastro em backoffice: criar registros a partir de uma planilha/JSON (ex.: produtos, clientes, pedidos)
- Extração de dados: acessar relatórios e exportar/raspar dados para gerar um arquivo JSON/CSV
- Reprocesso de falhas: buscar itens em erro, abrir, tentar novamente e registrar resultado

### Requisitos técnicos Playwright

- Node.js + Playwright
- Rodar em modo headless e também com UI (quando necessário)
- Estrutura mínima:
  - Page Objects ou uma arquitetura clara de steps
  - Retries controlados (onde fizer sentido)
  - Screenshots e/ou trace em caso de falha
  - Relatório simples (HTML do Playwright ou JSON final)

### Entregáveis

- Código Playwright
- README com:
  - como instalar
  - como configurar .env (ex.: URL, credenciais dummy, etc.)
  - como rodar
- Evidência de execução:
  - relatório ou prints/trace
  - arquivo de saída (json/csv)
