// Banco de dados simulado usando localStorage
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
let tipoScanner = 'qrcode'; // 'qrcode' ou 'barcode'

// Inicializar bancos de dados
function inicializarBancosDeDados() {
    // Inicializar usuários
    if (!localStorage.getItem(USUARIOS_DB)) {
        const usuarios = [
            { id: 189, nome: "Administrador Master", tipo: "admin", dataCriacao: new Date().toISOString() },
            { id: 1, nome: "Enfermeira Maria", tipo: "comum", dataCriacao: new Date().toISOString() },
            { id: 2, nome: "Farmacêutico João", tipo: "comum", dataCriacao: new Date().toISOString() }
        ];
        localStorage.setItem(USUARIOS_DB, JSON.stringify(usuarios));
    }
    
    // Inicializar medicamentos
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

    // Inicializar movimentações
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
    
    // Inicializar configurações
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
    
    // Carregar configurações
    carregarConfiguracoes();
}

// Carregar configurações do sistema
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

// Salvar configurações do sistema
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

// Mudar tipo de scanner (QR Code ou Código de Barras)
function mudarTipoScanner(tipo) {
    tipoScanner = tipo;
    document.getElementById('btnQrCode').classList.toggle('active', tipo === 'qrcode');
    document.getElementById('btnBarcode').classList.toggle('active', tipo === 'barcode');
    
    if (scannerAtivo) {
        fecharScanner();
        iniciarScanner(scannerCampoAlvo);
    }
}

// SCANNER CORRIGIDO - FUNCIONANDO
// Iniciar scanner de código de barras - VERSÃO CORRIGIDA E TESTADA
function iniciarScanner(campoId) {
    scannerCampoAlvo = campoId;
    const scannerContainer = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    const instructions = document.getElementById('scannerInstructions');
    const errorDiv = document.getElementById('scannerError');
    
    scannerContainer.style.display = 'flex';
    instructions.style.display = 'block';
    errorDiv.style.display = 'none';
    
    // Verificar se o navegador suporta a API de mídia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Tentar acessar a câmera traseira primeiro
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
            
            if (tipoScanner === 'qrcode') {
                scanearCodigoQR(video);
            } else {
                scanearCodigoBarras();
            }
        })
        .catch(function(error) {
            console.error('Erro ao acessar a câmera:', error);
            
            // Se a câmera traseira falhar, tentar a câmera frontal
            constraints.video.facingMode = 'user';
            
            navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                video.srcObject = stream;
                scannerStream = stream;
                video.play();
                scannerAtivo = true;
                
                if (tipoScanner === 'qrcode') {
                    scanearCodigoQR(video);
                } else {
                    scanearCodigoBarras();
                }
            })
            .catch(function(error) {
                console.error('Erro ao acessar qualquer câmera:', error);
                instructions.style.display = 'none';
                errorDiv.style.display = 'block';
                scannerAtivo = false;
                
                // Mostrar ajuda de permissão de câmera no formulário
                document.getElementById('cameraHelp').style.display = 'block';
                document.getElementById('cameraHelpRetirar').style.display = 'block';
            });
        });
    } else {
        alert('Seu navegador não suporta acesso à câmera.');
        instructions.style.display = 'none';
        errorDiv.style.display = 'block';
        scannerAtivo = false;
    }
}

// Fechar scanner - CORRIGIDO
function fecharScanner() {
    const scannerContainer = document.getElementById('scannerContainer');
    const video = document.getElementById('scannerVideo');
    
    scannerContainer.style.display = 'none';
    scannerAtivo = false;
    
    // Parar todas as tracks da stream
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }
    
    video.srcObject = null;
    
    // Parar o Quagga se estiver ativo
    if (typeof Quagga !== 'undefined' && Quagga.isActive()) {
        Quagga.stop();
    }
}

