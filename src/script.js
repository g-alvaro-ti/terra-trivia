const FLASK_API_URL = "http://127.0.0.1:5000/api/wiki-context";
const FLASK_HEALTH_URL = "http://127.0.0.1:5000/api/health";
dados_scraping = []

let dificuldade_selecionada = "easy";
let api_rest_ativa = false;
let iniciando_jogo = false;

// Exibe a tela de jogo na página, chama a API do OpenTrivia e exibe a primeira pergunta
async function iniciarJogo() {
    // Impede o jogo de iniciar novamente enquanto essa função ainda está executando
    if (iniciando_jogo) {
        return;
    }

    const botaoIniciar = document.querySelector(".botao-iniciar-jogo");
    iniciando_jogo = true;
    if (botaoIniciar) {
        botaoIniciar.disabled = true;
    }

    dificuldade_selecionada = obterDificuldadeSelecionada();

    configurarTelaCarregamento(
        "Carregando partida...",
        "Buscando perguntas na API do OpenTrivia."
    );
    exibirTelaCarregamento(true);

    respostas_usuario = []
    dados_scraping = [];
    indice_pergunta_atual = 0;

    try {
        // Espera a verificação da API Rest e a resposta da API do OpenTrivia
        const [restAtiva, dados] = await Promise.all([
            verificarApiRestAtiva(),
            chamarApiTrivia(dificuldade_selecionada)
        ]);
        perguntas = dados.results;

        // Ajusta a visibilidade das telas
        exibirTelaCarregamento(false);
        ocultarElemento("#header", true);
        ocultarElemento("#fim-jogo", true);
        ocultarElemento("#jogo", false);
        ocultarElemento("#stats", false);

        // Exibe um aviso caso a API Rest esteja ausente ou não tenha chaves do Gemini
        exibirAvisoConexoes(restAtiva, verificarChaveApiCadastrada());

        iniciarCronometro();
        atualizarStatsRodape();
        exibirPerguntaAtual();
    } catch (erro) {
        exibirTelaCarregamento(false);
        configurarTelasIniciais();
        alert(`Não foi possível iniciar a partida (${erro.message}). Tente novamente.`);
    } finally {
        iniciando_jogo = false;
        if (botaoIniciar) {
            botaoIniciar.disabled = false;
        }
    }
}

// Volta para a tela inicial para iniciar uma nova partida
function jogarNovamente() {
    pararCronometro();

    const avisoConexoes = document.querySelector("#aviso-conexoes");
    if (avisoConexoes) {
        avisoConexoes.remove();
    }

    document.querySelector("#jogo").innerHTML = "";
    document.querySelector("#resumo-desempenho").innerHTML = "";
    document.querySelector("#lista-correcoes").innerHTML = "";
    ocultarElemento("#status-fim-jogo", true);

    respostas_usuario = [];
    dados_scraping = [];
    perguntas = [];
    indice_pergunta_atual = 0;
    inicio_partida_ms = 0;

    configurarTelasIniciais();
}

// Exibe a tela de fim de jogo, e chama as APIs do Gemini e REST pra correção das perguntas.
async function terminarJogo() {
    pararCronometro();

    const statusElemento = document.querySelector("#status-fim-jogo");
    const resumoElemento = document.querySelector("#resumo-desempenho");
    const listaElemento = document.querySelector("#lista-correcoes");
    const tempoTotalSegundos = inicio_partida_ms
        ? Number(((Date.now() - inicio_partida_ms) / 1000).toFixed(1))
        : 0;

    resumoElemento.innerHTML = "";
    listaElemento.innerHTML = "";

    // Se faltar API Rest ou chave do Gemini, exibe apenas as correções básicas
    if (!api_rest_ativa || !verificarChaveApiCadastrada()) {
        ocultarElemento("#jogo", true);
        ocultarElemento("#fim-jogo", false);
        ocultarElemento("#stats", true);
        ocultarElemento("#status-fim-jogo", true);
        renderizarCorrecoesSemApi(respostas_usuario, tempoTotalSegundos);
        return;
    }

    configurarTelaCarregamento(
        "Gerando correções...",
        "Finalizando coleta de dados na Wikipédia e consultando o Gemini."
    );
    exibirTelaCarregamento(true);

    try {
        // Aguarda as chamadas de scraping em paralelo iniciadas durante o jogo
        const contextosWiki = await Promise.all(dados_scraping);

        // Anexa os dados do scraping de cada questão antes de chamar o Gemini
        const respostasComWiki = respostas_usuario.map((resp) => {
            const wiki = contextosWiki.find(w => w && w.numero === resp.numero);
            return {
                ...resp,
                wiki_correta: wiki ? wiki.contexto_correta : { encontrado: false },
                wiki_usuario: wiki ? wiki.contexto_usuario : { encontrado: false }
            };
        });

        // Chama o Gemini
        const analiseGemini = await processarCorrecoesComGemini(respostasComWiki, {
            dificuldade: dificuldade_selecionada,
            tempo_total_segundos: tempoTotalSegundos
        });

        exibirTelaCarregamento(false);
        ocultarElemento("#fim-jogo", false);
        ocultarElemento("#status-fim-jogo", true);
        renderizarResumoDesempenho(analiseGemini?.resumo_geral, respostasComWiki);
        renderizarCardsCorrecao(analiseGemini?.correcoes || [], respostasComWiki);
    } catch (erro) {
        exibirTelaCarregamento(false);
        ocultarElemento("#fim-jogo", false);
        ocultarElemento("#status-fim-jogo", false);
        statusElemento.textContent = `Não foi possível obter a análise completa (${erro.message}). Exibindo correções básicas:`;
        renderizarCorrecoesSemApi(respostas_usuario, tempoTotalSegundos);
    }
}

