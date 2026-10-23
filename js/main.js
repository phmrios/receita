// js/main.js
import { carregarDadosClinicos, validarDados } from "./calculo.js";
import { inicializarUI } from "./ui.js";
import { mostrarLista, mostrarMensagem } from "./comum.js";

document.addEventListener("DOMContentLoaded", async () => {
  const erroEl = document.getElementById("erro-cadastro");
  try {
    const dados = await carregarDadosClinicos();
    const problemas = validarDados(dados);
    if (problemas.length) mostrarLista(erroEl, ["Problemas no cadastro:", ...problemas], "erro");
    inicializarUI(dados);
  } catch (err) {
    console.error(err);
    mostrarMensagem(
      erroEl,
      "Não foi possível carregar os medicamentos. Abra o site pelo endereço da internet (não pelo arquivo do computador) ou verifique a conexão.",
      "erro",
    );
  }
});
