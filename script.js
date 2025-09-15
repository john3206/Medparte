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
  if (!window.indexedDB) {
    alert('Seu navegador não suporta IndexedDB. Por favor, use um navegador moderno (Chrome, Firefox, Edge, Safari).');
    throw new Error('IndexedDB não suportado');
  }
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
    request.onerror = (event) => {
      console.error('Erro ao abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

async function getItem(key) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction('storage', 'readonly');
    const store = transaction.objectStore('storage');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = () => {
      console.error(`Erro ao obter ${key} do IndexedDB:`, request.error);
      reject(request.error);
    };
  });
}

async function setItem(key, value) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction('storage', 'readwrite');
    const store = transaction.objectStore('storage');
    const request = store.put({ key, data: value });
    request.onsuccess = resolve;
    request.onerror = () => {
      console.error(`Erro ao salvar ${key} no IndexedDB:`, request.error);
      reject(request.error);
    };
  });
}

async function inicializarBancosDeDados() {
  try {
    let usuarios = await getItem(USUARIOS_DB);
    if (!usuarios || usuarios.length === 0) {
      console.log('Inicializando banco de usuários padrão');
      usuarios = [
        { id: 189, nome: "Administrador Master", tipo: "admin", dataCriacao: new Date().toISOString(), foto: null },
        { id: 1, nome: "Enfermeira Maria", tipo: "comum", dataCriacao: new Date().toISOString(), foto: null },
        { id: 2, nome: "Farmacêutico João", tipo: "comum", dataCriacao: new Date().toISOString(), foto: null }
      ];
      await setItem(USUARIOS_DB, usuarios);
    }
    
    let medicamentos = await getItem(MEDICAMENTOS_DB);
    if (!medicamentos || medicamentos.length === 0) {
      console.log('Inicializando banco de medicamentos padrão');
      medicamentos = [
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
      await setItem(MEDICAMENTOS_DB, medicamentos);
    }

    let movimentacoes = await getItem(MOVIMENTACOES_DB);
    if (!movimentacoes || movimentacoes.length === 0) {
      console.log('Inicializando banco de movimentações padrão');
      movimentacoes = [
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
      await setItem(MOVIMENTACOES_DB, movimentacoes);
    }
    
    let configuracoes = await getItem(CONFIGURACOES_DB);
    if (!configuracoes) {
      console.log('Inicializando configurações padrão');
      configuracoes = {
        emailNotificacao: "jlenon.32@outlook.com",
        diasAlertaVencimento: 30,
        limiteEstoqueBaixo: 10,
        backupAuto: "semanal",
        temaInterface: "claro"
      };
      await setItem(CONFIGURACOES_DB, configuracoes);
    }
    
    await carregarConfiguracoes();
  } catch (error) {
    console.error('Erro ao inicializar bancos de dados:', error);
    alert('Erro ao inicializar o sistema. Verifique o console ou contate o suporte.');
  }
}

async function carregarConfiguracoes() {
  try {
    const configuracoes = await getItem(CONFIGURACOES_DB);
    if (configuracoes) {
      document.getElementById('emailNotificacao').value = configuracoes.emailNotificacao || '';
      document.getElementById('diasAlertaVencimento').value = configuracoes.diasAlertaVencimento || 30;
      document.getElementById('limiteEstoqueBaixo').value = configuracoes.limiteEstoqueBaixo || 10;
      document.getElementById('backupAuto').value = configuracoes.backupAuto || 'semanal';
      document.getElementById('temaInterface').value = configuracoes.temaInterface || 'claro';
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    alert('Erro ao carregar configurações. Verifique o console.');
  }
}

async function salvarConfiguracoes() {
  try {
    const configuracoes = {
      emailNotificacao: document.getElementById('emailNotificacao').value,
      diasAlertaVencimento: parseInt(document.getElementById('diasAlertaVencimento').value) || 30,
      limiteEstoqueBaixo: parseInt(document.getElementById('limiteEstoqueBaixo').value) || 10,
      backupAuto: document.getElementById('backupAuto').value,
      temaInterface: document.getElementById('temaInterface').value
    };
    
    await setItem(CONFIGURACOES_DB, configuracoes);
    alert('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações. Verifique o console.');
  }
}

function showLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    console.log('Mostrando loading overlay');
    loadingOverlay.style.display = 'flex';
  } else {
    console.error('Elemento loadingOverlay não encontrado no DOM');
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    console.log('Ocultando loading overlay');
    loadingOverlay.style.display = 'none';
  } else {
    console.error('Elemento loadingOverlay não encontrado no DOM');
  }
}

async function login() {
  showLoading();
  const userIdInput = document.getElementById('userId')?.value.trim();
  const userId = parseInt(userIdInput);
  
  if (!userIdInput || isNaN(userId) || userId < 1) {
    hideLoading();
    alert('Por favor, digite um ID de usuário válido (número maior que 0).');
    console.warn('ID inválido:', userIdInput);
    return;
  }
  
  try {
    const usuarios = await getItem(USUARIOS_DB) || [];
    console.log('Usuários carregados:', usuarios);
    
    if (usuarios.length === 0) {
      console.error('Banco de usuários vazio. Inicializando novamente.');
      await inicializarBancosDeDados();
      hideLoading();
      alert('Erro: Banco de usuários estava vazio. Inicializado com usuários padrão. Tente novamente.');
      return;
    }
    
    const usuario = usuarios.find(u => u.id === userId);
    
    if (!usuario) {
      hideLoading();
      alert('Usuário não encontrado. Tente IDs padrão (ex: 189 para admin) ou contate o administrador.');
      console.log('Usuários disponíveis:', usuarios);
      return;
    }
    
    usuarioLogado = usuario;
    
    const userNameElement = document.getElementById('userName');
    const userIdDisplayElement = document.getElementById('userIdDisplay');
    const userTypeBadgeElement = document.getElementById('userTypeBadge');
    
    if (!userNameElement || !userIdDisplayElement || !userTypeBadgeElement) {
      throw new Error('Elementos da interface (userName, userIdDisplay, userTypeBadge) não encontrados.');
    }
    
    userNameElement.textContent = usuario.nome;
    userIdDisplayElement.textContent = usuario.id;
    
    // Configurar permissões
    const menuCadastrar = document.getElementById('menuCadastrar');
    const menuRelatorios = document.getElementById('menuRelatorios');
    const menuUsuarios = document.getElementById('menuUsuarios');
    const menuConfiguracoes = document.getElementById('menuConfiguracoes');
    
    if (!menuCadastrar || !menuRelatorios || !menuUsuarios || !menuConfiguracoes) {
      throw new Error('Elementos do menu não encontrados.');
    }
    
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
    
    await mostrarFotoUsuario(usuario);
    await navigateTo('dashboard');
    await checarAlertasEstoque();
  } catch (error) {
    console.error('Erro durante o login:', error);
    alert('Erro ao realizar login. Verifique o console para detalhes ou contate o suporte.');
  } finally {
    hideLoading(); // Garante que o loading seja oculto mesmo em caso de erro
  }
}

async function checarAlertasEstoque() {
  try {
    const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
    const configuracoes = await getItem(CONFIGURACOES_DB) || {};
    const limiteEstoqueBaixo = configuracoes.limiteEstoqueBaixo || 10;
    const baixos = medicamentos.filter(m => m.quantidade <= limiteEstoqueBaixo);
    
    if (baixos.length > 0) {
      alert(`Alertas: ${baixos.map(m => m.nome).join(', ')} com estoque baixo (≤${limiteEstoqueBaixo})!`);
    }
  } catch (error) {
    console.error('Erro ao checar alertas de estoque:', error);
  }
}

async function mostrarFotoUsuario(usuario) {
  try {
    const avatar = document.querySelector('.user-info .avatar');
    if (!avatar) throw new Error('Elemento avatar não encontrado');
    
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
  } catch (error) {
    console.error('Erro ao mostrar foto do usuário:', error);
  }
}

async function uploadFotoUsuario() {
  try {
    const file = document.getElementById('userPhoto')?.files[0];
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
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    alert('Erro ao adicionar foto. Verifique o console.');
  }
}

async function atualizarPorcentagemArmazenamento() {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const percentage = ((estimate.usage / estimate.quota) * 100).toFixed(2);
      const storageInfo = document.getElementById('storageInfo') || document.createElement('p');
      storageInfo.id = 'storageInfo';
      storageInfo.textContent = `Armazenamento usado: ${percentage}%`;
      const dashboard = document.getElementById('dashboard');
      if (!document.getElementById('storageInfo')) {
        dashboard.appendChild(storageInfo);
      }
    } else {
      console.warn('navigator.storage.estimate não suportado neste navegador');
    }
  } catch (error) {
    console.error('Erro ao calcular armazenamento:', error);
  }
}