// ========================================
// Controle de visibilidade da página
// ========================================

function ocultarElemento(seletor, status = true){
    let elemento = document.querySelector(seletor)
    elemento.classList.toggle("hidden", status)
}

// Configura o título e a mensagem exibidos na tela de carregamento
function configurarTelaCarregamento(titulo = "Carregando...", mensagem = "") {
    const tituloElemento = document.querySelector("#carregamento-titulo");
    const mensagemElemento = document.querySelector("#carregamento-mensagem");

    if (tituloElemento) {
        tituloElemento.textContent = titulo;
    }
    if (mensagemElemento) {
        mensagemElemento.textContent = mensagem;
        ocultarElemento("#carregamento-mensagem", !mensagem);
    }
}

// Exibe exclusivamente a tela de carregamento (ocultando o restante da página) ou a oculta
function exibirTelaCarregamento(exibir = true) {
    if (exibir) {
        ocultarElemento("#header", true);
        ocultarElemento("#jogo", true);
        ocultarElemento("#fim-jogo", true);
        ocultarElemento("#stats", true);

        const avisoConexoes = document.querySelector("#aviso-conexoes");
        if (avisoConexoes) {
            avisoConexoes.classList.add("hidden");
        }

        ocultarElemento("#carregamento", false);
    } else {
        ocultarElemento("#carregamento", true);

        const avisoConexoes = document.querySelector("#aviso-conexoes");
        if (avisoConexoes) {
            avisoConexoes.classList.remove("hidden");
        }
    }
}

// Define o estado inicial da página assim que o script carrega
function configurarTelasIniciais() {
    ocultarElemento("#header", false);
    ocultarElemento("#jogo", true);
    ocultarElemento("#fim-jogo", true);
    ocultarElemento("#stats", true);
    ocultarElemento("#carregamento", true);
}

configurarTelasIniciais()

// ========================================
// Atualização de dados do jogo no rodapé 
// ========================================
let inicio_partida_ms = 0;
let inicio_pergunta_ms = 0;
let intervalo_timer = null;

function atualizarStatsRodape() {
    const total = perguntas.length || 5;
    const numeroExibido = Math.min(indice_pergunta_atual + 1, total);
    const acertos = respostas_usuario.filter(r => r.resposta_usuario === r.resposta_certa).length;
    const erros = respostas_usuario.length - acertos;
    const segundos = inicio_partida_ms ? ((Date.now() - inicio_partida_ms) / 1000).toFixed(1) : "0.0";

    document.querySelector("#stats .perguntas").textContent = `Pergunta: ${numeroExibido}/${total}`;
    document.querySelector("#stats .acertos").textContent = `Perguntas acertadas: ${acertos}`;
    document.querySelector("#stats .erros").textContent = `Perguntas erradas: ${erros}`;
    document.querySelector("#stats .tempo").textContent = `Tempo total: ${segundos}s`;
}

function iniciarCronometro() {
    pararCronometro();
    inicio_partida_ms = Date.now();
    inicio_pergunta_ms = Date.now();
    intervalo_timer = setInterval(atualizarStatsRodape, 100);
}

