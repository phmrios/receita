// ====================================================================
//  FICHA PALS - CÁLCULOS E GERAÇÃO ASCII (v2.0)
//  Autor: Pedro Rios (Médico)
// ====================================================================

// ----- Funções de cálculo -----
function calcularTot(idade) {
  return (idade / 4 + 3.5).toFixed(1);
}

function calcularProfundidadeTot(idade) {
  return (calcularTot(idade) * 3).toFixed(1);
}

function doseMgKg(peso, mgPorKg) {
  return (peso * mgPorKg).toFixed(2);
}

function doseMlKg(peso, mlPorKg) {
  return (peso * mlPorKg).toFixed(1);
}

function formatarNumero(num) {
  return num % 1 === 0 ? parseInt(num) : num;
}

function corBroselow(peso) {
  if (peso <= 3) return "Rosa (RN)";
  if (peso <= 5) return "Vermelho";
  if (peso <= 8) return "Roxo";
  if (peso <= 10) return "Amarelo";
  if (peso <= 14) return "Verde";
  if (peso <= 18) return "Laranja";
  if (peso <= 23) return "Azul";
  return "Cinzento (>25 kg)";
}

// ----- Função principal -----
function gerarFichaPALS(dados) {
  const { nome, idade, peso, altura, sexo } = dados;

  if (altura && altura > 200) {
    alert("Verifique: altura acima de 200 cm parece incorreta.");
  }

  const tot = calcularTot(idade);
  const profundidade = calcularProfundidadeTot(idade);
  const cor = corBroselow(peso);

  const doseAdrenalina = doseMgKg(peso, 0.01);
  const doseAdrenalinaMl = doseMlKg(peso, 0.1);
  const doseAmiodarona = doseMgKg(peso, 5);
  const doseAtropina = doseMgKg(peso, 0.02);
  const doseDextrose = doseMlKg(peso, 5);
  const doseSF = doseMlKg(peso, 20);

  if (doseAtropina > 0.5) alert("Atenção: dose máxima de atropina é 0,5 mg.");
  if (doseAmiodarona > 300)
    alert("Atenção: dose máxima de amiodarona é 300 mg.");
  if (doseAdrenalina > 1)
    alert("Atenção: dose máxima única de adrenalina é 1 mg.");

  const ficha = `
===============================================================================
               FICHA DE PARADA PEDIÁTRICA PRÉ-PREENCHIDA (PALS)
===============================================================================
Nome: ${nome}
Idade: ${idade} anos
Peso: ${peso} kg
Altura: ${altura || "-"} cm
Sexo: ${sexo || "-"}
Fita de Broselow (estimada): ${cor}
-------------------------------------------------------------------------------
[VIAS AÉREAS]
TOT cuff recomendado: ${tot} mm
Profundidade estimada: ${profundidade} cm
-------------------------------------------------------------------------------
[DOSES CALCULADAS]
Adrenalina (0,01 mg/kg): ${doseAdrenalina} mg  (1:10.000 = ${doseAdrenalinaMl} mL)
Amiodarona (5 mg/kg): ${doseAmiodarona} mg
Atropina (0,02 mg/kg): ${doseAtropina} mg
Dextrose 10% (5 mL/kg): ${doseDextrose} mL
SF 0,9% (20 mL/kg): ${doseSF} mL
-------------------------------------------------------------------------------
[ENERGIA DE DESFIBRILAÇÃO]
1º choque (2 J/kg): ${formatarNumero(peso * 2)} J
2º choque (4 J/kg): ${formatarNumero(peso * 4)} J
Choques seguintes (até 10 J/kg): ${formatarNumero(peso * 10)} J
-------------------------------------------------------------------------------
[REFERÊNCIAS RÁPIDAS DE RCP]
Compressões: 100–120/min | Profundidade: 1/3 do tórax (~5 cm)
Relação ventilações: 15:2 (2 reanimadores) ou 30:2 (1 reanimador)
Capnografia: alvo ETCO₂ ≥ 10–15 mmHg durante RCP
-------------------------------------------------------------------------------
[OBSERVAÇÕES]
- Atualizar peso diariamente.
- Revisar doses conforme nova condição clínica.
===============================================================================
  `;
  return ficha;
}

// ----- Evento principal -----
document.getElementById("gerarFicha").addEventListener("click", () => {
  const dados = {
    nome: document.getElementById("nome").value,
    idade: parseFloat(document.getElementById("idade").value),
    peso: parseFloat(document.getElementById("peso").value),
    altura: parseFloat(document.getElementById("altura").value),
    sexo: document.getElementById("sexo").value,
  };

  const saida = gerarFichaPALS(dados);
  document.getElementById("saida").textContent = saida;
});