// Scanear código QR
function scanearCodigoQR(video) {
    if (!scannerAtivo) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Verificar se o vídeo está pronto
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });
            
            if (code) {
                document.getElementById(scannerCampoAlvo).value = code.data;
                fecharScanner();
                
                // Se for o campo de retirada, buscar o medicamento
                if (scannerCampoAlvo === 'retirarCodigo') {
                    buscarMedicamentoPorCodigo(code.data);
                }
                
                // Ocultar ajuda de permissão se o scan foi bem-sucedido
                document.getElementById('cameraHelp').style.display = 'none';
                document.getElementById('cameraHelpRetirar').style.display = 'none';
                
                return;
            }
        } catch (error) {
            console.error('Erro no scanner:', error);
        }
    }
    
    // Continuar escaneando
    if (scannerAtivo) {
        requestAnimationFrame(() => scanearCodigoQR(video));
    }
}

// Scanear código de barras com Quagga
function scanearCodigoBarras() {
    if (!scannerAtivo) return;
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scannerVideo'),
            constraints: {
                width: 640,
                height: 480,
                facingMode: "environment"
            },
        },
        decoder: {
            readers: [
                "code_128_reader",
                "ean_reader",
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader"
            ]
        },
    }, function(err) {
        if (err) {
            console.error('Erro ao inicializar Quagga:', err);
            document.getElementById('scannerInstructions').style.display = 'none';
            document.getElementById('scannerError').style.display = 'block';
            return;
        }
        
        Quagga.start();
        
        // Detectar códigos de barras
        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            document.getElementById(scannerCampoAlvo).value = code;
            fecharScanner();
            
            // Se for o campo de retirada, buscar o medicamento
            if (scannerCampoAlvo === 'retirarCodigo') {
                buscarMedicamentoPorCodigo(code);
            }
            
            // Ocultar ajuda de permissão se o scan foi bem-sucedido
            document.getElementById('cameraHelp').style.display = 'none';
            document.getElementById('cameraHelpRetirar').style.display = 'none';
        });
    });
}

// Simular scan de código de barras
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
    
    // Se for o campo de retirada, buscar o medicamento
    if (campoId === 'retirarCodigo') {
        buscarMedicamentoPorCodigo(codigoAleatorio);
    }
    
    // Ocultar ajuda de permissão quando usar simulação
    document.getElementById('cameraHelp').style.display = 'none';
    document.getElementById('cameraHelpRetirar').style.display = 'none';
}

// Login no sistema
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
    
    // Atualizar interface com informações do usuário
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
    
    // Mostrar aplicativo e esconder login
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Atualizar dashboard
    atualizarDashboard();
}

// Logout do sistema
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

// Alternar menu em dispositivos móveis - CORRIGIDO
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Se o menu está sendo fechado, remover o overlay
    if (!sidebar.classList.contains('active')) {
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }
}