async function navigateTo(moduleId) {
  showLoading();
  try {
    console.log(`Navegando para módulo: ${moduleId}`);
    document.querySelectorAll('.module').forEach(module => {
      module.classList.remove('active');
    });
    
    document.querySelectorAll('.menu li').forEach(item => {
      item.classList.remove('active');
    });

    const moduleElement = document.getElementById(moduleId);
    const menuItem = document.querySelector(`.menu li[data-module="${moduleId}"]`);
    
    if (!moduleElement || !menuItem) {
      throw new Error(`Módulo ${moduleId} ou item de menu não encontrado`);
    }
    
    moduleElement.classList.add('active');
    menuItem.classList.add('active');
    
    document.getElementById('moduleTitle').textContent = menuItem.textContent;
    
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
  } catch (error) {
    console.error(`Erro ao navegar para ${moduleId}:`, error);
    alert('Erro ao carregar módulo. Verifique o console.');
  } finally {
    hideLoading(); // Garante que o loading seja oculto mesmo em caso de erro
  }
}

function navigateBack() {
  if (currentNavigationIndex > 0) {
    currentNavigationIndex--;
    navigateTo(navigationHistory[currentNavigationIndex]);
  }
}

function iniciarScanner(campoId) {
  scannerCampoAlvo = campoId;
  const scannerContainer = document.getElementById('scannerContainer');
  const video = document.getElementById('scannerVideo');
  const instructions = document.getElementById('scannerInstructions');
  const errorDiv = document.getElementById('scannerError');
  
  if (!scannerContainer || !video || !instructions || !errorDiv) {
    console.error('Elementos do scanner não encontrados');
    alert('Erro: Elementos do scanner não encontrados.');
    return;
  }
  
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
    alert('Seu navegador não suporta acesso à câmera. Tente um navegador moderno.');
    instructions.style.display = 'none';
    errorDiv.style.display = 'block';
    scannerAtivo = false;
  }
}

