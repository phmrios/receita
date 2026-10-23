# Avaliação do site — Assistente de Prescrição Pediátrica

> Data: 23/10/2026 · Escopo: `index.html` + `js/`, `data/*.json`, `pals.html`/`pals.js`, `teste3.html`, `style.css`
> 
> Como usar: marque **[x] Aprovo** ou **[x] Não aprovo** em cada item e responda as 12 perguntas no final.
> Nada foi alterado no código. Este arquivo é só a proposta.

Os erros marcados como **confirmados** eu reproduzi rodando `js/calculo.js` com pacientes de teste (ex.: 3 anos/15 kg, 13 anos/45 kg, 6 meses/7 kg).

---

## 🔴 Prioridade 1: erros que geram dose ou receita errada

### 1.1 Frequência "X vezes ao dia" é lida como "a cada X horas" (confirmado)

`calcularPrescricao` faz `24 / número da frequência`. Com isso, "2 vezes ao dia" vira **12 doses/dia** e "1 vez ao dia" vira **24 doses/dia**.

- **Prednisolona** 15 kg (1–2 mg/kg/dia): o site prescreve **1 mL 2x/dia = 6 mg/dia (0,4 mg/kg/dia)**, quando o esperado seria ~22 mg/dia. É uma **subdose de cerca de 4x**.
- Também afeta itraconazol ("1 vez ao dia") e os limites máximos diários de loratadina e aciclovir.

**Sugestão:** trocar o texto livre por campos numéricos explícitos (`doses_por_dia: 2`, `intervalo_h: 12`) e gerar o texto da frequência a partir deles.

- [x] Aprovo  [ ] Não aprovo

### 1.2 Azitromicina prescrita de 8/8h (confirmado)

O cadastro usa `"frequencia": "a cada 8 horas"`. O resultado é 2 mL de 8/8h (cerca de 16 mg/kg/dia em 3 tomadas). A azitromicina é dada **1x ao dia** (ex.: 10–12 mg/kg/dia por 5 dias na faringite, ou 10 mg/kg/dia por 3 dias na diarreia).

- [x] Aprovo  [ ] Não aprovo

### 1.3 Ciprofloxacino (comprimido) sai como "0 mL" (confirmado)

O cálculo trata o comprimido como líquido, então 15 kg resulta em "**0 mL** a cada 12 horas". Comprimidos precisam de uma rota própria (mg → fração de comprimido: ½, 1) ou de um aviso para usar suspensão.

- [x] Aprovo  [ ] Não aprovo

### 1.4 Pacientes > 12 anos ou ≥ 40 kg recebem receita vazia (confirmado)

Quando nenhuma regra se aplica, o código insere `undefined` e aparecem **linhas em branco sem nenhum aviso**. Exemplo: em 13 anos/45 kg com "Febre/Dor" + "Amigdalite", dipirona, amoxicilina e azitromicina **somem silenciosamente**.
**Sugestão:** mostrar "⚠️ Dipirona: fora da faixa cadastrada (idade 0–12 anos)". Também é possível cadastrar as regras adolescente/adulto (já existe `amoxicilina_250_5_adulto`, mas sem dose).

- [x] Aprovo  [ ] Não aprovo

### 1.5 Medicamento inexistente: `amoxicilina_250_5_dose_alta`

O sintoma **"Pneumonia / Sinusite (Grave)"** referencia esse ID, mas ele não existe em `medicamentos.json`. A amoxicilina em dose alta nunca aparece. O sintoma **"Crise asmática"** tem lista vazia e não gera nada.
**Sugestão:** adicionar um validador que, ao carregar, aponta IDs órfãos e sintomas vazios.

- [x] Aprovo  [ ] Não aprovo

### 1.6 Arredondamento para mL inteiro

`Math.round(ml)` gera erros grandes em crianças pequenas. Exemplos: 1,5 mL vira 2 mL (+33%) e 2,5 mL vira 3 mL (+20%, ondansetrona).
**Sugestão:** arredondar para **0,5 mL** (ou 0,1 mL abaixo de 2 mL) e exibir o mg/kg efetivo da dose arredondada.

- [x] Aprovo  [ ] Não aprovo

### 1.7 Gotas/mL fixo em 20 para todos os produtos