function pararCronometro() {
    if (intervalo_timer) {
        clearInterval(intervalo_timer);
        intervalo_timer = null;
    }
}
// ========================================
// Input das Chaves API e Rodízio
// ========================================

let chaves_gemini = []
let chave_gemini_atual = ""

// Exibe na página as mensagens de validação/cadastro da chave API
function exibirMensagemChave(texto, tipo = "aviso") {
    const secaoApi = document.querySelector(".selecionar-api");
    if (!secaoApi) return;

    let elemento = secaoApi.querySelector(".mensagem-chave");
    if (!elemento) {
        elemento = document.createElement("p");
        secaoApi.appendChild(elemento);
    }

    elemento.className = `mensagem-chave mensagem-chave-${tipo}`;
    elemento.textContent = texto;
}

// Adiciona a chave do input à lista de Chaves API, com validação
function adicionarChave(chave){
    const chaveFormatada = typeof chave === "string" ? chave.trim() : "";

    if (!chaveFormatada) {
        exibirMensagemChave("Nenhuma chave informada.", "aviso");
        return false;
    }

    // Regex para Chaves API do Gemini do tipo legado (AIzaSy...) ou tipo novo (AQ....)
    const regexGoogleKey = /^(AIzaSy[a-zA-Z0-9_-]{33}|AQ\.[a-zA-Z0-9_-]{20,})$/;

    if (!regexGoogleKey.test(chaveFormatada)) {
        exibirMensagemChave("Falha ao adicionar: A chave não possui um formato válido do Gemini (deve iniciar com 'AIzaSy' ou 'AQ.').", "erro");
        return false;
    }

    // Evita chaves repetidas
    if (chaves_gemini.includes(chaveFormatada)) {
        exibirMensagemChave("A chave informada já foi adicionada anteriormente.", "aviso");
        return false;
    }

    // Insere na lista
    chaves_gemini.push(chaveFormatada);

    // Se for a primeira chave inserida, já define como a chave atual
    if (!chave_gemini_atual) {
        chave_gemini_atual = chaveFormatada;
    }

    exibirMensagemChave(`Chave API adicionada com sucesso! Total cadastradas: ${chaves_gemini.length}.`, "sucesso");
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
    const statusChaves = document.querySelector("#status-chaves");

    if (sucesso) {
        inputApiKey.value = "";
        statusChaves.textContent = `Chaves cadastradas: ${chaves_gemini.length} (rodízio ativo).`;
    } else if (chaves_gemini.length === 0) {
        statusChaves.textContent = "Nenhuma chave cadastrada (0).";
    } else {
        statusChaves.textContent = `Chaves cadastradas: ${chaves_gemini.length} (rodízio ativo).`;
    }
});

function obterDificuldadeSelecionada() {
    const selecionado = document.querySelector('input[name="dificuldade"]:checked');
    return selecionado ? selecionado.value : "medium";
}

// ========================================
// Verificação de disponibilidade da API Rest e Gemini
// ========================================


// Verifica se tem pelo menos uma chave API do Gemini cadastrada
function verificarChaveApiCadastrada() {
    return Array.isArray(chaves_gemini) && chaves_gemini.length > 0;
}

