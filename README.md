# TerraTrivia

O TerraTrivia é um jogo rápido de perguntas e respostas sobre Ciências e Natureza que roda direto no navegador. No fim de cada partida, o jogo mostra explicações curtas para cada questão, comparações com a alternativa que você marcou e trechos reais da Wikipédia para ajudar a revisar o assunto.

O propósito da página é montar explicações, tabelas e cards informativos usando dados Webscraping de artigos da Wikipédia, junto com os dados das suas perguntas respondidas. Assim, o Gemini recebe esses dados e fornece uma explicação dinâmica pra cada uma das perguntas.

## Como funciona

Cada partida tem 5 perguntas de múltipla escolha em três níveis de dificuldade (fácil, médio e difícil), buscadas na API aberta da OpenTDB.

Enquanto você responde às perguntas, a página se comunica em segundo plano com um servidor local em Python (a API REST). Esse servidor consulta a Wikipédia para pegar resumos, imagens, links em português e dados das tabelas informativas dos artigos ligados à pergunta. Quando você erra uma questão, ele também busca informações sobre a opção que você escolheu para mostrar a diferença entre ela e a resposta certa.

Ao terminar as 5 perguntas, a página junta os dados da OpenTDB, as informações coletadas da Wikipédia e o seu desempenho (acertos, erros e tempo) e envia tudo para a API do Gemini. O resultado aparece em um resumo geral da partida e em cartões individuais para cada questão.

Se você quiser jogar sem configurar a chave do Gemini ou sem ligar o servidor em Python, o jogo também funciona normalmente no modo básico, mostrando apenas a correção simples no final.

## Como executar a API REST no computador

A API REST é opcional, mas necessária caso você queira ver os dados e comparações da Wikipédia no fim da partida (junto com uma chave da API do Gemini, que pode ser criada no [Google AI Studio](https://aistudio.google.com/api-keys) e adicionada na tela inicial).

Para rodar o servidor local:

1. Tenha o Python instalado no seu computador e baixe os arquivos deste repositório.
2. Abra o terminal e instale as bibliotecas usadas pelo servidor (você só precisa fazer isso uma vez):

```bash
pip install flask flask-cors requests beautifulsoup4
```

3. Entre na pasta `backend` do projeto e inicie o servidor:

```bash
cd backend
python app.py
```

4. Mantenha essa janela do terminal aberta enquanto joga. A própria página do TerraTrivia reconhece automaticamente quando ele está ativo.