function fecharScanner() {
  const scannerContainer = document.getElementById('scannerContainer');
  const video = document.getElementById('scannerVideo');
  
  if (scannerContainer && video) {
    scannerContainer.style.display = 'none';
    scannerAtivo = false;
    
    if (scannerStream) {
      scannerStream.getTracks().forEach(track => track.stop());
      scannerStream = null;
    }
    
    video.srcObject = null;
  }
}

function scanearCodigo(video) {
  if (!scannerAtivo) return;

  const codeReader = new ZXing.BrowserMultiFormatReader();
  codeReader.decodeFromVideoElement(video, (result, err) => {
    if (result) {
      const code = result.text;
      document.getElementById(scannerCampoAlvo).value = code;
      fecharScanner();
      if (scannerCampoAlvo === 'retirarCodigo') {
        buscarMedicamentoPorCodigo(code);
      } else if (scannerCampoAlvo === 'codigoBarras') {
        buscarMedicamentoPorCodigoParaPreencher(code);
      }
      document.getElementById('cameraHelp').style.display = 'none';
      document.getElementById('cameraHelpRetirar').style.display = 'none';
      codeReader.reset();
    }
    if (err && !(err instanceof ZXing.NotFoundException)) {
      console.error('Erro ao scanear código:', err);
      document.getElementById('scannerInstructions').style.display = 'none';
      document.getElementById('scannerError').style.display = 'block';
    }
  });
}

async function buscarMedicamentoPorCodigo(codigo) {
  if (codigo.length < 10) return;
  try {
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
  } catch (error) {
    console.error('Erro ao buscar medicamento:', error);
    alert('Erro ao buscar medicamento. Verifique o console.');
  }
}

async function buscarMedicamentoPorCodigoParaPreencher(codigo) {
  try {
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
  } catch (error) {
    console.error('Erro ao preencher dados do medicamento:', error);
    alert('Erro ao preencher dados do medicamento. Verifique o console.');
  }
}

function logout() {
  const exitModal = document.getElementById('exitModal');
  if (exitModal) {
    exitModal.style.display = 'flex';
  }
}

