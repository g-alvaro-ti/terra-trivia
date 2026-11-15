import requests
import html
import re
from urllib.parse import quote, unquote, urljoin
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor

HEADERS = {
    "User-Agent": "TerraTriviaBot/1.0 (Projeto Academico Web Services; contato-local)"
}

_SESSION = requests.Session()
_SESSION.headers.update(HEADERS)

_CACHE_ENTIDADE = {}

EN_BASE = "https://en.wikipedia.org"
PT_BASE = "https://pt.wikipedia.org"

STOPWORDS = {
    "which", "what", "where", "when", "who", "whom", "whose", "why", "how",
    "the", "and", "for", "with", "from", "that", "this", "these", "those",
    "into", "onto", "about", "after", "before", "between", "under", "over",
    "does", "did", "was", "were", "are", "can", "could", "would", "should",
    "have", "has", "had", "known", "called", "name", "many", "much", "long",
    "reach", "make", "takes", "form", "solid", "part", "human", "body",
    "located", "following", "typically", "each", "our", "starting", "its",
    "standard", "unit", "approximately", "synthetic", "originally"
}

NUMEROS_EXTENSO = {
    "zero", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "hundred", "thousand",
    "million", "billion"
}

# ========================================
# Funções utilitarias pra tratamento de texto, extração de palavras chave e acesso dos links
# ========================================

def limpar_texto(texto: str) -> str:
    if not texto:
        return ""
    texto = html.unescape(texto)
    texto = re.sub(r"\[\d+\]|\[note \d+\]|\[edit\]", "", texto)
    texto = re.sub(r"\s+", " ", texto)
    return texto.strip()


def eh_numero_ou_medida(valor: str) -> bool:
    """Identifica respostas que não são nomes de artigos (números, anos, temperaturas)."""
    texto = limpar_texto(valor).lower()
    if not texto:
        return True

    if re.fullmatch(r"[\d.,+-]+", texto):
        return True

    if texto in NUMEROS_EXTENSO:
        return True

    if re.match(r"^\d", texto) or "°" in texto:
        return True

    return False


def extrair_palavras_chave_pergunta(pergunta: str, limite: int = 5) -> str:
    texto = html.unescape(pergunta or "")
    palavras = re.findall(r"[A-Za-z0-9\-\*]+", texto)
    filtradas = []
    for p in palavras:
        low = p.lower()
        if len(low) >= 3 and low not in STOPWORDS and low not in filtradas:
            filtradas.append(p)
        if len(filtradas) >= limite:
            break
    return " ".join(filtradas)


def buscar_html(url: str, timeout: int = 8) -> tuple[str, BeautifulSoup | None]:
    try:
        resp = _SESSION.get(url, timeout=timeout, allow_redirects=True)
        if resp.status_code != 200:
            return url, None
        return resp.url, BeautifulSoup(resp.text, "lxml")
    except requests.RequestException:
        return url, None


def eh_pagina_busca(soup: BeautifulSoup, url: str) -> bool:
    if "Special:Search" in url or "search=" in url:
        titulo = soup.select_one("#firstHeading")
        if titulo and "search results" in titulo.get_text(strip=True).lower():
            return True
    return bool(soup.select_one(".mw-search-results"))


def eh_desambiguacao(soup: BeautifulSoup) -> bool:
    return bool(soup.select_one("#disambigbox, .dmbox-disambig, .disambig"))


def resolver_desambiguacao(soup: BeautifulSoup, contexto_pergunta: str) -> str | None:
    """Escolhe o melhor link dentro da página de desambiguação usando palavras da pergunta."""
    tokens_contexto = set(
        re.findall(r"[a-z0-9]+", html.unescape(contexto_pergunta).lower())
    ) - STOPWORDS
    tokens_contexto.update({"science", "physics", "chemistry", "biology", "astronomy", "unit", "mass", "galaxy"})

    melhor_url = None
    melhor_score = 0

    for li in soup.select(".mw-parser-output ul > li"):
        link = li.select_one("a[href^='/wiki/']")
        if not link:
            continue
        href = link.get("href", "")
        if ":" in href:
            continue

        texto_item = li.get_text(" ", strip=True).lower()
        tokens_item = set(re.findall(r"[a-z0-9]+", texto_item))
        score = len(tokens_contexto & tokens_item)
        if score > melhor_score:
            melhor_score = score
            melhor_url = urljoin(EN_BASE, href)

    return melhor_url

