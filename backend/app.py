from flask import Flask, jsonify, request
from flask_cors import CORS

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

    return jsonify({"status": "Teste"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)