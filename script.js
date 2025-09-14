const MEDICAMENTOS_DB = 'medicamentos_db';
const USUARIOS_DB = 'usuarios_db';
const MOVIMENTACOES_DB = 'movimentacoes_db';
const CONFIGURACOES_DB = 'configuracoes_db';
let usuarioLogado = null;
let medicamentoAlerta = null;
let scannerAtivo = false;
let scannerCampoAlvo = null;
let scannerStream = null;
let relatorioChart = null;
let navigationHistory = ['dashboard'];
let currentNavigationIndex = 0;

// Inicializar EmailJS (substitua com seus IDs reais do EmailJS)
emailjs.init("YOUR_USER_ID"); // Configure no EmailJS dashboard

function inicializarBancosDeDados() {
    if (!localStorage.getItem(USUARIOS_DB)) {
        const usuarios = [
            { id: 189, nome: "Administrador Master", tipo: "admin", dataCriacao: new Date().toISOString() },
            { id: 1, nome: "Enfermeira Maria", tipo: "comum", dataCriacao: new Date().toISOString() },
            { id: 2, nome: "Farmacêutico João", tipo: "comum", dataCriacao: new Date().toISOString() }
        ];
        localStorage.setItem(USUARIOS_DB, JSON.stringify(usuarios));
    }
    
    if (!localStorage.getItem(MEDICAMENTOS_DB)) {
        const medicamentos = [
            {
                id: 1,
                codigo: "7891234567890",
                nome: "Paracetamol",
                fabricante: "Medley",
                lote: "PTM202301",
                quantidade: 150,
                valorUnitario: 0.25,
                dataValidade: "2024-06-30",
                dataCadastro: new Date().toISOString(),
                usuarioCadastro: 189,
                observacoes: "Medicamento de uso controlado"
            },
            {
                id: 2,
                codigo: "7899876543210",
                nome: "Dipirona Sódica",
                fabricante: "EMS",
                lote: "DIP202302",
                quantidade: 80,
                valorUnitario: 0.18,
                dataValidade: "2024-08-15",
                dataCadastro: new Date().toISOString(),
                usuarioCadastro: 189,
                observacoes: ""
            },
            {
                id: 3,
                codigo: "7896655443322",
                nome: "Omeprazol",
                fabricante: "Eurofarma",
                lote: "OMP202305",
                quantidade: 5,
                valorUnitario: 1.20,
                dataValidade: "2024-05-15",
                dataCadastro: new Date().toISOString(),
                usuarioCadastro: 189,
                observacoes: "Estoque crítico"
            }
        ];
        localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos));
    }

    if (!localStorage.getItem(MOVIMENTACOES_DB)) {
        const movimentacoes = [
            {
                id: 1,
                medicamentoId: 1,
                tipo: "saida",
                quantidade: 10,
                valorUnitario: 0.25,
                valorTotal: 2.50,
                usuarioId: 1,
                data: new Date(Date.now() - 86400000).toISOString(),
                motivo: "uso",
                observacoes: "Uso na enfermaria"
            },
            {
                id: 2,
                medicamentoId: 2,
                tipo: "saida",
                quantidade: 5,
                valorUnitario: 0.18,
                valorTotal: 0.90,
                usuarioId: 2,
                data: new Date(Date.now() - 172800000).toISOString(),
                motivo: "venda",
                observacoes: "Venda balcão"
            }
        ];
        localStorage.setItem(MOVIMENTACOES_DB, JSON.stringify(movimentacoes));
    }
    
    if (!localStorage.getItem(CONFIGURACOES_DB)) {
        const configuracoes = {
            emailNotificacao: "jlenon.32@outlook.com",
            diasAlertaVencimento: 30,
            limiteEstoqueBaixo: 10,
            backupAuto: "semanal",
            temaInterface: "claro"
        };
        localStorage.setItem(CONFIGURACOES_DB, JSON.stringify(configuracoes));
    }
    
    carregarConfiguracoes();
}

function carregarConfiguracoes() {
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB));
    if (configuracoes) {
        document.getElementById('emailNotificacao').value = configuracoes.emailNotificacao || '';
        document.getElementById('diasAlertaVencimento').value = configuracoes.diasAlertaVencimento || 30;
        document.getElementById('limiteEstoqueBaixo').value = configuracoes.limiteEstoqueBaixo || 10;
        document.getElementById('backupAuto').value = configuracoes.backupAuto || 'semanal';
        document.getElementById('temaInterface').value = configuracoes.temaInterface || 'claro';
    }
}

