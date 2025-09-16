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

    // Renderizar lista de sintomas em ordem numérica
    listaSintomas.innerHTML = "";
    Object.entries(sintomas)
      .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
      .forEach(([id, sint]) => {
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

    let resultado = `-----------------------------------\n`;
    resultado += `Paciente: ${idade} anos, ${peso} kg\n`;
    resultado += `Prescrição:\n`;
    resultado += `-----------------------------------\n\n`;

    // controle de medicamentos já prescritos
    const prescritos = new Set();

    selecionados.forEach(idSintoma => {
      const sint = sintomas[idSintoma];
      resultado += ` `;

      sint.medicamentos_ids.forEach(idMed => {
        if (prescritos.has(idMed)) return; // já adicionado antes, pula
        prescritos.add(idMed);

        const med = medicamentos[idMed];
        if (!med) return;

        // Verificar se tem regras complexas
        if (med.regras) {
          const regra = med.regras.find(r =>
            idade >= (r.idade_min ?? 0) &&
            idade <= (r.idade_max ?? 200) &&
            (!r.peso_min || peso >= r.peso_min) &&
            (!r.peso_max || peso <= r.peso_max)
          );

          if (regra) {
            if (regra.faixa_mgkg) {
              const media = (regra.faixa_mgkg[0] + regra.faixa_mgkg[1]) / 2;
              let mgDia = media * peso;
              let mgDose = regra.tipo_faixa_mgkg === "dia"
                ? mgDia / extrairNumDoses(regra.frequencia)
                : mgDia;

              if (regra.dose_max_mg_dose) {
                mgDose = Math.min(mgDose, regra.dose_max_mg_dose);
              }

              let mlDoseFinal = "";
              let gotas = "";
              if (regra.concentracao) {
                const mlCalc = mgDose / regra.concentracao;
                const mlRounded = Math.round(mlCalc * 2) / 2; // arredonda para múltiplos de 0,5
                mlDoseFinal = mlRounded.toFixed(1);
                gotas = Math.round(mlRounded * 20);
              }

              resultado += `${med.nome}\n`;
              if (mlDoseFinal) {
                resultado += `   Uso: Administrar ${mlDoseFinal} mL (${gotas} gotas) via oral ${regra.frequencia},`;
              } else {
                resultado += `   Uso: Administrar ${mgDose.toFixed(0)} mg via oral ${regra.frequencia},`;
              }
              if (regra.duracao) resultado += ` durante ${regra.duracao}.`;
              resultado += `\n`;
            } else {
              resultado += `${med.nome}\n   Uso: ${regra.observacao || "Ver bula"}\n`;
            }

            if (regra.condicao) resultado += `    Condição: ${regra.condicao}\n`;
            if (med.observacao) resultado += `    Obs: ${med.observacao}\n`;
            resultado += `\n`;
          }

        } else {
          // Modelo simples (antigo)
          if (med.idade_minima_anos && idade < med.idade_minima_anos) {
            resultado += ` ${med.nome}: Não recomendado para menores de ${med.idade_minima_anos} anos.\n\n`;
            return;
          }

          if (med.faixa_mgkg) {
            const media = (med.faixa_mgkg[0] + med.faixa_mgkg[1]) / 2;
            let mgDia = media * peso;
            let mgDose = med.tipo_faixa_mgkg === "dia"
              ? mgDia / extrairNumDoses(med.frequencia)
              : mgDia;

            if (med.dose_max_mg_dose) {
              mgDose = Math.min(mgDose, med.dose_max_mg_dose);
            }

            let mlDoseFinal = "";
            let gotas = "";
            if (med.concentracao) {
              const mlCalc = mgDose / med.concentracao;
              const mlRounded = Math.round(mlCalc * 2) / 2; // arredonda para múltiplos de 0,5
              mlDoseFinal = mlRounded.toFixed(1);
              gotas = Math.round(mlRounded * 20);
            }

            resultado += `${med.nome}\n`;
            if (mlDoseFinal) {
              resultado += `   Uso: Administrar ${mlDoseFinal} mL (${gotas} gotas) via oral ${med.frequencia},`;
            } else {
              resultado += `   Uso: Administrar ${mgDose.toFixed(0)} mg via oral ${med.frequencia},`;
            }
            if (med.duracao) resultado += ` durante ${med.duracao}.`;
            if (med.observacao) resultado += ` \n    Obs: ${med.observacao}`;
            resultado += `\n\n`;
          } else {
            resultado += `${med.nome}\n   Uso: ${med.frequencia || ""}\n\n`;
          }
        }
      });

      resultado += ``;
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