# RecipeShare

Aplicação desenvolvida para trabalho de faculdade.

## Como funciona

Use o comando `git clone` para clonar o repositório.<br>

### Backend

1. Rode `npm install`.
2. Crie e configure um `.env` de acordo com seu banco de dados Firebase. Ele precisa conter uma coleção `recipes` e uma coleção `users`.<br>
3. No terminal, acesse a raiz do backend com `cd recipeshare-backend`.<br>
4. Use o comando `node index` para rodar a API em `localhost:3000`.<br>

### Frontend

1. Rode `npm install`.<br>
2. Rode `npm run build`.<br>
3. Use `npm install -g http-server` e depois `http-server` ou a extensão LiveServer no VSCode.<br>
4. Acesse o localhost na porta pré-definida, `8080` no `http-server` ou `5500` no LiveServer.<br>
5. Acesse o `index.html` e clique no link para cadastro. Após isso, retorne ao login e poderá acessar todas as funções.<br>