function salvarConfiguracoes() {
    const configuracoes = {
        emailNotificacao: document.getElementById('emailNotificacao').value,
        diasAlertaVencimento: parseInt(document.getElementById('diasAlertaVencimento').value),
        limiteEstoqueBaixo: parseInt(document.getElementById('limiteEstoqueBaixo').value),
        backupAuto: document.getElementById('backupAuto').value,
        temaInterface: document.getElementById('temaInterface').value
    };
    
    localStorage.setItem(CONFIGURACOES_DB, JSON.stringify(configuracoes));
    alert('Configurações salvas com sucesso!');
}

function iniciarScanner(campoId) {
    scannerCampoAlvo = campoId;
    const scannerContainer = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    const instructions = document.getElementById('scannerInstructions');
    const errorDiv = document.getElementById('scannerError');
    
    scannerContainer.style.display = 'flex';
    instructions.style.display = 'block';
    errorDiv.style.display = 'none';
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        };
        
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            video.srcObject = stream;
            scannerStream = stream;
            video.play();
            scannerAtivo = true;
            scanearCodigo(video);
        })
        .catch(function(error) {
            console.error('Erro ao acessar a câmera:', error);
            instructions.style.display = 'none';
            errorDiv.style.display = 'block';
            scannerAtivo = false;
            document.getElementById('cameraHelp').style.display = 'block';
            document.getElementById('cameraHelpRetirar').style.display = 'block';
        });
    } else {
        alert('Seu navegador não suporta acesso à câmera.');
        instructions.style.display = 'none';
        errorDiv.style.display = 'block';
        scannerAtivo = false;
    }
}

function fecharScanner() {
    const scannerContainer = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    
    scannerContainer.style.display = 'none';
    scannerAtivo = false;
    
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    
    video.srcObject = null;
    Quagga.stop();
}

