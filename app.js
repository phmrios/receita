async function carregarDados() {
  const [medicamentosResp, sintomasResp] = await Promise.all([
    fetch("data/medicamentos.json"), 
    fetch("data/sintomas.json")      
  ]);
  const medicamentos = await medicamentosResp.json();
  const sintomas = await sintomasResp.json();
  return { medicamentos, sintomas };
}

function arredondar(valor) {
  return Math.round(valor);
}

function normalizarIdadeInteira(idadeAnos) {
  // Para tabelas por idade inteira (1..18), vamos arredondar para o inteiro mais próximo
  // e manter nos limites [1,18].
  if (idadeAnos < 1) return 0; // lactente
  const arred = Math.round(idadeAnos);
  return Math.min(18, Math.max(1, arred));
}

// ===== NOVO BLOCO: cálculo por UI/dia (tabela por idade) =====
function calcularDoseVitaminaD_UIporDia(regra, idadeAnos) {
  // regra pode ter:
  // - dose_ui_dia_lactente (para <1 ano)
  // - tabela_ui_por_idade: { "1": 600, ..., "18": 1200 }
  if (idadeAnos < 1) {
    return regra.dose_ui_dia_lactente || 400; // fallback seguro
  }
  const idadeTab = normalizarIdadeInteira(idadeAnos);
  if (regra.tabela_ui_por_idade && regra.tabela_ui_por_idade[String(idadeTab)]) {
    return regra.tabela_ui_por_idade[String(idadeTab)];
  }
  return null;
}

// A função calcularPrescricao agora contempla mg/kg e UI/dia
function calcularPrescricao(medicamento, idadeAnos, pesoKg) {
  let prescricoes = [];

  medicamento.regras.forEach(regra => {
    // 1. FILTRO de idade e peso
    if ((regra.idade_min != null && idadeAnos < regra.idade_min) ||
        (regra.idade_max != null && idadeAnos > regra.idade_max) ||
        (regra.peso_min != null && pesoKg < regra.peso_min) ||
        (regra.peso_max != null && pesoKg > regra.peso_max)) {
      return;
    }

    let texto = "";
    let ml = null;
    let gotas = null;

    // ===== ROTA 1: Regras em UI/dia (vitamina D) =====
    // Sinalizamos esta rota quando existir dose_ui_dia_lactente OU tabela_ui_por_idade
    if (regra.dose_ui_dia_lactente != null || regra.tabela_ui_por_idade) {
      const doseUIDia = calcularDoseVitaminaD_UIporDia(regra, idadeAnos); // número (UI/dia)
      // Se a concentração por gota foi definida no medicamento, convertemos UI -> gotas
      if (doseUIDia != null && medicamento.concentracao_ui_por_gota) {
        const gotasDia = Math.max(1, Math.round(doseUIDia / medicamento.concentracao_ui_por_gota));
        gotas = gotasDia;
      }

      // Montagem do texto
      let nomeCompleto = `${medicamento.nome} ${medicamento.forma}`;
      if (medicamento.apresentacao) {
        nomeCompleto += ` (${medicamento.apresentacao})`;
      }
      texto = `${nomeCompleto} — 01 frasco`;

      texto += `\n   Uso: Administrar `;
      if (gotas != null) {
        texto += `${gotas} gotas`;
      } else {
        // fallback: se por algum motivo não calcular gotas, mostramos diretamente a UI
        texto += `${doseUIDia} UI`;
      }
      texto += ` via oral`;
      if (regra.frequencia) texto += ` ${regra.frequencia}`;
      if (regra.duracao) texto += `, ${regra.duracao}`;
      if (regra.observacao) texto += `\n   Obs: ${regra.observacao}`;
      if (medicamento.observacao && (!regra.observacao || !texto.includes(regra.observacao))) {
        texto += `\n   Obs: ${medicamento.observacao}`;
      }

      prescricoes.push(texto);
      return; // Já geramos a prescrição por esta regra
    }

    // ===== ROTA 2: Regras em mg/kg (lógica original) =====
    let doseMg = null;
    let dosesPorDia = 1;

    if (regra.faixa_mgkg) {
      let freqNum = parseInt(regra.frequencia?.match(/\d+/)?.[0]);

      if (regra.tipo_faixa_mgkg === "dia") {
        dosesPorDia = 24 / (freqNum || 8);
      } else if (regra.tipo_faixa_mgkg === "dose") {
        dosesPorDia = freqNum ? (24 / freqNum) : 1;
      }

      const [min, max] = regra.faixa_mgkg;
      const alvo = (min + max) / 2;

      if (regra.tipo_faixa_mgkg === "dose") {
        doseMg = pesoKg * alvo;
      } else if (regra.tipo_faixa_mgkg === "dia") {
        let totalDia = pesoKg * alvo;
        doseMg = totalDia / dosesPorDia;
      }

      if (regra.dose_max_mgkg_dia) {
        let doseMgMax_calc_por_dia_kg = (pesoKg * regra.dose_max_mgkg_dia) / dosesPorDia;
        doseMg = Math.min(doseMg, doseMgMax_calc_por_dia_kg);
      }
      if (regra.dose_max_mg_dose) {
        doseMg = Math.min(doseMg, regra.dose_max_mg_dose);
      }
      if (regra.dose_max_mg_dia) {
        let doseMgMax_calc_por_dia_total = regra.dose_max_mg_dia / dosesPorDia;
        doseMg = Math.min(doseMg, doseMgMax_calc_por_dia_total);
      }
    }

    // 3. CÁLCULO DE VOLUME (rota mg/kg)
    if (doseMg && regra.concentracao) {
      let ml_puro = doseMg / regra.concentracao;
      if (medicamento.forma === "Gotas") {
        gotas = arredondar(ml_puro * 20);
      }
      ml = arredondar(ml_puro);
    }

    // 4. FORMAÇÃO DO TEXTO (rota mg/kg)
    let nomeCompleto = `${medicamento.nome} ${medicamento.forma}`;
    if (medicamento.apresentacao) {
      nomeCompleto += ` (${medicamento.apresentacao})`;
    }
    texto = `${nomeCompleto} — 01 frasco`;

    if (ml || gotas) {
      texto += `\n   Uso: Administrar `;
      if (gotas) {
        texto += `${gotas} gotas`;
      } else if (ml) {
        texto += `${ml} mL`;
      }
      texto += ` via oral`;
      if (regra.frequencia) texto += ` ${regra.frequencia}`;
      if (regra.duracao) texto += `, ${regra.duracao}`;
      if (regra.observacao) texto += `\n   Obs: ${regra.observacao}`;
    } else if (regra.observacao) {
      texto += `\n   Uso: ${regra.observacao}`;
    }

    if (medicamento.observacao && (!regra.observacao || !texto.includes(regra.observacao))) {
      texto += `\n   Obs: ${medicamento.observacao}`;
    }

    prescricoes.push(texto);
  });

  return prescricoes.length > 0 ? [prescricoes[0]] : [];
}