// Navegar entre módulos - CORRIGIDO para fechar menu em mobile
function navigateTo(moduleId) {
    // Fechar o menu lateral em dispositivos móveis
    if (window.innerWidth <= 768) {
        toggleMenu();
    }
    
    // Esconder todos os módulos
    document.querySelectorAll('.module').forEach(module => {
        module.classList.remove('active');
    });
    
    // Remover classe active de todos os itens do menu
    document.querySelectorAll('.menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar módulo selecionado
    document.getElementById(moduleId).classList.add('active');
    
    // Ativar item do menu correspondente
    document.querySelector(`.menu li[data-module="${moduleId}"]`).classList.add('active');
    
    // Atualizar título do módulo
    document.getElementById('moduleTitle').textContent = document.querySelector(`.menu li[data-module="${moduleId}"]`).textContent;
    
    // Adicionar ao histórico de navegação
    navigationHistory.push(moduleId);
    currentNavigationIndex = navigationHistory.length - 1;
    
    // Executar ações específicas do módulo
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

// Navegar para trás
function navigateBack() {
    if (currentNavigationIndex > 0) {
        currentNavigationIndex--;
        navigateTo(navigationHistory[currentNavigationIndex]);
    }
}

// Atualizar dashboard com informações atuais
function atualizarDashboard() {
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)) || {};
    
    // Calcular totais
    const totalMedicamentos = medicamentos.length;
    const totalValor = medicamentos.reduce((total, med) => total + (med.quantidade * med.valorUnitario), 0);
    
    // Calcular próximos vencimentos (dentro de 30 dias)
    const hoje = new Date();
    const diasAlerta = configuracoes.diasAlertaVencimento || 30;
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() + diasAlerta);
    
    const proximosVencimentos = medicamentos.filter(med => {
        const dataValidade = new Date(med.dataValidade);
        return dataValidade <= dataLimite && dataValidade >= hoje;
    }).length;
    
    // Calcular total gasto no mês
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const totalGastoMes = movimentacoes
        .filter(mov => new Date(mov.data) >= inicioMes && mov.tipo === 'entrada')
        .reduce((total, mov) => total + mov.valorTotal, 0);
    
    // Encontrar medicamento mais utilizado
    const medicamentoMaisUtilizado = encontrarMedicamentoMaisUtilizado();
    
    // Atualizar estatísticas
    document.getElementById('totalMedicamentos').textContent = totalMedicamentos;
    document.getElementById('totalValor').textContent = `R$ ${totalValor.toFixed(2)}`;
    document.getElementById('proximosVencimentos').textContent = proximosVencimentos;
    document.getElementById('totalGastoMes').textContent = `R$ ${totalGastoMes.toFixed(2)}`;
    document.getElementById('medicamentoMaisUtilizado').textContent = medicamentoMaisUtilizado;
    
    // Atualizar tabela de movimentações
    atualizarTabelaMovimentacoes();
}

// Encontrar medicamento mais utilizado
function encontrarMedicamentoMaisUtilizado() {
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    
    if (movimentacoes.length === 0) return '-';
    
    // Contar saídas por medicamento
    const contagem = {};
    movimentacoes
        .filter(mov => mov.tipo === 'saida')
        .forEach(mov => {
            if (!contagem[mov.medicamentoId]) {
                contagem[mov.medicamentoId] = 0;
            }
            contagem[mov.medicamentoId] += mov.quantidade;
        });
    
    // Encontrar o ID do medicamento mais utilizado
    const medicamentoId = Object.keys(contagem).reduce((a, b) => 
        contagem[a] > contagem[b] ? a : b
    );
    
    // Encontrar o nome do medicamento
    const medicamento = medicamentos.find(m => m.id == medicamentoId);
    return medicamento ? medicamento.nome : '-';
}

// Atualizar tabela de movimentações
function atualizarTabelaMovimentacoes() {
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
    
    // Ordenar por data (mais recente primeiro)
    movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    const tbody = document.getElementById('movimentacoesTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    // Adicionar as 10 movimentações mais recentes
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

// Formatar data para exibição
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Calcular valor unitário ao cadastrar medicamento
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

// Cadastrar novo medicamento
function cadastrarMedicamento() {
    const codigo = document.getElementById('codigoBarras').value;
    const nome = document.getElementById('nomeMedicamento').value;
    const fabricante = document.getElementById('fabricante').value;
    const lote = document.getElementById('lote').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const validade = document.getElementById('validade').value;
    const observacoes = document.getElementById('observacoes').value;
    
    // Validar campos obrigatórios
    if (!codigo || !nome || !fabricante || !lote || !quantidade || !valorTotal || !validade) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    // Calcular valor unitário
    const valorUnitario = valorTotal / quantidade;
    
    // Obter medicamentos existentes
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    
    // Verificar se já existe medicamento com mesmo código e lote
    const existe = medicamentos.some(med => med.codigo === codigo && med.lote === lote);
    
    if (existe) {
        alert('Já existe um medicamento com este código e lote. Use a funcionalidade de entrada de estoque.');
        return;
    }
    
    // Criar novo medicamento
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
    
    // Adicionar ao array e salvar
    medicamentos.push(novoMedicamento);
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos));
    
    // Registrar movimentação de entrada
    registrarMovimentacao(novoMedicamento.id, 'entrada', quantidade, valorUnitario, 'Cadastro inicial');
    
    // Limpar formulário
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
    
    // Atualizar dashboard
    atualizarDashboard();
}

