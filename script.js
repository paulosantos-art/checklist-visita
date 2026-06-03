let currentStep = 1;
const totalSteps = 6;

// =========================================================================
// 🔗 LINKS DA API E DA PLANILHA DE POLOS
// =========================================================================
const URL_API_ENVIO = "https://script.google.com/macros/s/AKfycbxsNi2snYoG0dOG7FJwc5jS7Gq6DZURXoeuIkn2b-sJRgMmAZeBfH9Yaj1VfeymeXLdHw/exec";
const URL_PLANILHA_POLOS = "https://docs.google.com/spreadsheets/d/1CxKsibEiGk-a1VfFhVmsFh6YAvv5WirR2WdgsGvFs_Q/export?format=csv&gid=1200408376";

// Mapeamento dos botões e elementos
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnAdicionarLinha = document.getElementById('btnAdicionarLinha');
const selectPolo = document.querySelector('select'); // Captura a lista suspensa de polos

// Event Listeners (Gatilhos de clique)
btnPrev.addEventListener('click', () => mudarPasso(-1));
btnNext.addEventListener('click', gerenciarCliqueAvancar);
btnAdicionarLinha.addEventListener('click', adicionarLinha);

// Gatilho para carregar os polos assim que a página abre
document.addEventListener("DOMContentLoaded", carregarPolosDoGoogle);

// =========================================================================
// 📊 FUNÇÃO NOVA: CARREGA OS POLOS NA SUA LISTA SUSPENSA
// =========================================================================
function carregarPolosDoGoogle() {
    if (!selectPolo) return; // Proteção caso o select não exista na página atual

    fetch(URL_PLANILHA_POLOS)
        .then(resposta => resposta.text())
        .then(dadosCSV => {
            selectPolo.innerHTML = '<option value="">Selecione um Polo...</option>';
            const linhas = dadosCSV.split("\n");

            // Percorre as linhas do CSV populando a lista suspensa
            for (let i = 1; i < linhas.length; i++) {
                const linhaLimpa = linhas[i].trim();
                if (linhaLimpa) {
                    const colunas = linhaLimpa.split(",");
                    const nomePolo = colunas[0].replace(/"/g, ""); // Remove aspas do CSV

                    const option = document.createElement("option");
                    option.value = nomePolo;
                    option.textContent = nomePolo;
                    selectPolo.appendChild(option);
                }
            }
        })
        .catch(erro => {
            console.error("Erro ao carregar os polos:", erro);
            selectPolo.innerHTML = '<option value="">Erro ao carregar polos da planilha</option>';
        });
}

// =========================================================================
// 🔄 FUNÇÕES ORIGINAIS DE NAVEGAÇÃO (MANTIDAS INTACTAS)
// =========================================================================
function mudarPasso(direcao) {
    // Remove o passo atual da tela
    document.getElementById(`step${currentStep}`).classList.remove('active');
    
    // Calcula o próximo passo
    currentStep += direcao;
    
    // Adiciona o novo passo na tela
    document.getElementById(`step${currentStep}`).classList.add('active');

    // Controla se o botão 'Anterior' deve aparecer ou sumir
    btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    
    // Se chegou na última etapa, muda o botão "Próximo" para "Finalizar"
    if (currentStep === totalSteps) {
        btnNext.innerText = 'Finalizar e Salvar';
        btnNext.style.background = '#10b981'; // Cor verde
    } else {
        btnNext.innerText = 'Próximo';
        btnNext.style.background = '#2563eb'; // Cor azul padrão
    }
}

function gerenciarCliqueAvancar() {
    // Se estiver no último passo, o clique dispara o salvamento dos dados
    if (currentStep === totalSteps) {
        finalizarFormulario();
    } else {
        mudarPasso(1);
    }
}

function adicionarLinha() {
    const tabela = document.getElementById('tabelaPlano').getElementsByTagName('tbody')[0];
    const novaLinha = tabela.insertRow();
    
    // Insere a estrutura de campos dentro da nova linha da tabela
    novaLinha.innerHTML = `
        <td><input type="text" placeholder="Ação"></td>
        <td><input type="text" placeholder="Nome"></td>
        <td><input type="date"></td>
    `;
}

// =========================================================================
// 🚀 FUNÇÃO INTERNA ATUALIZADA: COLETA OS DADOS E ENVIA PARA A SUA API
// =========================================================================
function finalizarFormulario() {
    const dadosFormulario = {};

    // 1. Coleta dos dados básicos
    dadosFormulario.data_visita = document.querySelector('input[type="date"]')?.value || "";
    dadosFormulario.polo = selectPolo?.value || ""; 
    
    const inputsTexto = document.querySelectorAll('input[type="text"]');
    dadosFormulario.responsavel = inputsTexto[0] ? inputsTexto[0].value : "";
    dadosFormulario.visitante = inputsTexto[1] ? inputsTexto[1].value : "";

    // 2. Coleta sequencial de todas as Textareas (Observações)
    const textareas = document.querySelectorAll('textarea');
    dadosFormulario.percepcao_geral = textareas[0] ? textareas[0].value : "";
    dadosFormulario.infra_observacoes = textareas[1] ? textareas[1].value : "";
    dadosFormulario.demandas_alunos = textareas[2] ? textareas[2].value : "";
    dadosFormulario.apoio_sede_atendimento = textareas[3] ? textareas[3].value : "";
    dadosFormulario.analise_equipe = textareas[4] ? textareas[4].value : "";
    dadosFormulario.dificuldades_operacionais = textareas[5] ? textareas[5].value : "";
    dadosFormulario.desafios_academicos = textareas[6] ? textareas[6].value : "";
    dadosFormulario.pontos_fortes = textareas[7] ? textareas[7].value : "";
    dadosFormulario.pontos_atencao = textareas[8] ? textareas[8].value : "";
    dadosFormulario.parecer_final = textareas[9] ? textareas[9].value : "";
    dadosFormulario.consideracoes_finais = textareas[10] ? textareas[10].value : "";

    // 3. Coleta das Checkboxes pelas classes correspondentes
    dadosFormulario.infra = capturarCheckboxesMarcadas('.infra-checkbox'); 
    dadosFormulario.atendimento = capturarCheckboxesMarcadas('.atendimento-checkbox');
    dadosFormulario.comercial_operacao = capturarCheckboxesMarcadas('.comercial-checkbox');
    dadosFormulario.academico_tutoria = capturarCheckboxesMarcadas('.academico-checkbox');

    // Validação preventiva para não cadastrar sem selecionar o polo
    if (!dadosFormulario.polo) {
        alert("Por favor, selecione um Polo antes de finalizar!");
        return;
    }

    // 4. Envio dos dados estruturados via POST para a sua API do Google
    fetch(URL_API_ENVIO, {
        method: "POST",
        mode: "no-cors", 
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosFormulario)
    })
    .then(() => {
        alert('Checklist de Visita Técnica enviado e salvo na planilha com sucesso!');
        
        // Reseta o formulário e recarrega a página retornando para o passo 1
        const checklistForm = document.getElementById('checklistForm');
        if (checklistForm) checklistForm.reset();
        window.location.reload();
    })
    .catch(erro => {
        console.error("Erro no envio para a API:", erro);
        alert("Erro técnico ao tentar salvar as informações na planilha.");
    });
}

// Função utilitária interna para ler caixas de seleção
function capturarCheckboxesMarcadas(seletorClasse) {
    const marcados = [];
    const checkboxes = document.querySelectorAll(seletorClasse);
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const labelText = cb.parentElement.textContent.trim();
            marcados.push(labelText || cb.value);
        }
    });
    return marcados;
}