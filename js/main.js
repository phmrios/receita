// js/main.js
import { carregarDadosClinicos } from "./calculo.js";
import { inicializarUI } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const dados = await carregarDadosClinicos();
  inicializarUI(dados);
});
