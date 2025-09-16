document.addEventListener("DOMContentLoaded", async () => {
  const idadeInput = document.getElementById("idade");
  const pesoInput = document.getElementById("peso");
  const passo1 = document.getElementById("passo1");
  const passo2 = document.getElementById("passo2");
  const passo3 = document.getElementById("passo3");
  const listaSintomas = document.getElementById("lista-sintomas");
  const saida = document.getElementById("saida");

  let medicamentos = {};
  let sintomas = {};

  // Carregar JSONs
  async function carregarDados() {
    const [medResp, sintResp] = await Promise.all([
      fetch("data/medicamentos.json"),
      fetch("data/sintomas.json")
    ]);
    medicamentos = await medResp.json();
    sintomas = await sintResp.json();
  }
  await carregarDados();

  // Ir para passo 2
  document.getElementById("paraPasso2").addEventListener("click", () => {
    if (!idadeInput.value || !pesoInput.value) return alert("Preencha todos os campos!");
    passo1.classList.add("hidden");
    passo2.classList.remove("hidden");

    // Renderizar lista de sintomas
    listaSintomas.innerHTML = "";
    Object.entries(sintomas).forEach(([id, sint]) => {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = id;
      label.appendChild(checkbox);
      label.append(" " + sint.nome);
      listaSintomas.appendChild(label);
    });
  });

  // Gerar prescrição
  document.getElementById("gerar").addEventListener("click", () => {
    const idade = parseFloat(idadeInput.value);
    const peso = parseFloat(pesoInput.value);

    const selecionados = [...listaSintomas.querySelectorAll("input:checked")].map(c => c.value);
    if (selecionados.length === 0) return alert("Selecione ao menos 1 sintoma.");

    let resultado = `Paciente ${idade} anos, ${peso} kg\n\n`;

    selecionados.forEach(idSintoma => {
      const sint = sintomas[idSintoma];
      resultado += ``;
      sint.medicamentos_ids.forEach(idMed => {
        const med = medicamentos[idMed];
        if (!med) return;

        // Idade mínima
        if (med.idade_minima_anos && idade < med.idade_minima_anos) {
          resultado += `⚠️ ${med.nome}: Não recomendado para menores de ${med.idade_minima_anos} anos.\n\n`;
          return;
        }

        // Cálculo dose mg/kg
        if (med.faixa_mgkg) {
          const media = (med.faixa_mgkg[0] + med.faixa_mgkg[1]) / 2;
          let mgDia = media * peso;
          let mgDose = med.tipo_faixa_mgkg === "dia"
            ? mgDia / extrairNumDoses(med.frequencia)
            : mgDia;

          if (med.dose_max_mg_dose) {
            mgDose = Math.min(mgDose, med.dose_max_mg_dose);
          }

          const mlDose = med.concentracao ? (mgDose / med.concentracao).toFixed(1) : "";
          resultado += `${med.nome}\n  ${mgDose.toFixed(0)} mg (${mlDose} ml) ${med.frequencia}`;
        } else {
          resultado += `${med.nome}\n  ${med.frequencia || ""}`;
        }

        if (med.duracao) resultado += `, ${med.duracao}`;
        if (med.observacao) resultado += `\n   Obs: ${med.observacao}`;
        resultado += "\n\n";
      });
    });

    saida.value = resultado;
    passo2.classList.add("hidden");
    passo3.classList.remove("hidden");
  });

  // Copiar
  document.getElementById("copiar").addEventListener("click", () => {
    saida.select();
    document.execCommand("copy");
    alert("Copiado!");
  });

  // Reiniciar
  document.getElementById("reiniciar").addEventListener("click", () => {
    location.reload();
  });

  // Helper: quantas doses/dia pela frequência
  function extrairNumDoses(freq) {
    if (!freq) return 1;
    if (freq.includes("12 em 12")) return 2;
    if (freq.includes("8 em 8")) return 3;
    if (freq.includes("6 em 6")) return 4;
    if (freq.includes("1 vez ao dia")) return 1;
    if (freq.includes("2 vezes ao dia")) return 2;
    if (freq.includes("3 vezes ao dia")) return 3;
    return 1;
  }
});