// Verifica se a API Rest está em execução
async function verificarApiRestAtiva() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
        const resp = await fetch(FLASK_HEALTH_URL, {
            method: "GET",
            signal: controller.signal
        });
        if (!resp.ok) {
            api_rest_ativa = false;
            return false;
        }
        const dados = await resp.json();
        api_rest_ativa = dados?.status === "ok";
        return api_rest_ativa;
    } catch (erro) {
        api_rest_ativa = false;
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Cria e exibe um elemento de aviso caso a API Rest ou a chave do Gemini não estejam disponíveis
function exibirAvisoConexoes(restAtiva, temChave) {
    const avisoAnterior = document.querySelector("#aviso-conexoes");
    if (avisoAnterior) {
        avisoAnterior.remove();
    }

    if (restAtiva && temChave) {
        return;
    }

    // Constroi uma string dependendo do que está ausente
    const motivos = [];
    if (!restAtiva) {
        motivos.push("A API Rest (Flask) não está em execução.");
    }
    if (!temChave) {
        motivos.push("Nenhuma chave API do Gemini foi cadastrada.");
    }

    const aviso = document.createElement("div");
    aviso.id = "aviso-conexoes";
    aviso.className = "aviso-conexoes";
    aviso.innerHTML = `<strong>Aviso:</strong> ${motivos.join(" ")} O jogo funcionará no modo básico, sem dados da Wikipédia e sem análise do Gemini.`;

    const header = document.querySelector("header");
    if (header) {
        header.insertAdjacentElement("afterend", aviso);
    } else {
        document.body.prepend(aviso);
    }
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
function registrarResposta(numero_pergunta, enunciado, resposta_usuario, resposta_certa, lista_alternativas) {

    // Verifica se essa pergunta já possui uma resposta registrada
    const indice = respostas_usuario.findIndex(resposta => resposta.numero === numero_pergunta);

    const tempo_segundos = Number(((Date.now() - inicio_pergunta_ms) / 1000).toFixed(1));
    const nova_resposta = {
        numero: numero_pergunta,
        dificuldade: dificuldade_selecionada,
        categoria: "Science & Nature",
        enunciado,
        alternativas: lista_alternativas,
        resposta_usuario,
        resposta_certa,
        tempo_segundos
    };

    // Se já respondeu, atualiza a resposta
    if(indice !== -1){
        respostas_usuario[indice] = nova_resposta;
    }
    // Caso contrário, adiciona ao array
    else{
        respostas_usuario.push(nova_resposta);
    }

    // Dispara o web scraping em paralelo apenas se a API Rest e a chave do Gemini estiverem disponíveis
    if (api_rest_ativa && verificarChaveApiCadastrada()) {
        dados_scraping[numero_pergunta - 1] = chamarApiFlaskWiki({
            numero: numero_pergunta,
            enunciado,
            resposta_certa,
            resposta_usuario
        });
    }

    atualizarStatsRodape();
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
            // Desabilita todas as alternativas para evitar múltiplos cliques durante a mudança de pergunta
            respostas.querySelectorAll('input[type="radio"]').forEach((radio) => {
                radio.disabled = true;
            });

            label.classList.add(
                alternativa === resposta_certa ? "alternativa-certa" : "alternativa-errada"
            );

            registrarResposta(
                numero_pergunta,
                enunciado,
                alternativa,
                resposta_certa,
                lista_alternativas
            );

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
    inicio_pergunta_ms = Date.now()
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

// Faz a chamada pra API Rest, para retornar o conteúdo extraído de uma página da Wikipdeia a partir dos dados de uma questão
async function chamarApiFlaskWiki(itemQuestao) {
    try {
        const resp = await fetch(FLASK_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemQuestao)
        });
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
        }
        return await resp.json();
    } catch (erro) {
        console.warn(`Falha ao consultar Flask para questão ${itemQuestao.numero}:`, erro);
        return {
            numero: itemQuestao.numero,
            contexto_correta: { encontrado: false },
            contexto_usuario: { encontrado: false }
        };
    }
}

function renderizarResumoDesempenho(resumo, lista) {
    const container = document.querySelector("#resumo-desempenho");
    const total = lista.length;
    const acertos = lista.filter(i => i.resposta_usuario === i.resposta_certa).length;
    const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;

    container.innerHTML = `
        <div class="widget-resumo">
            <div class="resumo-cabecalho">
                <span class="badge-nivel">${resumo?.nivel_dominio || "Resumo"}</span>
                <strong>${acertos}/${total} acertos (${percentual}%)</strong>
            </div>
            <div class="barra-progresso">
                <div class="barra-preenchimento" style="width: ${percentual}%"></div>
            </div>
            <p class="diagnostico-geral">${resumo?.diagnostico_curto || ""}</p>
            <div class="chips-revisao">
                ${(resumo?.topicos_revisar || []).map(t => `<span class="chip-alerta">Revisar: ${t}</span>`).join("")}
            </div>
        </div>
    `;
}