# ========================================
# Funções principais de scraping de seções específicas
# ========================================

def extrair_infobox(soup: BeautifulSoup, max_itens: int = 6) -> list[dict]:
    """Extrai pares chave/valor da table.infobox"""
    pares = []
    chaves_vistas = set()

    for tabela in soup.select("table.infobox"):
        for tr in tabela.select("tr"):
            celulas = tr.find_all(["th", "td"], recursive=False)
            if len(celulas) != 2:
                continue

            chave = limpar_texto(celulas[0].get_text(" ", strip=True))
            valor = limpar_texto(celulas[1].get_text(" ", strip=True))

            if not chave or not valor or len(chave) > 45 or len(valor) > 120:
                continue
            if chave.lower() in chaves_vistas:
                continue

            chaves_vistas.add(chave.lower())
            pares.append({"atributo": chave, "valor": valor})

            if len(pares) >= max_itens:
                return pares

    return pares


def extrair_primeiro_paragrafo(soup: BeautifulSoup, max_chars: int = 340) -> str:
    for p in soup.select(".mw-parser-output p"):
        if p.find_parent("table") or p.find_parent(class_="hatnote"):
            continue
        texto = limpar_texto(p.get_text(" ", strip=True))
        if len(texto) > 45:
            if len(texto) > max_chars:
                return texto[:max_chars].rsplit(" ", 1)[0] + "..."
            return texto
    return ""


def extrair_secoes(soup: BeautifulSoup, max_secoes: int = 5) -> list[str]:
    ignorar = {"see also", "references", "external links", "further reading", "notes", "bibliography"}
    secoes = []
    for h in soup.select(".mw-parser-output .mw-heading2 h2, .mw-parser-output h2"):
        texto = limpar_texto(h.get_text(" ", strip=True))
        if texto and texto.lower() not in ignorar:
            secoes.append(texto)
        if len(secoes) >= max_secoes:
            break
    return secoes


def extrair_imagem(soup: BeautifulSoup) -> str:
    img = soup.select_one("table.infobox img") or soup.select_one(".mw-parser-output figure img")
    if not img:
        return ""
    src = img.get("src", "")
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/"):
        return urljoin(EN_BASE, src)
    return src


def obter_dados_pt(soup_en: BeautifulSoup) -> dict:
    """Segue o link interlinguagem para pt.wikipedia.org para título, URL e resumo em PT."""
    link_pt = soup_en.select_one('a.interlanguage-link-target[hreflang="pt"]')
    if not link_pt or not link_pt.get("href"):
        return {"disponivel": False, "titulo": "", "url": "", "resumo": ""}

    pt_url = link_pt["href"]
    url_final, soup_pt = buscar_html(pt_url)
    if not soup_pt:
        return {"disponivel": False, "titulo": "", "url": pt_url, "resumo": ""}

    titulo_el = soup_pt.select_one("#firstHeading")
    titulo_pt = limpar_texto(titulo_el.get_text(" ", strip=True)) if titulo_el else ""
    resumo_pt = extrair_primeiro_paragrafo(soup_pt)

    return {
        "disponivel": True,
        "titulo": titulo_pt,
        "url": unquote(url_final),
        "resumo": resumo_pt,
    }

# ========================================
# Funções principais de execução do scraping geral
# ========================================