function confirmExit() {
  usuarioLogado = null;
  const appContainer = document.getElementById('appContainer');
  const loginContainer = document.getElementById('loginContainer');
  if (appContainer && loginContainer) {
    appContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
    document.getElementById('userId').value = '';
    document.getElementById('userId').focus();
    closeExitModal();
  }
}

function closeExitModal() {
  const exitModal = document.getElementById('exitModal');
  if (exitModal) {
    exitModal.style.display = 'none';
  }
}

function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (!sidebar.classList.contains('active')) {
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 300);
    }
  }
}

async function atualizarDashboard() {
  try {
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
    
    const medicamentoMaisUtilizado = await encontrarMedicamentoMaisUtilizado(movimentacoes, medicamentos);
    
    document.getElementById('totalMedicamentos').textContent = totalMedicamentos;
    document.getElementById('totalValor').textContent = `R$ ${totalValor.toFixed(2)}`;
    document.getElementById('proximosVencimentos').textContent = proximosVencimentos;
    document.getElementById('totalGastoMes').textContent = `R$ ${totalGastoMes.toFixed(2)}`;
    document.getElementById('medicamentoMaisUtilizado').textContent = medicamentoMaisUtilizado;
    
    await atualizarTabelaMovimentacoes(movimentacoes, medicamentos);
    await atualizarTop5Medicamentos(movimentacoes, medicamentos);
    await atualizarPorcentagemArmazenamento();
  } catch (error) {
    console.error('Erro ao atualizar dashboard:', error);
    alert('Erro ao carregar dashboard. Verifique o console.');
  }
}

