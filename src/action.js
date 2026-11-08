let botaoIniciarJogo = document.querySelector(".botao-iniciar-jogo")
let botaoTerminarJogo = document.querySelector(".botao-terminar-jogo")

botaoIniciarJogo.addEventListener("click", async function() {
    iniciarJogo()
});

botaoTerminarJogo.addEventListener("click", async function() {
    terminarJogo()
});