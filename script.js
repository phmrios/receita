/**
 * Aguarda o carregamento completo do DOM (da página)
 * para então iniciar a aplicação.
 */
document.addEventListener("DOMContentLoaded", async function() {

    // --- Carregamento de Dados Iniciais ---

    let MEDICAMENTOS = {};
    let SINTOMAS = {};

    /**
     * Carrega os arquivos JSON de medicamentos e sintomas.
     * Esta função é 'async' para esperar os arquivos serem lidos.
     */
    async function carregarDados() {
        try {
            // Carrega os dois arquivos em paralelo para ganhar tempo
            const [respMedicamentos, respSintomas] = await Promise.all([
                fetch('medicamentos.json'),
                fetch('sintomas.json')
            ]);

            // Verifica se as respostas dos arquivos foram bem-sucedidas
            if (!respMedicamentos.ok || !respSintomas.ok) {
                throw new Error('Falha ao carregar os ficheiros de dados JSON.');
            }

            // Converte as respostas para JSON e armazena nas variáveis globais
            MEDICAMENTOS = await respMedicamentos.json();
            SINTOMAS = await respSintomas.json();
            
            console.log("Dados de medicamentos e sintomas carregados com sucesso!");

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("ERRO FATAL: Não foi possível carregar a base de dados de medicamentos. A aplicação não pode continuar. Tente recarregar a página.");
        }
    }


    // --- Funções de Cálculo de Dose ---

    /**
     * Arredonda um número de forma personalizada.
     * (Ex: 1.5 arredonda para 1, mas 1.6 arredonda para 2).
     * @param {number} numero - O número a ser arredondado.
     * @returns {number} - O número arredondado.
     */
    function arredondamentoPersonalizado(numero) {
        if ((numero - Math.floor(numero)) < 0.6) {
            return Math.floor(numero);
        } else {
            return Math.ceil(numero);
        }
    }

    /**
     * Extrai o número de doses por dia com base na string de frequência.
     * @param {string} frequencia - A string (ex: "de 8 em 8 horas").
     * @returns {number} - O número de doses (ex: 3).
     */
    function getNumDoses(frequencia) {
        if (!frequencia) return 1;
        if (frequencia.includes("12 em 12")) return 2;
        if (frequencia.includes("8 em 8")) return 3;
        if (frequencia.includes("6 em 6")) return 4;
        if (frequencia.includes("1 vez ao dia") || frequencia.includes("1x ao dia")) return 1;
        if (frequencia.includes("2 vezes ao dia") || frequencia.includes("2x ao dia")) return 2;
        if (frequencia.includes("3 vezes ao dia") || frequencia.includes("3x ao dia")) return 3;
        return 1; // Padrão
    }

    /**
     * [CÁLCULO ESPECIAL] Calcula a dose de Vitamina D com base na idade.
     * @param {object} med - O objeto do medicamento (de medicamentos.json).
     * @param {number} peso - Peso do paciente (kg) (não usado aqui).
     * @param {number} idade - Idade do paciente (anos).
     * @returns {string} - A string de orientação de dose.
     */
    function calcularDoseVitDIdade(med, peso, idade) {
        const limitesIdade = Object.keys(med.dosagem_por_idade_ui).sort((a, b) => a - b);
        let doseUI = 0;
        let doseTexto = "";

        // Itera pelas idades limite
        for (const limite of limitesIdade) {
            if (idade <= parseFloat(limite)) {
                doseUI = med.dosagem_por_idade_ui[limite].dose;
                doseTexto = med.dosagem_por_idade_ui[limite].texto;
                break;
            }
        }

        if (doseUI === 0) {
            // Se não encontrou (idade > 999), usa o último
            const ultimoLimite = limitesIdade[limitesIdade.length - 1];
            doseUI = med.dosagem_por_idade_ui[ultimoLimite].dose;
            doseTexto = med.dosagem_por_idade_ui[ultimoLimite].texto;
        }

        const concentracao = med.concentracao; // 200 UI/gota
        const doseGotas = Math.round(doseUI / concentracao); 

        return `tomar ${doseGotas} gotas (${doseUI} UI), via oral, ${med.frequencia}.\n   Indicação: ${doseTexto}`;
    }

    /**
     * [CÁLCULO ESPECIAL] Calcula a dose para SRO (Terapia de Reidratação Oral).
     * @param {object} med - O objeto do medicamento.
     * @param {number} peso - Peso do paciente (kg).
     * @param {number} idade - Idade do paciente (anos).
     * @returns {string} - A string de orientação de dose.
     */
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
        
        return `${med.frequencia}\n     - ${reidratacaoTexto}\n     - ${manutencaoTexto}`;
    }

    /**
     * [CÁLCULO ESPECIAL] Calcula a dose para Ambroxol com base na idade.
     * @param {object} med - O objeto do medicamento.
     * @param {number} peso - Peso do paciente (kg) (não usado aqui).
     * @param {number} idade - Idade do paciente (anos).
     * @returns {string} - A string de orientação de dose.
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
            return `${doseTexto}, via oral, ${freq}`;
        } else {
            // Caso para > 12 anos
            return "Dose adulto (conforme bula) ou conforme orientação médica.";
        }
    }

    /**
     * Mapeia um 'calculo_especial' (definido no JSON) para a função
     * de cálculo JavaScript correspondente.
     * Isso permite adicionar novos cálculos complexos facilmente.
     */
    const CALCULOS_ESPECIAIS = {
        "sro": calcularDoseSRO,
        "ambroxol_idade": calcularDoseAmbroxol,
        "calculo_vitd_idade": calcularDoseVitDIdade
        // Para adicionar um novo cálculo especial, crie a função e adicione-a
        // neste objeto, usando a mesma chave string definida no JSON.
    };

    /**
     * Função Principal de Cálculo de Dose.
     * Decide qual lógica de cálculo usar (especial, mg/kg, ou simples)
     * e formata a string de saída.
     * @param {object} med - O objeto do medicamento.
     * @param {number} peso - Peso do paciente (kg).
     * @param {number} idade - Idade do paciente (anos).
     * @returns {string} - A prescrição formatada para este medicamento.
     */
    function calcularDose(med, peso, idade) {
        let orientacaoBase = "";
        let alerta = "";

        // 1. Alerta de idade mínima
        const idadeMinima = med.idade_minima_anos;
        if (idadeMinima != null && idade < idadeMinima) {
            alerta = `   >> ALERTA: Medicamento não recomendado para menores de ${Math.floor(idadeMinima)} ano(s). <<\n`;
        }

        // 2. Lógica de Cálculo
        
        // 2a. Verifica se é um cálculo especial (SRO, VitD, etc.)
        if (med.calculo_especial && CALCULOS_ESPECIAIS[med.calculo_especial]) {
            orientacaoBase = CALCULOS_ESPECIAIS[med.calculo_especial](med, peso, idade);
        
        // 2b. Se não, usa o cálculo padrão de MG/KG
        } else if (med.faixa_mgkg) { 
            const doseMedia = (med.faixa_mgkg[0] + med.faixa_mgkg[1]) / 2;
            let doseMgDose = 0; 
            
            if (med.tipo_faixa_mgkg === "dia") {
                // Cálculo por dose (baseado no peso/dia)
                const doseMgDia = doseMedia * peso;
                const numDoses = getNumDoses(med.frequencia);
                doseMgDose = doseMgDia / numDoses;
            } else {
                // Cálculo por dose (baseado no peso/dose)
                doseMgDose = doseMedia * peso;
            }

            // Aplica a dose máxima por segurança
            const doseMaxMgDose = med.dose_max_mg_dose;
            if (doseMaxMgDose && doseMgDose > doseMaxMgDose) {
                doseMgDose = doseMaxMgDose;
            }
            
            const concentracao = med.concentracao;
            if (concentracao) {
                // Calcula ML e Gotas
                let doseMl = doseMgDose / concentracao; 
                let doseGotas = arredondamentoPersonalizado(doseMl * 20); // (Considerando 20 gotas/ml)

                // Aplica limite máximo de gotas, se houver
                const doseMaxGotas = med.dose_max_gotas_dose;
                if (doseMaxGotas && doseGotas > doseMaxGotas) {
                    doseGotas = doseMaxGotas;
                    doseMl = doseGotas / 20; 
                }

                const doseTexto = `tomar ${doseGotas} gotas (${doseMl.toFixed(1)} ml)`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            } else {
                // Caso seja em mg (ex: comprimido, não líquido)
                const doseTexto = `tomar ${arredondamentoPersonalizado(doseMgDose)} mg`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            }
        
        // 2c. Se não, usa a orientação simples (frequência)
        } else { 
            orientacaoBase = `${med.frequencia || 'Conforme orientação médica'}`;
        }

        // 3. Montagem final (adiciona duração e observações)
        let orientacaoFinal = orientacaoBase;
        if (med.duracao) {
            orientacaoFinal += `, ${med.duracao}`;
        }
        if (med.observacao) {
            orientacaoFinal += `\n   Observação: ${med.observacao}`;
        }

        return `${med.nome}\n${alerta}   Uso: ${orientacaoFinal}`;
    }


    /**
     * Gera o texto final da prescrição com base nos sintomas selecionados.
     * @param {number} idade - Idade do paciente.
     * @param {number} peso - Peso do paciente.
     * @param {string[]} sintomasSelecionados - Array de IDs de sintomas (do checkbox).
     * @returns {string} - O texto completo do relatório.
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
        
        // Objeto para evitar medicamentos duplicados
        const prescricoes = {}; 
        
        for (const sintomaId of sintomasSelecionados) {
            const sintoma = SINTOMAS[sintomaId];
            if (sintoma) {
                for (const medId of sintoma.medicamentos_ids) {
                    if (medId in MEDICAMENTOS) { 
                        const med = MEDICAMENTOS[medId];
                        // Só adiciona o medicamento se ele ainda não foi prescrito
                        if (!prescricoes[med.nome]) { 
                            prescricoes[med.nome] = calcularDose(med, peso, idade);
                        }
                    } else {
                        console.warn(`AVISO: Medicamento ID '${medId}' não encontrado.`);
                    }
                }
            }
        }

        // Adiciona as prescrições (em ordem alfabética) ao relatório
        relatorio += Object.values(prescricoes).sort().join("\n\n");
        relatorio += "\n\n=====================================\n";
        return relatorio.trim();
    }

    // --- Controlo da Interface (UI) ---

    /**
     * Popula a lista de checkboxes de sintomas na tela
     * buscando os dados do objeto SINTOMAS.
     */
    function popularListaSintomas() {
        const container = document.getElementById('sintomas-lista');
        
        // Ordena as chaves dos sintomas para exibição
        const chavesOrdenadas = Object.keys(SINTOMAS).sort((a, b) => {
            const numA = parseInt(a.replace('C', '')); 
            const numB = parseInt(b.replace('C', ''));
            return numA - numB;
        });

        // Cria um checkbox para cada sintoma
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
    
    
    // --- Ponto de Entrada da Aplicação (Inicialização) ---

    // 1. Espera os dados (JSONs) carregarem
    await carregarDados();

    // 2. Se os SINTOMAS não foram carregados (erro), interrompe a execução
    if (Object.keys(SINTOMAS).length === 0) {
        return;
    }

    // 3. Popula a lista de sintomas na tela.
    popularListaSintomas();

    // 4. Anexa os 'escutadores' de eventos (event listeners) aos botões.
    
    // Botão "Próximo" (Passo 1 para 2)
    document.getElementById('btn-goto-step-2').addEventListener('click', function() {
        const idade = document.getElementById('idade').value;
        const peso = document.getElementById('peso').value;
        
        // Validação simples dos dados de entrada
        if (!idade || !peso || idade < 0 || peso <= 0) {
            alert("Por favor, preencha a Idade e o Peso com valores válidos.");
            return; 
        }
        
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    });

    // Botão "GERAR PRESCRIÇÃO" (Passo 2 para 3)
    document.getElementById('generate-button').addEventListener('click', function() {
        const idade = parseFloat(document.getElementById('idade').value);
        const peso = parseFloat(document.getElementById('peso').value);
        
        const sintomasSelecionados = [];
        const checkboxes = document.querySelectorAll('#sintomas-lista input[type="checkbox"]:checked');
        
        checkboxes.forEach(cb => {
            sintomasSelecionados.push(cb.value);
        });

        // Validação da seleção de sintomas
        if (sintomasSelecionados.length === 0) {
            alert("Por favor, selecione pelo menos um sintoma.");
            return;
        }

        // Gera o relatório
        const relatorio = gerarRelatorio(idade, peso, sintomasSelecionados);
        
        // Exibe o relatório no <textarea>
        document.getElementById('resultado-texto').value = relatorio;
        
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
    });

    // Botão "Copiar Texto"
    document.getElementById('copy-button').addEventListener('click', function() {
        const resultadoTexto = document.getElementById('resultado-texto');
        resultadoTexto.select();
        
        // Tenta o método moderno de área de transferência
        navigator.clipboard.writeText(resultadoTexto.value).then(() => {
            alert('Texto copiado para a área de transferência!');
        }).catch(err => {
            // Se falhar, usa o método antigo (fallback)
            console.warn("Falha ao copiar (moderno), tentando método antigo...", err);
            try {
                document.execCommand('copy');
                alert('Texto copiado para a área de transferência! (fallback)');
            } catch (e) {
                alert('Falha ao copiar o texto.');
            }
        });
    });

    // Botão "Começar Novamente"
    document.getElementById('restart-button').addEventListener('click', function() {
        // Recarrega a página para limpar todos os campos
        location.reload(); 
    });

});
