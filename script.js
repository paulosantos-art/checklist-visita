// CONFIGURAÇÃO DO BANCO DE DADOS (Substitua pelas suas credenciais obtidas no Passo 2)
  const firebaseConfig = {
    apiKey: "AIzaSyD_NGA9zHAVashJI0IFOFXAl6m2dbyn7r8",
    authDomain: "check-list-polos.firebaseapp.com",
    projectId: "check-list-polos",
    storageBucket: "check-list-polos.firebasestorage.app",
    messagingSenderId: "353682584368",
    appId: "1:353682584368:web:aeefd2e5dc9d2201e64ef5",
    measurementId: "G-XVV8D498Q5"
  };

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// =========================================================================
// CONFIGURAÇÃO DA SUA PLANILHA DE POLOS DINÂMICA (ATUALIZADO)
// =========================================================================

const ID_DA_PLANILHA = "1CxKsibEiGk-a1VfFhVmsFh6YAvv5WirR2WdgsGvFs_Q"; 
const GID_DA_ABA = "1200408376"; 

// Substitua a linha antiga da urlPlanilha por esta:
const urlPlanilha = `https://docs.google.com/spreadsheets/d/${ID_DA_PLANILHA}/export?format=csv&gid=${GID_DA_ABA}`;
window.addEventListener('DOMContentLoaded', () => {
    carregarPolosDaPlanilha();
});

function carregarPolosDaPlanilha() {
    const selectPolo = document.getElementById('selectPolo');

    // Busca os dados diretamente da sua planilha do Google
    fetch(urlPlanilha)
    .then(resposta => resposta.text())
    .then(dadosCsv => {
        // Limpa o select e coloca a opção padrão de instrução
        selectPolo.innerHTML = '<option value="" disabled selected>Selecione o Polo...</option>';
        
        // Divide o documento pelas quebras de linha
        const linhas = dadosCsv.split('\n');
        
        // ATENÇÃO: Se a linha 1 da sua planilha já for o nome de um Polo, mude "let i = 1" para "let i = 0"
        // Deixei "i = 1" assumindo que a primeira linha é um cabeçalho (ex: "Polos" ou "Nome")
        for (let i = 1; i < linhas.length; i++) {
            if (linhas[i].trim() === '') continue; // Ignora linhas em branco
            
            // Remove as aspas duplas que o Google injeta no formato CSV
            let nomePolo = linhas[i].replace(/"/g, '').trim();
            
            if (nomePolo) {
                // Cria o elemento visual dentro da lista suspensa
                const novaOpcao = document.createElement('option');
                novaOpcao.value = nomePolo;
                novaOpcao.innerText = nomePolo;
                selectPolo.appendChild(novaOpcao);
            }
        }
    })
    .catch(erro => {
        console.error("Erro ao conectar com a planilha do Google:", erro);
        selectPolo.innerHTML = '<option value="" disabled selected>Erro ao carregar polos. Verifique a planilha.</option>';
    });
}

// =========================================================================
// O RESTANTE DO SEU CÓDIGO DO SCRIPT.JS (FIREBASE/PDF) CONTINUA DAQUI PARA BAIXO...
// =========================================================================

// Lógica de Navegação das Abas
let currentStep = 1;
const totalSteps = 6;

const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnAdicionarLinha = document.getElementById('btnAdicionarLinha');
const form = document.getElementById('checklistForm');

btnPrev.addEventListener('click', () => mudarPasso(-1));
btnNext.addEventListener('click', gerenciarCliqueAvancar);
btnAdicionarLinha.addEventListener('click', adicionarLinha);

function mudarPasso(direcao) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep += direcao;
    document.getElementById(`step${currentStep}`).classList.add('active');

    btnPrev.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    
    if (currentStep === totalSteps) {
        btnNext.innerText = 'Finalizar, Salvar e Baixar PDF';
        btnNext.style.background = '#10b981';
    } else {
        btnNext.innerText = 'Próximo';
        btnNext.style.background = '#2563eb';
    }
}

