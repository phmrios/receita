// js/ui.js
import { gerarPrescricao, formatarIdade, fmt } from "./calculo.js";
import { gerarEncaminhamento } from "./encaminhamento.js";
import { mostrarMensagem, mostrarLista, ligarBotoesDeSaida } from "./comum.js";

const $ = (id) => document.getElementById(id);

const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function montarSintomas(sintomas) {
  const container = $("sintomas-container");
  const grupos = new Map();
  for (const s of sintomas) {
    if (!grupos.has(s.grupo)) grupos.set(s.grupo, []);
    grupos.get(s.grupo).push(s);
  }

  for (const [grupo, lista] of grupos) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "grupo-sintomas";
    const legend = document.createElement("legend");
    legend.textContent = grupo;
    fieldset.appendChild(legend);

    for (const s of lista) {
      const item = document.createElement("div");
      item.className = "checkbox-item";
      item.dataset.busca = semAcento(`${grupo} ${s.nome}`);

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `sintoma-${s.id}`;
      checkbox.value = s.id;

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = s.nome;

      item.append(checkbox, label);
      fieldset.appendChild(item);
    }
    container.appendChild(fieldset);
  }

  $("busca-sintoma").addEventListener("input", (e) => {
    const termo = semAcento(e.target.value.trim());
    container.querySelectorAll(".grupo-sintomas").forEach((fs) => {
      let visiveis = 0;
      fs.querySelectorAll(".checkbox-item").forEach((item) => {
        const mostrar = !termo || item.dataset.busca.includes(termo);
        item.hidden = !mostrar;
        if (mostrar) visiveis++;
      });
      fs.hidden = visiveis === 0;
    });
  });
}

// Idade sempre em anos internamente.
function lerPaciente() {
  const valor = parseFloat($("idade").value.replace(",", "."));
  const unidade = $("idade-unidade").value;
  const peso = parseFloat($("peso").value.replace(",", "."));
  const idade = unidade === "meses" ? valor / 12 : valor;
  return { idade, peso };
}

export function inicializarUI({ medicamentos, sintomas }) {
  montarSintomas(sintomas);
  ligarBotoesDeSaida();

  $("gerar").addEventListener("click", () => {
    const msg = $("mensagem-form");
    const { idade, peso } = lerPaciente();
    const selecionados = Array.from(
      document.querySelectorAll("#sintomas-container input:checked"),
    ).map((c) => c.value);

    const erros = [];
    if (isNaN(idade) || idade < 0 || idade > 18) erros.push("Informe a idade (0 a 18 anos).");
    if (isNaN(peso) || peso <= 0 || peso > 150) erros.push("Informe o peso em kg.");
    if (selecionados.length === 0) erros.push("Selecione pelo menos um sintoma.");
    if (erros.length) {
      mostrarLista(msg, erros, "erro");
      return;
    }
    mostrarMensagem(msg, "");

    const { texto, conferencia, avisos } = gerarPrescricao(
      { medicamentos, sintomas },
      idade,
      peso,
      selecionados,
    );

    $("resultado").textContent = texto;
    mostrarLista($("avisos"), avisos, "aviso");

    const lista = $("conferencia");
    lista.replaceChildren(
      ...conferencia.map((c) => Object.assign(document.createElement("li"), { textContent: c })),
    );
    $("conferencia-bloco").hidden = conferencia.length === 0;
  });

  $("gerar-encaminhamento").addEventListener("click", () => {
    const { idade, peso } = lerPaciente();
    const nome = $("enc-paciente").value.trim();
    const dados = [];
    if (!isNaN(idade)) dados.push(formatarIdade(idade));
    if (!isNaN(peso)) dados.push(`${fmt(peso)} kg`);
    const paciente = [nome || "o(a) paciente", dados.length ? `(${dados.join(", ")})` : ""]
      .filter(Boolean)
      .join(" ");

    $("encaminhamento").textContent = gerarEncaminhamento({
      paciente,
      diagnostico: $("enc-diagnostico").value,
      conduta: $("enc-conduta").value,
    });
  });
}
