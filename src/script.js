// Exibe a tela de jogo na página, chama a API do OpenTrivia e exibe a primeira pergunta
async function iniciarJogo() {
    console.log("Botão pressionado!");

    // Ajusta a visibilidade das telas
    ocultarElemento("#inicio", true);
    ocultarElemento("#fim-jogo", true);
    ocultarElemento("#jogo", false);
    ocultarElemento("#stats", false);

    respostas_usuario = []
    indice_pergunta_atual = 0;

    const dados = await chamarApiTrivia("medium");
    perguntas = dados.results;

    console.log("API processada!")
    exibirPerguntaAtual();
}

// Exibe a tela de fim de jogo, e chama as APIs do Gemini e REST pra correção das perguntas.
function terminarJogo(){

    console.log("Fim de jogo!");

    // Oculta a tela de perguntas e exibe o encerramento
    ocultarElemento("#jogo", true);
    ocultarElemento("#fim-jogo", false);
    ocultarElemento("#stats", true);

    console.log("Respostas registradas:");

    respostas_usuario.forEach(resposta => {

        const acertou = resposta.resposta_usuario === resposta.resposta_certa;

        console.log(`Pergunta ${resposta.numero}`);
        console.log("Enunciado:", resposta.enunciado);
        console.log("Resposta do usuário:", resposta.resposta_usuario);
        console.log("Resposta correta:", resposta.resposta_certa);
        console.log("Acertou?", acertou);

        console.log("----------------------");
    });

}

// ========================================
// Controle de visibilidade da página
// ========================================

function ocultarElemento(seletor, status = true){
    let elemento = document.querySelector(seletor)
    elemento.classList.toggle("hidden", status)
}

// Define o estado inicial da página assim que o script carrega
function configurarTelasIniciais() {
    ocultarElemento("#inicio", false);
    ocultarElemento("#jogo", true);
    ocultarElemento("#fim-jogo", true);
    ocultarElemento("#stats", true);
}

configurarTelasIniciais()

// ========================================
// Input das Chaves API e Rodízio
// ========================================

let chaves_gemini = []
let chave_gemini_atual = ""

// Adiciona a chave do input à lista de Chaves API, com validação
function adicionarChave(chave){

}

// Redefine a Chave API usada atualmente para a próxima chave da lista
function obterProximaChave(){

}

// ========================================
// Inicio de jogo e exibição das perguntas
// ========================================

perguntas = []
respostas_usuario = []

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
async function chamarApiTrivia(dificuldade = "easy"){
    if(dificuldade != "easy" && dificuldade != "medium" && dificuldade != "hard"){
        dificuldade = "easy"
    }
    const url = `https://opentdb.com/api.php?amount=5&category=17&difficulty=${dificuldade}&type=multiple`

    try {
        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        return dados;

    } catch (erro) {
        console.error("Erro ao buscar perguntas:", erro);
        throw erro;
    }
}

// Recebe os dados de uma pergunta respondida pelo usuário,
// E as adiciona à lista de respostas, contendo a resposta escolhida e a resposta correta
function registrarResposta(numero_pergunta, enunciado, resposta_usuario, resposta_certa){

    // Verifica se essa pergunta já possui uma resposta registrada
    const indice = respostas_usuario.findIndex(resposta => resposta.numero === numero_pergunta);

    const nova_resposta = {
        numero: numero_pergunta,
        enunciado: enunciado,
        resposta_usuario: resposta_usuario,
        resposta_certa: resposta_certa
    };

    // Se já respondeu, atualiza a resposta
    if(indice !== -1){
        respostas_usuario[indice] = nova_resposta;
    }
    // Caso contrário, adiciona ao array
    else{
        respostas_usuario.push(nova_resposta);
    }
}

function processarPerguntas(perguntas){
    let numero_pergunta = 1
    perguntas.results.forEach((pergunta, index) => {
        console.log(`Pergunta ${index + 1}:`);
        console.log(pergunta.question);
        console.log("Resposta correta:", pergunta.correct_answer);
        console.log("Respostas incorretas:", pergunta.incorrect_answers);
        console.log("----------------------");

        const lista_alternativas = [];

        // Sorteia a posição da resposta correta
        const indice_resposta_certa = Math.floor(Math.random() * 4);

        lista_alternativas[indice_resposta_certa] = pergunta.correct_answer;

        // Distribui as respostas incorretas
        let indice_incorretas = 0;

        for(let i = 0; i < 4; i++){
            if(i !== indice_resposta_certa){
                lista_alternativas[i] = pergunta.incorrect_answers[indice_incorretas];
                indice_incorretas++;
            }
        }

        // Cria o elemento HTML na página
        criarCardPergunta(
            pergunta.question,
            lista_alternativas,
            numero_pergunta,
            pergunta.correct_answer
        );
        numero_pergunta++
    });
}