def resolver_e_raspar_entidade(termo: str, pergunta: str, fallback: bool = False) -> dict:
    """
    Resolve um artigo na Wikipédia EN e extrai metadados.
    - Para correct_answer: fallback=True (resolve números/medidas via pergunta).
    - Para user_answer: fallback=False (evita falsos positivos pra respostas com nomes inventados).
    """
    termo_limpo = html.unescape(termo or "").strip()
    cache_key = f"{termo_limpo.lower()}::{fallback}::{pergunta[:40].lower()}"
    if cache_key in _CACHE_ENTIDADE:
        return _CACHE_ENTIDADE[cache_key]

    if not termo_limpo or eh_numero_ou_medida(termo_limpo):
        if not fallback:
            return {"encontrado": False, "motivo": "numero_ou_medida"}
        keywords = extrair_palavras_chave_pergunta(pergunta)
        url_busca = f"{EN_BASE}/w/index.php?search={quote(keywords)}&fulltext=1"
    else:
        url_busca = f"{EN_BASE}/w/index.php?search={quote(termo_limpo)}"

    url_atual, soup = buscar_html(url_busca)
    if not soup:
        return {"encontrado": False, "motivo": "erro_requisicao"}

    if eh_pagina_busca(soup, url_atual):
        primeiro = soup.select_one(".mw-search-result-heading a")
        if not primeiro:
            return {"encontrado": False, "motivo": "sem_resultados"}

        titulo_sugerido = limpar_texto(primeiro.get_text(" ", strip=True)).lower()
        if not fallback and termo_limpo.lower() not in titulo_sugerido and titulo_sugerido not in termo_limpo.lower():
            return {"encontrado": False, "motivo": "distrator_sem_artigo"}

        url_atual, soup = buscar_html(urljoin(EN_BASE, primeiro["href"]))
        if not soup:
            return {"encontrado": False, "motivo": "erro_redirecionamento"}

    if eh_desambiguacao(soup):
        url_desambig = resolver_desambiguacao(soup, pergunta)
        if not url_desambig:
            return {"encontrado": False, "motivo": "desambiguacao_nao_resolvida"}
        url_atual, soup = buscar_html(url_desambig)
        if not soup or eh_desambiguacao(soup):
            return {"encontrado": False, "motivo": "desambiguacao_nao_resolvida"}

    titulo_en_el = soup.select_one("#firstHeading")
    shortdesc_el = soup.select_one(".shortdescription")

    resultado = {
        "encontrado": True,
        "titulo_en": limpar_texto(titulo_en_el.get_text(" ", strip=True)) if titulo_en_el else termo_limpo,
        "url_en": unquote(url_atual),
        "shortdescription": limpar_texto(shortdesc_el.get_text(" ", strip=True)) if shortdesc_el else "",
        "infobox": extrair_infobox(soup, max_itens=6),
        "secoes": extrair_secoes(soup, max_secoes=5),
        "imagem_url": extrair_imagem(soup),
        "resumo_en": extrair_primeiro_paragrafo(soup),
        "pt": obter_dados_pt(soup),
    }

    _CACHE_ENTIDADE[cache_key] = resultado
    return resultado


def processar_item_questao(item: dict) -> dict:
    numero = item.get("numero")
    pergunta = item.get("enunciado", "")
    resposta_certa = item.get("resposta_certa", "")
    resposta_usuario = item.get("resposta_usuario", "")
    acertou = html.unescape(resposta_usuario).strip() == html.unescape(resposta_certa).strip()

    dados_correta = resolver_e_raspar_entidade(
        resposta_certa, pergunta, fallback=True
    )

    dados_usuario = {"encontrado": False, "motivo": "usuario_acertou"}
    if not acertou and resposta_usuario:
        dados_usuario = resolver_e_raspar_entidade(
            resposta_usuario, pergunta, fallback=False
        )

    return {
        "numero": numero,
        "acertou": acertou,
        "contexto_correta": dados_correta,
        "contexto_usuario": dados_usuario,
    }


def processar_lote_questoes(itens: list[dict]) -> list[dict]:
    if not itens:
        return []
    with ThreadPoolExecutor(max_workers=5) as executor:
        return list(executor.map(processar_item_questao, itens))