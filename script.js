// Constantes globais
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

// Inicialização do EmailJS (substitua pelos seus IDs reais)
emailjs.init("YOUR_USER_ID"); // Configure no painel do EmailJS

// Funções de Banco de Dados IndexedDB
async function openIDB() {
  if (!window.indexedDB) {
    console.error('IndexedDB não suportado neste navegador.');
    alert('Seu navegador não suporta IndexedDB. Use Chrome, Firefox, Edge ou Safari.');
    return null;
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('controleMedicamentosDB', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('storage', { keyPath: 'key' });
    };
    request.onsuccess = (event) => { idb = event.target.result; resolve(idb); };
    request.onerror = (event) => { console.error('Erro ao abrir IndexedDB:', event.target.error); reject(event.target.error); };
  });
}

async function getItem(key) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction('storage', 'readonly');
    const store = transaction.objectStore('storage');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = () => reject(request.error);
  });
}

async function setItem(key, value) {
  if (!idb) await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction('storage', 'readwrite');
    const store = transaction.objectStore('storage');
    const request = store.put({ key, data: value });
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
}

// Inicialização dos Dados
async function inicializarBancosDeDados() {
  try {
    let usuarios = await getItem(USUARIOS_DB);
    if (!usuarios || usuarios.length === 0) {
      usuarios = [
        { id: 189, nome: "Administrador Master", tipo: "admin", dataCriacao: new Date().toISOString(), foto: null },
        { id: 1, nome: "Enfermeira Maria", tipo: "comum", dataCriacao: new Date().toISOString(), foto: null },
        { id: 2, nome: "Farmacêutico João", tipo: "comum", dataCriacao: new Date().toISOString(), foto: null }
      ];
      await setItem(USUARIOS_DB, usuarios);
    }

    let medicamentos = await getItem(MEDICAMENTOS_DB);
    if (!medicamentos || medicamentos.length === 0) {
      medicamentos = [
        { id: 1, codigo: "7891234567890", nome: "Paracetamol", fabricante: "Medley", lote: "PTM202301", quantidade: 150, valorUnitario: 0.25, dataValidade: "2024-06-30", dataCadastro: new Date().toISOString(), usuarioCadastro: 189, observacoes: "Uso controlado" },
        { id: 2, codigo: "7899876543210", nome: "Dipirona Sódica", fabricante: "EMS", lote: "DIP202302", quantidade: 80, valorUnitario: 0.18, dataValidade: "2024-08-15", dataCadastro: new Date().toISOString(), usuarioCadastro: 189, observacoes: "" },
        { id: 3, codigo: "7896655443322", nome: "Omeprazol", fabricante: "Eurofarma", lote: "OMP202305", quantidade: 5, valorUnitario: 1.20, dataValidade: "2024-05-15", dataCadastro: new Date().toISOString(), usuarioCadastro: 189, observacoes: "Estoque crítico" }
      ];
      await setItem(MEDICAMENTOS_DB, medicamentos);
    }

    let movimentacoes = await getItem(MOVIMENTACOES_DB);
    if (!movimentacoes || movimentacoes.length === 0) {
      movimentacoes = [
        { id: 1, medicamentoId: 1, tipo: "saida", quantidade: 10, valorUnitario: 0.25, valorTotal: 2.50, usuarioId: 1, data: new Date(Date.now() - 86400000).toISOString(), motivo: "uso", observacoes: "Enfermaria" },
        { id: 2, medicamentoId: 2, tipo: "saida", quantidade: 5, valorUnitario: 0.18, valorTotal: 0.90, usuarioId: 2, data: new Date(Date.now() - 172800000).toISOString(), motivo: "venda", observacoes: "Balcão" }
      ];
      await setItem(MOVIMENTACOES_DB, movimentacoes);
    }

    let configuracoes = await getItem(CONFIGURACOES_DB);
    if (!configuracoes) {
      configuracoes = { emailNotificacao: "jlenon.32@outlook.com", diasAlertaVencimento: 30, limiteEstoqueBaixo: 10, backupAuto: "semanal", temaInterface: "claro" };
      await setItem(CONFIGURACOES_DB, configuracoes);
    }
    await carregarConfiguracoes();
  } catch (error) {
    console.error('Erro na inicialização dos bancos:', error);
    alert('Erro ao inicializar o sistema. Verifique o console.');
  }
}

