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
let idb = null;

// Inicializar EmailJS (substitua com seus IDs reais do EmailJS)
emailjs.init("YOUR_USER_ID"); // Configure no EmailJS dashboard

async function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('controleMedicamentosDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('storage', { keyPath: 'key' });
    };
    request.onsuccess = (event) => {
      idb = event.target.result;
      resolve(idb);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

async function getItem(key) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction('storage', 'readonly');
    const store = transaction.objectStore('storage');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = reject;
  });
}

async function setItem(key, value) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction('storage', 'readwrite');
    const store = transaction.objectStore('storage');
    const request = store.put({ key, data: value });
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

async function inicializarBancosDeDados() {
  const usuarios = await getItem(USUARIOS_DB);
  if (!usuarios) {
    const defaultUsuarios = [
      { id: 189, nome: "Administrador Master", tipo: "admin", dataCriacao: new Date().toISOString() },
      { id: 1, nome: "Enfermeira Maria", tipo: "comum", dataCriacao: new Date().toISOString() },
      { id: 2, nome: "Farmacêutico João", tipo: "comum", dataCriacao: new Date().toISOString() }
    ];
    await setItem(USUARIOS_DB, defaultUsuarios);
  }
  
  const medicamentos = await getItem(MEDICAMENTOS_DB);
  if (!medicamentos) {
    const defaultMedicamentos = [
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
    await setItem(MEDICAMENTOS_DB, defaultMedicamentos);
  }

  const movimentacoes = await getItem(MOVIMENTACOES_DB);
  if (!movimentacoes) {
    const defaultMovimentacoes = [
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
    await setItem(MOVIMENTACOES_DB, defaultMovimentacoes);
  }
  
  const configuracoes = await getItem(CONFIGURACOES_DB);
  if (!configuracoes) {
    const defaultConfiguracoes = {
      emailNotificacao: "jlenon.32@outlook.com",
      diasAlertaVencimento: 30,
      limiteEstoqueBaixo: 10,
      backupAuto: "semanal",
      temaInterface: "claro"
    };
    await setItem(CONFIGURACOES_DB, defaultConfiguracoes);
  }
  
  await carregarConfiguracoes();
}

async function carregarConfiguracoes() {
  const configuracoes = await getItem(CONFIGURACOES_DB);
  if (configuracoes) {
    document.getElementById('emailNotificacao').value = configuracoes.emailNotificacao || '';
    document.getElementById('diasAlertaVencimento').value = configuracoes.diasAlertaVencimento || 30;
    document.getElementById('limiteEstoqueBaixo').value = configuracoes.limiteEstoqueBaixo || 10;
    document.getElementById('backupAuto').value = configuracoes.backupAuto || 'semanal';
    document.getElementById('temaInterface').value = configuracoes.temaInterface || 'claro';
  }
}

async function salvarConfiguracoes() {
  const configuracoes = {
    emailNotificacao: document.getElementById('emailNotificacao').value,
    diasAlertaVencimento: parseInt(document.getElementById('diasAlertaVencimento').value) || 30,
    limiteEstoqueBaixo: parseInt(document.getElementById('limiteEstoqueBaixo').value) || 10,
    backupAuto: document.getElementById('backupAuto').value,
    temaInterface: document.getElementById('temaInterface').value
  };
  
  await setItem(CONFIGURACOES_DB, configuracoes);
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
  if (typeof Quagga !== 'undefined' && Quagga.stop) Quagga.stop();
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

async function login() {
  const userIdInput = document.getElementById('userId').value.trim();
  const userId = parseInt(userIdInput);
  
  if (!userIdInput || isNaN(userId) || userId < 1) {
    alert('Por favor, digite um ID de usuário válido (número maior que 0).');
    return;
  }
  
  const usuarios = await getItem(USUARIOS_DB) || [];
  if (usuarios.length === 0) {
    console.error('Banco de usuários vazio. Inicializando novamente.');
    await inicializarBancosDeDados();
    alert('Erro: Banco de usuários estava vazio. Inicializado com usuários padrão. Tente novamente.');
    return;
  }
  
  const usuario = usuarios.find(u => u.id === userId);
  
  if (!usuario) {
    alert('Usuário não encontrado. Tente IDs padrão (ex: 189 para admin) ou contate o administrador.');
    console.log('Usuários disponíveis:', usuarios);
    return;
  }
  
  try {
    usuarioLogado = usuario;
    
    const userNameElement = document.getElementById('userName');
    const userIdDisplayElement = document.getElementById('userIdDisplay');
    const userTypeBadgeElement = document.getElementById('userTypeBadge');
    
    if (!userNameElement || !userIdDisplayElement || !userTypeBadgeElement) {
      throw new Error('Elementos da interface não encontrados.');
    }
    
    userNameElement.textContent = usuario.nome;
    userIdDisplayElement.textContent = usuario.id;
    
    // Configurar permissões
    const menuCadastrar = document.getElementById('menuCadastrar');
    const menuRelatorios = document.getElementById('menuRelatorios');
    const menuUsuarios = document.getElementById('menuUsuarios');
    const menuConfiguracoes = document.getElementById('menuConfiguracoes');
    
    if (usuario.tipo === 'admin') {
      userTypeBadgeElement.innerHTML = '<span class="admin-badge">Admin</span>';
      menuCadastrar.style.display = 'block';
      menuRelatorios.style.display = 'block';
      menuUsuarios.style.display = 'block';
      menuConfiguracoes.style.display = 'block';
    } else {
      userTypeBadgeElement.textContent = '';
      menuCadastrar.style.display = 'none';
      menuRelatorios.style.display = 'none';
      menuUsuarios.style.display = 'none';
      menuConfiguracoes.style.display = 'none';
    }
    
    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('appContainer');
    
    if (!loginContainer || !appContainer) {
      throw new Error('Contêineres de login ou aplicativo não encontrados.');
    }
    
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    
    document.getElementById('userId').value = '';
    
    navigateTo('dashboard');
    await checarAlertasEstoque();
  } catch (error) {
    console.error('Erro durante o login:', error);
    alert('Erro ao realizar login. Verifique o console para detalhes ou contate o suporte.');
  }
}

async function checarAlertasEstoque() {
  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const configuracoes = await getItem(CONFIGURACOES_DB) || {};
  const limiteEstoqueBaixo = configuracoes.limiteEstoqueBaixo || 10;
  const baixos = medicamentos.filter(m => m.quantidade <= limiteEstoqueBaixo);
  
  if (baixos.length > 0) {
    alert(`Alertas: ${baixos.map(m => m.nome).join(', ')} com estoque baixo (≤${limiteEstoqueBaixo})!`);
  }
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

async function atualizarDashboard() {
  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
  const configuracoes = await getItem(CONFIGURACOES_DB) || {};
  
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
  
  const medicamentoMaisUtilizado = encontrarMedicamentoMaisUtilizado(movimentacoes, medicamentos);
  
  document.getElementById('totalMedicamentos').textContent = totalMedicamentos;
  document.getElementById('totalValor').textContent = `R$ ${totalValor.toFixed(2)}`;
  document.getElementById('proximosVencimentos').textContent = proximosVencimentos;
  document.getElementById('totalGastoMes').textContent = `R$ ${totalGastoMes.toFixed(2)}`;
  document.getElementById('medicamentoMaisUtilizado').textContent = medicamentoMaisUtilizado;
  
  atualizarTabelaMovimentacoes(movimentacoes, medicamentos);
}

function encontrarMedicamentoMaisUtilizado(movimentacoes, medicamentos) {
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

function atualizarTabelaMovimentacoes(movimentacoes, medicamentos) {
  const usuarios = await getItem(USUARIOS_DB) || [];
  
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
      <td>${mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'devolucao' ? 'Devolução' : 'Saída'}</td>
    `;
    
    tbody.appendChild(tr);
  });
}

function formatarData(dataString) {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

async function cadastrarMedicamento() {
  const codigo = document.getElementById('codigoBarras').value.trim();
  const nome = document.getElementById('nomeMedicamento').value.trim();
  const fabricante = document.getElementById('fabricante').value.trim();
  const lote = document.getElementById('lote').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const valorTotal = parseFloat(document.getElementById('valorTotal').value);
  const validade = document.getElementById('validade').value;
  const observacoes = document.getElementById('observacoes').value.trim();
  
  if (!codigo || !nome || !fabricante || !lote || !quantidade || !valorTotal || !validade) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  
  const valorUnitario = valorTotal / quantidade;
  
  let medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  
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
  await setItem(MEDICAMENTOS_DB, medicamentos);
  
  await registrarMovimentacao(novoMedicamento.id, 'entrada', quantidade, valorUnitario, 'Cadastro inicial');
  
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
  
  await atualizarDashboard();
}

async function buscarMedicamentoPorCodigo(codigo) {
  if (codigo.length < 10) return;
  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
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

async function processarMovimentacao() {
  const codigo = document.getElementById('retirarCodigo').value.trim();
  const quantidade = parseInt(document.getElementById('quantidadeRetirada').value);
  const tipo = document.getElementById('tipoMovimentacao').value;
  const motivo = document.getElementById('motivoRetirada').value;
  
  if (!codigo || !quantidade || quantidade < 1) {
    alert('Por favor, preencha todos os campos corretamente.');
    return;
  }
  
  let medicamentos = await getItem(MEDICAMENTOS_DB) || [];
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
  await setItem(MEDICAMENTOS_DB, medicamentos);
  
  await registrarMovimentacao(
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
  
  await atualizarDashboard();
}

async function registrarMovimentacao(medicamentoId, tipo, quantidade, valorUnitario, motivo) {
  let movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
  
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
  await setItem(MOVIMENTACOES_DB, movimentacoes);
}

function enviarEmailAlerta(medicamento) {
  const configuracoes = await getItem(CONFIGURACOES_DB) || {};
  const email = configuracoes.emailNotificacao;

  if (!email) {
    alert('Configure o email de notificação nas configurações.');
    return;
  }

  const templateParams = {
    medicamento_nome: medicamento.nome,
    quantidade: medicamento.quantidade,
    email_to: email
  };

  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams)
    .then(function(response) {
      alert('Email enviado com sucesso!');
    }, function(error) {
      console.error('Erro ao enviar email:', error);
      alert('Erro ao enviar email. Verifique a configuração.');
    });
}

function confirmarEnvioEmail() {
  if (medicamentoAlerta) {
    enviarEmailAlerta(medicamentoAlerta);
    medicamentoAlerta = null;
  }
  closeAlert();
}

function closeAlert() {
  document.getElementById('alertModal').style.display = 'none';
}

async function filtrarMedicamentos() {
  const termo = document.getElementById('pesquisaTermo').value.toLowerCase().trim();
  const status = document.getElementById('filtroStatus').value;
  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const configuracoes = await getItem(CONFIGURACOES_DB) || {};
  
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

async function detalhesMedicamento(id) {
  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const medicamento = medicamentos.find(m => m.id === id);
  
  if (medicamento) {
    alert(`Detalhes do Medicamento:\n\nNome: ${medicamento.nome}\nCódigo: ${medicamento.codigo}\nFabricante: ${medicamento.fabricante}\nLote: ${medicamento.lote}\nQuantidade: ${medicamento.quantidade}\nValor Unitário: R$ ${medicamento.valorUnitario.toFixed(2)}\nValidade: ${formatarData(medicamento.dataValidade)}\nObservações: ${medicamento.observacoes || 'Nenhuma'}`);
  }
}

async function excluirMedicamento(id) {
  if (!confirm('Tem certeza que deseja excluir este medicamento?')) return;
  
  let medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const medicamentosAtualizados = medicamentos.filter(m => m.id !== id);
  
  await setItem(MEDICAMENTOS_DB, medicamentosAtualizados);
  
  alert('Medicamento excluído com sucesso!');
  await filtrarMedicamentos();
  await atualizarDashboard();
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

async function gerarRelatorio() {
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

  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
  const configuracoes = await getItem(CONFIGURACOES_DB) || {};

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
        return `<tr><td>${formatarData(mov.data)}</td><td>${med ? med.nome : 'Desconhecido'}</td><td>${mov.quantidade}</td><td>${mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'devolucao' ? 'Devolução' : 'Saída'}</td><td>${mov.motivo}</td></tr>`;
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
        }
        return `<tr><td>${med.nome}</td><td>${med.quantidade}</td><td><span class="badge ${statusClass}">${status}</span></td></tr>`;
      }).join('');
      resumo.innerHTML = `Total em estoque: ${medicamentos.reduce((sum, m) => sum + m.quantidade, 0)}`;
      break;
    case 'vencimentos':
      thead = '<tr><th>Nome</th><th>Validade</th><th>Dias Restantes</th></tr>';
      const vencendo = medicamentos.filter(med => {
        const dataValidade = new Date(med.dataValidade);
        return dataValidade <= new Date(hoje.getTime() + (configuracoes.diasAlertaVencimento || 30) * 24 * 60 * 60 * 1000);
      });
      tbody = vencendo.map(med => {
        const dias = Math.floor((new Date(med.dataValidade) - hoje) / (24 * 60 * 60 * 1000));
        return `<tr><td>${med.nome}</td><td>${formatarData(med.dataValidade)}</td><td>${dias}</td></tr>`;
      }).join('');
      resumo.innerHTML = `Próximos vencimentos: ${vencendo.length}`;
      break;
    case 'valor':
      thead = '<tr><th>Nome</th><th>Valor Total</th></tr>';
      tbody = medicamentos.map(med => `<tr><td>${med.nome}</td><td>R$ ${(med.quantidade * med.valorUnitario).toFixed(2)}</td></tr>`).join('');
      resumo.innerHTML = `Valor total: R$ ${medicamentos.reduce((sum, m) => sum + (m.quantidade * m.valorUnitario), 0).toFixed(2)}`;
      break;
  }

  tabela.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;

  if (relatorioChart) relatorioChart.destroy();
  const ctx = document.getElementById('relatorioChart').getContext('2d');
  relatorioChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: medicamentos.map(m => m.nome),
      datasets: [{
        label: tipo === 'valor' ? 'Valor em Estoque (R$)' : 'Quantidade',
        data: tipo === 'valor' ? medicamentos.map(m => m.quantidade * m.valorUnitario) : medicamentos.map(m => m.quantidade),
        backgroundColor: 'rgba(26, 79, 114, 0.5)',
        borderColor: 'rgba(26, 79, 114, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function exportarRelatorio() {
  const rows = Array.from(document.getElementById('tabelaRelatorio').querySelectorAll('tr'));
  const csv = rows.map(row => Array.from(row.querySelectorAll('th, td')).map(cell => `"${cell.textContent.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function limparDadosAntigos() {
  if (!confirm('Confirma a exclusão de movimentações com mais de 1 ano?')) return;
  const umAnoAtras = new Date();
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  let movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
  movimentacoes = movimentacoes.filter(mov => new Date(mov.data) > umAnoAtras);
  await setItem(MOVIMENTACOES_DB, movimentacoes);
  alert('Dados antigos limpos com sucesso!');
  await atualizarDashboard();
}

async function recalcularEstoque() {
  let medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
  medicamentos.forEach(med => {
    const movs = movimentacoes.filter(m => m.medicamentoId === med.id);
    med.quantidade = movs.reduce((qty, mov) => qty + (mov.tipo === 'entrada' || mov.tipo === 'devolucao' ? mov.quantidade : -mov.quantidade), 0);
  });
  await setItem(MEDICAMENTOS_DB, medicamentos);
  alert('Estoque recalculado com sucesso!');
  await atualizarDashboard();
}

async function carregarUsuarios() {
  const usuarios = await getItem(USUARIOS_DB) || [];
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
        <button class="action-btn btn-danger" onclick="excluirUsuario(${usuario.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function cadastrarUsuario() {
  const id = parseInt(document.getElementById('novoUsuarioId').value);
  const nome = document.getElementById('novoUsuarioNome').value.trim();
  const tipo = document.getElementById('novoUsuarioTipo').value;
  
  if (!id || !nome || isNaN(id) || id < 1) {
    alert('Por favor, preencha ID e nome do usuário corretamente.');
    return;
  }
  
  let usuarios = await getItem(USUARIOS_DB) || [];
  
  if (usuarios.some(u => u.id === id)) {
    alert('Já existe um usuário com este ID.');
    return;
  }
  
  usuarios.push({
    id,
    nome,
    tipo,
    dataCriacao: new Date().toISOString()
  });
  
  await setItem(USUARIOS_DB, usuarios);
  
  document.getElementById('novoUsuarioId').value = '';
  document.getElementById('novoUsuarioNome').value = '';
  document.getElementById('novoUsuarioTipo').value = 'comum';
  
  alert('Usuário cadastrado com sucesso!');
  await carregarUsuarios();
}

async function excluirUsuario(id) {
  if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
  
  let usuarios = await getItem(USUARIOS_DB) || [];
  const usuariosAtualizados = usuarios.filter(u => u.id !== id);
  
  await setItem(USUARIOS_DB, usuariosAtualizados);
  
  alert('Usuário excluído com sucesso!');
  await carregarUsuarios();
}

async function fazerBackup() {
  const data = {
    medicamentos: await getItem(MEDICAMENTOS_DB) || [],
    usuarios: await getItem(USUARIOS_DB) || [],
    movimentacoes: await getItem(MOVIMENTACOES_DB) || [],
    configuracoes: await getItem(CONFIGURACOES_DB) || {}
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  alert('Backup realizado com sucesso!');
}

async function restaurarBackup() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.medicamentos) await setItem(MEDICAMENTOS_DB, data.medicamentos);
        if (data.usuarios) await setItem(USUARIOS_DB, data.usuarios);
        if (data.movimentacoes) await setItem(MOVIMENTACOES_DB, data.movimentacoes);
        if (data.configuracoes) await setItem(CONFIGURACOES_DB, data.configuracoes);
        
        alert('Backup restaurado com sucesso!');
        await atualizarDashboard();
        await carregarUsuarios();
        await carregarConfiguracoes();
      } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        alert('Erro ao restaurar backup. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
}

window.onload = async function() {
  await inicializarBancosDeDados();
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('appContainer').style.display = 'none';
  document.getElementById('userId').focus();
  
  document.querySelectorAll('.menu li').forEach(item => {
    if (item.dataset.module && item.dataset.module !== 'sair') {
      item.addEventListener('click', () => navigateTo(item.dataset.module));
    }
  });
  
  toggleMotivoField();
  mudarTipoRelatorio();
};
