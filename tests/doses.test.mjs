// Testes das doses. Rodar com:  npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  calcularMedicamento,
  gerarPrescricao,
  validarDados,
  dosesPorDia,
  arredondarMl,
  formatarIdade,
} from "../js/calculo.js";
import { corBroselow, calcularDoses, calcularTot } from "../js/pals.js";

const ler = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const medicamentos = ler("../data/medicamentos.json");
const sintomas = ler("../data/sintomas.json");
const dados = { medicamentos, sintomas };

const uso = (id, idade, peso) => {
  const r = calcularMedicamento(medicamentos[id], idade, peso);
  assert.ok(r.ok, r.aviso);
  return r.item.uso;
};

test("cadastro sem IDs órfãos nem sintomas vazios", () => {
  assert.deepEqual(validarDados(dados), []);
});

test("frequência: 'a cada X horas' e 'X vezes ao dia'", () => {
  assert.equal(dosesPorDia({ frequencia: "a cada 8 horas" }), 3);
  assert.equal(dosesPorDia({ frequencia: "2 vezes ao dia" }), 2);
  assert.equal(dosesPorDia({ frequencia: "1 vez ao dia" }), 1);
  assert.equal(dosesPorDia({ frequencia: "5 vezes ao dia (café...)" }), 5);
});

test("arredondamento de mL", () => {
  assert.equal(arredondarMl(1.4), 1.5);
  assert.equal(arredondarMl(2.24), 2);
  assert.equal(arredondarMl(0.33), 0.3);
  assert.equal(arredondarMl(0.01), 0.1);
});

test("idade em texto", () => {
  assert.equal(formatarIdade(0.5), "6 meses");
  assert.equal(formatarIdade(1.5), "1 ano e 6 meses");
  assert.equal(formatarIdade(8), "8 anos");
});

test("prednisolona 15 kg: 1,5 mg/kg/dia em dose única = 7,5 mL", () => {
  assert.match(uso("prednisolona_3", 3, 15), /^7,5 mL 1 vez ao dia/);
});

test("azitromicina 15 kg: 1 vez ao dia (não 8/8h)", () => {
  assert.match(uso("azitromicina_oral", 3, 15), /^4 mL 1 vez ao dia, por 3 dias/);
});

test("amoxicilina 10 kg: 50 mg/kg/dia 8/8h = 3,5 mL", () => {
  // 500 mg/dia ÷ 3 = 166,7 mg = 3,33 mL → 3,5 mL
  assert.match(uso("amoxicilina_padrao", 2, 10), /^3,5 mL a cada 8 horas/);
});

test("ciprofloxacino 30 kg: 1 comprimido (não '0 mL')", () => {
  assert.match(uso("ciprofloxacino_500", 10, 30), /^1 comprimido a cada 12 horas/);
});

test("comprimido que não dá para fracionar em criança pequena vira aviso", () => {
  const r = calcularMedicamento(medicamentos.ciprofloxacino_500, 0.5, 7);
  assert.equal(r.ok, false);
});

test("dipirona: bloqueia < 3 meses", () => {
  assert.equal(calcularMedicamento(medicamentos.dipirona_500, 0.1, 4).ok, false);
});

test("adolescente recebe dose adulta, sem itens sumindo", () => {
  const r = gerarPrescricao(dados, 13, 45, ["febre_dor", "amigdalite"]);
  assert.match(r.texto, /Dipirona 500 mg — Comprimido/);
  assert.match(r.texto, /Amoxicilina 500 mg — Cápsula/);
  assert.match(r.texto, /Azitromicina 500 mg/);
});

test("pneumonia grave inclui amoxicilina em dose alta", () => {
  const r = gerarPrescricao(dados, 3, 15, ["pneumonia_sinusite_grave"]);
  assert.match(r.texto, /Amoxicilina \(dose alta\)/);
  assert.match(r.texto, /9 mL a cada 8 horas/);
});

test("quantidade de frascos pelo tratamento completo", () => {
  const r = calcularMedicamento(medicamentos.amoxicilina_dose_alta, 3, 15);
  assert.match(r.item.cabecalho, /02 frascos de 150 mL/);
});

test("nenhuma combinação gera 'undefined', 'NaN' ou dose zero", () => {
  const todos = sintomas.map((s) => s.id);
  const pacientes = [
    [0.1, 4], [0.3, 6], [0.5, 7], [1, 10], [2, 12], [3, 15], [5, 18],
    [8, 26], [10, 30], [11.9, 39], [12, 40], [15, 55], [18, 70],
  ];
  for (const [idade, peso] of pacientes) {
    const { texto, conferencia, avisos } = gerarPrescricao(dados, idade, peso, todos);
    const tudo = [texto, ...conferencia, ...avisos].join("\n");
    assert.doesNotMatch(tudo, /undefined|NaN|null/, `${idade} anos / ${peso} kg`);
    assert.doesNotMatch(texto, /\b0 (mL|gotas)\b/, `${idade} anos / ${peso} kg`);
  }
});

test("PALS: fita de Broselow", () => {
  assert.equal(corBroselow(4), "Cinza (3–5 kg)");
  assert.equal(corBroselow(10), "Roxo (10–11 kg)");
  assert.equal(corBroselow(16), "Branco (15–18 kg)");
  assert.equal(corBroselow(25), "Laranja (24–29 kg)");
  assert.equal(corBroselow(33), "Verde (30–36 kg)");
});

test("PALS: doses respeitam o máximo", () => {
  const d = calcularDoses(120);
  assert.equal(d.adrenalinaMg, 1);
  assert.equal(d.amiodaronaMg, 300);
  assert.equal(d.atropinaMg, 0.5);
  assert.equal(d.choqueMaxJ, 200);
  assert.equal(calcularDoses(10).adrenalinaMg, 0.1);
});

test("PALS: tubo com cuff", () => {
  assert.equal(calcularTot(0.5), 3);
  assert.equal(calcularTot(1.5), 3.5);
  assert.equal(calcularTot(4), 4.5);
  assert.equal(calcularTot(6), 5);
});
