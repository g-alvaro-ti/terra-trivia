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
function criarPromptLista(listaRespostas, configuracao = {}) {
    const itensFormatados = listaRespostas.map((item) => {
        const acertou = item.resposta_usuario === item.resposta_certa;
        const enunciadoLimpo = decodificarEntidadesHtml(item.enunciado);
        const respUsuario = decodificarEntidadesHtml(item.resposta_usuario);
        const respCerta = decodificarEntidadesHtml(item.resposta_certa);

        return `
Questão ${item.numero}:
- Enunciado: "${enunciadoLimpo}"
- Resposta do usuário: "${respUsuario}" (${acertou ? "ACERTOU" : "ERROU"})
- Resposta correta: "${respCerta}"
- Dados raspados da resposta correta (Wikipédia): ${formatarInfoboxCurta(item.wiki_correta)}
- Dados raspados da escolha do usuário (Wikipédia): ${acertou ? "Não aplicável (usuário acertou)" : formatarInfoboxCurta(item.wiki_usuario)}
        `.trim();
    }).join("\n\n");

    return `
Você é um tutor especialista em ciências e conhecimentos gerais de um jogo de trivia chamado "Terra Trivia".
O usuário jogou na dificuldade "${configuracao.dificuldade || "easy"}" com tempo total de ${configuracao.tempo_total_segundos || 0}s.
Use OBRIGATORIAMENTE os dados raspados da Wikipédia (infobox e seções) fornecidos abaixo junto com as respostas do usuário para responder em Português do Brasil:
1. Em "resumo_geral": gere um diagnóstico breve do desempenho considerando dificuldade, acertos e tempo, e liste de 1 a 3 tópicos científicos que merecem revisão.
2. Em cada item de "correcoes":
   - "explicacao_objetiva": se acertou, dê uma curiosidade científica direta (2 frases); se errou, explique por que a alternativa escolhida não corresponde ao pedido e corrija usando os fatos da infobox (2 a 3 frases).
   - "comparacao_tabela": crie de 2 a 4 linhas comparando atributos reais extraídos da infobox (ex.: se o usuário errou e há infobox da escolha dele, compare "sua escolha" vs "resposta certa"; se não houver infobox da escolha do usuário, use os atributos principais da resposta certa com "Contexto esperado" na coluna do usuário).
   - "secao_recomendada": escolha exatamente um dos nomes da lista "Seções" fornecida pelo Flask que mais ajude o usuário a aprofundar o tema (ou deixe vazio se não houver).

Dados da partida:
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
        type: "OBJECT",
        properties: {
            resumo_geral: {
                type: "OBJECT",
                properties: {
                    nivel_dominio: { type: "STRING", description: "Ex: Iniciante, Explorador, Cientista" },
                    diagnostico_curto: { type: "STRING" },
                    topicos_revisar: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                    }
                },
                required: ["nivel_dominio", "diagnostico_curto", "topicos_revisar"]
            },
            correcoes: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        numero: { type: "INTEGER" },
                        explicacao_objetiva: { type: "STRING" },
                        secao_recomendada: { type: "STRING" },
                        comparacao_tabela: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    atributo: { type: "STRING" },
                                    valor_usuario: { type: "STRING" },
                                    valor_correto: { type: "STRING" }
                                },
                                required: ["atributo", "valor_usuario", "valor_correto"]
                            }
                        }
                    },
                    required: ["numero", "explicacao_objetiva", "secao_recomendada", "comparacao_tabela"]
                }
            }
        },
        required: ["resumo_geral", "correcoes"]
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

            try {
                return JSON.parse(textoJson);
            } catch (erroParse) {
                throw new Error(`JSON inválido retornado pelo Gemini: ${erroParse.message}`);
            }

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
async function processarCorrecoesComGemini(listaRespostas = respostas_usuario, configuracao = {}) {
    if (!listaRespostas || listaRespostas.length === 0) {
        return { resumo_geral: null, correcoes: [] };
    }

    const prompt = criarPromptLista(listaRespostas, configuracao);
    return await chamarApiGeminiLista(prompt);
}

function formatarInfoboxCurta(wikiObj) {
    if (!wikiObj || !wikiObj.encontrado) return "Indisponível";
    const pares = (wikiObj.infobox || [])
        .map(p => `${p.atributo}: ${p.valor}`)
        .join(" | ");
    const secoes = (wikiObj.secoes || []).join(", ");
    return `Título: ${wikiObj.titulo_en} | Descrição: ${wikiObj.shortdescription || "N/A"} | Infobox: [${pares || "sem infobox"}] | Seções: [${secoes || "N/A"}]`;
}