// Gerenciamento de Configurações
async function carregarConfiguracoes() {
  const config = await getItem(CONFIGURACOES_DB) || {};
  document.getElementById('emailNotificacao').value = config.emailNotificacao || '';
  document.getElementById('diasAlertaVencimento').value = config.diasAlertaVencimento || 30;
  document.getElementById('limiteEstoqueBaixo').value = config.limiteEstoqueBaixo || 10;
  document.getElementById('backupAuto').value = config.backupAuto || 'semanal';
  document.getElementById('temaInterface').value = config.temaInterface || 'claro';
}

async function salvarConfiguracoes() {
  const config = {
    emailNotificacao: document.getElementById('emailNotificacao').value,
    diasAlertaVencimento: parseInt(document.getElementById('diasAlertaVencimento').value) || 30,
    limiteEstoqueBaixo: parseInt(document.getElementById('limiteEstoqueBaixo').value) || 10,
    backupAuto: document.getElementById('backupAuto').value,
    temaInterface: document.getElementById('temaInterface').value
  };
  await setItem(CONFIGURACOES_DB, config);
  alert('Configurações salvas!');
}

// Controle de Loading
function showLoading() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.style.display = 'flex';
  else console.warn('Loading overlay não encontrado no DOM.');
}

function hideLoading() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.style.display = 'none';
  else console.warn('Loading overlay não encontrado no DOM.');
}

// Autenticação e Login
async function login() {
  showLoading();
  try {
    const userId = parseInt(document.getElementById('userId').value.trim());
    if (!userId || userId < 1) throw new Error('ID inválido');

    const usuarios = await getItem(USUARIOS_DB) || [];
    if (usuarios.length === 0) throw new Error('Nenhum usuário cadastrado');

    const usuario = usuarios.find(u => u.id === userId);
    if (!usuario) throw new Error('Usuário não encontrado');

    usuarioLogado = usuario;

    // Atualizar interface
    document.getElementById('userName').textContent = usuario.nome;
    document.getElementById('userIdDisplay').textContent = usuario.id;
    const badge = document.getElementById('userTypeBadge');
    const menuItems = { cadastrar: 'menuCadastrar', relatorios: 'menuRelatorios', usuarios: 'menuUsuarios', configuracoes: 'menuConfiguracoes' };

    if (usuario.tipo === 'admin') {
      badge.innerHTML = '<span class="admin-badge">Admin</span>';
      Object.values(menuItems).forEach(id => document.getElementById(id).style.display = 'block');
    } else {
      badge.textContent = '';
      Object.values(menuItems).forEach(id => document.getElementById(id).style.display = 'none');
    }

    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('userId').value = '';

    await mostrarFotoUsuario(usuario);
    await navigateTo('dashboard');
    await checarAlertasEstoque();
  } catch (error) {
    console.error('Erro no login:', error);
    alert(error.message || 'Erro ao fazer login. Verifique o console.');
  } finally {
    hideLoading(); // Sempre ocultar o loading, mesmo em erro
  }
}

async function checarAlertasEstoque() {
  const meds = await getItem(MEDICAMENTOS_DB) || [];
  const config = await getItem(CONFIGURACOES_DB) || {};
  const baixos = meds.filter(m => m.quantidade <= (config.limiteEstoqueBaixo || 10));
  if (baixos.length) alert(`Alerta: ${baixos.map(m => m.nome).join(', ')} com estoque baixo!`);
}

async function mostrarFotoUsuario(usuario) {
  const avatar = document.querySelector('.user-info .avatar');
  if (!avatar) return;

  avatar.innerHTML = '';
  if (usuario.foto) {
    const img = document.createElement('img');
    img.src = usuario.foto; img.style.width = '50px'; img.style.height = '50px'; img.style.borderRadius = '50%';
    avatar.appendChild(img);
  } else avatar.innerHTML = '<i class="fas fa-user-circle fa-3x"></i>';

  avatar.insertAdjacentHTML('afterend', '<input type="file" id="userPhoto" accept="image/*" onchange="uploadFotoUsuario()" style="display:none;"><button onclick="document.getElementById(\'userPhoto\').click()">Adicionar Foto</button>');
}

