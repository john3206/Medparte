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
      { id: 189, nome: "Administrador Master", tipo: "admin", dataCriacao: new Date().toISOString(), foto: null },
      { id: 1, nome: "Enfermeira Maria", tipo: "comum", dataCriacao: new Date().toISOString(), foto: null },
      { id: 2, nome: "Farmacêutico João", tipo: "comum", dataCriacao: new Date().toISOString(), foto: null }
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

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

async function navigateTo(moduleId) {
  showLoading();
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
      await atualizarDashboard();
      break;
    case 'pesquisar':
      await filtrarMedicamentos();
      break;
    case 'relatorios':
      mudarTipoRelatorio();
      break;
    case 'usuarios':
      await carregarUsuarios();
      break;
  }
  hideLoading();
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

function scanearCodigo(video) {
  if (!scannerAtivo) return;

  const html5QrCode = new Html5Qrcode("scannerVideo");

  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39 ]
    },
    (decodedText, decodedResult) => {
      document.getElementById(scannerCampoAlvo).value = decodedText;
      fecharScanner();
      if (scannerCampoAlvo === 'retirarCodigo') {
        buscarMedicamentoPorCodigo(decodedText);
      } else if (scannerCampoAlvo === 'codigoBarras') {
        buscarMedicamentoPorCodigoParaPreencher(decodedText);
      }
      document.getElementById('cameraHelp').style.display = 'none';
      document.getElementById('cameraHelpRetirar').style.display = 'none';
    },
    (errorMessage) => {
      // ignore or log
    }
  ).catch((err) => {
    console.error('Erro ao iniciar scanner:', err);
    document.getElementById('scannerInstructions').style.display = 'none';
    document.getElementById('scannerError').style.display = 'block';
  });
}

async function buscarMedicamentoPorCodigoParaPreencher(codigo) {
  const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
  const medicamento = medicamentos.find(med => med.codigo === codigo);
  
  if (medicamento) {
    document.getElementById('nomeMedicamento').value = medicamento.nome;
    document.getElementById('fabricante').value = medicamento.fabricante;
    document.getElementById('lote').value = medicamento.lote;
    document.getElementById('quantidade').value = medicamento.quantidade;
    document.getElementById('valorTotal').value = (medicamento.quantidade * medicamento.valorUnitario).toFixed(2);
    document.getElementById('validade').value = medicamento.dataValidade;
    document.getElementById('observacoes').value = medicamento.observacoes || '';
    calcularValorUnitario();
  }
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
    await mostrarFotoUsuario(usuario);
  } catch (error) {
    console.error('Erro durante o login:', error);
    alert('Erro ao realizar login. Verifique o console para detalhes ou contate o suporte.');
  }
}

async function mostrarFotoUsuario(usuario) {
  const avatar = document.querySelector('.user-info .avatar');
  avatar.innerHTML = '';
  if (usuario.foto) {
    const img = document.createElement('img');
    img.src = usuario.foto;
    img.style.width = '50px';
    img.style.height = '50px';
    img.style.borderRadius = '50%';
    avatar.appendChild(img);
  } else {
    avatar.innerHTML = '<i class="fas fa-user-circle fa-3x"></i>';
  }
  avatar.insertAdjacentHTML('afterend', '<input type="file" id="userPhoto" accept="image/*" onchange="uploadFotoUsuario()" style="display:none;"><button onclick="document.getElementById(\'userPhoto\').click()">Adicionar Foto</button>');
}

async function uploadFotoUsuario() {
  const file = document.getElementById('userPhoto').files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    let usuarios = await getItem(USUARIOS_DB) || [];
    const usuarioIndex = usuarios.findIndex(u => u.id === usuarioLogado.id);
    if (usuarioIndex !== -1) {
      usuarios[usuarioIndex].foto = e.target.result;
      await setItem(USUARIOS_DB, usuarios);
      usuarioLogado.foto = e.target.result;
      await mostrarFotoUsuario(usuarioLogado);
      alert('Foto adicionada com sucesso!');
    }
  };
  reader.readAsDataURL(file);
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
  atualizarTop5Medicamentos(movimentacoes, medicamentos);
  atualizarPorcentagemArmazenamento();
}

async function atualizarPorcentagemArmazenamento() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
    const storageInfo = document.createElement('p');
    storageInfo.textContent = `Armazenamento usado: ${percentage}%`;
    const dashboard = document.getElementById('dashboard');
    dashboard.appendChild(storageInfo);
  } else {
    console.warn('navigator.storage.estimate not supported');
  }
}

function atualizarTop5Medicamentos(movimentacoes, medicamentos) {
  const contagem = {};
  movimentacoes
    .filter(mov => mov.tipo === 'saida')
    .forEach(mov => {
      if (!contagem[mov.medicamentoId]) {
        contagem[mov.medicamentoId] = 0;
      }
      contagem[mov.medicamentoId] += mov.quantidade;
    });
  
  const sortedIds = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a]).slice(0, 5);
  
  const top5Table = document.createElement('table');
  top5Table.innerHTML = `<thead><tr><th>Medicamento</th><th>Quantidade Usada</th></tr></thead><tbody></tbody>`;
  const tbody = top5Table.querySelector('tbody');
  sortedIds.forEach(id => {
    const med = medicamentos.find(m => m.id == id);
    if (med) {
      tbody.innerHTML += `<tr><td>${med.nome}</td><td>${contagem[id]}</td></tr>`;
    }
  });
  
  const dashboard = document.getElementById('dashboard');
  const h2 = document.createElement('h2');
  h2.textContent = '5 Medicamentos Mais Usados';
  dashboard.appendChild(h2);
  dashboard.appendChild(top5Table);
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
  
  // Adicionar botão voltar no header
  const header = document.querySelector('.header');
  const backBtn = document.createElement('button');
  backBtn.textContent = 'Voltar';
  backBtn.onclick = navigateBack;
  header.insertBefore(backBtn, header.firstChild);
};
