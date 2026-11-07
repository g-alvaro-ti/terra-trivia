// Exibe a tela de jogo na página, chama a API do OpenTrivia e exibe as 5 perguntas na página.
function iniciar_jogo(){

}

// Exibe a tela de fim de jogo, e chama as APIs do Gemini e REST pra correção das perguntas.
function terminar_jogo(){

}

// ========================================
// Input das Chaves API e Rodízio
// ========================================

let chaves_gemini = []
let chave_gemini_atual = ""

// Adiciona a chave do input à lista de Chaves API, com validação
function adicionar_chave(chave){

}

// Redefine a Chave API usada atualmente para a próxima chave da lista
function obter_proxima_chave(){

}

// ========================================
// Inicio de jogo e exibição das perguntas
// ========================================

// Faz a chamada pra API do OpenTDB
// Recebe um parâmetro dificuldade, que pode ser easy, medium ou hard
// Retorna uma lista JSON de 5 perguntas e suas respectivas respostas
/* Formato:
{
  "response_code": 0,
  "results": [
    {
      "category": "Science & Nature",
      "type": "multiple",
      "difficulty": "easy",
      "question": "Enunciado da pergunta",
      "correct_answer": "Resposta correta",
      "incorrect_answers": [
        "Resposta errada 1",
        "Resposta errada 2",
        "Resposta errada 3"
      ]
    }
  ]
}
*/
// https://opentdb.com/api_config.php
async function chamar_api_trivia(dificuldade){
    
}

// Cria o elemento HTML da pergunta com o enunciado e alternativas
function criarCardPergunta(enunciado, alternativa_1, alternativa_2, alternativa_3, alternativa_4){

}

// ========================================
// Fim de jogo e correção
// ========================================

// Monta e retorna um prompt com o contexto da resposta do usuário, para ser usado com o Gemini
function criar_prompt_correcao(enunciado, resposta_certa, resposta_errada){
    const promptCorrecao = `

    `
}

// Faz a chamada pra API do Gemini usando o prompt passado no parâmetro, e retorna o texto gerado.
async function chamar_api_gemini(prompt){

}

// Faz a chamada pra API Rest, para retornar parte do conteúdo de uma página
async function chamar_api_wikipedia(){

}

// Cria o elemento HTML da correção na página
// O parâmetro acerto pode ser true ou false
// Se o usuario acertou, apenas exibe seu enunciado e resposta indicando que acertou
// Se o usuario errou, mostra a resposta correta e exibe uma explicação e um link para leitura
function criarCardCorrecao(enunciado, acerto, resposta_certa, resposta_errada, explicacao, link, link_texto){

}