async function uploadFotoUsuario() {
  const file = document.getElementById('userPhoto')?.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    let usuarios = await getItem(USUARIOS_DB) || [];
    const idx = usuarios.findIndex(u => u.id === usuarioLogado.id);
    if (idx !== -1) {
      usuarios[idx].foto = e.target.result;
      await setItem(USUARIOS_DB, usuarios);
      usuarioLogado.foto = e.target.result;
      await mostrarFotoUsuario(usuarioLogado);
      alert('Foto adicionada!');
    }
  };
  reader.readAsDataURL(file);
}

async function atualizarPorcentagemArmazenamento() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const perc = ((estimate.usage / estimate.quota) * 100).toFixed(2);
    const info = document.getElementById('storageInfo') || document.createElement('p');
    info.id = 'storageInfo'; info.textContent = `Uso: ${perc}%`;
    if (!document.getElementById('storageInfo')) document.getElementById('dashboard').appendChild(info);
  }
}

// Navegação
async function navigateTo(moduleId) {
  showLoading();
  try {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.menu li').forEach(i => i.classList.remove('active'));

    const module = document.getElementById(moduleId);
    const menuItem = document.querySelector(`.menu li[data-module="${moduleId}"]`);
    if (!module || !menuItem) throw new Error('Módulo ou menu não encontrado');

    module.classList.add('active');
    menuItem.classList.add('active');
    document.getElementById('moduleTitle').textContent = menuItem.textContent;

    navigationHistory.push(moduleId);
    currentNavigationIndex = navigationHistory.length - 1;

    switch (moduleId) {
      case 'dashboard': await atualizarDashboard(); break;
      case 'pesquisar': await filtrarMedicamentos(); break;
      case 'relatorios': mudarTipoRelatorio(); break;
      case 'usuarios': await carregarUsuarios(); break;
    }
  } catch (error) {
    console.error('Erro na navegação:', error);
    alert('Erro ao carregar módulo.');
  } finally {
    hideLoading();
  }
}

function navigateBack() {
  if (currentNavigationIndex > 0) {
    currentNavigationIndex--;
    navigateTo(navigationHistory[currentNavigationIndex]);
  }
}

// Scanner
function iniciarScanner(campoId) {
  scannerCampoAlvo = campoId;
  const container = document.getElementById('scannerContainer');
  const video = document.getElementById('scannerVideo');
  const instrucoes = document.getElementById('scannerInstructions');
  const erro = document.getElementById('scannerError');

  if (!container || !video || !instrucoes || !erro) {
    console.error('Elementos do scanner ausentes');
    alert('Erro no scanner. Verifique o DOM.');
    return;
  }

  container.style.display = 'flex';
  instrucoes.style.display = 'block';
  erro.style.display = 'none';

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; scannerStream = stream; video.play(); scannerAtivo = true; scanearCodigo(video); })
    .catch(err => { console.error('Erro na câmera:', err); instrucoes.style.display = 'none'; erro.style.display = 'block'; scannerAtivo = false; });
}

