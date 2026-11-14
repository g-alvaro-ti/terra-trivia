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
async function terminarJogo() {
    // Oculta a tela de perguntas e exibe o encerramento
    ocultarElemento("#jogo", true);
    ocultarElemento("#fim-jogo", false);
    ocultarElemento("#stats", true);

    try {
        const correcoes = await processarCorrecoesComGemini(respostas_usuario);
        console.log("JSON com explicações e links da Wikipédia:", correcoes);

        // TODO: chamar a função criarCardCorrecao()
    } catch (erro) {
        // TODO: elaborar um elemento HTML pra exibir o erro
        console.error("Falha ao obter correções do Gemini:", erro);
    }
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
    if (!chave || typeof chave !== "string") {
        console.warn("Nenhuma chave informada.");
        return false;
    }

    const chaveFormatada = chave.trim();

    // Regex para Chaves API do Gemini do tipo legado (AIzaSy...) ou tipo novo (AQ....)
    const regexGoogleKey = /^(AIzaSy[a-zA-Z0-9_-]{33}|AQ\.[a-zA-Z0-9_-]{20,})$/;

    if (!regexGoogleKey.test(chaveFormatada)) {
        console.error("Falha ao adicionar: A chave não possui um formato válido do Gemini (deve iniciar com 'AIzaSy' ou 'AQ.').");
        return false;
    }

    // Evita chaves repetidas
    if (chaves_gemini.includes(chaveFormatada)) {
        console.warn("A chave informada já foi adicionada anteriormente.");
        return false;
    }

    // Insere na lista
    chaves_gemini.push(chaveFormatada);

    // Se for a primeira chave inserida, já define como a chave atual
    if (!chave_gemini_atual) {
        chave_gemini_atual = chaveFormatada;
    }

    console.log(`Chave API adicionada com sucesso! Total cadastradas: ${chaves_gemini.length}`);
    return true;
}

// Redefine a Chave API usada atualmente para a próxima chave da lista
function obterProximaChave(){
    if (chaves_gemini.length === 0) {
        console.warn("Nenhuma chave API cadastrada na lista.");
        chave_gemini_atual = "";
        return null;
    }

    // Localiza o índice da chave atual na lista
    const indiceAtual = chaves_gemini.indexOf(chave_gemini_atual);
    let proximoIndice;

    // Se a chave atual não estiver na lista ou for a primeira execução, pega o índice 0;
    // Caso contrário, avança 1 posição usando o operador módulo (%) para voltar ao índice 0 após a última
    if (indiceAtual === -1) {
        proximoIndice = 0
    }else{
        proximoIndice = (indiceAtual + 1) % chaves_gemini.length;
    }

    chave_gemini_atual = chaves_gemini[proximoIndice];

    console.log(`Rodízio: utilizando a chave ${proximoIndice + 1} de ${chaves_gemini.length}`);
    return chave_gemini_atual;
}

let botaoInserirChave = document.querySelector(".botao-inserir-chave");
let inputApiKey = document.querySelector(".input-api-key");

botaoInserirChave.addEventListener("click", () => {
    const chave = inputApiKey.value;
    const sucesso = adicionarChave(chave);

    if (sucesso) {
        inputApiKey.value = ""; // Limpa o campo após inserir com sucesso
    }
});

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
function criarPromptWikipedia(enunciado, resposta_certa, resposta_errada){
    const promptWikipedia = `

    `
    return promptWikipedia
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