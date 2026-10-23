// js/calculo.js
// Motor de cálculo da prescrição. Funções puras (sem DOM) para poder testar.

// ===== CRITÉRIO DE DOSE ADULTA =====
export const IDADE_ADULTO = 12;
export const PESO_ADULTO = 40;

export function ehAdulto(idadeAnos, pesoKg) {
  return idadeAnos >= IDADE_ADULTO || pesoKg >= PESO_ADULTO;
}

// ===== FORMATAÇÃO =====
export function fmt(n, casas = 2) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

const doisDigitos = (n) => String(n).padStart(2, "0");

export function formatarIdade(idadeAnos) {
  const totalMeses = Math.round(idadeAnos * 12);
  const anos = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  if (anos === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const txtAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  if (meses === 0 || anos >= 5) return txtAnos;
  return `${txtAnos} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
}

// ===== ARREDONDAMENTOS =====
// mL: passos de 0,5 mL (abaixo de 1 mL, passos de 0,1 mL para não zerar).
export function arredondarMl(ml) {
  const passo = ml < 1 ? 0.1 : 0.5;
  const r = Math.round(ml / passo) * passo;
  return Math.max(passo, Number(r.toFixed(2)));
}

// Comprimido: passos de 1/2 (ou inteiro se não fracionável, ex.: cápsula).
export function arredondarUnidades(n, fracionavel = true) {
  const passo = fracionavel ? 0.5 : 1;
  return Math.max(passo, Math.round(n / passo) * passo);
}

function textoUnidades(n, nomeUnidade) {
  const plural = n > 1 ? `${nomeUnidade}s` : nomeUnidade;
  if (n === 0.5) return `1/2 ${nomeUnidade}`;
  const inteiro = Math.floor(n);
  const meio = n - inteiro === 0.5 ? " e 1/2" : "";
  return `${inteiro}${meio} ${plural}`;
}

// ===== FREQUÊNCIA / DURAÇÃO =====
// "a cada 8 horas" → 3 · "2 vezes ao dia" → 2 · "1 vez ao dia" → 1
export function dosesPorDia(regra) {
  if (regra.doses_por_dia) return regra.doses_por_dia;
  const f = regra.frequencia || "";
  const intervalo = f.match(/a cada (\d+)/i);
  if (intervalo) return 24 / Number(intervalo[1]);
  const vezes = f.match(/(\d+)\s*vez(es)?/i);
  if (vezes) return Number(vezes[1]);
  return 1;
}

export function diasDeTratamento(regra) {
  const m = (regra.duracao || "").match(/(\d+)\s*dias/);
  return m ? Number(m[1]) : null;
}

// ===== SELEÇÃO DA REGRA =====
function dentroDaFaixa(regra, idade, peso) {
  if (regra.idade_min != null && idade < regra.idade_min) return false;
  if (regra.idade_max != null && idade > regra.idade_max) return false;
  if (regra.peso_min != null && peso < regra.peso_min) return false;
  if (regra.peso_max != null && peso > regra.peso_max) return false;
  return true;
}

function regrasCandidatas(med, idade, peso) {
  const adultas = med.regras.filter((r) => r.publico === "adulto");
  if (ehAdulto(idade, peso) && adultas.length > 0) return adultas;
  return med.regras.filter((r) => r.publico !== "adulto");
}

function descreverFaixas(regras) {
  const partes = regras.map((r) => {
    const f = [];
    if (r.idade_min != null) f.push(`idade ≥ ${formatarIdade(r.idade_min)}`);
    if (r.idade_max != null) f.push(`idade ≤ ${formatarIdade(r.idade_max)}`);
    if (r.peso_min != null) f.push(`peso ≥ ${fmt(r.peso_min)} kg`);
    if (r.peso_max != null) f.push(`peso ≤ ${fmt(r.peso_max)} kg`);
    return f.join(" e ");
  });
  return partes.filter(Boolean).join("; ") || "sem faixa";
}

// ===== CÁLCULO DE UM MEDICAMENTO =====
// Retorna { ok, item: {cabecalho, uso, obs}, conferencia } ou { ok:false, aviso }
export function calcularMedicamento(med, idade, peso) {
  const candidatas = regrasCandidatas(med, idade, peso);
  const regra = candidatas.find((r) => dentroDaFaixa(r, idade, peso));

  if (!regra) {
    return {
      ok: false,
      aviso: `${med.nome}: não indicado / sem dose cadastrada para ${formatarIdade(idade)} e ${fmt(peso)} kg (faixa: ${descreverFaixas(candidatas)}).`,
    };
  }

  // Campos da regra sobrescrevem os do medicamento (exceto observação, que soma).
  const { regras, observacao: obsMed, ...baseMed } = med;
  const { observacao: obsRegra, ...baseRegra } = regra;
  const p = { ...baseMed, ...baseRegra };

  const dpd = dosesPorDia(p);
  const dias = diasDeTratamento(p);
  let doseTexto;
  let quantidade = p.quantidade;
  let conferencia = null;

  if (p.posologia) {
    // ---- Rota texto fixo ----
    doseTexto = p.posologia;
  } else if (p.dose_ui_dia) {
    // ---- Rota UI/dia (vitamina D) ----
    const gotas = Math.max(1, Math.round(p.dose_ui_dia / p.ui_por_gota));
    doseTexto = `${gotas} ${gotas === 1 ? "gota" : "gotas"}`;
    conferencia = `${fmt(p.dose_ui_dia)} UI/dia ÷ ${fmt(p.ui_por_gota)} UI/gota = ${gotas} gotas`;
  } else {
    // ---- Rota mg ----
    const passos = [];
    let doseMg;

    if (p.dose_fixa_mg) {
      doseMg = p.dose_fixa_mg;
      passos.push(`dose fixa ${fmt(doseMg)} mg/dose`);
    } else if (p.faixa_mgkg) {
      const [min, max] = p.faixa_mgkg;
      const alvo = p.alvo_mgkg ?? (min + max) / 2;
      if (p.tipo_faixa_mgkg === "dia") {
        const mgDia = alvo * peso;
        doseMg = mgDia / dpd;
        passos.push(
          `${fmt(alvo)} mg/kg/dia × ${fmt(peso)} kg = ${fmt(mgDia, 1)} mg/dia ÷ ${fmt(dpd)} = ${fmt(doseMg, 1)} mg/dose`,
        );
      } else {
        doseMg = alvo * peso;
        passos.push(
          `${fmt(alvo)} mg/kg/dose × ${fmt(peso)} kg = ${fmt(doseMg, 1)} mg/dose`,
        );
      }
    } else {
      return {
        ok: false,
        aviso: `${med.nome}: cadastro sem dose (falta posologia, dose fixa ou faixa mg/kg).`,
      };
    }

    // Limites de segurança
    const limites = [
      [p.dose_max_mg_dose, "máx. por dose"],
      [p.dose_max_mg_dia && p.dose_max_mg_dia / dpd, "máx. por dia"],
      [p.dose_max_mgkg_dia && (p.dose_max_mgkg_dia * peso) / dpd, "máx. mg/kg/dia"],
    ];
    for (const [teto, motivo] of limites) {
      if (teto && doseMg > teto) {
        doseMg = teto;
        passos.push(`limitado a ${fmt(doseMg, 1)} mg (${motivo})`);
      }
    }

    let mgReal;
    let volumeDoseMl = null;
    if (p.mg_por_unidade) {
      const nomeUnidade = p.unidade_solida || "comprimido";
      const n = arredondarUnidades(doseMg / p.mg_por_unidade, p.fracionavel !== false);
      mgReal = n * p.mg_por_unidade;
      if (mgReal > doseMg * 1.25) {
        return {
          ok: false,
          aviso: `${p.nome}: dose calculada de ${fmt(doseMg, 1)} mg não é possível com ${nomeUnidade} de ${fmt(p.mg_por_unidade)} mg (daria ${fmt(mgReal)} mg). Usar apresentação líquida ou ajustar manualmente.`,
        };
      }
      doseTexto = textoUnidades(n, nomeUnidade);
      if (!quantidade && dias) {
        const total = Math.ceil(n * dpd * dias);
        quantidade = `${doisDigitos(total)} ${total > 1 ? `${nomeUnidade}s` : nomeUnidade}`;
      }
    } else if (p.gotas_por_ml) {
      const gotas = Math.max(1, Math.round((doseMg / p.concentracao) * p.gotas_por_ml));
      mgReal = (gotas / p.gotas_por_ml) * p.concentracao;
      doseTexto = `${gotas} ${gotas === 1 ? "gota" : "gotas"}`;
      passos.push(`${p.gotas_por_ml} gotas/mL`);
    } else {
      volumeDoseMl = arredondarMl(doseMg / p.concentracao);
      mgReal = volumeDoseMl * p.concentracao;
      doseTexto = `${fmt(volumeDoseMl)} mL`;
    }

    passos.push(
      `${doseTexto} = ${fmt(mgReal, 1)} mg (${fmt(mgReal / peso, 1)} mg/kg/dose; ${fmt((mgReal * dpd) / peso, 1)} mg/kg/dia)`,
    );

    if (volumeDoseMl && dias) {
      const totalMl = volumeDoseMl * dpd * dias;
      passos.push(`total do tratamento ≈ ${fmt(totalMl, 0)} mL`);
      if (!quantidade && p.volume_frasco_ml) {
        const frascos = Math.ceil(totalMl / p.volume_frasco_ml);
        quantidade = `${doisDigitos(frascos)} ${frascos > 1 ? "frascos" : "frasco"} de ${p.volume_frasco_ml} mL`;
      }
    }
    conferencia = passos.join(" → ");
  }

  let uso = doseTexto;
  if (!p.posologia) {
    if (p.frequencia) uso += ` ${p.frequencia}`;
    if (p.duracao) uso += `, ${p.duracao}`;
  }

  const obs = [obsRegra, obsMed].map((o) => o?.trim()).filter(Boolean);
  const nomeCompleto = [p.nome, p.apresentacao, p.forma ? `— ${p.forma}` : ""]
    .filter(Boolean)
    .join(" ");

  return {
    ok: true,
    item: {
      cabecalho: `${nomeCompleto} — ${quantidade || "01 frasco"}`,
      uso,
      obs: [...new Set(obs)].join(" "),
    },
    conferencia: conferencia && `${p.nome}: ${conferencia}`,
  };
}

// ===== PLAUSIBILIDADE PESO × IDADE =====
// Peso esperado aproximado (fórmulas APLS); alerta se < 50% ou > 200%.
export function pesoEsperado(idadeAnos) {
  if (idadeAnos < 1) return idadeAnos * 12 * 0.5 + 4;
  if (idadeAnos <= 5) return 2 * idadeAnos + 8;
  if (idadeAnos <= 12) return 3 * idadeAnos + 7;
  return null;
}

export function avaliarPesoIdade(idadeAnos, pesoKg) {
  const esperado = pesoEsperado(idadeAnos);
  if (!esperado) return null;
  if (pesoKg < esperado * 0.5 || pesoKg > esperado * 2) {
    return `Peso de ${fmt(pesoKg)} kg parece incompatível com ${formatarIdade(idadeAnos)} (esperado ≈ ${fmt(esperado, 0)} kg). Confira se não houve erro de digitação.`;
  }
  return null;
}

// ===== VALIDAÇÃO DO CADASTRO =====
export function validarDados({ medicamentos, sintomas }) {
  const problemas = [];
  for (const s of sintomas) {
    if (!s.medicamentos_ids?.length) {
      problemas.push(`Sintoma "${s.nome}" não tem medicamentos cadastrados.`);
    }
    for (const id of s.medicamentos_ids || []) {
      if (!medicamentos[id]) {
        problemas.push(`Sintoma "${s.nome}" usa o medicamento "${id}", que não existe.`);
      }
    }
  }
  for (const [id, med] of Object.entries(medicamentos)) {
    if (!med.regras?.length) problemas.push(`Medicamento "${id}" não tem regras.`);
  }
  return problemas;
}

// ===== GERA PRESCRIÇÃO COMPLETA =====
export function gerarPrescricao({ medicamentos, sintomas }, idade, peso, idsSelecionados) {
  const itens = [];
  const conferencia = [];
  const avisos = [];
  const usados = new Set();
  const textosUsados = new Set();

  const plausibilidade = avaliarPesoIdade(idade, peso);
  if (plausibilidade) avisos.push(plausibilidade);
  if (ehAdulto(idade, peso)) {
    avisos.push(
      `Paciente com ${IDADE_ADULTO} anos ou mais, ou com ${PESO_ADULTO} kg ou mais: usando apresentações e doses de adulto quando cadastradas.`,
    );
  }

  for (const sintoma of sintomas.filter((s) => idsSelecionados.includes(s.id))) {
    for (const medId of sintoma.medicamentos_ids) {
      if (usados.has(medId)) continue;
      usados.add(medId);

      const med = medicamentos[medId];
      if (!med) {
        avisos.push(`Medicamento "${medId}" não encontrado no cadastro.`);
        continue;
      }

      const r = calcularMedicamento(med, idade, peso);
      if (!r.ok) {
        avisos.push(r.aviso);
        continue;
      }
      const chave = `${r.item.cabecalho}|${r.item.uso}`;
      if (textosUsados.has(chave)) continue;
      textosUsados.add(chave);

      itens.push(r.item);
      if (r.conferencia) conferencia.push(r.conferencia);
    }
  }

  const linhas = [`Paciente: ${formatarIdade(idade)}, ${fmt(peso)} kg`, ""];
  itens.forEach((it, i) => {
    linhas.push(`${i + 1}) ${it.cabecalho}`);
    linhas.push(`   Uso: ${it.uso}`);
    if (it.obs) linhas.push(`   Obs: ${it.obs}`);
    linhas.push("");
  });

  return { texto: linhas.join("\n").trim(), conferencia, avisos };
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
