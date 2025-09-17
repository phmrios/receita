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

// ATUALIZAÇÃO DA FUNÇÃO calcularPrescricao (com lógica de limite segura)
function calcularPrescricao(medicamento, idadeAnos, pesoKg) {
  let prescricoes = [];

  medicamento.regras.forEach(regra => {
    // 1. FILTRO de idade e peso (continua igual)
    if ((regra.idade_min && idadeAnos < regra.idade_min) ||
        (regra.idade_max && idadeAnos > regra.idade_max) ||
        (regra.peso_min && pesoKg < regra.peso_min) ||
        (regra.peso_max && pesoKg > regra.peso_max)) {
      return;
    }

    let doseMg = null;
    let dosesPorDia = 1; // Default para caso não haja frequência

    // 2. CÁLCULO BASE (Lógica movida para cima)
    if (regra.faixa_mgkg) {
      // Pega o primeiro número da frequência (ex: '6' de "a cada 6 ou 8 horas")
      // Se não achar, assume '8' (para 'dia') ou '1' (para 'dose')
      let freqNum = parseInt(regra.frequencia?.match(/\d+/)?.[0]);
      
      if (regra.tipo_faixa_mgkg === "dia") {
        dosesPorDia = 24 / (freqNum || 8); // Se for por dia, não pode ser 1
      } else if (regra.tipo_faixa_mgkg === "dose") {
        dosesPorDia = freqNum ? (24 / freqNum) : 1; // Se for por dose, pode ser dose única
      }
      
      const [min, max] = regra.faixa_mgkg;
      const alvo = (min + max) / 2;

      if (regra.tipo_faixa_mgkg === "dose") {
        doseMg = pesoKg * alvo;
      } else if (regra.tipo_faixa_mgkg === "dia") {
        let totalDia = pesoKg * alvo;
        doseMg = totalDia / dosesPorDia;
      }

      // --- INÍCIO DA NOVA LÓGICA DE LIMITES ---
      // Aplica os limites de dose de forma segura, na ordem correta
      
      // 1. Limite de mg/kg/dia (Ex: 40 mg/kg/dia do Ibuprofeno)
      if (regra.dose_max_mgkg_dia) {
        let doseMgMax_calc_por_dia_kg = (pesoKg * regra.dose_max_mgkg_dia) / dosesPorDia;
        doseMg = Math.min(doseMg, doseMgMax_calc_por_dia_kg);
      }

      // 2. Limite de mg por DOSE (Ex: 1000mg da Dipirona)
      if (regra.dose_max_mg_dose) {
        doseMg = Math.min(doseMg, regra.dose_max_mg_dose);
      }

      // 3. Limite de mg por DIA (Ex: 4000mg do Paracetamol)
      if (regra.dose_max_mg_dia) {
        let doseMgMax_calc_por_dia_total = regra.dose_max_mg_dia / dosesPorDia;
        doseMg = Math.min(doseMg, doseMgMax_calc_por_dia_total);
      }
      // --- FIM DA NOVA LÓGICA DE LIMITES ---
    }

    // 3. CÁLCULO DE VOLUME (mL e Gotas) (continua igual)
    let ml = null;
    let gotas = null;

    if (doseMg && regra.concentracao) {
      ml = arredondar(doseMg / regra.concentracao * 10) / 10;
      if (medicamento.forma === "Gotas") {
        gotas = arredondar(ml * 20);
      }
    }

    // 4. FORMAÇÃO DO TEXTO (com nome dinâmico)
    let nomeCompleto = `${medicamento.nome} ${medicamento.forma}`;
    if (medicamento.apresentacao) {
      nomeCompleto += ` (${medicamento.apresentacao})`;
    }
    
    let texto = `${nomeCompleto} — 01 frasco`;

    if (ml || gotas) {
      texto += `\n   Uso: Administrar `;
      if (ml) texto += `${ml} mL`;
      if (gotas) texto += ` (${gotas} gotas)`;
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
        // Usa o nome dinâmico aqui também, para consistência
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

  const sintomasSelect = document.getElementById("sintomas");
  Object.entries(sintomas).forEach(([id, s]) => {
    let opt = document.createElement("option");
    opt.value = id;
    opt.textContent = s.nome;
    sintomasSelect.appendChild(opt);
  });

  document.getElementById("gerar").addEventListener("click", () => {
    const idade = parseFloat(document.getElementById("idade").value);
    const peso = parseFloat(document.getElementById("peso").value);
    const selecionados = Array.from(sintomasSelect.selectedOptions).map(o => o.value);

    if (!idade || !peso || selecionados.length === 0) {
      alert("Preencha idade, peso e selecione pelo menos um sintoma.");
      return;
    }

    const texto = gerarPrescricao({ medicamentos, sintomas }, idade, peso, selecionados);
    document.getElementById("resultado").textContent = texto;
  });
});