// js/encaminhamento.js
// Relatório de encaminhamento da UPA para a Atenção Primária (APS).

export function gerarEncaminhamento({ paciente = "", diagnostico = "", conduta = "" }) {
  const linhas = [
    "Ao colega médico da Atenção Primária,",
    "",
    `Encaminho ${paciente || "o(a) paciente"}, atendido(a) nesta UPA por quadro clínico sem critérios de urgência ou emergência, em bom estado geral, estável e sem sinais de gravidade.`,
  ];
  if (diagnostico.trim()) linhas.push("", `Hipótese diagnóstica / queixa: ${diagnostico.trim()}`);
  if (conduta.trim()) linhas.push("", `Conduta realizada: ${conduta.trim()}`);
  linhas.push(
    "",
    "O caso é de acompanhamento adequado na Atenção Primária, motivo pelo qual oriento seguimento com o pediatra da unidade de referência para continuidade do cuidado, observação evolutiva e eventuais ajustes terapêuticos.",
    "",
    "Atenciosamente,",
  );
  return linhas.join("\n");
}