O site assume 20 gotas = 1 mL para tudo. O número varia por fabricante: ibuprofeno 100 mg/mL e paracetamol 200 mg/mL costumam ter bulas no esquema "1 gota/kg", que não equivale a 20 gotas/mL. Se o produto real tiver 10 gotas/mL, a dose em gotas sai **dobrada**.
**Sugestão:** cadastrar `gotas_por_ml` (ou `mg_por_gota`) em cada medicamento, conforme a bula do produto da sua unidade.

- [x] Aprovo  [ ] Não aprovo

### 1.8 Ficha PALS: cores da fita de Broselow erradas

O mapeamento atual (Verde ≤14 kg, Laranja ≤18, "Cinzento >25") não bate com a fita. A referência usual é: Cinza 3–5 · Rosa 6–7 · Vermelho 8–9 · Roxo 10–11 · Amarelo 12–14 · Branco 15–18 · Azul 19–23 · Laranja 24–29 · Verde 30–36 kg.

- [x] Aprovo  [ ] Não aprovo

### 1.9 Ficha PALS: doses não respeitam mínimo e máximo

O código só mostra `alert`, mas **imprime a dose acima do teto** na ficha. Os casos são: atropina (mín. 0,1 / máx. 0,5 mg), adrenalina (máx. 1 mg), amiodarona (máx. 300 mg) e choque "até 10 J/kg" (falta o teto de dose adulta). Também não há validação: com peso vazio, a ficha sai com `NaN`.

- [x] Aprovo  [ ] Não aprovo

---

## 🟠 Prioridade 2: segurança clínica e confiabilidade

### 2.1 Faltam limites de idade mínima

- Dipirona está com `idade_min: 0`. Não costuma ser usada abaixo de 3 meses ou 5 kg.
- Ondansetrona não tem idade mínima.
- Ibuprofeno não tem `dose_max_mg_dose` (ex.: 400 mg). Com 45 kg, o site gerou **68 gotas**, o que é pouco prático; acima de certo peso, sugerir comprimido.

- [x] Aprovo  [ ] Não aprovo

### 2.2 Checagem de plausibilidade peso × idade

O site deveria alertar quando o peso é incompatível com a idade (ex.: 2 anos e 40 kg), o que pega erros de digitação. Também deveria permitir **idade em meses** (hoje um bebê de 2 meses precisa digitar "0.17", e idade 0 é rejeitada).

- [x] Aprovo  [ ] Não aprovo

### 2.3 Mostrar o raciocínio do cálculo

Em cada item, exibir em letra menor algo como "45 mg/kg/dia → 675 mg/dia ÷ 3 = 225 mg/dose → 4,5 mL". O médico confere em 2 segundos.

- [x] Aprovo  [ ] Não aprovo

### 2.4 Aviso legal e versão dos protocolos

Incluir rodapé com "Ferramenta de apoio, conferir doses", a fonte de cada protocolo (SBP, MS, Nelson, ISPAD, AHA) e a data da última revisão.

- [x] Aprovo  [ ] Não aprovo

### 2.5 Testes automáticos das doses

Criar um arquivo de testes com casos conhecidos (ex.: "amoxicilina, 10 kg → 5 mL 8/8h"). Rodariam antes de cada atualização do JSON, para que uma edição no JSON não quebre doses silenciosamente.

- [x] Aprovo  [ ] Não aprovo

---

## 🟡 Prioridade 3: usabilidade

### 3.1 Botão "Copiar" e "Imprimir" na receita

A página CAD já tem botão de copiar; a de receita não tem.

- [x] Aprovo  [ ] Não aprovo

### 3.2 Organizar e buscar sintomas

Hoje são cerca de 30 checkboxes soltos. Sugestão:

- Agrupar por sistema (Febre/Dor, Respiratório, GI, Pele, Olhos, Infecções, Outros).
- Adicionar um campo de busca.
- Corrigir nomes: "Broquiolite" → "Bronquiolite"; "(OMA)PrimoTratamento" → "(OMA) – 1º tratamento".

- [x] Aprovo  [ ] Não aprovo

### 3.3 Escolher entre alternativas

"Amigdalite" prescreve amoxicilina **e** azitromicina juntas, e "Pielonefrite" prescreve 3 antibióticos. Sugestão: quando houver alternativas, mostrar como opções (radio) e o médico escolhe uma.

- [x] Aprovo  [ ] Não aprovo

### 3.4 Quantidade correta por item

