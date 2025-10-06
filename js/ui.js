// js/ui.js
import { gerarPrescricao } from "./calculo.js";

export function inicializarUI({ medicamentos, sintomas }) {
  const sintomasContainer = document.getElementById("sintomas-container");

  // Ordena sintomas numericamente
  const ids = Object.keys(sintomas).sort(
    (a, b) => parseFloat(a) - parseFloat(b),
  );

  ids.forEach((id) => {
    const sintoma = sintomas[id];
    const item = document.createElement("div");
    item.className = "checkbox-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `sintoma-${id}`;
    checkbox.value = id;

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = sintoma.nome;

    item.appendChild(checkbox);
    item.appendChild(label);
    sintomasContainer.appendChild(item);
  });

  document.getElementById("gerar").addEventListener("click", () => {
    const idade = parseFloat(document.getElementById("idade").value);
    const peso = parseFloat(document.getElementById("peso").value);
    const selecionados = Array.from(
      document.querySelectorAll("#sintomas-container input:checked"),
    ).map((c) => c.value);

    if (
      isNaN(idade) ||
      isNaN(peso) ||
      idade <= 0 ||
      peso <= 0 ||
      selecionados.length === 0
    ) {
      alert(
        "Preencha idade (>0), peso (>0) e selecione pelo menos um sintoma.",
      );
      return;
    }

    const texto = gerarPrescricao(
      { medicamentos, sintomas },
      idade,
      peso,
      selecionados,
    );
    document.getElementById("resultado").innerText = texto;
  });
}