// Buscar medicamento por código de barras - CORRIGIDO
function buscarMedicamentoPorCodigo(codigo) {
    // Não buscar se o código estiver vazio ou muito curto
    if (!codigo || codigo.length < 3) {
        return;
    }
    
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamento = medicamentos.find(med => med.codigo === codigo);
    
    if (medicamento) {
        document.getElementById('medicamentoRetirada').value = medicamento.nome;
        document.getElementById('loteRetirada').value = medicamento.lote;
        document.getElementById('valorUnitarioRetirada').value = medicamento.valorUnitario.toFixed(2);
        document.getElementById('quantidadeRetirada').max = medicamento.quantidade;
        
        // Calcular valor total inicial
        calcularValorTotalRetirada();
    } else {
        // Só mostrar alerta se o código tiver comprimento completo (ex: 13 dígitos para EAN-13)
        if (codigo.length >= 12) {
            document.getElementById('medicamentoRetirada').value = '';
            document.getElementById('loteRetirada').value = '';
            document.getElementById('valorUnitarioRetirada').value = '';
            document.getElementById('quantidadeRetirada').value = '';
            document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
            
            alert('Medicamento não encontrado. Verifique o código de barras.');
        }
    }
}

// Calcular valor total da retirada
function calcularValorTotalRetirada() {
    const quantidade = parseInt(document.getElementById('quantidadeRetirada').value) || 0;
    const valorUnitario = parseFloat(document.getElementById('valorUnitarioRetirada').value) || 0;
    const valorTotal = quantidade * valorUnitario;
    
    document.getElementById('valorTotalRetiradaInfo').textContent = `Valor total: R$ ${valorTotal.toFixed(2)}`;
}

// Alternar campo de motivo conforme tipo de movimentação
function toggleMotivoField() {
    const tipoMovimentacao = document.getElementById('tipoMovimentacao').value;
    const motivoField = document.getElementById('motivoField');
    
    if (tipoMovimentacao === 'devolucao') {
        motivoField.style.display = 'none';
    } else {
        motivoField.style.display = 'block';
    }
}

// Processar movimentação (saída ou devolução)
function processarMovimentacao() {
    const codigo = document.getElementById('retirarCodigo').value;
    const quantidade = parseInt(document.getElementById('quantidadeRetirada').value);
    const tipo = document.getElementById('tipoMovimentacao').value;
    const motivo = document.getElementById('motivoRetirada').value;
    
    // Validar campos
    if (!codigo || !quantidade || quantidade < 1) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    // Buscar medicamento
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamentoIndex = medicamentos.findIndex(med => med.codigo === codigo);
    
    if (medicamentoIndex === -1) {
        alert('Medicamento não encontrado.');
        return;
    }
    
    const medicamento = medicamentos[medicamentoIndex];
    
    // Verificar estoque para saída
    if (tipo === 'saida' && medicamento.quantidade < quantidade) {
        alert(`Estoque insuficiente. Disponível: ${medicamento.quantidade}`);
        return;
    }
    
    // Atualizar quantidade
    if (tipo === 'saida') {
        medicamento.quantidade -= quantidade;
    } else {
        medicamento.quantidade += quantidade;
    }
    
    // Salvar medicamento atualizado
    medicamentos[medicamentoIndex] = medicamento;
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos));
    
    // Registrar movimentação
    registrarMovimentacao(
        medicamento.id, 
        tipo, 
        quantidade, 
        medicamento.valorUnitario, 
        tipo === 'saida' ? motivo : 'Devolução'
    );
    
    // Verificar se o estoque chegou a zero e enviar alerta
    if (tipo === 'saida' && medicamento.quantidade === 0) {
        mostrarAlertaEstoqueZero(medicamento);
    }
    
    // Limpar formulário
    document.getElementById('retirarCodigo').value = '';
    document.getElementById('medicamentoRetirada').value = '';
    document.getElementById('loteRetirada').value = '';
    document.getElementById('valorUnitarioRetirada').value = '';
    document.getElementById('quantidadeRetirada').value = '';
    document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
    
    alert(`Movimentação registrada com sucesso!`);
    
    // Atualizar dashboard
    atualizarDashboard();
}

