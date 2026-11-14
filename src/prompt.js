// ========================================
// prompt.js - Utilização da API do Gemini
// ========================================

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Decodifica entidades HTML retornadas pela API do OpenTDB (ex: &quot;, &#039;, &amp;)
 * pra eles aparecerem como os caracteres certos, como aspas por exemplo
 */
function decodificarEntidadesHtml(texto) {
    if (!texto) return "";
    const textarea = document.createElement("textarea");
    textarea.innerHTML = texto;
    return textarea.value;
}

/**
 * Monta um único prompt contendo todas as perguntas e respostas da partida,
 * instruindo o Gemini a aprofundar os acertos e corrigir/aprofundar os erros.
 */
function criarPromptLista(listaRespostas) {
    const itensFormatados = listaRespostas.map((item) => {
        const acertou = item.resposta_usuario === item.resposta_certa;
        const enunciadoLimpo = decodificarEntidadesHtml(item.enunciado);
        const respostaUsuarioLimpa = decodificarEntidadesHtml(item.resposta_usuario);
        const respostaCertaLimpa = decodificarEntidadesHtml(item.resposta_certa);

        return `
Pergunta ${item.numero}:
- Enunciado: "${enunciadoLimpo}"
- Resposta do usuário: "${respostaUsuarioLimpa}"
- Resposta correta: "${respostaCertaLimpa}"
- Status: ${acertou ? "ACERTOU" : "ERROU"}
        `.trim();
    }).join("\n\n");

    return `
Você é um tutor especialista em ciências e conhecimentos gerais de um jogo de trivia chamado "Terra Trivia".
Analise a lista de perguntas respondidas pelo usuário abaixo e responda em Português do Brasil.

Regras para cada pergunta:
1. Se o status for "ACERTOU": forneça um aprofundamento interessante (curiosidade científica, contexto histórico ou detalhe técnico) sobre a resposta correta.
2. Se o status for "ERROU": explique de forma clara e didática por que a resposta do usuário está incorreta (não mencione "Você errou") e apresente uma correção com aprofundamento sobre a resposta certa.
3. Em ambos os casos, forneça o título exato do artigo e um link real e relevante da Wikipédia em português (https://pt.wikipedia.org/wiki/...) sobre o tema principal da pergunta. Caso não exista artigo em português, use a Wikipédia em inglês (https://en.wikipedia.org/wiki/...).
4. Mantenha cada explicação objetiva e envolvente (entre 2 e 4 frases).

Lista de respostas da partida:
${itensFormatados}
    `.trim();
}

/**
 * Faz a requisição para a API do Gemini exigindo saída em JSON estruturado.
 * Se a chave atual atingir o limite (HTTP 429) ou falhar por autenticação,
 * rotaciona automaticamente para as próximas chaves cadastradas.
 */
async function chamarApiGeminiLista(prompt) {
    if (!chave_gemini_atual && chaves_gemini.length > 0) {
        chave_gemini_atual = chaves_gemini[0];
    }

    if (!chave_gemini_atual) {
        throw new Error("Nenhuma chave API do Gemini foi cadastrada.");
    }

    // Define o esquema exato do JSON que o Gemini é obrigado a retornar
    const schemaResposta = {
        type: "ARRAY",
        description: "Lista de correções e aprofundamentos para cada pergunta do quiz.",
        items: {
            type: "OBJECT",
            properties: {
                numero: {
                    type: "INTEGER",
                    description: "Número original da pergunta."
                },
                acertou: {
                    type: "BOOLEAN",
                    description: "True se o usuário acertou, false se errou."
                },
                explicacao: {
                    type: "STRING",
                    description: "Aprofundamento (se acertou) ou correção com aprofundamento (se errou)."
                },
                titulo_wikipedia: {
                    type: "STRING",
                    description: "Título do artigo da Wikipédia (útil para consultar a API REST da Wikipédia)."
                },
                link_wikipedia: {
                    type: "STRING",
                    description: "URL completa do artigo relevante na Wikipédia."
                }
            },
            required: ["numero", "acertou", "explicacao", "titulo_wikipedia", "link_wikipedia"]
        }
    };

    const payload = {
        contents: [
            {
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: schemaResposta
        }
    };

    const totalTentativas = chaves_gemini.length;

    for (let tentativa = 0; tentativa < totalTentativas; tentativa++) {
        const chaveEmUso = chave_gemini_atual;

        try {
            const resposta = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(chaveEmUso)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            // 429 = Limite de cota atingido | 400/403 = Chave inválida ou sem permissão
            if (resposta.status === 429 || resposta.status === 400 || resposta.status === 403) {
                console.warn(`Chave falhou (HTTP ${resposta.status}). Tentando próxima chave...`);
                obterProximaChave();
                continue;
            }

            if (!resposta.ok) {
                const erroTexto = await resposta.text();
                throw new Error(`Erro na API do Gemini (${resposta.status}): ${erroTexto}`);
            }

            const dados = await resposta.json();
            const textoJson = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textoJson) {
                throw new Error("A API do Gemini retornou uma resposta vazia.");
            }

            return JSON.parse(textoJson);

        } catch (erro) {
            // Se ainda restarem chaves para testar em caso de falha de rede/limite, continua o loop
            if (tentativa < totalTentativas - 1) {
                console.warn("Erro na tentativa atual, rotacionando chave:", erro.message);
                obterProximaChave();
            } else {
                throw erro;
            }
        }
    }

    throw new Error("Todas as chaves API cadastradas atingiram o limite ou falharam.");
}

/**
 * Função principal para ser chamada no fim do jogo.
 * Recebe `respostas_usuario`, consulta o Gemini em lote e retorna
 * os dados originais combinados com a explicação e o link da Wikipédia.
 */
async function processarCorrecoesComGemini(listaRespostas = respostas_usuario) {
    if (!listaRespostas || listaRespostas.length === 0) {
        console.warn("Nenhuma resposta registrada para corrigir.");
        return [];
    }

    const prompt = criarPromptLista(listaRespostas);
    const resultadosGemini = await chamarApiGeminiLista(prompt);

    // Une cada resposta registrada com o respectivo retorno do Gemini
    return listaRespostas.map((resposta) => {
        const analise = resultadosGemini.find((item) => item.numero === resposta.numero);

        return {
            ...resposta,
            acertou: resposta.resposta_usuario === resposta.resposta_certa,
            explicacao: analise ? analise.explicacao : "O Gemini está indisponível no momento, não foi possível gerar a explicação.",
            titulo_wikipedia: analise ? analise.titulo_wikipedia : "",
            link_wikipedia: analise ? analise.link_wikipedia : "https://pt.wikipedia.org"
        };
    });
}