function gerenciarCliqueAvancar() {
    if (currentStep === totalSteps) {
        gerarPDF("Teste_Local"); // <--- Chama o PDF direto para testar!
    } else {
        mudarPasso(1);
    }
}
function adicionarLinha() {
    const tabela = document.getElementById('tabelaPlano').getElementsByTagName('tbody')[0];
    const novaLinha = tabela.insertRow();
    novaLinha.className = "linha-plano";
    novaLinha.innerHTML = `
        <td><input type="text" class="plano-acao" placeholder="Ação"></td>
        <td><input type="text" class="plano-responsavel" placeholder="Nome"></td>
        <td><input type="date" class="plano-prazo"></td>
    `;
}

// CAPTURA DOS DADOS E ENVIO PARA O BANCO
function salvarDadosNoBanco() {
    btnNext.disabled = true;
    btnNext.innerText = "Salvando e Gerando PDF...";

    const formData = new FormData(form);
    const dadosFormulario = {};

    formData.forEach((value, key) => {
        if (key !== "infra" && key !== "atendimento" && key !== "comercial_operacao" && key !== "academico_tutoria") {
            dadosFormulario[key] = value;
        }
    });

    const obterCheckboxesMarcados = (nome) => {
        return Array.from(document.querySelectorAll(`input[name="${nome}"]:checked`)).map(cb => cb.value);
    };

    dadosFormulario["infraestrutura_itens"] = obterCheckboxesMarcados("infra");
    dadosFormulario["atendimento_itens"] = obterCheckboxesMarcados("atendimento");
    dadosFormulario["comercial_operacao_itens"] = obterCheckboxesMarcados("comercial_operacao");
    dadosFormulario["academico_tutoria_itens"] = obterCheckboxesMarcados("academico_tutoria");

    const linhasPlano = document.querySelectorAll('.linha-plano');
    const planosDeAcao = [];
    linhasPlano.forEach(linha => {
        const acao = lineToSave = linha.querySelector('.plano-acao').value;
        const responsavel = linha.querySelector('.plano-responsavel').value;
        const prazo = linha.querySelector('.plano-prazo').value;
        if (acao || responsavel || prazo) {
            planosDeAcao.push({ acao, responsavel, prazo });
        }
    });
    dadosFormulario["plano_de_acao"] = planosDeAcao;
    dadosFormulario["enviado_em"] = firebase.firestore.FieldValue.serverTimestamp();

    // Envia para o Firebase
    db.collection("visitas_tecnicas").add(dadosFormulario)
    .then((docRef) => {
        // Se salvou no banco com sucesso, agora gera o PDF!
        gerarPDF(dadosFormulario.polo || 'Relatorio');
    })
    .catch((error) => {
        console.error("Erro ao salvar no banco: ", error);
        alert("Erro ao salvar os dados no banco.");
        btnNext.disabled = false;
        btnNext.innerText = "Finalizar, Salvar e Baixar PDF";
    });
}

// FUNÇÃO PARA GERAR O RELATÓRIO EM PDF
function gerarPDF(nomePolo) {
    // Mostra todas as abas de forma contínua
    const todosPassos = document.querySelectorAll('.step');
    todosPassos.forEach(passo => passo.style.display = 'block');
    
    document.getElementById('btnAdicionarLinha').style.display = 'none';

    const elementoRelatorio = document.getElementById('area-relatorio');
    const nomeArquivo = `Relatorio_Visita_${nomePolo.replace(/\s+/g, '_')}.pdf`;

    const opcoes = {
        margin:       15,
        filename:     nomeArquivo,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: false, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opcoes).from(elementoRelatorio).save().then(() => {
        alert("Dados salvos no banco e PDF gerado com sucesso!");
        form.reset();
        window.location.reload(); 
    });
}