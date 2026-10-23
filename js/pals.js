// ====================================================================
//  FICHA PALS - CÁLCULOS E GERAÇÃO ASCII (v3.0)
//  Autor: Pedro Rios (Médico)
// ====================================================================

// ----- Funções de cálculo -----
const limitar = (valor, max) => Math.min(valor, max);

const fmt = (n, casas = 2) =>
  Number(n).toLocaleString("pt-BR", { maximumFractionDigits: casas });

// Tubo com cuff: < 1 ano 3,0 · 1–2 anos 3,5 · ≥ 2 anos idade/4 + 3,5
export function calcularTot(idade) {
  if (idade < 1) return 3.0;
  if (idade < 2) return 3.5;
  return Math.round((idade / 4 + 3.5) * 2) / 2;
}

export function calcularProfundidadeTot(idade) {
  return calcularTot(idade) * 3;
}

// Fita de Broselow (faixas de peso em kg)
export function corBroselow(peso) {
  if (peso < 3) return "abaixo da fita (< 3 kg)";
  if (peso <= 5) return "Cinza (3–5 kg)";
  if (peso <= 7) return "Rosa (6–7 kg)";
  if (peso <= 9) return "Vermelho (8–9 kg)";
  if (peso <= 11) return "Roxo (10–11 kg)";
  if (peso <= 14) return "Amarelo (12–14 kg)";
  if (peso <= 18) return "Branco (15–18 kg)";
  if (peso <= 23) return "Azul (19–23 kg)";
  if (peso <= 29) return "Laranja (24–29 kg)";
  if (peso <= 36) return "Verde (30–36 kg)";
  return "acima da fita (> 36 kg): usar doses de adulto";
}

// Doses com teto (máximo) já aplicado.
export function calcularDoses(peso) {
  const adrenalinaMg = limitar(peso * 0.01, 1);
  return {
    adrenalinaMg,
    adrenalinaMl: adrenalinaMg / 0.1, // 1:10.000 = 0,1 mg/mL
    amiodaronaMg: limitar(peso * 5, 300),
    atropinaMg: limitar(peso * 0.02, 0.5),
    adenosina1Mg: limitar(peso * 0.1, 6),
    adenosina2Mg: limitar(peso * 0.2, 12),
    glicoseD10Ml: peso * 5,
    sfMl: limitar(peso * 20, 1000),
    choque1J: limitar(peso * 2, 200),
    choque2J: limitar(peso * 4, 200),
    choqueMaxJ: limitar(peso * 10, 200),
    cardioversao1J: limitar(peso * 0.5, 200),
    cardioversao2J: limitar(peso * 2, 200),
  };
}

export function validarDadosPALS({ idade, peso, altura }) {
  const erros = [];
  if (isNaN(idade) || idade < 0 || idade > 18) erros.push("Informe a idade (0 a 18 anos).");
  if (isNaN(peso) || peso <= 0 || peso > 150) erros.push("Informe o peso em kg.");
  if (!isNaN(altura) && (altura < 30 || altura > 200)) erros.push("Altura deve estar entre 30 e 200 cm.");
  return erros;
}

// ----- Função principal -----
export function gerarFichaPALS({ nome, idade, peso, altura, sexo }) {
  const d = calcularDoses(peso);
  const tot = calcularTot(idade);
  const profundidadeRcp = idade < 1 ? "~4 cm" : idade < 12 ? "~5 cm" : "5–6 cm";
  const teto = (valor, bruto) => (valor < bruto ? " (dose máxima)" : "");

  return `
===============================================================================
               FICHA DE PARADA PEDIÁTRICA PRÉ-PREENCHIDA (PALS)
===============================================================================
Nome: ${nome || "-"}
Idade: ${fmt(idade, 1)} anos
Peso: ${fmt(peso, 1)} kg
Altura: ${isNaN(altura) ? "-" : fmt(altura, 0)} cm
Sexo: ${sexo || "-"}
Fita de Broselow (estimada): ${corBroselow(peso)}
-------------------------------------------------------------------------------
[VIAS AÉREAS]
TOT com cuff: ${fmt(tot, 1)} mm (separar também ${fmt(tot - 0.5, 1)} e ${fmt(tot + 0.5, 1)})
Profundidade estimada (3 × TOT): ${fmt(calcularProfundidadeTot(idade), 1)} cm
-------------------------------------------------------------------------------
[DOSES CALCULADAS]
Adrenalina (0,01 mg/kg, máx. 1 mg): ${fmt(d.adrenalinaMg)} mg = ${fmt(d.adrenalinaMl, 1)} mL de 1:10.000${teto(d.adrenalinaMg, peso * 0.01)}
Amiodarona (5 mg/kg, máx. 300 mg): ${fmt(d.amiodaronaMg, 1)} mg${teto(d.amiodaronaMg, peso * 5)}
Atropina (0,02 mg/kg, máx. 0,5 mg): ${fmt(d.atropinaMg)} mg${teto(d.atropinaMg, peso * 0.02)}
Adenosina 1ª (0,1 mg/kg, máx. 6 mg): ${fmt(d.adenosina1Mg)} mg | 2ª (0,2 mg/kg, máx. 12 mg): ${fmt(d.adenosina2Mg)} mg
Glicose 10% (5 mL/kg): ${fmt(d.glicoseD10Ml, 1)} mL
SF 0,9% (20 mL/kg, máx. 1000 mL): ${fmt(d.sfMl, 0)} mL
-------------------------------------------------------------------------------
[DESFIBRILAÇÃO] (FV / TV sem pulso)
1º choque (2 J/kg): ${fmt(d.choque1J, 0)} J
2º choque (4 J/kg): ${fmt(d.choque2J, 0)} J
Choques seguintes (≥ 4 J/kg, até 10 J/kg ou dose adulta): até ${fmt(d.choqueMaxJ, 0)} J
[CARDIOVERSÃO SINCRONIZADA]
1ª (0,5–1 J/kg): ${fmt(d.cardioversao1J, 0)} J | seguintes (2 J/kg): ${fmt(d.cardioversao2J, 0)} J
-------------------------------------------------------------------------------
[REFERÊNCIAS RÁPIDAS DE RCP]
Compressões: 100–120/min | Profundidade: 1/3 do tórax (${profundidadeRcp})
Relação: 30:2 (1 socorrista) ou 15:2 (2 socorristas)
Com via aérea avançada: 1 ventilação a cada 2–3 s, compressões contínuas
Capnografia: alvo ETCO₂ ≥ 10–15 mmHg durante RCP
-------------------------------------------------------------------------------
[OBSERVAÇÕES]
- Atualizar peso diariamente.
- Revisar doses conforme nova condição clínica.
===============================================================================
`.trim();
}

// ----- Página -----
if (typeof document !== "undefined") {
  const { mostrarLista, mostrarMensagem, ligarBotoesDeSaida } = await import("./comum.js");
  ligarBotoesDeSaida();

  document.getElementById("gerarFicha").addEventListener("click", () => {
    const num = (id) => parseFloat(document.getElementById(id).value.replace(",", "."));
    const dados = {
      nome: document.getElementById("nome").value.trim(),
      idade: num("idade"),
      peso: num("peso"),
      altura: num("altura"),
      sexo: document.getElementById("sexo").value,
    };

    const msg = document.getElementById("mensagem-form");
    const erros = validarDadosPALS(dados);
    if (erros.length) {
      mostrarLista(msg, erros, "erro");
      return;
    }
    mostrarMensagem(msg, "");
    document.getElementById("saida").textContent = gerarFichaPALS(dados);
  });
}