function renderizarCardsCorrecao(correcoes, respostasComWiki) {
    const container = document.querySelector("#lista-correcoes");

    respostasComWiki.forEach((item) => {
        const analise = correcoes.find(c => c.numero === item.numero) || {};
        const acertou = item.resposta_usuario === item.resposta_certa;
        const wikiCerta = item.wiki_correta || {};
        const tituloLink = wikiCerta.pt?.disponivel ? wikiCerta.pt.titulo : wikiCerta.titulo_en;
        const urlLink = wikiCerta.pt?.disponivel ? wikiCerta.pt.url : wikiCerta.url_en;
        const resumoWiki = wikiCerta.pt?.disponivel ? wikiCerta.pt.resumo : wikiCerta.resumo_en;

        const linhasTabela = (analise.comparacao_tabela || []).map(linha => `
            <tr>
                <th>${linha.atributo}</th>
                <td>${linha.valor_usuario}</td>
                <td>${linha.valor_correto}</td>
            </tr>
        `).join("");

        const card = document.createElement("article");
        card.className = `pergunta-correcao ${acertou ? "card-acerto" : "card-erro"}`;

        card.innerHTML = `
            <div class="card-topo">
                <span class="badge-status ${acertou ? "badge-ok" : "badge-err"}">
                    ${acertou ? "Acertou" : "Errou"} · ${item.tempo_segundos}s
                </span>
                ${wikiCerta.shortdescription ? `<span class="chip-meta">${wikiCerta.shortdescription}</span>` : ""}
            </div>

            <h3 class="enunciado-pergunta">${item.numero}. ${item.enunciado}</h3>

            <div class="respostas-resumo">
                <span class="resp-user">Sua resposta: <strong>${item.resposta_usuario}</strong></span>
                <br>
                <span class="resp-certa">Resposta correta: <strong>${item.resposta_certa}</strong></span>
            </div>

            <p class="explicacao-gemini">${analise.explicacao_objetiva || ""}</p>

            ${linhasTabela ? `
                <table class="tabela-comparativa">
                    <thead>
                        <tr>
                            <th>Atributo (Infobox)</th>
                            <th>${acertou ? "Contexto" : "Sua escolha"}</th>
                            <th>Resposta certa</th>
                        </tr>
                    </thead>
                    <tbody>${linhasTabela}</tbody>
                </table>
            ` : ""}

            <div class="wiki-box">
                ${wikiCerta.imagem_url ? `<img src="${wikiCerta.imagem_url}" alt="${tituloLink || ""}" class="wiki-thumb">` : ""}
                <div class="wiki-texto">
                    ${resumoWiki ? `<p class="wiki-resumo">${resumoWiki}</p>` : ""}
                    ${analise.secao_recomendada ? `<span class="chip-secao">Explorar seção: ${analise.secao_recomendada}</span>` : ""}
                    ${urlLink ? `<a href="${urlLink}" target="_blank" rel="noopener noreferrer" class="wiki-link">Ler na Wikipédia: ${tituloLink}</a>` : ""}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// Exibe o resumo e os cards de correção sem depender da API Rest nem do Gemini
function renderizarCorrecoesSemApi(listaRespostas, tempoTotalSegundos = 0) {
    const resumoContainer = document.querySelector("#resumo-desempenho");
    const listaContainer = document.querySelector("#lista-correcoes");

    const total = listaRespostas.length;
    const acertos = listaRespostas.filter(i => i.resposta_usuario === i.resposta_certa).length;
    const erros = total - acertos;
    const percentual = total > 0 ? Math.round((acertos / total) * 100) : 0;

    resumoContainer.innerHTML = `
        <div class="widget-resumo">
            <div class="resumo-cabecalho">
                <span class="badge-nivel">Modo Básico</span>
                <strong>${acertos}/${total} acertos (${percentual}%)</strong>
            </div>
            <div class="barra-progresso">
                <div class="barra-preenchimento" style="width: ${percentual}%"></div>
            </div>
            <p class="diagnostico-geral">
                Dificuldade: ${dificuldade_selecionada} · Erros: ${erros} · Tempo total: ${tempoTotalSegundos}s
            </p>
        </div>
    `;

    if (total === 0) {
        listaContainer.innerHTML = `<p>Nenhuma pergunta foi respondida nesta partida.</p>`;
        return;
    }

    listaRespostas.forEach((item) => {
        const acertou = item.resposta_usuario === item.resposta_certa;
        const card = document.createElement("article");
        card.className = `pergunta-correcao ${acertou ? "card-acerto" : "card-erro"}`;

        card.innerHTML = `
            <div class="card-topo">
                <span class="badge-status ${acertou ? "badge-ok" : "badge-err"}">
                    ${acertou ? "Acertou" : "Errou"} · ${item.tempo_segundos}s
                </span>
            </div>

            <h3 class="enunciado-pergunta">${item.numero}. ${item.enunciado}</h3>

            <div class="respostas-resumo">
                <span class="resp-user">Sua resposta: <strong>${item.resposta_usuario}</strong></span>
                <br>
                <span class="resp-certa">Resposta correta: <strong>${item.resposta_certa}</strong></span>
            </div>
        `;

        listaContainer.appendChild(card);
    });
}