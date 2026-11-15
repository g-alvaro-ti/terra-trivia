import requests

EN_BASE = "https://en.wikipedia.org"
PT_BASE = "https://pt.wikipedia.org"

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