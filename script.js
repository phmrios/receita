// Espera o DOM (a página) carregar
document.addEventListener("DOMContentLoaded", function() {

    // ==============================================================================
    // === BLOCO DE CARREGAMENTO DE DADOS (V4) ======================================
    // ==============================================================================
    
    const MEDICAMENTOS = {
      "paracetamol_200": { "nome": "Paracetamol 200mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 10, 15 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 750, "concentracao": 200, "frequencia": "de 6 em 6 horas", "observacao": "se febre ou dor" },
      "dipirona_500": { "nome": "Dipirona 500mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 10, 20 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 1000, "concentracao": 500, "frequencia": "de 6 em 6 horas", "observacao": "se febre ou dor" },
      "ibuprofeno_100": { "nome": "Ibuprofeno 100mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 5, 10 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 400, "concentracao": 100, "frequencia": "de 8 em 8 horas", "observacao": "se febre ou dor" },
      "amoxicilina_250": { "nome": "Amoxicilina 250mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 50, 50 ], "tipo_faixa_mgkg": "dia", "dose_max_mg_dose": 500, "concentracao": 50, "frequencia": "de 8 em 8 horas", "duracao": "por 7 dias" },
      "amoxi_clav_400": { "nome": "Amoxicilina-clavulanato 400mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 40, 40 ], "tipo_faixa_mgkg": "dia", "dose_max_mg_dose": 875, "concentracao": 80, "frequencia": "de 8 em 8 horas", "duracao": "por 7 dias" },
      "cefalexina_250": { "nome": "Cefalexina 250mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 50, 50 ], "tipo_faixa_mgkg": "dia", "dose_max_mg_dose": 1000, "concentracao": 50, "frequencia": "de 6 em 6 horas", "duracao": "por 7 dias" },
      "azitromicina_oral": { "nome": "Azitromicina 200mg/5ml ----------------- suspensão oral", "faixa_mgkg": [ 10, 10 ], "tipo_faixa_mgkg": "dia", "dose_max_mg_dose": 500, "concentracao": 40, "frequencia": "1 vez ao dia", "duracao": "por 5 dias", "observacao": "Dar a quantidade indicada, sempre no mesmo horário, 1 vez por dia. Agitar bem o frasco antes de usar. Oferecer com um pouco de água após a dose. Não interromper antes do tempo prescrito, mesmo que a criança melhore." },
      "ciprofloxacino": { "nome": "Ciprofloxacino 250mg/5ml ----------------- suspensão oral", "faixa_mgkg": [ 15, 15 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 500, "concentracao": 50, "frequencia": "de 12 em 12 horas", "duracao": "por 5 dias", "observacao": "Dar a quantidade indicada, sempre no mesmo horário, 1 vez por dia. Agitar bem o frasco antes de usar. Oferecer com um pouco de água após a dose. Não interromper antes do tempo prescrito, mesmo que a criança melhore." },
      "mel_frasco": { "nome": "Mel ----------------- 01 frasco", "faixa_mgkg": null, "idade_minima_anos": 1, "concentracao": null, "frequencia": "5 ml antes de dormir", "observacao": "(não usar em menores de 1 ano)" },
      "soro_fisiologico": { "nome": "Soro fisiológico 0,9% ----------------- 01 frasco", "faixa_mgkg": null, "concentracao": null, "frequencia": "5ml em cada narina, várias vezes ao dia", "observacao": "se congestão nasal" },
      "ondansetrona_4": { "nome": "Ondansetrona 4mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 0.2, 0.2 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 8, "concentracao": 0.8, "frequencia": "de 8 em 8 horas", "observacao": "se vômitos" },
      "loratadina_1": { "nome": "Loratadina 1mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 0.2, 0.2 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 10, "concentracao": 1, "frequencia": "1 vez ao dia", "duracao": "por 5 dias" },
      "prednisolona": { "nome": "Prednisolona 3mg/ml ----------------- xarope", "faixa_mgkg": [ 2, 2 ], "tipo_faixa_mgkg": "dia", "dose_max_mg_dose": 40, "concentracao": 3, "frequencia": "1 vez ao dia", "duracao": "por 5 dias" },
      "hidroxizina": { "nome": "Hidroxizina 2mg/ml ----------------- xarope", "faixa_mgkg": [ 0.7, 0.7 ], "tipo_faixa_mgkg": "dose", "dose_max_mg_dose": 25, "concentracao": 2, "frequencia": "de 8 em 8 horas", "duracao": "por 5 dias" },
      
      // --- MUDANÇA V4 ---
      // A lógica do Ambroxol foi atualizada para ser mais inteligente,
      // incluindo dose E frequência variáveis por idade.
      "ambroxol": {
        "nome": "Ambroxol 15mg/5ml ----------------- xarope",
        "faixa_mgkg": null,
        "calculo_especial": "ambroxol_idade", // <-- GATILHO PARA A NOVA LÓGICA
        "calculo_idade_detalhado": {
           "2": { "dose_ml": 2.5, "frequencia": "2 vezes ao dia" },
           "5": { "dose_ml": 2.5, "frequencia": "3 vezes ao dia" },
           "12": { "dose_ml": 5, "frequencia": "3 vezes ao dia" }
        },
        "duracao": "por 5 dias"
      },
      // --- FIM DA MUDANÇA V4 ---

      "sro_sache": {
        "nome": "Solução de Reidratação Oral (SRO) ----------------- 01 caixa",
        "calculo_especial": "sro", 
        "frequencia": "Conforme fases abaixo:",
        "observacao": "Reconstituição: Dissolver 1 envelope em 1 litro de água potável (não variar o volume). Agitar bem até dissolução completa. Desprezar o conteúdo após 24 horas, mesmo que haja sobra.",
        "sro_reidratacao_mlkg": [75, 100], 
        "sro_manutencao_idade": {
          "1": "50-100 mL", 
          "10": "100-200 mL", 
          "99": "À vontade (geralmente até 400 mL)" 
        }
      },
      "bromoprida_gotas_4mg": {
        "nome": "Bromoprida 4mg/mL ----------------- Gotas",
        "faixa_mgkg": [ 0.5, 1 ],
        "tipo_faixa_mgkg": "dose", 
        "dose_max_gotas_dose": 58, 
        "concentracao": 4,
        "frequencia": "de 8 em 8 horas",
        "observacao": "Administrar preferencialmente 30 minutos antes das refeições.",
        "idade_minima_anos": 1
      },
      "probiotico": { "nome": "Probiótico (Saccharomyces boulardii) 200mg ----------------- sachê/cápsula", "faixa_mgkg": null, "concentracao": 200, "frequencia": "2 vezes ao dia", "duracao": "por 5 a 7 dias", "observacao": "em menores de 2 anos: 1 sachê 2x/dia; acima de 2 anos: 1 sachê 2x/dia" },
      "zinco": { "nome": "Sulfato de Zinco ----------------- comprimido ou solução", "faixa_mgkg": null, "concentracao": 4, "frequencia": "1 vez ao dia", "duracao": "por 10 a 14 dias", "observacao": "crianças menores de 6 meses: 10 mg/dia; a partir de 6 meses: 20 mg/dia" }
    };

    // --- MUDANÇA V4 ---
    // Sintoma "Vômitos" (5) foi atualizado (já estava na V3 que eu te mandei).
    // O Sintoma "Tosse Com Catarro" (28) JÁ INCLUÍA Ambroxol.
    const SINTOMAS = {
      "1": { "nome": "Febre / Dor", "medicamentos_ids": [ "paracetamol_200", "dipirona_500", "ibuprofeno_100" ] },
      "2": { "nome": "Tosse Seca", "medicamentos_ids": [ "mel_frasco", "hidroxizina" ] },
      "2.8": { "nome": "Tosse Com Catarro", "medicamentos_ids": [ "mel_frasco", "hidroxizina", "ambroxol" ] },
      "3": { "nome": "Congestão nasal", "medicamentos_ids": [ "soro_fisiologico" ] },
      "4": { "nome": "Faringite Bacteriana", "medicamentos_ids": [ "ibuprofeno_100", "paracetamol_200", "amoxicilina_250", "amoxi_clav_400" ] },
      "5": { "nome": "Vômitos", "medicamentos_ids": [ "ondansetrona_4", "bromoprida_gotas_4mg" ] },
      "5.8": { "nome": "Diarreia", "medicamentos_ids": [ "sro_sache", "probiotico", "zinco" ] },
      "5.C": { "nome": "Diarreia + ATB (azitro)", "medicamentos_ids": [ "sro_sache", "probiotico", "zinco", "azitromicina_oral" ] },
      "6": { "nome": "Alergia / Urticária", "medicamentos_ids": [ "loratadina_1", "prednisolona" ] },
      "7": { "nome": "Otite Média Aguda (OMA)", "medicamentos_ids": [ "amoxicilina_250", "paracetamol_200", "ibuprofeno_100" ] },
      "8": { "nome": "Infecção de Pele", "medicamentos_ids": [ "cefalexina_250" ] },
      "9": { "nome": "Infecção Urinária / Sinusite", "medicamentos_ids": [ "amoxi_clav_400" ] }
    };

    // ==============================================================================
    // === BLOCO DE FUNÇÕES "TRADUZIDAS" DO PYTHON (V4) =============================
    // ==============================================================================

    function arredondamentoPersonalizado(numero) {
        if ((numero - Math.floor(numero)) < 0.6) {
            return Math.floor(numero);
        } else {
            return Math.ceil(numero);
        }
    }

    function getNumDoses(frequencia) {
        if (!frequencia) return 1;
        if (frequencia.includes("12 em 12")) return 2;
        if (frequencia.includes("8 em 8")) return 3;
        if (frequencia.includes("6 em 6")) return 4;
        if (frequencia.includes("1 vez ao dia") || frequencia.includes("1x ao dia")) return 1;
        if (frequencia.includes("2 vezes ao dia") || frequencia.includes("2x ao dia")) return 2;
        if (frequencia.includes("3 vezes ao dia") || frequencia.includes("3x ao dia")) return 3;
        return 1; 
    }

    /**
     * --- MUDANÇA V4 ---
     * A lógica "calculo_por_idade_ml" foi REMOVIDA e substituída por
     * "calculo_especial: ambroxol_idade", que é mais inteligente.
     */
    function calcularDose(med, peso, idade) {
        let orientacaoBase = "";
        let alerta = "";

        const idadeMinima = med.idade_minima_anos;
        if (idadeMinima != null && idade < idadeMinima) {
            alerta = `   >> ALERTA: Medicamento não recomendado para menores de ${Math.floor(idadeMinima)} ano(s). <<\n`;
        }

        // --- LÓGICA ESPECIAL SRO (Mantida) ---
        if (med.calculo_especial === "sro") {
            const minMl = med.sro_reidratacao_mlkg[0] * peso;
            const maxMl = med.sro_reidratacao_mlkg[1] * peso;
            let reidratacaoTexto = `Fase de Reidratação (primeiras 4-6h): ${minMl.toFixed(0)} a ${maxMl.toFixed(0)} mL.`;
            if (idade > 10) {
                 reidratacaoTexto = "Fase de Reidratação (primeiras 4-6h): 2 a 3 Litros, conforme aceitação.";
            }

            let manutencaoTexto = "";
            const limitesIdadeManutencao = Object.keys(med.sro_manutencao_idade).sort((a, b) => a - b);
            for (const limite of limitesIdadeManutencao) {
                if (idade <= limite) {
                    manutencaoTexto = `Fase de Manutenção: ${med.sro_manutencao_idade[limite]} após cada evacuação líquida.`;
                    break;
                }
            }
            orientacaoBase = `${med.frequencia}\n     - ${reidratacaoTexto}\n     - ${manutencaoTexto}`;
            
        // --- NOVIDADE V4: LÓGICA ESPECIAL AMBROXOL ---
        } else if (med.calculo_especial === "ambroxol_idade") {
            let doseMl = null;
            let freq = "";
            const limitesIdade = Object.keys(med.calculo_idade_detalhado).sort((a, b) => a - b);
            
            for (const limite of limitesIdade) {
                if (idade <= limite) {
                    // Pega o objeto inteiro da dose (ex: { dose_ml: 2.5, frequencia: "2 vezes ao dia" })
                    const doseInfo = med.calculo_idade_detalhado[limite];
                    doseMl = doseInfo.dose_ml;
                    freq = doseInfo.frequencia; // Pega a frequência específica!
                    break;
                }
            }

            if (doseMl) {
                const doseTexto = `tomar ${doseMl.toFixed(1)} ml`;
                orientacaoBase = `${doseTexto}, via oral, ${freq}`; // Usa a frequência correta
            } else {
                // Caso para > 12 anos (que não definimos, usa padrão se houver)
                orientacaoBase = "Dose adulto (conforme bula) ou conforme orientação médica.";
            }

        // --- CÁLCULO MG/KG (Atualizado na V3) ---
        } else if (med.faixa_mgkg) { 
            const doseMedia = (med.faixa_mgkg[0] + med.faixa_mgkg[1]) / 2;
            let doseMgDose = 0; 
            
            if (med.tipo_faixa_mgkg === "dia") {
                const doseMgDia = doseMedia * peso;
                const numDoses = getNumDoses(med.frequencia);
                doseMgDose = doseMgDia / numDoses;
            } else {
                doseMgDose = doseMedia * peso;
            }

            const doseMaxMgDose = med.dose_max_mg_dose;
            if (doseMaxMgDose && doseMgDose > doseMaxMgDose) {
                doseMgDose = doseMaxMgDose;
            }
            
            const concentracao = med.concentracao;
            if (concentracao) {
                let doseMl = doseMgDose / concentracao; 
                let doseGotas = arredondamentoPersonalizado(doseMl * 20); 

                const doseMaxGotas = med.dose_max_gotas_dose;
                if (doseMaxGotas && doseGotas > doseMaxGotas) {
                    doseGotas = doseMaxGotas;
                    doseMl = doseGotas / 20; 
                }

                const doseTexto = `tomar ${doseGotas} gotas (${doseMl.toFixed(1)} ml)`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            } else {
                const doseTexto = `tomar ${arredondamentoPersonalizado(doseMgDose)} mg`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            }
        
        // --- CÁLCULO SIMPLES (Mantido) ---
        } else { 
            orientacaoBase = `${med.frequencia || 'Conforme orientação médica'}`;
        }

        // --- Montagem final (igual para todos) ---
        let orientacaoFinal = orientacaoBase;
        if (med.duracao) {
            orientacaoFinal += `, ${med.duracao}`;
        }
        if (med.observacao) {
            orientacaoFinal += `\n   Observação: ${med.observacao}`;
        }

        return `${med.nome}\n${alerta}   Uso: ${orientacaoFinal}`;
    }
    // --- FIM DA FUNÇÃO calcularDose ---


    /**
     * Função Gerar Relatório (sem alterações)
     */
    function gerarRelatorio(idade, peso, sintomasSelecionados) {
        const data = new Date().toLocaleString('pt-BR');
        
        let relatorio = `
========== RELATÓRIO MÉDICO ==========
Data/Hora: ${data}
Idade: ${idade} anos
Peso: ${peso} kg

---- Prescrição ----
`;
        
        const prescricoes = {}; 
        
        for (const sintomaId of sintomasSelecionados) {
            const sintoma = SINTOMAS[sintomaId];
            if (sintoma) {
                for (const medId of sintoma.medicamentos_ids) {
                    if (medId in MEDICAMENTOS) { 
                        const med = MEDICAMENTOS[medId];
                        if (!prescricoes[med.nome]) { 
                            prescricoes[med.nome] = calcularDose(med, peso, idade);
                        }
                    } else {
                        console.warn(`AVISO: Medicamento ID '${medId}' não encontrado.`);
                    }
                }
            }
        }

        relatorio += Object.values(prescricoes).sort().join("\n\n");
        relatorio += "\n\n=====================================\n";
        return relatorio.trim();
    }

    // ==============================================================================
    // === BLOCO DE CONTROLO DA INTERFACE (UI) ======================================
    // ==============================================================================

    // --- (Toda esta seção é IDÊNTICA à V3/V2. Sem alterações) ---

    function popularListaSintomas() {
        const container = document.getElementById('sintomas-lista');
        
        const chavesOrdenadas = Object.keys(SINTOMAS).sort((a, b) => {
            const numA = parseInt(a.replace('C', '')); 
            const numB = parseInt(b.replace('C', ''));
            return numA - numB;
        });

        for (const key of chavesOrdenadas) {
            const sintoma = SINTOMAS[key];
            
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key; 
            
            const texto = document.createTextNode(` ${key} - ${sintoma.nome}`);
            
            label.appendChild(checkbox);
            label.appendChild(texto);
            container.appendChild(label);
        }
    }
    
    popularListaSintomas();

    document.getElementById('btn-goto-step-2').addEventListener('click', function() {
        const idade = document.getElementById('idade').value;
        const peso = document.getElementById('peso').value;
        
        if (!idade || !peso || idade < 0 || peso <= 0) {
            alert("Por favor, preencha a Idade e o Peso com valores válidos.");
            return; 
        }
        
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    });

    document.getElementById('generate-button').addEventListener('click', function() {
        const idade = parseFloat(document.getElementById('idade').value);
        const peso = parseFloat(document.getElementById('peso').value);
        
        const sintomasSelecionados = [];
        const checkboxes = document.querySelectorAll('#sintomas-lista input[type="checkbox"]:checked');
        
        checkboxes.forEach(cb => {
            sintomasSelecionados.push(cb.value);
        });

        if (sintomasSelecionados.length === 0) {
            alert("Por favor, selecione pelo menos um sintoma.");
            return;
        }

        const relatorio = gerarRelatorio(idade, peso, sintomasSelecionados);
        
        document.getElementById('resultado-texto').value = relatorio;
        
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
    });

    document.getElementById('copy-button').addEventListener('click', function() {
        const resultadoTexto = document.getElementById('resultado-texto');
        resultadoTexto.select();
        document.execCommand('copy');
        alert('Texto copiado para a área de transferência!');
    });

    document.getElementById('restart-button').addEventListener('click', function() {
        location.reload(); 
    });

});
