# API Serverless na AWS

### Cenário

Você precisa criar uma API que suporte um processo de operação simples: gestão de solicitações (tickets/requests) que serão criadas e consultadas por um app ou backoffice.

### Requisitos técnicos

- Stack sugerida: Node.js + TypeScript + Serverless Framework
- Deploy na AWS (obrigatório): API Gateway + Lambda
- Persistência: DynamoDB (preferencial) ou RDS (aceito se justificar)
- Observabilidade: logs úteis (CloudWatch), e rastreabilidade por requestId

### Endpoints mínimos

1. POST /requests
   - Cria uma solicitação
   - Campos mínimos:
     - title (string, obrigatório)
     - description (string, opcional)
     - priority (LOW|MEDIUM|HIGH, obrigatório)
     - createdBy (email, obrigatório)
   - Deve validar payload e retornar 201 com id gerado
2. GET /requests/{id}
   Retorna a solicitação por id
   404 se não existir
3. GET /requests?createdBy=&status=
   - Lista com filtros simples (pelo menos 1 filtro funcionando)
   - Pode paginar (bônus)

### Boas práticas esperadas

- Separação de camadas (handler / service / repository)
- Tratamento de erros consistente (ex.: 400, 404, 500)
  -Variáveis de ambiente (sem secrets hardcoded)
- README com:
  - Como rodar local
  - Como fazer deploy
  - Exemplos de requests (curl ou Postman)

### Entregáveis

- Repositório com o código
- Evidência do deploy (ex.: URL do API Gateway + exemplo de chamada)
- Um serverless.yml (ou CDK/Terraform se preferir, mas tem que ficar bem claro)