// Cria o elemento HTML da pergunta com o enunciado e alternativas
function criarCardPergunta(enunciado, lista_alternativas, numero_pergunta, resposta_certa) {
    const secaoJogo = document.querySelector("#jogo");
    const pergunta = document.createElement("div");
    pergunta.classList.add("pergunta")

    const titulo = document.createElement("h2");
    titulo.classList.add("enunciado-pergunta")
    // Usando innerHTML para decodificar entidades HTML da OpenTDB (ex: &quot;, &#039;)
    titulo.innerHTML = enunciado;

    const respostas = document.createElement("div");
    respostas.classList.add("respostas")

    lista_alternativas.forEach((alternativa, index) => {
        const label = document.createElement("label");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `pergunta-${numero_pergunta}`;
        input.value = `r${index + 1}`;

         // Executa quando o usuário seleciona uma alternativa
        input.addEventListener("change", () => {

            registrarResposta(
                numero_pergunta,
                enunciado,
                alternativa,
                resposta_certa
            );

            // Delay de 500ms para o usuário ver a seleção antes de trocar a tela
            setTimeout(() => {
                indice_pergunta_atual++;
                if (indice_pergunta_atual < perguntas.length) {
                    exibirPerguntaAtual();
                } else {
                    terminarJogo();
                }
            }, 500);
        });

        label.appendChild(input);
        // innerHTML para também decodificar entidades especiais nas alternativas
        const textoAlternativa = document.createElement("span");
        textoAlternativa.innerHTML = " " + alternativa;
        label.appendChild(textoAlternativa);

        respostas.appendChild(label);
    })

    // Monta a estrutura HTML
    pergunta.appendChild(titulo);
    pergunta.appendChild(respostas);

    // Adiciona a pergunta à seção do jogo
    secaoJogo.appendChild(pergunta);
}

// Renderiza somente a pergunta correspondente ao índice atual
function exibirPerguntaAtual() {
    const secaoJogo = document.querySelector("#jogo");
    secaoJogo.innerHTML = ""; // Limpa a pergunta anterior da tela

    // Se já respondeu todas, encerra o jogo
    if (indice_pergunta_atual >= perguntas.length) {
        terminarJogo();
        return;
    }

    const pergunta = perguntas[indice_pergunta_atual];
    const numero_pergunta = indice_pergunta_atual + 1;

    // Sorteia a posição da alternativa correta entre as 4
    const lista_alternativas = [...pergunta.incorrect_answers];
    const indice_resposta_certa = Math.floor(Math.random() * 4);
    lista_alternativas.splice(indice_resposta_certa, 0, pergunta.correct_answer);

    // Cria o card da pergunta atual
    criarCardPergunta(
        pergunta.question,
        lista_alternativas,
        numero_pergunta,
        pergunta.correct_answer
    );
}

// ========================================
// Fim de jogo e correção
// ========================================

// Monta e retorna um prompt com o contexto da resposta do usuário, para ser usado com o Gemini
function criarPromptCorrecao(enunciado, resposta_certa, resposta_errada){
    const promptCorrecao = `

    `
}

// Faz a chamada pra API do Gemini usando o prompt passado no parâmetro, e retorna o texto gerado.
async function chamarApiGemini(prompt){

}

// Faz a chamada pra API Rest, para retornar parte do conteúdo de uma página
async function chamarApiWikipedia(){

}

// Cria o elemento HTML da correção na página
// O parâmetro acerto pode ser true ou false
// Se o usuario acertou, apenas exibe seu enunciado e resposta indicando que acertou
// Se o usuario errou, mostra a resposta correta e exibe uma explicação e um link para leitura
function criarCardCorrecao(enunciado, acerto, resposta_certa, resposta_errada, explicacao, link, link_texto){

}