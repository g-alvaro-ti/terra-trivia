from flask import Flask, jsonify, request
from flask_cors import CORS

from scraper import processar_item_questao, processar_lote_questoes

app = Flask(__name__)
CORS(app)


@app.route("/api/health", methods=['GET'])
def health():
    return jsonify({"status": "ok", "servico": "Terra Trivia Wiki Scraper"})

@app.route("/api/wiki-context", methods=['POST', 'GET'])
def wiki_context():
    """
    Recebe uma questão única ou uma lista de questões
    e retorna os dados raspados da Wikipédia.
    """
    payload = request.get_json(silent=True) or {}

    # Pra processar varias questões de uma vez
    if "questoes" in payload and isinstance(payload["questoes"], list):
        resultados = processar_lote_questoes(payload["questoes"])
        return jsonify({"resultados": resultados})

    # Pra processar uma única questão
    if "enunciado" in payload and "resposta_certa" in payload:
        resultado = processar_item_questao(payload)
        return jsonify(resultado)

    return jsonify({"erro": "Payload inválido. Envie 'questoes' (lista) ou uma questão única."}), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)