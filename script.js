// Espera o DOM (a página) carregar
document.addEventListener("DOMContentLoaded", function() {

    // ==============================================================================
    // === BLOCO DE CARREGAMENTO DE DADOS ===========================================
    // ==============================================================================
    
    // Em vez de ler ficheiros, colamos o conteúdo dos .json aqui
    // Os nomes das variáveis (MEDICAMENTOS, SINTOMAS) são os mesmos do Python!
    
    const MEDICAMENTOS = {
      "paracetamol_200": { "nome": "Paracetamol 200mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 10, 15 ], "dose_max_mg": 750, "concentracao": 200, "frequencia": "de 6 em 6 horas", "observacao": "se febre ou dor" },
      "dipirona_500": { "nome": "Dipirona 500mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 10, 20 ], "dose_max_mg": 1000, "concentracao": 500, "frequencia": "de 6 em 6 horas", "observacao": "se febre ou dor" },
      "ibuprofeno_100": { "nome": "Ibuprofeno 100mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 5, 10 ], "dose_max_mg": 400, "concentracao": 100, "frequencia": "de 8 em 8 horas", "observacao": "se febre ou dor" },
      "amoxicilina_250": { "nome": "Amoxicilina 250mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 50, 50 ], "dose_max_mg": 500, "concentracao": 50, "frequencia": "de 8 em 8 horas", "duracao": "por 7 dias" },
      "amoxi_clav_400": { "nome": "Amoxicilina-clavulanato 400mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 40, 40 ], "dose_max_mg": 875, "concentracao": 80, "frequencia": "de 8 em 8 horas", "duracao": "por 7 dias" },
      "cefalexina_250": { "nome": "Cefalexina 250mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 50, 50 ], "dose_max_mg": 1000, "concentracao": 50, "frequencia": "de 6 em 6 horas", "duracao": "por 7 dias" },
      "azitromicina_oral": { "nome": "Azitromicina 200mg/5ml ----------------- suspensão oral", "faixa_mgkg": [ 10, 10 ], "dose_max_mg": 500, "concentracao": 40, "frequencia": "1 vez ao dia", "duracao": "por 5 dias", "observacao": "Dar a quantidade indicada, sempre no mesmo horário, 1 vez por dia. Agitar bem o frasco antes de usar. Oferecer com um pouco de água após a dose. Não interromper antes do tempo prescrito, mesmo que a criança melhore." },
      "ciprofloxacino": { "nome": "Ciprofloxacino 250mg/5ml ----------------- suspensão oral", "faixa_mgkg": [ 15, 15 ], "dose_max_mg": 500, "concentracao": 50, "frequencia": "de 12 em 12 horas", "duracao": "por 5 dias", "observacao": "Dar a quantidade indicada, sempre no mesmo horário, 1 vez por dia. Agitar bem o frasco antes de usar. Oferecer com um pouco de água após a dose. Não interromper antes do tempo prescrito, mesmo que a criança melhore." },
      "mel_frasco": { "nome": "Mel ----------------- 01 frasco", "faixa_mgkg": null, "idade_minima_anos": 1, "concentracao": null, "frequencia": "5 ml antes de dormir", "observacao": "(não usar em menores de 1 ano)" },
      "soro_fisiologico": { "nome": "Soro fisiológico 0,9% ----------------- 01 frasco", "faixa_mgkg": null, "concentracao": null, "frequencia": "5ml em cada narina, várias vezes ao dia", "observacao": "se congestão nasal" },
      "ondansetrona_4": { "nome": "Ondansetrona 4mg/5ml ----------------- 01 frasco", "faixa_mgkg": [ 0.2, 0.2 ], "dose_max_mg": 8, "concentracao": 0.8, "frequencia": "de 8 em 8 horas", "observacao": "se vômitos" },
      "loratadina_1": { "nome": "Loratadina 1mg/ml ----------------- 01 frasco", "faixa_mgkg": [ 0.2, 0.2 ], "dose_max_mg": 10, "concentracao": 1, "frequencia": "1 vez ao dia", "duracao": "por 5 dias" },
      "prednisolona": { "nome": "Prednisolona 3mg/ml ----------------- xarope", "faixa_mgkg": [ 2, 2 ], "dose_max_mg": 40, "concentracao": 3, "frequencia": "1 vez ao dia", "duracao": "por 5 dias" },
      "hidroxizina": { "nome": "Hidroxizina 2mg/ml ----------------- xarope", "faixa_mgkg": [ 0.7, 0.7 ], "dose_max_mg": 25, "concentracao": 2, "frequencia": "de 8 em 8 horas", "duracao": "por 5 dias" },
      "ambroxol": { "nome": "Ambroxol 15mg/5ml ----------------- xarope", "faixa_mgkg": null, "calculo_por_idade_ml": { "2": 2.5, "5": 2.5, "12": 5 }, "dose_max_mg": null, "concentracao": null, "frequencia": "administrar por via oral, 3 vezes ao dia.", "duracao": "por 5 dias" },
      "sro_sache": { "nome": "Solução de Reidratação Oral (SRO) ----------------- 01 caixa", "faixa_mgkg": null, "concentracao": null, "frequencia": "oferecer várias vezes ao dia, em pequenas quantidades", "observacao": "até 10 kg: 50-100 mL após cada evacuação; 10 a 20 kg: 100-200 mL; acima de 20 kg: conforme aceitação" },
      "probiotico": { "nome": "Probiótico (Saccharomyces boulardii) 200mg ----------------- sachê/cápsula", "faixa_mgkg": null, "concentracao": 200, "frequencia": "2 vezes ao dia", "duracao": "por 5 a 7 dias", "observacao": "em menores de 2 anos: 1 sachê 2x/dia; acima de 2 anos: 1 sachê 2x/dia" },
      "zinco": { "nome": "Sulfato de Zinco ----------------- comprimido ou solução", "faixa_mgkg": null, "concentracao": 4, "frequencia": "1 vez ao dia", "duracao": "por 10 a 14 dias", "observacao": "crianças menores de 6 meses: 10 mg/dia; a partir de 6 meses: 20 mg/dia" }
    };

    const SINTOMAS = {
      "1": { "nome": "Febre / Dor", "medicamentos_ids": [ "paracetamol_200", "dipirona_500", "ibuprofeno_100" ] },
      "2": { "nome": "Tosse Seca", "medicamentos_ids": [ "mel_frasco", "hidroxizina" ] },
      "28": { "nome": "Tosse Com Catarro", "medicamentos_ids": [ "mel_frasco", "hidroxizina", "ambroxol" ] },
      "3": { "nome": "Congestão nasal", "medicamentos_ids": [ "soro_fisiologico" ] },
      "4": { "nome": "Faringite Bacteriana", "medicamentos_ids": [ "ibuprofeno_100", "paracetamol_200", "amoxicilina_250", "amoxi_clav_400" ] },
      "5": { "nome": "Vômitos", "medicamentos_ids": [ "ondansetrona_4" ] },
      "58": { "nome": "Diarreia Viral", "medicamentos_ids": [ "sro_sache", "probiotico", "zinco" ] },
      "5C": { "nome": "Diarreia + ATB (azitro)", "medicamentos_ids": [ "sro_sache", "probiotico", "zinco", "azitromicina_oral" ] },
      "6": { "nome": "Alergia / Urticária", "medicamentos_ids": [ "loratadina_1", "prednisolona" ] },
      "7": { "nome": "Otite Média Aguda (OMA)", "medicamentos_ids": [ "amoxicilina_250", "paracetamol_200", "ibuprofeno_100" ] },
      "8": { "nome": "Infecção de Pele", "medicamentos_ids": [ "cefalexina_250" ] },
      "9": { "nome": "Infecção Urinária / Sinusite", "medicamentos_ids": [ "amoxi_clav_400" ] }
    };

    // ==============================================================================
    // === BLOCO DE FUNÇÕES "TRADUZIDAS" DO PYTHON ==================================
    // ==============================================================================

    /**
     * Tradução direta da função de arredondamento do Python.
     * math.floor -> Math.floor
     * math.ceil -> Math.ceil
     * int(numero) -> Math.floor(numero)
     */
    function arredondamentoPersonalizado(numero) {
        if ((numero - Math.floor(numero)) < 0.6) {
            return Math.floor(numero);
        } else {
            return Math.ceil(numero);
        }
    }

    /**
     * Tradução direta da função de calcular_dose do Python.
     */
    function calcularDose(med, peso, idade) {
        let orientacaoBase = "";
        let alerta = "";

        // .get("key") vira apenas .key (ou ["key"])
        const idadeMinima = med.idade_minima_anos;
        if (idadeMinima != null && idade < idadeMinima) {
            alerta = `   >> ALERTA: Medicamento não recomendado para menores de ${Math.floor(idadeMinima)} ano(s). <<\n`;
        }

        const calculoIdade = med.calculo_por_idade_ml;
        
        // Verificamos se 'calculoIdade' existe
        if (calculoIdade) {
            let doseMl = null;
            // Object.keys() pega as chaves, e .sort() as ordena
            const limitesIdade = Object.keys(calculoIdade).sort((a, b) => a - b);
            
            for (const limite of limitesIdade) {
                if (idade <= limite) {
                    doseMl = calculoIdade[limite];
                    break;
                }
            }

            if (doseMl) {
                // .toFixed(1) formata para 1 casa decimal
                const doseTexto = `tomar ${doseMl.toFixed(1)} ml`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            } else {
                orientacaoBase = "Dose a ser definida pelo médico para esta faixa etária.";
            }

        } else if (med.faixa_mgkg) { // med.get("faixa_mgkg") vira med.faixa_mgkg
            // sum(lista) / 2 vira (lista[0] + lista[1]) / 2
            const doseMedia = (med.faixa_mgkg[0] + med.faixa_mgkg[1]) / 2;
            let doseMg = doseMedia * peso;

            const doseMaxLimite = med.dose_max_mg;
            if (doseMaxLimite && doseMg > doseMaxLimite) {
                doseMg = doseMaxLimite;
            }

            const concentracao = med.concentracao;
            if (concentracao) {
                const doseMl = doseMg / concentracao;
                const doseGotas = arredondamentoPersonalizado(doseMl * 20);
                const doseTexto = `tomar ${doseGotas} gotas (${doseMl.toFixed(1)} ml)`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            } else {
                const doseTexto = `tomar ${arredondamentoPersonalizado(doseMg)} mg`;
                orientacaoBase = `${doseTexto}, via oral, ${med.frequencia || ''}`;
            }
        } else {
            orientacaoBase = `${med.frequencia || 'Conforme orientação médica'}`;
        }

        let orientacaoFinal = orientacaoBase;
        if (med.duracao) {
            orientacaoFinal += `, ${med.duracao}`;
        }
        if (med.observacao) {
            orientacaoFinal += `, ${med.observacao}`;
        }

        return `${med.nome}\n${alerta}   Uso: ${orientacaoFinal}`;
    }

    /**
     * Tradução da função gerar_relatorio do Python.
     * 'sintomasSelecionados' será um array de IDs (ex: ["1", "5C"])
     */
    function gerarRelatorio(idade, peso, sintomasSelecionados) {
        // new Date() é o análogo do datetime.datetime.now()
        const data = new Date().toLocaleString('pt-BR');
        
        // Usamos Template Literals (crases ``) para formatar a string
        let relatorio = `
========== RELATÓRIO MÉDICO ==========
Data/Hora: ${data}
Idade: ${idade} anos
Peso: ${peso} kg

---- Prescrição ----
`;
        
        // Usamos um Objeto JS como um dicionário
        const prescricoes = {}; 
        
        for (const sintomaId of sintomasSelecionados) {
            // SINTOMAS[sintomaId] é como SINTOMAS.get(sintomaId)
            const sintoma = SINTOMAS[sintomaId];
            if (sintoma) {
                for (const medId of sintoma.medicamentos_ids) {
                    // medId in MEDICAMENTOS
                    if (medId in MEDICAMENTOS) { 
                        const med = MEDICAMENTOS[medId];
                        // !prescricoes[med.nome] é como 'if med["nome"] not in prescricoes'
                        if (!prescricoes[med.nome]) { 
                            prescricoes[med.nome] = calcularDose(med, peso, idade);
                        }
                    } else {
                        console.warn(`AVISO: Medicamento ID '${medId}' não encontrado.`);
                    }
                }
            }
        }

        // Object.values() pega só os valores (as prescrições)
        // .sort() ordena
        // .join() junta tudo com duas quebras de linha
        relatorio += Object.values(prescricoes).sort().join("\n\n");
        relatorio += "\n\n=====================================\n";
        return relatorio.trim(); // .trim() remove espaços em branco extras do início/fim
    }

    // ==============================================================================
    // === BLOCO DE CONTROLO DA INTERFACE (UI) ======================================
    // ==============================================================================

    // --- 1. POPULAR A LISTA DE SINTOMAS ---
    // Esta função é nova! Ela lê os SINTOMAS e cria os checkboxes no HTML.
    function popularListaSintomas() {
        const container = document.getElementById('sintomas-lista');
        
        // Ordena as chaves dos sintomas (ex: "1", "2", "28", "5C"...)
        // Usamos uma função de ordenação para garantir que 28 venha depois de 9
        const chavesOrdenadas = Object.keys(SINTOMAS).sort((a, b) => {
            const numA = parseInt(a.replace('C', '')); // Trata "5C" como 5
            const numB = parseInt(b.replace('C', ''));
            return numA - numB;
        });

        for (const key of chavesOrdenadas) {
            const sintoma = SINTOMAS[key];
            
            // Cria os elementos HTML
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key; // O valor do checkbox é o ID (ex: "5C")
            
            // Adiciona o texto (ex: "1 - Febre / Dor")
            const texto = document.createTextNode(` ${key} - ${sintoma.nome}`);
            
            label.appendChild(checkbox);
            label.appendChild(texto);
            container.appendChild(label);
        }
    }
    
    // Chama a função para construir a lista assim que a página carrega
    popularListaSintomas();

    // --- 2. CONTROLO DOS BOTÕES ---

    // Botão "Próximo" (do Passo 1 para o 2)
    document.getElementById('btn-goto-step-2').addEventListener('click', function() {
        // Validação
        const idade = document.getElementById('idade').value;
        const peso = document.getElementById('peso').value;
        
        if (!idade || !peso || idade < 0 || peso <= 0) {
            alert("Por favor, preencha a Idade e o Peso com valores válidos.");
            return; // Para a execução
        }
        
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    });

    // Botão "GERAR PRESCRIÇÃO"
    document.getElementById('generate-button').addEventListener('click', function() {
        // 1. Coletar dados de Idade/Peso
        const idade = parseFloat(document.getElementById('idade').value);
        const peso = parseFloat(document.getElementById('peso').value);
        
        // 2. Coletar sintomas selecionados
        const sintomasSelecionados = [];
        const checkboxes = document.querySelectorAll('#sintomas-lista input[type="checkbox"]:checked');
        
        checkboxes.forEach(cb => {
            sintomasSelecionados.push(cb.value); // Adiciona o ID (ex: "1", "5C")
        });

        if (sintomasSelecionados.length === 0) {
            alert("Por favor, selecione pelo menos um sintoma.");
            return;
        }

        // 3. Chamar a lógica principal
        const relatorio = gerarRelatorio(idade, peso, sintomasSelecionados);
        
        // 4. Exibir resultado
        document.getElementById('resultado-texto').value = relatorio;
        
        // 5. Mudar de ecrã
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
    });

    // Botão "Copiar"
    document.getElementById('copy-button').addEventListener('click', function() {
        const resultadoTexto = document.getElementById('resultado-texto');
        resultadoTexto.select();
        document.execCommand('copy');
        alert('Texto copiado para a área de transferência!');
    });

    // Botão "Recomeçar"
    document.getElementById('restart-button').addEventListener('click', function() {
        location.reload(); // Simplesmente recarrega a página
    });

});