// Mostrar alerta de estoque zero
function mostrarAlertaEstoqueZero(medicamento) {
    document.getElementById('alertTitle').textContent = 'Estoque Esgotado';
    document.getElementById('alertMessage').textContent = `O medicamento ${medicamento.nome} (Lote: ${medicamento.lote}) acabou no estoque. Deseja enviar um alerta por e-mail?`;
    document.getElementById('alertModal').style.display = 'flex';
    medicamentoAlerta = medicamento;
}

// Confirmar envio de email
function confirmarEnvioEmail() {
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)) || {};
    const email = configuracoes.emailNotificacao;
    
    if (email && medicamentoAlerta) {
        // Simular envio de email (em um sistema real, aqui seria uma chamada API)
        alert(`E-mail enviado para ${email} sobre o esgotamento do medicamento ${medicamentoAlerta.nome}`);
    } else if (!email) {
        alert('Nenhum e-mail configurado para notificações. Configure em Configurações do Sistema.');
    }
    
    closeAlert();
}

// Fechar alerta
function closeAlert() {
    document.getElementById('alertModal').style.display = 'none';
    medicamentoAlerta = null;
}

// Registrar movimentação no histórico
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

// Filtrar medicamentos na pesquisa
function filtrarMedicamentos() {
    const termo = document.getElementById('pesquisaTermo').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const configuracoes = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)) || {};
    
    const hoje = new Date();
    const tbody = document.getElementById('tabelaPesquisa').querySelector('tbody');
    tbody.innerHTML = '';
    
    medicamentos.forEach(med => {
        // Aplicar filtro de status
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
        
        // Aplicar filtro de termo
        if (mostrar && termo) {
            mostrar = med.nome.toLowerCase().includes(termo) || 
                     med.codigo.includes(termo) || 
                     med.fabricante.toLowerCase().includes(termo) ||
                     med.lote.toLowerCase().includes(termo);
        }
        
        if (mostrar) {
            const tr = document.createElement('tr');
            
            // Determinar status do medicamento
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

// Mostrar detalhes do medicamento
function detalhesMedicamento(id) {
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamento = medicamentos.find(m => m.id === id);
    
    if (medicamento) {
        alert(`Detalhes do Medicamento:\n\nNome: ${medicamento.nome}\nCódigo: ${medicamento.codigo}\nFabricante: ${medicamento.fabricante}\nLote: ${medicamento.lote}\nQuantidade: ${medicamento.quantidade}\nValor Unitário: R$ ${medicamento.valorUnitario.toFixed(2)}\nValidade: ${formatarData(medicamento.dataValidade)}\nObservações: ${medicamento.observacoes || 'Nenhuma'}`);
    }
}

// Excluir medicamento
function excluirMedicamento(id) {
    if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;
    
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const medicamentosAtualizados = medicamentos.filter(m => m.id !== id);
    
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentosAtualizados));
    
    alert('Medicamento excluído com sucesso!');
    filtrarMedicamentos();
    atualizarDashboard();
}

// Mudar tipo de relatório
function mudarTipoRelatorio() {
    const tipo = document.getElementById('tipoRelatorio').value;
    const periodoPersonalizado = document.getElementById('periodoPersonalizado');
    
    if (tipo === 'personalizado') {
        periodoPersonalizado.style.display = 'block';
    } else {
        periodoPersonalizado.style.display = 'none';
    }
}

// Gerar relatório
function gerarRelatorio() {
    const tipo = document.getElementById('tipoRelatorio').value;
    const periodo = document.getElementById('periodoRelatorio').value;
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    
    let dadosFiltrados = [];
    let titulo = '';
    
    // Filtrar por período
    let dataInicioFiltro = new Date();
    let dataFimFiltro = new Date();
    
    if (periodo === 'personalizado') {
        dataInicioFiltro = new Date(dataInicio);
        dataFimFiltro = new Date(dataFim);
    } else {
        dataInicioFiltro.setDate(dataInicioFiltro.getDate() - parseInt(periodo));
    }
    
    dadosFiltrados = movimentacoes.filter(mov => {
        const dataMov = new Date(mov.data);
        return dataMov >= dataInicioFiltro && dataMov <= dataFimFiltro;
    });
    
    // Aplicar filtro por tipo de relatório
    switch(tipo) {
        case 'movimentacoes':
            titulo = 'Relatório de Movimentações';
            break;
        case 'estoque':
            titulo = 'Relatório de Situação do Estoque';
            dadosFiltrados = medicamentos;
            break;
        case 'vencimentos':
            titulo = 'Relatório de Próximos Vencimentos';
            const hoje = new Date();
            const diasAlerta = JSON.parse(localStorage.getItem(CONFIGURACOES_DB)).diasAlertaVencimento || 30;
            const dataLimite = new Date();
            dataLimite.setDate(hoje.getDate() + diasAlerta);
            
            dadosFiltrados = medicamentos.filter(med => {
                const dataValidade = new Date(med.dataValidade);
                return dataValidade <= dataLimite && dataValidade >= hoje;
            });
            break;
        case 'valor':
            titulo = 'Relatório de Valor em Estoque';
            dadosFiltrados = medicamentos;
            break;
    }
    
    // Gerar conteúdo do relatório
    let conteudoHTML = `<h4>${titulo}</h4>`;
    conteudoHTML += `<p>Período: ${periodo === 'personalizado' ? `${formatarData(dataInicio)} a ${formatarData(dataFim)}` : `Últimos ${periodo} dias`}</p>`;
    
    if (tipo === 'movimentacoes') {
        const totalEntradas = dadosFiltrados.filter(m => m.tipo === 'entrada').reduce((total, m) => total + m.valorTotal, 0);
        const totalSaidas = dadosFiltrados.filter(m => m.tipo === 'saida').reduce((total, m) => total + m.valorTotal, 0);
        
        conteudoHTML += `<p>Total de Entradas: R$ ${totalEntradas.toFixed(2)}</p>`;
        conteudoHTML += `<p>Total de Saídas: R$ ${totalSaidas.toFixed(2)}</p>`;
        conteudoHTML += `<p>Saldo: R$ ${(totalEntradas - totalSaidas).toFixed(2)}</p>`;
    } else if (tipo === 'valor') {
        const valorTotal = dadosFiltrados.reduce((total, med) => total + (med.quantidade * med.valorUnitario), 0);
        conteudoHTML += `<p>Valor Total em Estoque: R$ ${valorTotal.toFixed(2)}</p>`;
    }
    
    document.getElementById('conteudoResumo').innerHTML = conteudoHTML;
    
    // Preencher tabela de relatório
    const thead = document.getElementById('tabelaRelatorio').querySelector('thead');
    const tbody = document.getElementById('tabelaRelatorio').querySelector('tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (tipo === 'movimentacoes') {
        thead.innerHTML = `
            <tr>
                <th>Data</th>
                <th>Medicamento</th>
                <th>Lote</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Valor Total</th>
                <th>Tipo</th>
                <th>Usuário</th>
            </tr>
        `;
        
        dadosFiltrados.forEach(mov => {
            const medicamento = medicamentos.find(m => m.id === mov.medicamentoId);
            const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
            const usuario = usuarios.find(u => u.id === mov.usuarioId);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatarData(mov.data)}</td>
                <td>${medicamento ? medicamento.nome : 'Desconhecido'}</td>
                <td>${medicamento ? medicamento.lote : '-'}</td>
                <td>${mov.quantidade}</td>
                <td>R$ ${mov.valorUnitario.toFixed(2)}</td>
                <td>R$ ${mov.valorTotal.toFixed(2)}</td>
                <td>${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                <td>${usuario ? usuario.nome : 'Desconhecido'}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        // Para outros tipos de relatório (estoque, vencimentos, valor)
        thead.innerHTML = `
            <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Fabricante</th>
                <th>Lote</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Validade</th>
                <th>Valor Total</th>
            </tr>
        `;
        
        dadosFiltrados.forEach(med => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${med.codigo}</td>
                <td>${med.nome}</td>
                <td>${med.fabricante}</td>
                <td>${med.lote</td>
                <td>${med.quantidade}</td>
                <td>R$ ${med.valorUnitario.toFixed(2)}</td>
                <td>${formatarData(med.dataValidade)}</td>
                <td>R$ ${(med.quantidade * med.valorUnitario).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    // Gerar gráfico (simplificado)
    const ctx = document.getElementById('relatorioChart').getContext('2d');
    if (relatorioChart) {
        relatorioChart.destroy();
    }
    
    // Aqui seria a implementação real do gráfico com Chart.js
    // Por simplicidade, estamos apenas mostrando uma mensagem
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Gráfico do Relatório', ctx.canvas.width / 2, ctx.canvas.height / 2);
    
    alert(`Relatório "${titulo}" gerado com sucesso!`);
}

// Exportar relatório
function exportarRelatorio() {
    const tabela = document.getElementById('tabelaRelatorio');
    let csv = [];
    
    // Headers
    const headers = [];
    for (let i = 0; i < tabela.rows[0].cells.length; i++) {
        headers.push(tabela.rows[0].cells[i].textContent);
    }
    csv.push(headers.join(','));
    
    // Data
    for (let i = 1; i < tabela.rows.length; i++) {
        const row = [];
        for (let j = 0; j < tabela.rows[i].cells.length; j++) {
            row.push(tabela.rows[i].cells[j].textContent);
        }
        csv.push(row.join(','));
    }
    
    // Download
    const csvContent = "data:text/csv;charset=utf-8," + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_medicamentos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Carregar usuários
function carregarUsuarios() {
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
    const tbody = document.getElementById('tabelaUsuarios').querySelector('tbody');
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nome}</td>
            <td>${usuario.tipo === 'admin' ? 'Administrador' : 'Usuário Comum'}</td>
            <td>${formatarData(usuario.dataCriacao)}</td>
            <td>
                <button class="action-btn btn-danger" onclick="excluirUsuario(${usuario.id})" ${usuario.id === usuarioLogado.id ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Cadastrar novo usuário
function cadastrarUsuario() {
    const id = parseInt(document.getElementById('novoUsuarioId').value);
    const nome = document.getElementById('novoUsuarioNome').value;
    const tipo = document.getElementById('novoUsuarioTipo').value;
    
    if (!id || id < 1 || !nome) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
    
    // Verificar si ID já existe
    if (usuarios.some(u => u.id === id)) {
        alert('Já existe um usuário com este ID.');
        return;
    }
    
    // Adicionar novo usuário
    usuarios.push({
        id,
        nome,
        tipo,
        dataCriacao: new Date().toISOString()
    });
    
    localStorage.setItem(USUARIOS_DB, JSON.stringify(usuarios));
    
    // Limpar formulário
    document.getElementById('novoUsuarioId').value = '';
    document.getElementById('novoUsuarioNome').value = '';
    document.getElementById('novoUsuarioTipo').value = 'comum';
    
    alert('Usuário cadastrado com sucesso!');
    carregarUsuarios();
}

// Excluir usuário
function excluirUsuario(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    const usuarios = JSON.parse(localStorage.getItem(USUARIOS_DB)) || [];
    const usuariosAtualizados = usuarios.filter(u => u.id !== id);
    
    localStorage.setItem(USUARIOS_DB, JSON.stringify(usuariosAtualizados));
    
    alert('Usuário excluído com sucesso!');
    carregarUsuarios();
}

// Fazer backup dos dados
function fazerBackup() {
    const backup = {
        medicamentos: localStorage.getItem(MEDICAMENTOS_DB),
        usuarios: localStorage.getItem(USUARIOS_DB),
        movimentacoes: localStorage.getItem(MOVIMENTACOES_DB),
        configuracoes: localStorage.getItem(CONFIGURACOES_DB),
        data: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_medicamentos_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Backup realizado com sucesso!');
}

// Restaurar backup
function restaurarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (backup.medicamentos) localStorage.setItem(MEDICAMENTOS_DB, backup.medicamentos);
                if (backup.usuarios) localStorage.setItem(USUARIOS_DB, backup.usuarios);
                if (backup.movimentacoes) localStorage.setItem(MOVIMENTACOES_DB, backup.movimentacoes);
                if (backup.configuracoes) localStorage.setItem(CONFIGURACOES_DB, backup.configuracoes);
                
                alert('Backup restaurado com sucesso!');
                location.reload();
            } catch (error) {
                alert('Erro ao restaurar backup. Arquivo inválido.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Limpar dados antigos
function limparDadosAntigos() {
    if (!confirm('Tem certeza que deseja limpar dados antigos? Esta ação não pode ser desfeita.')) return;
    
    // Limpar movimentações com mais de 1 ano
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
    
    const movimentacoesAtualizadas = movimentacoes.filter(mov => {
        return new Date(mov.data) >= umAnoAtras;
    });
    
    localStorage.setItem(MOVIMENTACOES_DB, JSON.stringify(movimentacoesAtualizadas));
    
    alert(`Dados antigos limpos. ${movimentacoes.length - movimentacoesAtualizadas.length} registros removidos.`);
}

// Recalcular valores de estoque
function recalcularEstoque() {
    const medicamentos = JSON.parse(localStorage.getItem(MEDICAMENTOS_DB)) || [];
    const movimentacoes = JSON.parse(localStorage.getItem(MOVIMENTACOES_DB)) || [];
    
    // Para cada medicamento, recalcular a quantidade com base nas movimentações
    medicamentos.forEach(medicamento => {
        const movimentacoesMedicamento = movimentacoes.filter(mov => mov.medicamentoId === medicamento.id);
        
        let quantidadeCalculada = 0;
        
        movimentacoesMedicamento.forEach(mov => {
            if (mov.tipo === 'entrada') {
                quantidadeCalculada += mov.quantidade;
            } else if (mov.tipo === 'saida') {
                quantidadeCalculada -= mov.quantidade;
            }
        });
        
        // Atualizar a quantidade do medicamento
        medicamento.quantidade = quantidadeCalculada;
    });
    
    localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos));
    
    alert('Valores recalculados com sucesso!');
    atualizarDashboard();
}

// Inicializar a aplicação
window.onload = function() {
    inicializarBancosDeDados();
    document.getElementById('userId').focus();
    toggleMotivoField();
    mudarTipoRelatorio();
    
    // Adicionar event listeners para os itens do menu - CORRIGIDO
    document.querySelectorAll('.menu li[data-module]').forEach(item => {
        if (item.dataset.module !== 'sair') {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                navigateTo(this.dataset.module);
            });
        }
    });
    
    // Adicionar evento de teste ao botão de simular scan
    document.querySelectorAll('.scan-btn').forEach(btn => {
        if (btn.textContent.includes('Simular Scan')) {
            btn.addEventListener('click', function() {
                const campoId = this.getAttribute('onclick').match(/'([^']+)'/)[1];
                setTimeout(() => {
                    document.getElementById(campoId).value = "7891234567890";
                    if (campoId === 'retirarCodigo') {
                        buscarMedicamentoPorCodigo("7891234567890");
                    }
                }, 500);
            });
        }
    });
    
    // Adicionar evento de redimensionamento para ajustar o menu
    window.addEventListener('resize', function() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        // Se a tela for maior que 768px, garantir que o menu está visível
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
};

// Configurar o botão voltar do navegador para funcionar com o histórico de navegação
window.addEventListener('popstate', function(event) {
    navigateBack();
});

// Prevenir que o navegador saia do aplicativo sem confirmação
window.addEventListener('beforeunload', function (e) {
    if (document.getElementById('appContainer').style.display === 'block') {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