Hoje todo item sai como "— 01 frasco", inclusive envelope de SRO, creme, pomada e comprimido. Sugestão: usar a unidade certa (envelope, tubo, caixa) e calcular quantos frascos o tratamento completo precisa (ex.: amoxicilina por 10 dias pode precisar de 2 frascos).

- [x] Aprovo  [ ] Não aprovo

### 3.5 Relatório de encaminhamento à APS

Hoje ele é um "medicamento" falso (`dipironaecasa`) com um `if` especial no código. Sugestão: transformar em uma seção própria ("Gerar relatório de encaminhamento"), com campos para queixa e conduta.

- [x] Aprovo  [ ] Não aprovo

### 3.6 Validação sem `alert()`

Trocar os `alert` por mensagens dentro da página, perto do campo com erro. Isso vale também para a PALS e para o botão copiar da CAD.

- [x] Aprovo  [ ] Não aprovo

---

## 🔵 Prioridade 4: código e organização

### 4.1 Arquivos e nomes

- `teste3.html` é a calculadora de **CAD**; renomear para `cad.html`.
- `teste3 - cópia.html` é **outra ferramenta** (Reidratação OMS/Nelson v3.0) que não está no menu. Decidir se ela entra no menu (como `hidratacao.html`) ou é apagada.
- `.DS_Store` está versionado; criar `.gitignore`.

- [x] Aprovo  [ ] Não aprovo

### 4.2 CSS duplicado e visual inconsistente

`style.css` define navbar, `.container` e títulos duas vezes. A página CAD não usa `.container` e tem estilos inline próprios. Sugestão: unificar, adicionar modo escuro e melhorar o layout para celular, já que o uso provável é no plantão, pelo celular.

- [x] Aprovo  [ ] Não aprovo

### 4.3 Funcionar offline / sem servidor

A página principal usa `fetch` de JSON e módulos ES, então **não funciona abrindo o arquivo direto** (`file://`). Opções: embutir os dados em um `.js`, ou transformar o site em PWA instalável com cache offline, útil em UPA com internet ruim.

- [x] Aprovo  [ ] Não aprovo

### 4.4 Commits descritivos

Todos os commits recentes se chamam "atualizando". Usar mensagens como "corrige dose da azitromicina" facilita rastrear quando uma dose mudou, o que é importante numa ferramenta clínica.

- [x] Aprovo  [ ] Não aprovo

---

## ❓ 12 perguntas para decidir

1. **Quem vai usar o site?** Só você, a equipe da UPA, ou será público na internet? Isso muda o nível de aviso legal e de validação. EU E MEUS AMIGOS
2. **Qual é a referência oficial das doses?** SBP, Ministério da Saúde, Nelson, protocolo da prefeitura/UPA? Posso citar a fonte em cada medicamento? NÃO TEM OFICIAL
3. **As doses atuais do JSON foram conferidas por você?** Alguns pontos me pareceram fora do usual e quero confirmar antes de mexer: AJUSTE CONFORME ACHAR MELHOR
   - cefalexina 25–50 mg/kg/dia (média 37,5) para erisipela/celulite;
   - cefuroxima 30 mg/kg/dia por 14 dias;
   - amox+clav "Otite" com 65 mg/kg/dia (média de 40–90);
   - vitamina D crescendo de 600 a 1200 UI conforme a idade.
4. **Quando a faixa tem mínimo e máximo** (ex.: 10–20 mg/kg), o site deve usar a **média** (como hoje), o valor **máximo**, ou deixar você escolher? O QUE FOR MELHOR
5. **Qual arredondamento você prefere** para mL: 0,5 mL, 0,1 mL, ou depende do volume? DE MEIO PRA CIMA 
6. **Quais marcas ou apresentações sua unidade dispensa** (ex.: ibuprofeno 50 ou 100 mg/mL, paracetamol 200 mg/mL)? Preciso disso para cadastrar o número correto de gotas/mL. NÃO 
7. **Adolescentes (>12 anos ou ≥40 kg):** cadastro a dose adulta, ou o site só mostra um aviso "usar dose adulta"? CADASTRO DE DOSE ADULTA 
8. **Em sintomas com várias opções** (amigdalite, pielonefrite, eczema): quer escolher uma por vez (radio) ou continuar recebendo todas listadas? TODAS LISTADAS 
9. **O que fazer com `teste3 - cópia.html`** (Calculadora de Reidratação OMS/Nelson)? Entra no menu, substitui a CAD, ou pode apagar? ENTRA NO MENU 
10. **O uso é principalmente no celular ou no computador da UPA?** E a internet de lá é confiável? Isso define se vale fazer a versão offline (PWA). INTERNET NÃO CONFIAVEL
11. **A receita é colada em algum sistema** (e-SUS, prontuário), impressa, ou as duas coisas? Isso define o formato de saída: texto puro, impressão A5 com cabeçalho, etc. TEXTO PURO 
12. **Posso começar pelas correções da Prioridade 1** (frequência, azitromicina, cipro, receita vazia, ID faltando, arredondamento, Broselow, tetos PALS) antes de qualquer mudança visual? SIM PODE FAZER COMO ACHAR MELHOR 

