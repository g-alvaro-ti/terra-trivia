import requests
import html
import re
from urllib.parse import quote, unquote, urljoin
from bs4 import BeautifulSoup

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
    return []


def extrair_primeiro_paragrafo(soup: BeautifulSoup, max_chars: int = 340) -> str:
    return ""


def extrair_secoes(soup: BeautifulSoup, max_secoes: int = 5) -> list[str]:
    return []


def extrair_imagem(soup: BeautifulSoup) -> str:
    return ""


def obter_dados_pt(soup_en: BeautifulSoup) -> dict:
    return {"disponivel": False, "titulo": "", "url": "", "resumo": ""}

# ========================================
# Funções principais de execução do scraping geral
# ========================================

def resolver_e_raspar_entidade(termo: str, pergunta: str, fallback: bool = False) -> dict:
    return {"encontrado": False, "motivo": "teste"}


def processar_item_questao(item: dict) -> dict:
    return {
        "numero": item.get("numero"),
        "acertou": False,
        "contexto_correta": resolver_e_raspar_entidade(item.get("resposta_certa", ""), item.get("enunciado", ""), True),
        "contexto_usuario": {"encontrado": False, "motivo": "teste"},
    }


def processar_lote_questoes(itens: list[dict]) -> list[dict]:
    return [processar_item_questao(item) for item in itens]