function fecharScanner() {
  const container = document.getElementById('scannerContainer');
  const video = document.getElementById('scannerVideo');
  if (container && video) {
    container.style.display = 'none';
    scannerAtivo = false;
    if (scannerStream) scannerStream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
}

function scanearCodigo(video) {
  if (!scannerAtivo) return;
  const codeReader = new ZXing.BrowserMultiFormatReader();
  codeReader.decodeFromVideoElement(video, (result, err) => {
    if (result) {
      document.getElementById(scannerCampoAlvo).value = result.text;
      fecharScanner();
      if (scannerCampoAlvo === 'retirarCodigo') buscarMedicamentoPorCodigo(result.text);
      else if (scannerCampoAlvo === 'codigoBarras') buscarMedicamentoPorCodigoParaPreencher(result.text);
      codeReader.reset();
    }
    if (err && !(err instanceof ZXing.NotFoundException)) console.error('Erro no scan:', err);
  });
}

// Busca de Medicamentos
async function buscarMedicamentoPorCodigo(codigo) {
  const meds = await getItem(MEDICAMENTOS_DB) || [];
  const med = meds.find(m => m.codigo === codigo);
  if (med) {
    document.getElementById('medicamentoRetirada').value = med.nome;
    document.getElementById('loteRetirada').value = med.lote;
    document.getElementById('valorUnitarioRetirada').value = med.valorUnitario.toFixed(2);
    document.getElementById('quantidadeRetirada').max = med.quantidade;
    calcularValorTotalRetirada();
  } else alert('Medicamento não encontrado.');
}

async function buscarMedicamentoPorCodigoParaPreencher(codigo) {
  const meds = await getItem(MEDICAMENTOS_DB) || [];
  const med = meds.find(m => m.codigo === codigo);
  if (med) {
    document.getElementById('nomeMedicamento').value = med.nome;
    document.getElementById('fabricante').value = med.fabricante;
    document.getElementById('lote').value = med.lote;
    document.getElementById('quantidade').value = med.quantidade;
    document.getElementById('valorTotal').value = (med.quantidade * med.valorUnitario).toFixed(2);
    document.getElementById('validade').value = med.dataValidade;
    document.getElementById('observacoes').value = med.observacoes || '';
    calcularValorUnitario();
  }
}

// Logout e Menu
function logout() { document.getElementById('exitModal').style.display = 'flex'; }
function confirmExit() { usuarioLogado = null; document.getElementById('appContainer').style.display = 'none'; document.getElementById('loginContainer').style.display = 'flex'; document.getElementById('userId').value = ''; document.getElementById('userId').focus(); closeExitModal(); }
function closeExitModal() { document.getElementById('exitModal').style.display = 'none'; }
function toggleMenu() { document.getElementById('sidebar').classList.toggle('active'); document.getElementById('sidebarOverlay').classList.toggle('active'); }

// Dashboard
async function atualizarDashboard() {
  const meds = await getItem(MEDICAMENTOS_DB) || [];
  const movs = await getItem(MOVIMENTACOES_DB) || [];
  const config = await getItem(CONFIGURACOES_DB) || {};

  document.getElementById('totalMedicamentos').textContent = meds.length;
  document.getElementById('totalValor').textContent = `R$ ${meds.reduce((t, m) => t + (m.quantidade * m.valorUnitario), 0).toFixed(2)}`;
  document.getElementById('proximosVencimentos').textContent = meds.filter(m => new Date(m.dataValidade) <= new Date(Date.now() + (config.diasAlertaVencimento || 30) * 86400000)).length;
  document.getElementById('totalGastoMes').textContent = `R$ ${movs.filter(m => new Date(m.data).getMonth() === new Date().getMonth() && m.tipo === 'entrada').reduce((t, m) => t + m.valorTotal, 0).toFixed(2)}`;
  document.getElementById('medicamentoMaisUtilizado').textContent = await encontrarMedicamentoMaisUtilizado(movs, meds);

  await atualizarTabelaMovimentacoes(movs, meds);
  await atualizarTop5Medicamentos(movs, meds);
  await atualizarPorcentagemArmazenamento();
}

async function encontrarMedicamentoMaisUtilizado(movs, meds) {
  const count = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => { acc[m.medicamentoId] = (acc[m.medicamentoId] || 0) + m.quantidade; return acc; }, {});
  const topId = Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b, null);
  return meds.find(m => m.id == topId)?.nome || '-';
}

