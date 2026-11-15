let botaoIniciarJogo = document.querySelector(".botao-iniciar-jogo")
let botaoTerminarJogo = document.querySelector(".botao-terminar-jogo")
let botaoJogarNovamente = document.querySelector(".botao-jogar-novamente")

botaoIniciarJogo.addEventListener("click", async function() {
    iniciarJogo()
});

botaoTerminarJogo.addEventListener("click", async function() {
    terminarJogo()
});

botaoJogarNovamente.addEventListener("click", function() {
    jogarNovamente()
});