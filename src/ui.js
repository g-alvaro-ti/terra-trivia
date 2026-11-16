// ========================================
// ui.js - Melhorias visuais, acessibilidade e observadores de DOM
// Mantém script.js, action.js e prompt.js intactos.
// ========================================

(function () {
    const secaoCarregamento = document.querySelector("#carregamento");
    const secaoJogo = document.querySelector("#jogo");
    const listaCorrecoes = document.querySelector("#lista-correcoes");
    const inputApiKey = document.querySelector(".input-api-key");
    const botaoInserirChave = document.querySelector(".botao-inserir-chave");

    // 1. Bloqueio de scroll na tela de carregamento
    function sincronizarTravaScroll() {
        if (!secaoCarregamento) return;
        const visivel = !secaoCarregamento.classList.contains("hidden");
        document.body.classList.toggle("travar-scroll", visivel);
    }

    if (secaoCarregamento) {
        sincronizarTravaScroll();
        const obsCarregamento = new MutationObserver(sincronizarTravaScroll);
        obsCarregamento.observe(secaoCarregamento, {
            attributes: true,
            attributeFilter: ["class"]
        });
    }

    // 2. Atalho Enter para cadastrar chave API no #config
    if (inputApiKey && botaoInserirChave) {
        inputApiKey.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                botaoInserirChave.click();
            }
        });
    }

    // 3. Feedback imediato e atalhos de teclado na tela #jogo
    function aprimorarPerguntaAtual() {
        if (!secaoJogo) return;
        const perguntaEl = secaoJogo.querySelector(".pergunta");
        if (!perguntaEl || perguntaEl.dataset.uiAprimorado === "1") return;
        perguntaEl.dataset.uiAprimorado = "1";

        const enunciado = perguntaEl.querySelector(".enunciado-pergunta");
        if (enunciado && !enunciado.querySelector(".pergunta-interrogacao")) {
            const badgeInterrogacao = document.createElement("span");
            badgeInterrogacao.className = "pergunta-interrogacao";
            badgeInterrogacao.setAttribute("aria-hidden", "true");
            badgeInterrogacao.textContent = "?";
            enunciado.prepend(badgeInterrogacao);
        }

        const labels = perguntaEl.querySelectorAll(".respostas label");
        const letras = ["a", "b", "c", "d"];
        labels.forEach((label, idx) => {
            const radio = label.querySelector('input[type="radio"]');
            if (radio) {
                radio.addEventListener("change", () => {
                    labels.forEach((item) => item.classList.remove("alternativa-selecionada"));
                    if (radio.checked) {
                        label.classList.add("alternativa-selecionada");
                    }
                });
            }

            if (!label.querySelector(".alt-letra")) {
                const badgeLetra = document.createElement("span");
                badgeLetra.className = "alt-letra";
                badgeLetra.setAttribute("aria-hidden", "true");
                badgeLetra.textContent = letras[idx] || String(idx + 1);
                label.prepend(badgeLetra);
            }
        });
    }

    if (secaoJogo) {
        const obsJogo = new MutationObserver(aprimorarPerguntaAtual);
        obsJogo.observe(secaoJogo, { childList: true });
    }

    // Atalhos 1-4 ou A-D para selecionar alternativa durante o jogo
    document.addEventListener("keydown", (event) => {
        if (!secaoJogo || secaoJogo.classList.contains("hidden")) return;
        if (secaoCarregamento && !secaoCarregamento.classList.contains("hidden")) return;

        const tagAtiva = document.activeElement?.tagName;
        if (tagAtiva === "INPUT" || tagAtiva === "TEXTAREA") return;

        const mapaTeclas = {
            "1": 0, "a": 0, "A": 0,
            "2": 1, "b": 1, "B": 1,
            "3": 2, "c": 2, "C": 2,
            "4": 3, "d": 3, "D": 3
        };

        if (!(event.key in mapaTeclas)) return;

        const radios = secaoJogo.querySelectorAll('.respostas input[type="radio"]');
        const alvo = radios[mapaTeclas[event.key]];
        if (alvo && !alvo.disabled) {
            alvo.checked = true;
            alvo.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });

    // 4. Estruturação responsiva dos cards de fim de jogo
    function aprimorarCardsCorrecao() {
        if (!listaCorrecoes) return;

        // Envolve tabelas comparativas em container rolável no mobile
        listaCorrecoes.querySelectorAll("table.tabela-comparativa").forEach((tabela) => {
            if (tabela.parentElement?.classList.contains("tabela-wrapper")) return;
            const wrapper = document.createElement("div");
            wrapper.className = "tabela-wrapper";
            tabela.parentNode.insertBefore(wrapper, tabela);
            wrapper.appendChild(tabela);
        });

        // Trata caixas da Wikipédia vazias ou sem miniatura
        listaCorrecoes.querySelectorAll(".wiki-box").forEach((box) => {
            const temConteudo = Boolean(box.querySelector("img, p, span, a"));
            if (!temConteudo) {
                box.classList.add("hidden");
                return;
            }
            if (!box.querySelector("img.wiki-thumb")) {
                box.classList.add("wiki-sem-imagem");
            }
        });
    }

    if (listaCorrecoes) {
        const obsCorrecoes = new MutationObserver(aprimorarCardsCorrecao);
        obsCorrecoes.observe(listaCorrecoes, { childList: true });
    }
})();