async function encontrarMedicamentoMaisUtilizado(movimentacoes, medicamentos) {
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

async function atualizarTabelaMovimentacoes(movimentacoes, medicamentos) {
  try {
    const usuarios = await getItem(USUARIOS_DB) || [];
    
    movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    const tbody = document.getElementById('movimentacoesTable')?.querySelector('tbody');
    if (!tbody) throw new Error('Tabela de movimentações não encontrada');
    
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
  } catch (error) {
    console.error('Erro ao atualizar tabela de movimentações:', error);
  }
}

async function atualizarTop5Medicamentos(movimentacoes, medicamentos) {
  try {
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
    
    const top5Table = document.getElementById('top5Medicamentos') || document.createElement('table');
    top5Table.id = 'top5Medicamentos';
    top5Table.innerHTML = `<thead><tr><th>Medicamento</th><th>Quantidade Usada</th></tr></thead><tbody></tbody>`;
    const tbody = top5Table.querySelector('tbody');
    tbody.innerHTML = '';
    
    sortedIds.forEach(id => {
      const med = medicamentos.find(m => m.id == id);
      if (med) {
        tbody.innerHTML += `<tr><td>${med.nome}</td><td>${contagem[id]}</td></tr>`;
      }
    });
    
    const dashboard = document.getElementById('dashboard');
    if (!document.getElementById('top5Medicamentos')) {
      const h2 = document.createElement('h2');
      h2.textContent = '5 Medicamentos Mais Usados';
      dashboard.appendChild(h2);
      dashboard.appendChild(top5Table);
    }
  } catch (error) {
    console.error('Erro ao atualizar top 5 medicamentos:', error);
  }
}

function formatarData(dataString) {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcularValorUnitario() {
  const quantidade = parseFloat(document.getElementById('quantidade')?.value) || 0;
  const valorTotal = parseFloat(document.getElementById('valorTotal')?.value) || 0;
  
  if (quantidade > 0 && valorTotal > 0) {
    const valorUnitario = valorTotal / quantidade;
    document.getElementById('valorUnitarioInfo').textContent = `Valor unitário: R$ ${valorUnitario.toFixed(2)}`;
  } else {
    document.getElementById('valorUnitarioInfo').textContent = 'Valor unitário: R$ 0,00';
  }
}

async function cadastrarMedicamento() {
  try {
    const codigo = document.getElementById('codigoBarras')?.value.trim();
    const nome = document.getElementById('nomeMedicamento')?.value.trim();
    const fabricante = document.getElementById('fabricante')?.value.trim();
    const lote = document.getElementById('lote')?.value.trim();
    const quantidade = parseInt(document.getElementById('quantidade')?.value);
    const valorTotal = parseFloat(document.getElementById('valorTotal')?.value);
    const validade = document.getElementById('validade')?.value;
    const observacoes = document.getElementById('observacoes')?.value.trim();
    
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
  } catch (error) {
    console.error('Erro ao cadastrar medicamento:', error);
    alert('Erro ao cadastrar medicamento. Verifique o console.');
  }
}

function calcularValorTotalRetirada() {
  const quantidade = parseInt(document.getElementById('quantidadeRetirada')?.value) || 0;
  const valorUnitario = parseFloat(document.getElementById('valorUnitarioRetirada')?.value) || 0;
  const valorTotal = quantidade * valorUnitario;
  
  document.getElementById('valorTotalRetiradaInfo').textContent = `Valor total: R$ ${valorTotal.toFixed(2)}`;
}

function toggleMotivoField() {
  const tipoMovimentacao = document.getElementById('tipoMovimentacao')?.value;
  const motivoField = document.getElementById('motivoField');
  
  if (tipoMovimentacao && motivoField) {
    if (tipoMovimentacao === 'devolucao') {
      motivoField.style.display = 'none';
    } else {
      motivoField.style.display = 'block';
    }
  }
}

async function processarMovimentacao() {
  try {
    const codigo = document.getElementById('retirarCodigo')?.value.trim();
    const quantidade = parseInt(document.getElementById('quantidadeRetirada')?.value);
    const tipo = document.getElementById('tipoMovimentacao')?.value;
    const motivo = document.getElementById('motivoRetirada')?.value;
    
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
      await enviarEmailAlerta(medicamento);
    }
    
    document.getElementById('retirarCodigo').value = '';
    document.getElementById('medicamentoRetirada').value = '';
    document.getElementById('loteRetirada').value = '';
    document.getElementById('valorUnitarioRetirada').value = '';
    document.getElementById('quantidadeRetirada').value = '';
    document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
    
    alert(`Movimentação registrada com sucesso!`);
    
    await atualizarDashboard();
  } catch (error) {
    console.error('Erro ao processar movimentação:', error);
    alert('Erro ao processar movimentação. Verifique o console.');
  }
}

async function registrarMovimentacao(medicamentoId, tipo, quantidade, valorUnitario, motivo) {
  try {
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
  } catch (error) {
    console.error('Erro ao registrar movimentação:', error);
    throw error;
  }
}

async function enviarEmailAlerta(medicamento) {
  try {
    const configuracoes = await getItem(CONFIGURACOES_DB) || {};
    const email = configuracoes.emailNotificacao || 'jlenon.32@outlook.com';

    const templateParams = {
      medicamento_nome: medicamento.nome,
      quantidade: medicamento.quantidade,
      email_to: email
    };

    await emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams);
    console.log('Email de alerta enviado para:', email);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    alert('Erro ao enviar email de alerta. Verifique a configuração do EmailJS.');
  }
}

function closeAlert() {
  const alertModal = document.getElementById('alertModal');
  if (alertModal) {
    alertModal.style.display = 'none';
  }
}

