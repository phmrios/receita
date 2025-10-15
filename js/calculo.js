// js/calculo.js

// ===== UTILITÁRIOS =====
function arredondar(valor) {
  return Math.round(valor);
}

function normalizarIdadeInteira(idadeAnos) {
  if (idadeAnos < 1) return 0; // lactente
  const arred = Math.round(idadeAnos);
  return Math.min(18, Math.max(1, arred));
}

// ===== CÁLCULO UI/dia (Vitamina D) =====
function calcularDoseVitaminaD_UIporDia(protocolo, idadeAnos) {
  if (idadeAnos < 1) return protocolo.dose_ui_dia_lactente || 400;
  const idadeTab = normalizarIdadeInteira(idadeAnos);
  return protocolo.tabela_ui_por_idade?.[String(idadeTab)] ?? null;
}

// ===== FORMATAÇÃO CENTRALIZADA =====
function formatarPrescricao(med, doseTexto, protocolo) {
  const isRelatorio = med?.id === "dipironaecasa";

  let texto = `${med.nome} ${med.forma}`;
  if (med.apresentacao) texto += ` (${med.apresentacao})`;

  // Só adiciona "— 01 frasco" se NÃO for o relatório
  if (!isRelatorio) {
    texto += ` — 01 frasco`;
  }

  texto += `\n   Uso: ${doseTexto}`;
  if (protocolo.frequencia) texto += ` ${protocolo.frequencia}`;
  if (protocolo.duracao) texto += `, ${protocolo.duracao}`;

  // Evita duplicações de observações
  const obsSet = new Set();

  const addObs = (obs) => {
    if (!obs) return;
    const normalizado = obs.trim().replace(/\s+/g, " ");
    if (
      !doseTexto.includes(normalizado) &&
      !texto.includes(normalizado) &&
      !obsSet.has(normalizado)
    ) {
      obsSet.add(normalizado);
    }
  };

  addObs(protocolo?.observacao);
  addObs(med?.observacao);

  if (obsSet.size > 0) {
    texto += `\n   Obs: ${Array.from(obsSet).join(" | ")}`;
  }

  return texto;
}

// ===== CÁLCULO PRINCIPAL =====
export function calcularPrescricao(med, idadeAnos, pesoKg) {
  const prescricoes = [];

  for (const protocolo of med.regras) {
    const foraDaFaixa =
      (protocolo.idade_min && idadeAnos < protocolo.idade_min) ||
      (protocolo.idade_max && idadeAnos > protocolo.idade_max) ||
      (protocolo.peso_min && pesoKg < protocolo.peso_min) ||
      (protocolo.peso_max && pesoKg > protocolo.peso_max);

    if (foraDaFaixa) continue;

    // ---- ROTA UI/dia ----
    if (protocolo.dose_ui_dia_lactente || protocolo.tabela_ui_por_idade) {
      const doseUIDia = calcularDoseVitaminaD_UIporDia(protocolo, idadeAnos);
      let gotas = null;
      if (doseUIDia && med.concentracao_ui_por_gota)
        gotas = Math.max(
          1,
          Math.round(doseUIDia / med.concentracao_ui_por_gota),
        );

      const doseTexto = gotas ? `${gotas} gotas` : `${doseUIDia ?? "—"} UI`;
      prescricoes.push(formatarPrescricao(med, doseTexto, protocolo));
      continue;
    }

    // ---- ROTA mg/kg ----
    let doseMg = null;
    let dosesPorDia = 1;

    if (protocolo.faixa_mgkg) {
      const freqNum = parseInt(protocolo.frequencia?.match(/\d+/)?.[0]);
      dosesPorDia =
        protocolo.tipo_faixa_mgkg === "dia"
          ? 24 / (freqNum || 8)
          : freqNum
            ? 24 / freqNum
            : 1;

      const [min, max] = protocolo.faixa_mgkg;
      const alvo = (min + max) / 2;

      if (protocolo.tipo_faixa_mgkg === "dose") {
        doseMg = pesoKg * alvo;
      } else if (protocolo.tipo_faixa_mgkg === "dia") {
        doseMg = (pesoKg * alvo) / dosesPorDia;
      }

      // Limites de segurança
      if (protocolo.dose_max_mgkg_dia) {
        doseMg = Math.min(
          doseMg,
          (pesoKg * protocolo.dose_max_mgkg_dia) / dosesPorDia,
        );
      }
      if (protocolo.dose_max_mg_dose) {
        doseMg = Math.min(doseMg, protocolo.dose_max_mg_dose);
      }
      if (protocolo.dose_max_mg_dia) {
        doseMg = Math.min(doseMg, protocolo.dose_max_mg_dia / dosesPorDia);
      }
    }

    let doseTexto = "";
    if (doseMg && protocolo.concentracao) {
      const ml = doseMg / protocolo.concentracao;
      if (med.forma === "Gotas") {
        doseTexto = `${arredondar(ml * 20)} gotas`;
      } else {
        doseTexto = `${arredondar(ml)} mL`;
      }
    } else if (protocolo.observacao) {
      doseTexto = protocolo.observacao;
    } else {
      doseTexto = "⚠️ Não há dose recomendada para este paciente.";
    }

    prescricoes.push(formatarPrescricao(med, doseTexto, protocolo));
  }

  return prescricoes.length > 0 ? [prescricoes[0]] : [];
}

// ===== GERA PRESCRIÇÃO COMPLETA =====
export function gerarPrescricao(
  { medicamentos, sintomas },
  idade,
  peso,
  sintomasSelecionados,
) {
  const resultado = [
    "--------------------------------",
    `Paciente: ${idade} anos, ${peso} kg`,
    "Prescrição:",
    "--------------------------------",
  ];
  const usados = new Set();

  for (const id of sintomasSelecionados) {
    const sintoma = sintomas[id];
    if (!sintoma) continue;

    for (const medId of sintoma.medicamentos_ids) {
      if (usados.has(medId)) continue;
      usados.add(medId);

      const med = medicamentos[medId];
      if (!med) continue;

      // injeta o id no objeto do medicamento (permite lógica condicional na formatação)
      const medComId = { ...med, id: medId };

      const prescricoes = calcularPrescricao(medComId, idade, peso);
      resultado.push(prescricoes[0]);
    }
  }

  return resultado.join("\n\n");
}

// ===== CARREGAR DADOS =====
export async function carregarDadosClinicos() {
  const [respMed, respSint] = await Promise.all([
    fetch("data/medicamentos.json"),
    fetch("data/sintomas.json"),
  ]);
  return {
    medicamentos: await respMed.json(),
    sintomas: await respSint.json(),
  };
}
