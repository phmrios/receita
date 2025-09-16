// Espera o DOM (a página) carregar
document.addEventListener("DOMContentLoaded", async function() {

    // ==============================================================================
    // === BLOCO DE CARREGAMENTO DE DADOS (OTIMIZADO) ===============================
    // ==============================================================================

    let MEDICAMENTOS = {};
    let SINTOMAS = {};

    async function carregarDados() {
        try {
            const [respMedicamentos, respSintomas] = await Promise.all([
                fetch('medicamentos.json'),
                fetch('sintomas.json')
            ]);

            if (!respMedicamentos.ok || !respSintomas.ok) {
                throw new Error('Falha ao carregar os ficheiros de dados JSON.');
            }

            MEDICAMENTOS = await respMedicamentos.json();
            SINTOMAS = await respSintomas.json();
            
            console.log("Dados de medicamentos e sintomas carregados com sucesso!");

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("ERRO FATAL: Não foi possível carregar a base de dados de medicamentos. A aplicação não pode continuar. Tente recarregar a página.");
        }
    }


    // ==============================================================================
    // === BLOCO DE FUNÇÕES DE CÁLCULO (OTIMIZADO V5) ===============================
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
     * --- NOVA FUNÇÃO (Estratégia 1) ---
     * Calcula a dose para SRO (Terapia de Reidratação Oral).
     */
  function calcularDoseVitDIdade(med, peso, idade) {
    // Pega as chaves do objeto (as idades máximas: "1", "18", "70", "999")
    const limitesIdade = Object.keys(med.dosagem_por_idade_ui).sort((a, b) => a - b);
    
    let doseUI = 0;
    let doseTexto = "";

    // Itera pelas idades limite
    for (const limite of limitesIdade) {
        if (idade <= parseFloat(limite)) {
            // Encontrou a faixa etária correta
            doseUI = med.dosagem_por_idade_ui[limite].dose;
            doseTexto = med.dosagem_por_idade_ui[limite].texto;
            break; // Para o loop
        }
    }

    if (doseUI === 0) {
        // Se não encontrou (idade > 999), usa o último
        const ultimoLimite = limitesIdade[limitesIdade.length - 1];
        doseUI = med.dosagem_por_idade_ui[ultimoLimite].dose;
        doseTexto = med.dosagem_por_idade_ui[ultimoLimite].texto;
    }

    const concentracao = med.concentracao; // 200 UI/gota
    // Arredonda as gotas para o número inteiro mais próximo
    const doseGotas = Math.round(doseUI / concentracao); 

    // Retorna a orientação final
    return `tomar ${doseGotas} gotas (${doseUI} UI), via oral, ${med.frequencia}.\n   Indicação: ${doseTexto}`;
}
    function calcularDoseSRO(med, peso, idade) {
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
        // Retorna a string de orientação base
        return `${med.frequencia}\n     - ${reidratacaoTexto}\n     - ${manutencaoTexto}`;
    }

    /**
     * --- NOVA FUNÇÃO (Estratégia 2) ---
     * Calcula a dose para Ambroxol com base na idade.
     */
    function calcularDoseAmbroxol(med, peso, idade) {
        let doseMl = null;
        let freq = "";
        const limitesIdade = Object.keys(med.calculo_idade_detalhado).sort((a, b) => a - b);
        
        for (const limite of limitesIdade) {
            if (idade <= limite) {
                const doseInfo = med.calculo_idade_detalhado[limite];
                doseMl = doseInfo.dose_ml;
                freq = doseInfo.frequencia; 
                break;
            }
        }

        if (doseMl) {
            const doseTexto = `tomar ${doseMl.toFixed(1)} ml`;
            // Retorna a string de orientação base
            return `${doseTexto}, via oral, ${freq}`;
        } else {
            // Caso para > 12 anos
            return "Dose adulto (conforme bula) ou conforme orientação médica.";
        }
    }

    /**
     * --- NOVO "REGISTO DE ESTRATÉGIAS" ---
     * Este objeto mapeia a string 'calculo_especial' (do JSON)
     * para a função de cálculo correspondente.
     */
    const CALCULOS_ESPECIAIS = {
        "sro": calcularDoseSRO,
        "ambroxol_idade": calcularDoseAmbroxol
      "calculo_vitd_idade": calcularDoseVitDIdade
        // O próximo cálculo especial que criares,
        // basta adicionar a função e mapeá-la aqui!
    };

    /**
     * Função Principal de Cálculo de Dose (REFATORADA)
     */
    function calcularDose(med, peso, idade) {
        let orientacaoBase = "";
        let alerta = "";

        // 1. Alerta de idade
        const idadeMinima = med.idade_minima_anos;
        if (idadeMinima != null && idade < idadeMinima) {
            alerta = `   >> ALERTA: Medicamento não recomendado para menores de ${Math.floor(idadeMinima)} ano(s). <<\n`;
        }

        // 2. Lógica de Cálculo
        
        // --- NOVO: LÓGICA DE CÁLCULO ESPECIAL (Strategy) ---
        if (med.calculo_especial && CALCULOS_ESPECIAIS[med.calculo_especial]) {
            orientacaoBase = CALCULOS_ESPECIAIS[med.calculo_especial](med, peso, idade);
        
        // --- CÁLCULO PADRÃO MG/KG ---
        } else if (med.faixa_mgkg) { 
            const doseMedia = (med.faixa_mgkg[0] + med.faixa_mgkg[1]) / 2;
            let doseMgDose = 0; 
            
            // (Pequena correção aqui: a tua v4 original tinha 'tipo_faixa_mgkg')
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
        
        // --- CÁLCULO SIMPLES ---
        } else { 
            orientacaoBase = `${med.frequencia || 'Conforme orientação médica'}`;
        }

        // 3. Montagem final
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
    
    // --- INICIALIZAÇÃO DA APLICAÇÃO ---

    // 1. Espera os dados carregarem
    await carregarDados();

    // 2. Se SINTOMAS não foi carregado (deu erro), não faz mais nada.
    if (Object.keys(SINTOMAS).length === 0) {
        return;
    }

    // 3. AGORA, com os dados prontos, popula a lista de sintomas na tela.
    popularListaSintomas();

    // 4. AGORA, anexa os 'escutadores' de eventos (event listeners)
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
        navigator.clipboard.writeText(resultadoTexto.value).then(() => {
            alert('Texto copiado para a área de transferência!');
        }).catch(err => {
            console.warn("Falha ao copiar (moderno), tentando método antigo...", err);
            try {
                document.execCommand('copy');
                alert('Texto copiado para a área de transferência! (fallback)');
            } catch (e) {
                alert('Falha ao copiar o texto.');
            }
        });
    });

    document.getElementById('restart-button').addEventListener('click', function() {
        location.reload(); 
    });

});