async function filtrarMedicamentos() {
  try {
    const termo = document.getElementById('pesquisaTermo')?.value.toLowerCase().trim();
    const status = document.getElementById('filtroStatus')?.value;
    const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
    const configuracoes = await getItem(CONFIGURACOES_DB) || {};
    
    const hoje = new Date();
    const tbody = document.getElementById('tabelaPesquisa')?.querySelector('tbody');
    if (!tbody) throw new Error('Tabela de pesquisa não encontrada');
    
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
          <td><button onclick="iniciarRetirada('${med.codigo}')">Retirar</button></td>
        `;
        
        tbody.appendChild(tr);
      }
    });
  } catch (error) {
    console.error('Erro ao filtrar medicamentos:', error);
    alert('Erro ao filtrar medicamentos. Verifique o console.');
  }
}

function iniciarRetirada(codigo) {
  document.getElementById('retirarCodigo').value = codigo;
  buscarMedicamentoPorCodigo(codigo);
  navigateTo('retirar');
}

function mudarTipoRelatorio() {
  const tipo = document.getElementById('tipoRelatorio')?.value;
  const periodo = document.getElementById('periodoRelatorio')?.value;
  const periodoPersonalizado = document.getElementById('periodoPersonalizado');
  
  if (periodoPersonalizado) {
    periodoPersonalizado.style.display = periodo === 'personalizado' ? 'block' : 'none';
  }
}

async function gerarRelatorio() {
  try {
    const tipo = document.getElementById('tipoRelatorio')?.value;
    const periodo = document.getElementById('periodoRelatorio')?.value;
    const dataInicio = document.getElementById('dataInicio')?.value;
    const dataFim = document.getElementById('dataFim')?.value;
    const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
    const movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
    const usuarios = await getItem(USUARIOS_DB) || [];

    let dadosFiltrados = movimentacoes;
    const hoje = new Date();

    if (periodo !== 'personalizado') {
      const dias = parseInt(periodo);
      const dataLimite = new Date(hoje);
      dataLimite.setDate(hoje.getDate() - dias);
      dadosFiltrados = dadosFiltrados.filter(mov => new Date(mov.data) >= dataLimite);
    } else if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      dadosFiltrados = dadosFiltrados.filter(mov => {
        const dataMov = new Date(mov.data);
        return dataMov >= inicio && dataMov <= fim;
      });
    }

    const tbody = document.getElementById('tabelaRelatorio') || document.createElement('table');
    tbody.id = 'tabelaRelatorio';
    tbody.innerHTML = `<thead><tr><th>Data</th><th>Medicamento</th><th>Quantidade</th><th>Valor Total</th><th>Usuário</th><th>Tipo</th></tr></thead><tbody></tbody>`;
    const conteudoResumo = document.getElementById('conteudoResumo') || document.createElement('div');
    conteudoResumo.id = 'conteudoResumo';

    let dadosChart = [];
    let labelsChart = [];

    switch(tipo) {
      case 'movimentacoes':
        dadosFiltrados.forEach(mov => {
          const medicamento = medicamentos.find(m => m.id === mov.medicamentoId);
          const usuario = usuarios.find(u => u.id === mov.usuarioId);
          tbody.querySelector('tbody').innerHTML += `
            <tr>
              <td>${formatarData(mov.data)}</td>
                            <td>${medicamento ? medicamento.nome : 'Desconhecido'}</td>
              <td>${mov.quantidade}</td>
              <td>R$ ${mov.valorTotal.toFixed(2)}</td>
              <td>${usuario ? usuario.nome : 'Desconhecido'}</td>
              <td>${mov.tipo}</td>
            </tr>
          `;
        });
        conteudoResumo.innerHTML = `<p>Total de movimentações: ${dadosFiltrados.length}</p>`;
        dadosChart = dadosFiltrados.map(mov => mov.quantidade);
        labelsChart = dadosFiltrados.map(mov => {
          const med = medicamentos.find(m => m.id === mov.medicamentoId);
          return med ? med.nome : 'Desconhecido';
        });
        break;

      case 'estoque':
        const estoque = medicamentos.map(med => ({
          nome: med.nome,
          quantidade: med.quantidade,
          valorTotal: med.quantidade * med.valorUnitario
        }));
        estoque.forEach(item => {
          tbody.querySelector('tbody').innerHTML += `
            <tr>
              <td>${item.nome}</td>
              <td>${item.quantidade}</td>
              <td>R$ ${item.valorTotal.toFixed(2)}</td>
            </tr>
          `;
        });
        conteudoResumo.innerHTML = `<p>Total em estoque: R$ ${estoque.reduce((total, item) => total + item.valorTotal, 0).toFixed(2)}</p>`;
        dadosChart = estoque.map(item => item.quantidade);
        labelsChart = estoque.map(item => item.nome);
        break;

      case 'vencimentos':
        const vencimentos = medicamentos.filter(med => {
          const dataValidade = new Date(med.dataValidade);
          return dataValidade < hoje || (dataValidade - hoje) / (1000 * 60 * 60 * 24) <= 30;
        });
        vencimentos.forEach(med => {
          tbody.querySelector('tbody').innerHTML += `
            <tr>
              <td>${med.nome}</td>
              <td>${formatarData(med.dataValidade)}</td>
              <td>${med.quantidade}</td>
            </tr>
          `;
        });
        conteudoResumo.innerHTML = `<p>Total vencendo ou vencido: ${vencimentos.length}</p>`;
        dadosChart = vencimentos.map(med => med.quantidade);
        labelsChart = vencimentos.map(med => med.nome);
        break;

      case 'valor':
        const valorPorMedicamento = medicamentos.map(med => ({
          nome: med.nome,
          valorTotal: med.quantidade * med.valorUnitario
        }));
        valorPorMedicamento.forEach(item => {
          tbody.querySelector('tbody').innerHTML += `
            <tr>
              <td>${item.nome}</td>
              <td>R$ ${item.valorTotal.toFixed(2)}</td>
            </tr>
          `;
        });
        conteudoResumo.innerHTML = `<p>Valor total em estoque: R$ ${valorPorMedicamento.reduce((total, item) => total + item.valorTotal, 0).toFixed(2)}</p>`;
        dadosChart = valorPorMedicamento.map(item => item.valorTotal);
        labelsChart = valorPorMedicamento.map(item => item.nome);
        break;
    }

    const mainContent = document.getElementById('mainContent');
    if (!document.getElementById('tabelaRelatorio')) {
      mainContent.appendChild(tbody);
    }
    if (!document.getElementById('conteudoResumo')) {
      mainContent.appendChild(conteudoResumo);
    }

    if (relatorioChart) {
      relatorioChart.destroy();
    }
    const ctx = document.getElementById('relatorioChart').getContext('2d');
    relatorioChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labelsChart,
        datasets: [{
          label: 'Quantidade/Valor',
          data: dadosChart,
          backgroundColor: [
            '#1a4f72', '#ff6f61', '#6b5b95', '#88b04b', '#f7cac9',
            '#92a8d1', '#955251', '#b565a7', '#009b77', '#dd4124'
          ],
          borderColor: [
            '#1a4f72', '#ff6f61', '#6b5b95', '#88b04b', '#f7cac9',
            '#92a8d1', '#955251', '#b565a7', '#009b77', '#dd4124'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: true } }
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    alert('Erro ao gerar relatório. Verifique o console.');
  }
}

function exportarRelatorio() {
  const table = document.getElementById('tabelaRelatorio');
  if (!table) {
    alert('Nenhum relatório gerado para exportar.');
    return;
  }

  let csv = [];
  const rows = table.querySelectorAll('tr');
  
  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th');
    const rowData = Array.from(cols).map(col => `"${col.textContent.trim().replace(/"/g, '""')}"`);
    csv.push(rowData.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + csv.join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'relatorio.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function carregarUsuarios() {
  try {
    const usuarios = await getItem(USUARIOS_DB) || [];
    
    const tbody = document.getElementById('tabelaUsuarios')?.querySelector('tbody');
    if (!tbody) throw new Error('Tabela de usuários não encontrada');
    
    tbody.innerHTML = '';
    
    usuarios.forEach(usuario => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${usuario.id}</td>
        <td>${usuario.nome}</td>
        <td>${usuario.tipo}</td>
        <td>${formatarData(usuario.dataCriacao)}</td>
        <td><button onclick="editarUsuario(${usuario.id})">Editar</button> <button onclick="removerUsuario(${usuario.id})">Remover</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    alert('Erro ao carregar usuários. Verifique o console.');
  }
}

async function cadastrarUsuario() {
  try {
    const id = parseInt(document.getElementById('novoUsuarioId')?.value);
    const nome = document.getElementById('novoUsuarioNome')?.value.trim();
    const tipo = document.getElementById('novoUsuarioTipo')?.value;
    
    if (!id || !nome || !tipo) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    
    let usuarios = await getItem(USUARIOS_DB) || [];
    
    if (usuarios.some(u => u.id === id)) {
      alert('ID já existe. Escolha outro ID.');
      return;
    }
    
    const novoUsuario = {
      id,
      nome,
      tipo,
      dataCriacao: new Date().toISOString(),
      foto: null
    };
    
    usuarios.push(novoUsuario);
    await setItem(USUARIOS_DB, usuarios);
    
    document.getElementById('novoUsuarioId').value = '';
    document.getElementById('novoUsuarioNome').value = '';
    document.getElementById('novoUsuarioTipo').value = 'comum';
    
    await carregarUsuarios();
    alert('Usuário cadastrado com sucesso!');
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    alert('Erro ao cadastrar usuário. Verifique o console.');
  }
}

async function editarUsuario(id) {
  try {
    let usuarios = await getItem(USUARIOS_DB) || [];
    const usuario = usuarios.find(u => u.id === id);
    
    if (usuario) {
      const novoNome = prompt('Novo nome:', usuario.nome);
      const novoTipo = prompt('Novo tipo (comum/admin):', usuario.tipo);
      
      if (novoNome && novoTipo) {
        usuario.nome = novoNome;
        usuario.tipo = novoTipo.toLowerCase() === 'admin' ? 'admin' : 'comum';
        await setItem(USUARIOS_DB, usuarios);
        await carregarUsuarios();
        alert('Usuário atualizado com sucesso!');
      }
    }
  } catch (error) {
    console.error('Erro ao editar usuário:', error);
    alert('Erro ao editar usuário. Verifique o console.');
  }
}

async function removerUsuario(id) {
  try {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      let usuarios = await getItem(USUARIOS_DB) || [];
      usuarios = usuarios.filter(u => u.id !== id);
      await setItem(USUARIOS_DB, usuarios);
      await carregarUsuarios();
      alert('Usuário removido com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    alert('Erro ao remover usuário. Verifique o console.');
  }
}

async function fazerBackup() {
  try {
    const backup = {
      medicamentos: await getItem(MEDICAMENTOS_DB) || [],
      usuarios: await getItem(USUARIOS_DB) || [],
      movimentacoes: await getItem(MOVIMENTACOES_DB) || [],
      configuracoes: await getItem(CONFIGURACOES_DB) || {}
    };
    
    const data = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup-${data}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Backup realizado com sucesso!');
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
    alert('Erro ao fazer backup. Verifique o console.');
  }
}

async function restaurarBackup() {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        const backup = JSON.parse(text);
        
        if (confirm('Tem certeza que deseja restaurar o backup? Isso substituirá os dados atuais.')) {
          await setItem(MEDICAMENTOS_DB, backup.medicamentos);
          await setItem(USUARIOS_DB, backup.usuarios);
          await setItem(MOVIMENTACOES_DB, backup.movimentacoes);
          await setItem(CONFIGURACOES_DB, backup.configuracoes);
          await atualizarDashboard();
          await carregarUsuarios();
          alert('Backup restaurado com sucesso!');
        }
      }
    };
    input.click();
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    alert('Erro ao restaurar backup. Verifique o console.');
  }
}