function scanearCodigo(video) {
    if (!scannerAtivo) return;

    Quagga.init({
        inputStream: {
            type: "LiveStream",
            target: video,
            constraints: {
                facingMode: "environment"
            }
        },
        decoder: {
            readers: ["ean_reader", "code_128_reader"]
        }
    }, function(err) {
        if (err) {
            console.error('Erro ao iniciar Quagga:', err);
            document.getElementById('scannerInstructions').style.display = 'none';
            document.getElementById('scannerError').style.display = 'block';
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(function(result) {
        const code = result.codeResult.code;
        document.getElementById(scannerCampoAlvo).value = code;
        fecharScanner();
        if (scannerCampoAlvo === 'retirarCodigo') {
            buscarMedicamentoPorCodigo(code);
        }
        document.getElementById('cameraHelp').style.display = 'none';
        document.getElementById('cameraHelpRetirar').style.display = 'none';
    });
}

function simularScan(campoId) {
    const codigos = [
        '7891234567890',
        '7899876543210',
        '7896655443322',
        '7896666666666',
        '7897777777777'
    ];
    
    const codigoAleatorio = codigos[Math.floor(Math.random() * codigos.length)];
    document.getElementById(campoId).value = codigoAleatorio;
    
    if (campoId === 'retirarCodigo') {
        buscarMedicamentoPorCodigo(codigoAleatorio);
    }
    
    document.getElementById('cameraHelp').style.display = 'none';
    document.getElementById('cameraHelpRetirar').style.display = 'none';
}

function login() {
    const userId = parseInt(document.getElementById('userId').value);
    
    if (!userId || userId < 1) {
        alert('Por favor, digite um ID de usuário válido.');
        return;
    }
    
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
    const usuario = usuarios.find(u => u.id === userId);
    
    if (!usuario) {
        alert('Usuário não encontrado. Entre em contato com o administrador.');
        return;
    }
    
    usuarioLogado = usuario;
    
    document.getElementById('userName').textContent = usuario.nome;
    document.getElementById('userIdDisplay').textContent = usuario.id;
    
    if (usuario.tipo === 'admin') {
        document.getElementById('userTypeBadge').innerHTML = '<span class="admin-badge">Admin</span>';
        document.getElementById('menuUsuarios').style.display = 'block';
        document.getElementById('menuConfiguracoes').style.display = 'block';
        document.getElementById('menuRelatorios').style.display = 'block';
    } else {
        document.getElementById('userTypeBadge').textContent = '';
        document.getElementById('menuUsuarios').style.display = 'none';
        document.getElementById('menuConfiguracoes').style.display = 'none';
        document.getElementById('menuRelatorios').style.display = 'none';
    }
    
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    atualizarDashboard();
    checarAlertasEstoque();
}

function logout() {
    document.getElementById('exitModal').style.display = 'flex';
}

function confirmExit() {
    usuarioLogado = null;
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('userId').value = '';
    document.getElementById('userId').focus();
    closeExitModal();
}

function closeExitModal() {
    document.getElementById('exitModal').style.display = 'none';
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (!sidebar.classList.contains('active')) {
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }
}

function navigateTo(moduleId) {
    if (window.innerWidth <= 768) {
        toggleMenu();
    }
    
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    
    document.querySelectorAll('.menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    document.getElementById(moduleId).classList.add('active');
    
    document.querySelector(`.menu li[data-module="${moduleId}"]`).classList.add('active');
    
    document.getElementById('moduleTitle').textContent = document.querySelector(`.menu li[data-module="${moduleId}"]`).textContent;
    
    navigationHistory.push(moduleId);
    currentNavigationIndex = navigationHistory.length - 1;
    
    switch(moduleId) {
        case 'dashboard':
            atualizarDashboard();
            break;
        case 'pesquisar':
            filtrarMedicamentos();
            break;
        case 'relatorios':
            mudarTipoRelatorio();
            break;
        case 'usuarios':
            carregarUsuarios();
            break;
    }
}

function navigateBack() {
    if (currentNavigationIndex > 0) {
        currentNavigationIndex--;
        navigateTo(navigationHistory[currentNavigationIndex]);
    }
}

function atualizarDashboard() {
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)) || {};
    
    const totalMedicamentos = medicamentos.length;
    const totalValor = medicamentos.reduce((total, med) => total + (med.quantidade * med.valorUnitario), 0);
    
    const hoje = new Date();
    const diasAlerta = configuracoes.diasAlertaVencimento || 30;
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + diasAlerta);
    
    const proximosVencimentos = medicamentos.filter(med => {
        const dataValidade = new Date(med.dataValidade);
        return dataValidade <= dataLimite && dataValidade >= hoje;
    }).length;
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const totalGastoMes = movimentacoes
        .filter(mov => new Date(mov.data) >= inicioMes && mov.tipo === 'entrada')
        .reduce((total, mov) => total + mov.valorTotal, 0);
    
    const medicamentoMaisUtilizado = encontrarMedicamentoMaisUtilizado();
    
    document.getElementById('totalMedicamentos').textContent = totalMedicamentos;
    document.getElementById('totalValor').textContent = `R$ ${totalValor.toFixed(2)}`;
    document.getElementById('proximosVencimentos').textContent = proximosVencimentos;
    document.getElementById('totalGastoMes').textContent = `R$ ${totalGastoMes.toFixed(2)}`;
    document.getElementById('medicamentoMaisUtilizado').textContent = medicamentoMaisUtilizado;
    
    atualizarTabelaMovimentacoes();
}

function encontrarMedicamentoMaisUtilizado() {
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    
    if (movimentacoes.length === 0) return '-';
    
    const contagem = {};
    movimentacoes
        .filter(mov => mov.tipo === 'saida')
        .forEach(mov => {
            if (!contagem[mov.medicamentoId]) {
                contagem[mov.medicamentoId] = 0;
            }
            contagem[mov.medicamentoId] += mov.quantidade;
        });
    
    const medicamentoId = Object.keys(contagem).reduce((a, b) => 
        contagem[a] > contagem[b] ? a : b, null
    );
    
    const medicamento = medicamentos.find(m => m.id == medicamentoId);
    return medicamento ? medicamento.nome : '-';
}

function atualizarTabelaMovimentacoes() {
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
    
    movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    const tbody = document.getElementById('movimentacoesTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    movimentacoes.slice(0, 10).forEach(mov => {
        const medicamento = medicamentos.find(m => m.id === mov.medicamentoId);
        const usuario = usuarios.find(u => u.id === mov.usuarioId);
        
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${formatarData(mov.data)}</td>
            <td>${medicamento ? medicamento.nome : 'Desconhecido'}</td>
            <td>${medicamento ? medicamento.lote : '-'}</td>
            <td>${mov.quantidade}</td>
            <td>R$ ${mov.valorTotal.toFixed(2)}</td>
            <td>${usuario ? usuario.nome : 'Desconhecido'}</td>
            <td>${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function calcularValorUnitario() {
    const quantidade = parseFloat(document.getElementById('quantidade').value) || 0;
    const valorTotal = parseFloat(document.getElementById('valorTotal').value) || 0;
    
    if (quantidade > 0 && valorTotal > 0) {
        const valorUnitario = valorTotal / quantidade;
        document.getElementById('valorUnitarioInfo').textContent = `Valor unitário: R$ ${valorUnitario.toFixed(2)}`;
    } else {
        document.getElementById('valorUnitarioInfo').textContent = 'Valor unitário: R$ 0,00';
    }
}

function cadastrarMedicamento() {
    const codigo = document.getElementById('codigoBarras').value;
    const nome = document.getElementById('nomeMedicamento').value;
    const fabricante = document.getElementById('fabricante').value;
    const lote = document.getElementById('lote').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const validade = document.getElementById('validade').value;
    const observacoes = document.getElementById('observacoes').value;
    
    if (!codigo || !nome || !fabricante || !lote || !quantidade || !valorTotal || !validade) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const valorUnitario = valorTotal / quantidade;
    
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    
    const existe = medicamentos.some(med => med.codigo === codigo && med.lote === lote);
    
    if (existe) {
        alert('Já existe um medicamento com este código e lote. Use a funcionalidade de entrada de estoque.');
        return;
    }
    
    const novoMedicamento = {
        id: medicamentos.length > 0 ? Math.max(...medicamentos.map(m => m.id)) + 1 : 1,
        codigo,
        nome,
        fabricante,
        lote,
        quantidade,
        valorUnitario,
        dataValidade: validade,
        dataCadastro: new Date().toISOString(),
        usuarioCadastro: usuarioLogado.id,
        observacoes
    };
    
    medicamentos.push(novoMedicamento);
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos));
    
    registrarMovimentacao(novoMedicamento.id, 'entrada', quantidade, valorUnitario, 'Cadastro inicial');
    
    document.getElementById('codigoBarras').value = '';
    document.getElementById('nomeMedicamento').value = '';
    document.getElementById('fabricante').value = '';
    document.getElementById('lote').value = '';
    document.getElementById('quantidade').value = '';
    document.getElementById('valorTotal').value = '';
    document.getElementById('validade').value = '';
    document.getElementById('observacoes').value = '';
    document.getElementById('valorUnitarioInfo').textContent = 'Valor unitário: R$ 0,00';
    
    alert('Medicamento cadastrado com sucesso!');
    
    atualizarDashboard();
}

function buscarMedicamentoPorCodigo(codigo) {
    if (codigo.length < 10) return;
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamento = medicamentos.find(med => med.codigo === codigo);
    
    if (medicamento) {
        document.getElementById('medicamentoRetirada').value = medicamento.nome;
        document.getElementById('loteRetirada').value = medicamento.lote;
        document.getElementById('valorUnitarioRetirada').value = medicamento.valorUnitario.toFixed(2);
        document.getElementById('quantidadeRetirada').max = medicamento.quantidade;
        
        calcularValorTotalRetirada();
    } else {
        document.getElementById('medicamentoRetirada').value = '';
        document.getElementById('loteRetirada').value = '';
        document.getElementById('valorUnitarioRetirada').value = '';
        document.getElementById('quantidadeRetirada').value = '';
        document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
        
        alert('Medicamento não encontrado. Verifique o código de barras.');
    }
}

function calcularValorTotalRetirada() {
    const quantidade = parseInt(document.getElementById('quantidadeRetirada').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioRetirada').value) || 0;
    const valorTotal = quantidade * valorUnitario;
    
    document.getElementById('valorTotalRetiradaInfo').textContent = `Valor total: R$ ${valorTotal.toFixed(2)}`;
}

function toggleMotivoField() {
    const tipoMovimentacao = document.getElementById('tipoMovimentacao').value;
    const motivoField = document.getElementById('motivoField');
    
    if (tipoMovimentacao === 'devolucao') {
        motivoField.style.display = 'none';
    } else {
        motivoField.style.display = 'block';
    }
}

function processarMovimentacao() {
    const codigo = document.getElementById('retirarCodigo').value;
    const quantidade = parseInt(document.getElementById('quantidadeRetirada').value);
    const tipo = document.getElementById('tipoMovimentacao').value;
    const motivo = document.getElementById('motivoRetirada').value;
    
    if (!codigo || !quantidade || quantidade < 1) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamentoIndex = medicamentos.findIndex(med => med.codigo === codigo);
    
    if (medicamentoIndex === -1) {
        alert('Medicamento não encontrado.');
        return;
    }
    
    const medicamento = medicamentos[medicamentoIndex];
    
    if (tipo === 'saida' && medicamento.quantidade < quantidade) {
        alert(`Estoque insuficiente. Disponível: ${medicamento.quantidade}`);
        return;
    }
    
    if (tipo === 'saida') {
        medicamento.quantidade -= quantidade;
    } else {
        medicamento.quantidade += quantidade;
    }
    
    medicamentos[medicamentoIndex] = medicamento;
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos));
    
    registrarMovimentacao(
        medicamento.id, 
        tipo, 
        quantidade, 
        medicamento.valorUnitario, 
        tipo === 'saida' ? motivo : 'Devolução'
    );
    
    if (medicamento.quantidade <= 0 && tipo === 'saida') {
        medicamentoAlerta = medicamento;
        document.getElementById('alertTitle').textContent = 'Alerta de Estoque Zerado';
        document.getElementById('alertMessage').textContent = `O medicamento ${medicamento.nome} chegou a zero no estoque. Deseja enviar email de alerta?`;
        document.getElementById('alertModal').style.display = 'flex';
    }
    
    document.getElementById('retirarCodigo').value = '';
    document.getElementById('medicamentoRetirada').value = '';
    document.getElementById('loteRetirada').value = '';
    document.getElementById('valorUnitarioRetirada').value = '';
    document.getElementById('quantidadeRetirada').value = '';
    document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
    
    alert(`Movimentação registrada com sucesso!`);
    
    atualizarDashboard();
}

function registrarMovimentacao(medicamentoId, tipo, quantidade, valorUnitario, motivo) {
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    
    const novaMovimentacao = {
        id: movimentacoes.length > 0 ? Math.max(...movimentacoes.map(m => m.id)) + 1 : 1,
        medicamentoId,
        tipo,
        quantidade,
        valorUnitario,
        valorTotal: quantidade * valorUnitario,
        usuarioId: usuarioLogado.id,
        data: new Date().toISOString(),
        motivo,
        observacoes: ''
    };
    
    movimentacoes.push(novaMovimentacao);
    localStorage.setItem(MOVIMENTACOES_DB, JSON.stringify(movimentacoes));
}

function filtrarMedicamentos() {
    const termo = document.getElementById('pesquisaTermo').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)) || {};
    
    const hoje = new Date();
    const tbody = document.getElementById('tabelaPesquisa').querySelector('tbody');
    tbody.innerHTML = '';
    
    medicamentos.forEach(med => {
        let mostrar = true;
        
        if (status !== 'todos') {
            const dataValidade = new Date(med.dataValidade);
            
            switch(status) {
                case 'disponivel':
                    mostrar = med.quantidade > 0 && dataValidade > hoje;
                    break;
                case 'vencendo':
                    const diasParaVencer = Math.floor((dataValidade - hoje) / (1000 * 60 * 60 * 24));
                    mostrar = diasParaVencer <= (configuracoes.diasAlertaVencimento || 30) && diasParaVencer >= 0;
                    break;
                case 'vencido':
                    mostrar = dataValidade < hoje;
                    break;
                case 'estoque-baixo':
                    mostrar = med.quantidade <= (configuracoes.limiteEstoqueBaixo || 10);
                    break;
            }
        }
        
        if (mostrar && termo) {
            mostrar = med.nome.toLowerCase().includes(termo) || 
                     med.codigo.includes(termo) || 
                     med.fabricante.toLowerCase().includes(termo) ||
                     med.lote.toLowerCase().includes(termo);
        }
        
        if (mostrar) {
            const tr = document.createElement('tr');
            
            let statusText = '';
            let statusClass = '';
            
            const dataValidade = new Date(med.dataValidade);
            if (dataValidade < hoje) {
                statusText = 'Vencido';
                statusClass = 'badge-danger';
            } else {
                const diasParaVencer = Math.floor((dataValidade - hoje) / (1000 * 60 * 60 * 24));
                if (diasParaVencer <= (configuracoes.diasAlertaVencimento || 30)) {
                    statusText = 'Vencendo';
                    statusClass = 'badge-warning';
                } else if (med.quantidade <= (configuracoes.limiteEstoqueBaixo || 10)) {
                    statusText = 'Estoque Baixo';
                    statusClass = 'badge-warning';
                } else {
                    statusText = 'Disponível';
                    statusClass = 'badge-success';
                }
            }
            
            tr.innerHTML = `
                <td>${med.codigo}</td>
                <td>${med.nome}</td>
                <td>${med.fabricante}</td>
                <td>${med.lote}</td>
                <td>${med.quantidade}</td>
                <td>R$ ${med.valorUnitario.toFixed(2)}</td>
                <td>${formatarData(med.dataValidade)}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn" onclick="detalhesMedicamento(${med.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-danger" onclick="excluirMedicamento(${med.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        }
    });
}

function detalhesMedicamento(id) {
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamento = medicamentos.find(m => m.id === id);
    
    if (medicamento) {
        alert(`Detalhes do Medicamento:\n\nNome: ${medicamento.nome}\nCódigo: ${medicamento.codigo}\nFabricante: ${medicamento.fabricante}\nLote: ${medicamento.lote}\nQuantidade: ${medicamento.quantidade}\nValor Unitário: R$ ${medicamento.valorUnitario.toFixed(2)}\nValidade: ${formatarData(medicamento.dataValidade)}\nObservações: ${medicamento.observacoes || 'Nenhuma'}`);
    }
}

function excluirMedicamento(id) {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;
    
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamentosAtualizados = medicamentos.filter(m => m.id !== id);
    
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentosAtualizados));
    
    alert('Medicamento excluído com sucesso!');
    filtrarMedicamentos();
    atualizarDashboard();
}

function mudarTipoRelatorio() {
    const tipo = document.getElementById('tipoRelatorio').value;
    const periodoPersonalizado = document.getElementById('periodoPersonalizado');
    
    if (document.getElementById('periodoRelatorio').value === 'personalizado') {
        periodoPersonalizado.style.display = 'block';
    } else {
        periodoPersonalizado.style.display = 'none';
    }
}

function gerarRelatorio() {
    const tipo = document.getElementById('tipoRelatorio').value;
    const periodo = document.getElementById('periodoRelatorio').value;
    let dataInicio, dataFim;

    const hoje = new Date();
    if (periodo === 'personalizado') {
        dataInicio = new Date(document.getElementById('dataInicio').value);
        dataFim = new Date(document.getElementById('dataFim').value);
        if (!dataInicio || !dataFim || dataInicio > dataFim) {
            alert('Por favor, selecione um período válido.');
            return;
        }
    } else {
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - parseInt(periodo));
        dataFim = hoje;
    }

    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)) || {};

    const filteredMovimentacoes = movimentacoes.filter(mov => {
        const dataMov = new Date(mov.data);
        return dataMov >= dataInicio && dataMov <= dataFim;
    });

    const tabela = document.getElementById('tabelaRelatorio');
    const resumo = document.getElementById('conteudoResumo');
    tabela.innerHTML = '';
    resumo.innerHTML = '';

    let thead, tbody;

    switch (tipo) {
        case 'movimentacoes':
            thead = '<tr><th>Data</th><th>Medicamento</th><th>Quantidade</th><th>Tipo</th><th>Motivo</th></tr>';
            tbody = filteredMovimentacoes.map(mov => {
                const med = medicamentos.find(m => m.id === mov.medicamentoId);
                return `<tr><td>${formatarData(mov.data)}</td><td>${med ? med.nome : 'Desconhecido'}</td><td>${mov.quantidade}</td><td>${mov.tipo}</td><td>${mov.motivo}</td></tr>`;
            }).join('');
            resumo.innerHTML = `Total de movimentações: ${filteredMovimentacoes.length}`;
            break;
        case 'estoque':
            thead = '<tr><th>Nome</th><th>Quantidade</th><th>Status</th></tr>';
            tbody = medicamentos.map(med => {
                const dataValidade = new Date(med.dataValidade);
                let status = 'Disponível';
                let statusClass = 'badge-success';
                if (dataValidade < hoje) {
                    status = 'Vencido';
                    statusClass = 'badge-danger';
                } else if (Math.floor((dataValidade - hoje) / (1000 * 60 * 60 * 24)) <= (configuracoes.diasAlertaVencimento || 30)) {
                    status = 'Vencendo';
                    statusClass = 'badge-warning';
                } else if (med.quantidade <= (configuracoes.limiteEstoqueBaixo || 10)) {
                    status = 'Estoque Baixo';
                    statusClass = 'badge-warning';