---

## ✅ Status da implementação (23/10/2026)

Todos os itens aprovados foram implementados. Testes: `npm test` (17 testes, todos passando).

**Decisões tomadas a partir das respostas**
- Pergunta 8 ("todas listadas") prevaleceu sobre o item 3.3: as alternativas continuam todas na receita.
- Arredondamento: passos de 0,5 mL (abaixo de 1 mL, 0,1 mL). Gotas: inteiras. Comprimidos: 1/2. Cápsulas: inteiras.
- Faixa mg/kg: usa a média, exceto onde o cadastro define `alvo_mgkg` (ex.: amoxicilina 50 e 90 mg/kg/dia, ibuprofeno 10 mg/kg).
- Dose adulta (≥ 12 anos **ou** ≥ 40 kg): regras com `"publico": "adulto"` no JSON.
- Gotas/mL (sem marca definida): dipirona 20, paracetamol 15, ibuprofeno 100 mg/mL 10 — **conferir com o frasco disponível**.

**Doses ajustadas — revisar**
| Medicamento | Antes | Agora |
|---|---|---|
| Azitromicina | 12 mg/kg/dia de 8/8h | 10 mg/kg/dia 1x/dia por 3 dias; faringite 12 mg/kg/dia por 5 dias |
| Prednisolona | saía ~0,4 mg/kg/dia (bug) | 1,5 mg/kg/dia 1x/dia (máx. 40 mg) |
| Amoxicilina faringite | 5 dias | 10 dias (estreptococo) |
| Amoxicilina dose alta | não existia | 90 mg/kg/dia 8/8h (máx. 1 g/dose) |
| Amox+clav OMA falha | 65 mg/kg/dia | 90 mg/kg/dia 12/12h; pielonefrite: 50 mg/kg/dia |
| Cefalexina erisipela/cistite | 37,5 mg/kg/dia 8/8h | 50 mg/kg/dia 6/6h, 7 dias; dose alta 100 mg/kg/dia, 10 dias |
| Cefuroxima | 14 dias | 10 dias |
| Aciclovir | 20 mg/kg (máx. 800) | 15 mg/kg 5x/dia (máx. 200 mg/dose) |
| Zinco | texto dizia 2,5 mL = 10 mg (errado para 10 mg/5 mL) | 5 mL (10 mg) < 6 meses; 10 mL (20 mg) ≥ 6 meses |
| Dexclorfeniramina | ~3x a dose de bula | dose de bula por idade; ≥ 2 anos |
| Loratadina | 0,2 mg/kg | 5 mg (< 30 kg) / 10 mg (≥ 30 kg); ≥ 2 anos |
| Ondansetrona | 0,2 mg/kg, sem idade mínima | 0,15 mg/kg (máx. 4 mg); ≥ 6 meses |
| Prometazina / Ambroxol / Tacrolimo | sem idade mínima | ≥ 2 anos |
| Dipirona | desde 0 anos | ≥ 3 meses e ≥ 5 kg |
| Vitamina D | 600→1200 UI crescente | 400 UI < 1 ano; 600 UI ≥ 1 ano |
| Itraconazol | sem dose | cápsula 100 mg, 5–10 mg/kg/dia (máx. 200 mg) |
| Crise asmática | vazio | salbutamol spray + prednisolona |
| Encaminhamento APS | "medicamento" falso | seção própria na página |

**Arquivos**: `teste3.html` → `cad.html`; `teste3 - cópia.html` → `hidratacao.html` (no menu); `pals.js` → `js/pals.js`; novos `js/comum.js`, `js/encaminhamento.js`, `sw.js`, `manifest.webmanifest`, `icon.svg`, `tests/`, `.gitignore`, `package.json`. Ao alterar qualquer arquivo publicado, aumentar `VERSAO` em `sw.js`.