async function atualizarTabelaMovimentacoes(movs, meds) {
  const usuarios = await getItem(USUARIOS_DB) || [];
  const tbody = document.getElementById('movimentacoesTable').querySelector('tbody');
  tbody.innerHTML = '';
  movs.sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 10).forEach(m => {
    const med = meds.find(m2 => m2.id === m.medicamentoId);
    const usr = usuarios.find(u => u.id === m.usuarioId);
    tbody.innerHTML += `<tr><td>${formatarData(m.data)}</td><td>${med?.nome || 'Desconhecido'}</td><td>${med?.lote || '-'}</td><td>${m.quantidade}</td><td>R$ ${m.valorTotal.toFixed(2)}</td><td>${usr?.nome || 'Desconhecido'}</td><td>${m.tipo}</td></tr>`;
  });
}

async function atualizarTop5Medicamentos(movs, meds) {
  const count = movs.filter(m => m.tipo === 'saida').reduce((acc, m) => { acc[m.medicamentoId] = (acc[m.medicamentoId] || 0) + m.quantidade; return acc; }, {});
  const topIds = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 5);
  const tbody = document.getElementById('top5Medicamentos').querySelector('tbody');
  tbody.innerHTML = topIds.map(id => `<tr><td>${meds.find(m => m.id == id)?.nome || '-'}</td><td>${count[id]}</td></tr>`).join('');
}

// Cadastro e Movimentações
function formatarData(data) { return new Date(data).toLocaleDateString('pt-BR'); }
function calcularValorUnitario() { const q = parseFloat(document.getElementById('quantidade').value) || 0; const v = parseFloat(document.getElementById('valorTotal').value) || 0; document.getElementById('valorUnitarioInfo').textContent = `R$ ${(q > 0 ? v / q : 0).toFixed(2)}`; }
async function cadastrarMedicamento() { /* ... */ } // Implementação anterior
function calcularValorTotalRetirada() { const q = parseInt(document.getElementById('quantidadeRetirada').value) || 0; const v = parseFloat(document.getElementById('valorUnitarioRetirada').value) || 0; document.getElementById('valorTotalRetiradaInfo').textContent = `R$ ${(q * v).toFixed(2)}`; }
function toggleMotivoField() { document.getElementById('motivoField').style.display = document.getElementById('tipoMovimentacao').value === 'devolucao' ? 'none' : 'block'; }
async function processarMovimentacao() { /* ... */ } // Implementação anterior
async function registrarMovimentacao(medicamentoId, tipo, quantidade, valorUnitario, motivo) { /* ... */ } // Implementação anterior
async function enviarEmailAlerta(medicamento) { /* ... */ } // Implementação anterior
function closeAlert() { document.getElementById('alertModal').style.display = 'none'; }

// Relatórios e Usuários
async function filtrarMedicamentos() { /* ... */ } // Implementação anterior
function iniciarRetirada(codigo) { document.getElementById('retirarCodigo').value = codigo; buscarMedicamentoPorCodigo(codigo); navigateTo('retirar'); }
function mudarTipoRelatorio() { document.getElementById('periodoPersonalizado').style.display = document.getElementById('periodoRelatorio').value === 'personalizado' ? 'block' : 'none'; }
async function gerarRelatorio() { /* ... */ } // Implementação anterior
function exportarRelatorio() { /* ... */ } // Implementação anterior
async function carregarUsuarios() { /* ... */ } // Implementação anterior
async function cadastrarUsuario() { /* ... */ } // Implementação anterior
async function editarUsuario(id) { /* ... */ } // Implementação anterior
async function removerUsuario(id) { /* ... */ } // Implementação anterior

// Backup e Manutenção
async function fazerBackup() { /* ... */ } // Implementação anterior
async function restaurarBackup() { /* ... */ } // Implementação anterior
async function limparDadosAntigos() { /* ... */ } // Implementação anterior
async function recalcularEstoque() { /* ... */ } // Implementação anterior

// Inicialização
window.onload = async () => {
  await openIDB();
  await inicializarBancosDeDados();
  document.getElementById('userId').focus();
  document.getElementById('backBtn').addEventListener('click', navigateBack);
  document.getElementById('sidebar').addEventListener('click', (e) => {
    const li = e.target.closest('li[data-module]');
    if (li) {
      const moduleId = li.getAttribute('data-module');
      if (moduleId === 'sair') logout();
      else navigateTo(moduleId);
    }
  });
};