function gerarPrescricao({ medicamentos, sintomas }, idade, peso, sintomasSelecionados) {
  let resultado = [];
  let usados = new Set();

  resultado.push("--------------------------------");
  resultado.push(`Paciente: ${idade} anos, ${peso} kg`);
  resultado.push("Prescrição:");
  resultado.push("--------------------------------");

  sintomasSelecionados.forEach(id => {
    const sintoma = sintomas[id];
    if (!sintoma) return;

    sintoma.medicamentos_ids.forEach(medId => {
      if (usados.has(medId)) return;
      usados.add(medId);

      const med = medicamentos[medId];
      if (!med) return;

      const prescricoes = calcularPrescricao(med, idade, peso);
      if (prescricoes.length === 0) {
        let nomeCompleto = med.nome ? `${med.nome} ${med.forma || ''}`.trim() : 'Medicamento desconhecido';
        if(med.apresentacao) nomeCompleto += ` (${med.apresentacao})`;
        resultado.push(`${nomeCompleto} — 01 frasco\n   Uso: ⚠️ Não há dose recomendada para este paciente.`);
      } else {
        resultado.push(prescricoes[0]);
      }
    });
  });

  return resultado.join("\n\n");
}

document.addEventListener("DOMContentLoaded", async () => {
  const { medicamentos, sintomas } = await carregarDados();
  
  const sintomasContainer = document.getElementById("sintomas-container");

  const sintomaIds = Object.keys(sintomas);
  sintomaIds.sort((a, b) => {
    const numA = parseFloat(a.replace(',', '.')); 
    const numB = parseFloat(b.replace(',', '.'));
    return numA - numB;
  });

  sintomaIds.forEach(id => {
    const sintoma = sintomas[id];

    const itemDiv = document.createElement("div");
    itemDiv.className = "checkbox-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `sintoma-${id}`;
    checkbox.value = id;

    const label = document.createElement("label");
    label.htmlFor = `sintoma-${id}`;
    label.textContent = sintoma.nome;

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);
    sintomasContainer.appendChild(itemDiv);
  });

  document.getElementById("gerar").addEventListener("click", () => {
    const idade = parseFloat(document.getElementById("idade").value);
    const peso = parseFloat(document.getElementById("peso").value);

    const selecionados = Array.from(
      document.querySelectorAll('#sintomas-container input[type="checkbox"]:checked')
    ).map(checkbox => checkbox.value);

    if (!idade || !peso || selecionados.length === 0) {
      alert("Preencha idade, peso e selecione pelo menos um sintoma.");
      return;
    }

    const texto = gerarPrescricao({ medicamentos, sintomas }, idade, peso, selecionados);
    document.getElementById("resultado").textContent = texto;
  });
});