async function limparDadosAntigos() {
  try {
    if (confirm('Tem certeza que deseja limpar dados antigos (movimentações de mais de 90 dias)?')) {
      const movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
      const hoje = new Date();
      const dataLimite = new Date(hoje);
      dataLimite.setDate(hoje.getDate() - 90);
      
      const novasMovimentacoes = movimentacoes.filter(mov => new Date(mov.data) >= dataLimite);
      await setItem(MOVIMENTACOES_DB, novasMovimentacoes);
      await atualizarDashboard();
      alert('Dados antigos limpos com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao limpar dados antigos:', error);
    alert('Erro ao limpar dados antigos. Verifique o console.');
  }
}

async function recalcularEstoque() {
  try {
    if (confirm('Tem certeza que deseja recalcular o estoque? Isso pode sobrescrever movimentações inconsistentes.')) {
      const medicamentos = await getItem(MEDICAMENTOS_DB) || [];
      const movimentacoes = await getItem(MOVIMENTACOES_DB) || [];
      
      medicamentos.forEach(med => {
        med.quantidade = 0;
      });
      
      movimentacoes.forEach(mov => {
        const medicamento = medicamentos.find(m => m.id === mov.medicamentoId);
        if (medicamento) {
          if (mov.tipo === 'entrada' || mov.tipo === 'devolucao') {
            medicamento.quantidade += mov.quantidade;
          } else {
            medicamento.quantidade -= mov.quantidade;
          }
        }
      });
      
      await setItem(MEDICAMENTOS_DB, medicamentos);
      await atualizarDashboard();
      alert('Estoque recalculado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao recalcular estoque:', error);
    alert('Erro ao recalcular estoque. Verifique o console.');
  }
}

window.onload = async function() {
  await openIDB();
  await inicializarBancosDeDados();
  document.getElementById('userId').focus();
  
  document.getElementById('backBtn').addEventListener('click', navigateBack);
  
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-module]');
      if (li) {
        const moduleId = li.getAttribute('data-module');
        if (moduleId === 'sair') {
          logout();
        } else {
          navigateTo(moduleId);
        }
      }
    });
  }
};
             
