<script>
        // Banco de dados simulado usando localStorage
        const MEDICAMENTOS_DB = 'medicamentos_db';
        const USUARIOS_DB = 'usuarios_db';
        const MOVIMENTACOES_DB = 'movimentacoes_db';
        const CONFIGURACOES_DB = 'configuracoes_db';
        let usuarioLogado = null;
        let medicamentoAlerta = null;
        let scannerAtivo = false;
        let scannerCampoAlvo = null;
        
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
                        observacoes: "Estoque crítico" } ]; localStorage.setItem(MEDICAMENTOS_DB, JSON.stringify(medicamentos)); }



        // Inicializar movimentações
        if (!localStorage.getItem(MOVIMENTACOES_DB)) {
            localStorage.setItem(MOVIMENTACOES_DB, JSON.stringify([]));
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
    
    // Carregar configurações
    function carregarConfiguracoes() {
        const configuracoes = obterDados(CONFIGURACOES_DB);
        
        if (configuracoes.emailNotificacao) {
            document.getElementById('emailNotificacao').value = configuracoes.emailNotificacao;
        }
        if (configuracoes.diasAlertaVencimento) {
            document.getElementById('diasAlertaVencimento').value = configuracoes.diasAlertaVencimento;
        }
        if (configuracoes.limiteEstoqueBaixo) {
            document.getElementById('limiteEstoqueBaixo').value = configuracoes.limiteEstoqueBaixo;
        }
        if (configuracoes.backupAuto) {
            document.getElementById('backupAuto').value = configuracoes.backupAuto;
        }
        if (configuracoes.temaInterface) {
            document.getElementById('temaInterface').value = configuracoes.temaInterface;
        }
    }
    
    // Salvar configurações
    function salvarConfiguracoes() {
        const configuracoes = {
            emailNotificacao: document.getElementById('emailNotificacao').value,
            diasAlertaVencimento: parseInt(document.getElementById('diasAlertaVencimento').value),
            limiteEstoqueBaixo: parseInt(document.getElementById('limiteEstoqueBaixo').value),
            backupAuto: document.getElementById('backupAuto').value,
            temaInterface: document.getElementById('temaInterface').value
        };
        
        salvarDados(CONFIGURACOES_DB, configuracoes);
        alert('Configurações salvas com sucesso!');
    }
    
    // Obter dados do banco
    function obterDados(chave) {
        return JSON.parse(localStorage.getItem(chave) || '[]');
    }
    
    // Salvar dados no banco
    function salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    }
    
    // Verificar se usuário é administrador
    function isAdmin() {
        return usuarioLogado && (usuarioLogado.tipo === 'admin' || usuarioLogado.id === 189);
    }
    
    // Atualizar interface baseada no tipo de usuário
    function atualizarPermissoesUsuario() {
        const isAdminUser = isAdmin();
        
        // Mostrar/ocultar menus baseado no tipo de usuário
        document.getElementById('menuCadastrar').style.display = isAdminUser ? 'flex' : 'none';
        document.getElementById('menuRelatorios').style.display = isAdminUser ? 'flex' : 'none';
        document.getElementById('menuUsuarios').style.display = isAdminUser ? 'flex' : 'none';
        document.getElementById('menuConfiguracoes').style.display = isAdminUser ? 'flex' : 'none';
        
        // Atualizar badge do usuário
        const userTypeBadge = document.getElementById('userTypeBadge');
        if (isAdminUser) {
            userTypeBadge.innerHTML = '<span class="admin-badge">Admin</span>';
        } else {
            userTypeBadge.innerHTML = '';
        }
    }
    
    // Login do usuário
    function login() {
        const userId = parseInt(document.getElementById('userId').value);
        const usuarios = obterDados(USUARIOS_DB);
        
        // Verificar se é o admin master (ID 189)
        if (userId === 189) {
            usuarioLogado = { id: 189, nome: "Administrador Master", tipo: "admin" };
        } else {
            usuarioLogado = usuarios.find(u => u.id === userId);
        }
        
        if (usuarioLogado) {
            document.getElementById('loginContainer').style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            document.getElementById('userName').textContent = usuarioLogado.nome;
            document.getElementById('userIdDisplay').textContent = usuarioLogado.id;
            
            // Atualizar permissões baseadas no tipo de usuário
            atualizarPermissoesUsuario();
            
            atualizarDashboard();
        } else {
            alert('ID de usuário não encontrado!');
        }
    }
    
    // Logout
    function logout() {
        usuarioLogado = null;
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('userId').value = '';
    }
    
    // Alternar menu em dispositivos móveis
    function toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('active');
    }
    
    // Navegação entre módulos
    document.querySelectorAll('.menu li').forEach(item => {
        if (item.dataset.module !== 'sair') {
            item.addEventListener('click', () => {
                // Verificar se usuário tem permissão para acessar o módulo
                if ((item.dataset.module === 'cadastrar' || 
                     item.dataset.module === 'relatorios' || 
                     item.dataset.module === 'usuarios' || 
                     item.dataset.module === 'configuracoes') && !isAdmin()) {
                    alert('Você não tem permissão para acessar esta funcionalidade!');
                    return;
                }
                
                // Atualizar menu ativo
                document.querySelectorAll('.menu li').forEach(li => {
                    li.classList.remove('active');
                });
                item.classList.add('active');
                
                // Mostrar módulo correspondente
                document.querySelectorAll('.module').forEach(mod => {
                    mod.classList.remove('active');
                });
                document.getElementById(item.dataset.module).classList.add('active');
                
                // Atualizar título
                document.getElementById('moduleTitle').textContent = item.textContent;
                
                // Atualizar dados se necessário
                if (item.dataset.module === 'dashboard') {
                    atualizarDashboard();
                } else if (item.dataset.module === 'pesquisar') {
                    pesquisarMedicamentos('');
                } else if (item.dataset.module === 'usuarios') {
                    carregarUsuarios();
                } else if (item.dataset.module === 'configuracoes') {
                    carregarConfiguracoes();
                }
                
                // Fechar menu em dispositivos móveis
                if (window.innerWidth <= 768) {
                    toggleMenu();
                }
            });
        }
    });
    
    // Iniciar scanner de código de barras
    function iniciarScanner(campoId) {
        scannerCampoAlvo = campoId;
        const scannerContainer = document.getElementById('scannerContainer');
        const video = document.getElementById('scannerVideo');
        
        scannerContainer.style.display = 'flex';
        
        // Verificar se o navegador suporta a API de mídia
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                scannerAtivo = true;
                scanearCodigo(video);
            })
            .catch(function(error) {
                console.error('Erro ao acessar a câmera:', error);
                alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
                fecharScanner();
            });
        } else {
            alert('Seu navegador não suporta acesso à câmera.');
            fecharScanner();
        }
    }
    
    // Fechar scanner
    function fecharScanner() {
        const scannerContainer = document.getElementById('scannerContainer');
        const video = document.getElementById('scannerVideo');
        
        scannerContainer.style.display = 'none';
        scannerAtivo = false;
        
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
    }
    
    // Scanear código de barras
    function scanearCodigo(video) {
        if (!scannerAtivo) return;
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
            document.getElementById(scannerCampoAlvo).value = code.data;
            fecharScanner();
            
            // Se for o campo de retirada, buscar o medicamento
            if (scannerCampoAlvo === 'retirarCodigo') {
                buscarMedicamentoPorCodigo(code.data);
            }
        }
        
        // Continuar escaneando
        requestAnimationFrame(() => scanearCodigo(video));
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
    }
    
    // Calcular valor unitário no cadastro
    function calcularValorUnitario() {
        const quantidade = parseFloat(document.getElementById('quantidade').value) || 0;
        const valorTotal = parseFloat(document.getElementById('valorTotal').value) || 0;
        
        if (quantidade > 0 && valorTotal > 0) {
            const valorUnitario = valorTotal / quantidade;
            document.getElementById('valorUnitarioInfo').textContent = 
                `Valor unitário: R$ ${valorUnitario.toFixed(2)}`;
        } else {
            document.getElementById('valorUnitarioInfo').textContent = 'Valor unitário: R$ 0,00';
        }
    }
    
    // Calcular valor total na retirada
    function calcularValorTotalRetirada() {
        const quantidade = parseFloat(document.getElementById('quantidadeRetirada').value) || 0;
        const valorUnitario = parseFloat(document.getElementById('valorUnitarioRetirada').value.replace('R$ ', '').replace(',', '.')) || 0;
        
        if (quantidade > 0 && valorUnitario > 0) {
            const valorTotal = quantidade * valorUnitario;
            document.getElementById('valorTotalRetiradaInfo').textContent = 
                `Valor total: R$ ${valorTotal.toFixed(2)}`;
        } else {
            document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
        }
    }
    
    // Atualizar dashboard
    function atualizarDashboard() {
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        const usuarios = obterDados(USUARIOS_DB);
        
        // Estatísticas
        document.getElementById('totalMedicamentos').textContent = medicamentos.length;
        
        const valorTotal = medicamentos.reduce((total, med) => {
            return total + (med.quantidade * med.valorUnitario);
        }, 0);
        document.getElementById('totalValor').textContent = `R$ ${valorTotal.toFixed(2)}`;
        
        const hoje = new Date();
        const trintaDias = new Date();
        trintaDias.setDate(hoje.getDate() + 30);
        
        const proximosVencimentos = medicamentos.filter(med => {
            const validade = new Date(med.dataValidade);
            return validade > hoje && validade <= trintaDias;
        }).length;
        
        document.getElementById('proximosVencimentos').textContent = proximosVencimentos;
        
        // Calcular total gasto no mês
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        
        const movimentacoesMes = movimentacoes.filter(mov => {
            const dataMov = new Date(mov.data);
            return dataMov >= primeiroDiaMes && dataMov <= ultimoDiaMes && mov.tipo === 'saida' && mov.valorTotal;
        });
        
        const totalGastoMes = movimentacoesMes.reduce((total, mov) => total + mov.valorTotal, 0);
        document.getElementById('totalGastoMes').textContent = `R$ ${totalGastoMes.toFixed(2)}`;
        
        // Encontrar medicamento mais utilizado
        const medicamentosMaisUtilizados = {};
        movimentacoes.forEach(mov => {
            if (mov.tipo === 'saida') {
                if (!medicamentosMaisUtilizados[mov.medicamento]) {
                    medicamentosMaisUtilizados[mov.medicamento] = 0;
                }
                medicamentosMaisUtilizados[mov.medicamento] += mov.quantidade;
            }
        });
        
        let medicamentoMaisUtilizado = '-';
        let maiorQuantidade = 0;
        
        for (const medicamento in medicamentosMaisUtilizados) {
            if (medicamentosMaisUtilizados[medicamento] > maiorQuantidade) {
                maiorQuantidade = medicamentosMaisUtilizados[medicamento];
                medicamentoMaisUtilizado = medicamento;
            }
        }
        
        document.getElementById('medicamentoMaisUtilizado').textContent = medicamentoMaisUtilizado;
        
        // Últimas movimentações
        const tbody = document.querySelector('#movimentacoesTable tbody');
        tbody.innerHTML = '';
        
        // Ordenar movimentações por data (mais recente primeiro)
        movimentacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        // Mostrar apenas as 10 mais recentes
        movimentacoes.slice(0, 10).forEach(mov => {
            const usuario = usuarios.find(u => u.id === mov.usuario) || { nome: 'Desconhecido' };
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                <td>${mov.medicamento}</td>
                <td>${mov.lote}</td>
                <td>${mov.tipo === 'devolucao' ? '+' : ''}${mov.quantidade}</td>
                <td>${mov.valorTotal ? 'R$ ' + mov.valorTotal.toFixed(2) : '-'}</td>
                <td>${usuario.nome}</td>
                <td>${mov.tipo === 'devolucao' ? 'Devolução' : (mov.tipo === 'saida' ? 'Saída' : 'Entrada')}</td>
            `;
            
            tbody.appendChild(tr);
        });
    }
    
    // Cadastrar medicamento
    function cadastrarMedicamento() {
        if (!isAdmin()) {
            alert('Você não tem permissão para cadastrar medicamentos!');
            return;
        }
        
        const codigo = document.getElementById('codigoBarras').value;
        const nome = document.getElementById('nomeMedicamento').value;
        const fabricante = document.getElementById('fabricante').value;
        const lote = document.getElementById('lote').value;
        const quantidade = parseInt(document.getElementById('quantidade').value);
        const valorTotal = parseFloat(document.getElementById('valorTotal').value);
        const validade = document.getElementById('validade').value;
        const observacoes = document.getElementById('observacoes').value;
        
        if (!codigo || !nome || !lote || !quantidade || !valorTotal || !validade) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }
        
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const valorUnitario = valorTotal / quantidade;
        
        const novoMedicamento = {
            id: medicamentos.length > 0 ? Math.max(...medicamentos.map(m => m.id)) + 1 : 1,
            codigo: codigo,
            nome: nome,
            fabricante: fabricante,
            lote: lote,
            quantidade: quantidade,
            valorUnitario: valorUnitario,
            dataValidade: validade,
            dataCadastro: new Date().toISOString(),
            usuarioCadastro: usuarioLogado.id,
            observacoes: observacoes
        };
        
        medicamentos.push(novoMedicamento);
        salvarDados(MEDICAMENTOS_DB, medicamentos);
        
        // Registrar movimentação
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        movimentacoes.push({
            id: movimentacoes.length + 1,
            data: new Date().toISOString(),
            medicamento: nome,
            lote: lote,
            quantidade: quantidade,
            valorTotal: valorTotal,
            usuario: usuarioLogado.id,
            tipo: 'entrada'
        });
        salvarDados(MOVIMENTACOES_DB, movimentacoes);
        
        alert('Medicamento cadastrado com sucesso!');
        
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
    }
    
    // Buscar medicamento por código
    function buscarMedicamentoPorCodigo(codigo) {
        if (!codigo) return;
        
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const medicamento = medicamentos.find(m => m.codigo === codigo);
        
        if (medicamento) {
            document.getElementById('medicamentoRetirada').value = medicamento.nome;
            document.getElementById('loteRetirada').value = medicamento.lote;
            document.getElementById('valorUnitarioRetirada').value = `R$ ${medicamento.valorUnitario.toFixed(2)}`;
            document.getElementById('quantidadeRetirada').max = medicamento.quantidade;
            
            // Calcular valor total inicial
            calcularValorTotalRetirada();
        } else {
            document.getElementById('medicamentoRetirada').value = 'Não encontrado';
            document.getElementById('loteRetirada').value = '';
            document.getElementById('valorUnitarioRetirada').value = '';
            document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
        }
    }
    
    // Alternar campo de motivo
    function toggleMotivoField() {
        const tipo = document.getElementById('tipoMovimentacao').value;
        const motivoField = document.getElementById('motivoField');
        
        if (tipo === 'devolucao') {
            motivoField.style.display = 'none';
        } else {
            motivoField.style.display = 'block';
        }
    }
    
    // Processar movimentação (retirada ou devolução)
    function processarMovimentacao() {
        const codigo = document.getElementById('retirarCodigo').value;
        const quantidade = parseInt(document.getElementById('quantidadeRetirada').value);
        const tipo = document.getElementById('tipoMovimentacao').value;
        const motivo = tipo === 'devolucao' ? 'devolucao' : document.getElementById('motivoRetirada').value;
        const valorUnitario = parseFloat(document.getElementById('valorUnitarioRetirada').value.replace('R$ ', '').replace(',', '.')) || 0;
        const valorTotal = quantidade * valorUnitario;
        
        if (!codigo || !quantidade) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }
        
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const medicamentoIndex = medicamentos.findIndex(m => m.codigo === codigo);
        
        if (medicamentoIndex === -1) {
            alert('Medicamento não encontrado!');
            return;
        }
        
        if (tipo === 'saida' && medicamentos[medicamentoIndex].quantidade < quantidade) {
            alert('Quantidade indisponível em estoque!');
            return;
        }
        
        // Atualizar quantidade
        if (tipo === 'devolucao') {
            medicamentos[medicamentoIndex].quantidade += quantidade;
        } else {
            medicamentos[medicamentoIndex].quantidade -= quantidade;
        }
        
        salvarDados(MEDICAMENTOS_DB, medicamentos);
        
        // Registrar movimentação
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        movimentacoes.push({
            id: movimentacoes.length + 1,
            data: new Date().toISOString(),
            medicamento: medicamentos[medicamentoIndex].nome,
            lote: medicamentos[medicamentoIndex].lote,
            quantidade: quantidade,
            valorTotal: tipo === 'saida' ? valorTotal : null,
            usuario: usuarioLogado.id,
            tipo: tipo,
            motivo: motivo
        });
        salvarDados(MOVIMENTACOES_DB, movimentacoes);
        
        // Verificar se estoque chegou a zero após retirada
        if (tipo === 'saida' && medicamentos[medicamentoIndex].quantidade === 0) {
            medicamentoAlerta = medicamentos[medicamentoIndex];
            mostrarAlertaZeroEstoque(medicamentoAlerta);
        } else {
            alert(`Movimentação de ${tipo === 'devolucao' ? 'devolução' : 'retirada'} realizada com sucesso!`);
            
            // Limpar formulário
            document.getElementById('retirarCodigo').value = '';
            document.getElementById('medicamentoRetirada').value = '';
            document.getElementById('loteRetirada').value = '';
            document.getElementById('quantidadeRetirada').value = '';
            document.getElementById('valorUnitarioRetirada').value = '';
            document.getElementById('tipoMovimentacao').value = 'saida';
            document.getElementById('motivoRetirada').value = 'uso';
            document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
            toggleMotivoField();
        }
        
        // Atualizar dashboard
        atualizarDashboard();
    }
    
    // Mostrar alerta de estoque zero
    function mostrarAlertaZeroEstoque(medicamento) {
        document.getElementById('alertTitle').textContent = 'Estoque Esgotado';
        document.getElementById('alertMessage').textContent = 
            `O medicamento ${medicamento.nome} (Lote: ${medicamento.lote}) atingiu estoque zero. Deseja enviar um e-mail para o comprador responsável?`;
        document.getElementById('alertModal').style.display = 'flex';
    }
    
    // Confirmar envio de e-mail
    function confirmarEnvioEmail() {
        if (medicamentoAlerta) {
            enviarEmailEstoqueZero(medicamentoAlerta);
        }
        closeAlert();
        
        // Limpar formulário
        document.getElementById('retirarCodigo').value = '';
        document.getElementById('medicamentoRetirada').value = '';
        document.getElementById('loteRetirada').value = '';
        document.getElementById('quantidadeRetirada').value = '';
        document.getElementById('valorUnitarioRetirada').value = '';
        document.getElementById('tipoMovimentacao').value = 'saida';
        document.getElementById('motivoRetirada').value = 'uso';
        document.getElementById('valorTotalRetiradaInfo').textContent = 'Valor total: R$ 0,00';
        toggleMotivoField();
    }
    
    // Fechar alerta
    function closeAlert() {
        document.getElementById('alertModal').style.display = 'none';
        medicamentoAlerta = null;
    }
    
    // Enviar e-mail de estoque zero (simulação melhorada)
    function enviarEmailEstoqueZero(medicamento) {
        const configuracoes = obterDados(CONFIGURACOES_DB);
        const email = configuracoes.emailNotificacao || 'jlenon.32@outlook.com';
        
        // Formatar mensagem de e-mail
        const assunto = `Alerta: Estoque esgotado - ${medicamento.nome}`;
        const mensagem = `
            Prezado responsável pela compra,
            
            O medicamento ${medicamento.nome} (Lote: ${medicamento.lote}) atingiu estoque zero em ${new Date().toLocaleDateString('pt-BR')}.
            
            Por favor, realize a aquisição deste medicamento para garantir o abastecimento.
            
            Atenciosamente,
            Sistema de Controle de Medicamentos
        `;
        
        // Em um sistema real, isso seria uma integração com um serviço de e-mail
        // Como estamos no navegador, vamos usar mailto: para abrir o cliente de e-mail
        const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;
        
        // Abrir cliente de e-mail
        window.location.href = mailtoLink;
        
        // Mensagem de confirmação
        setTimeout(() => {
            alert('E-mail preparado para envio. Por favor, confirme o envio no seu cliente de e-mail.');
        }, 1000);
    }
    
    // Pesquisar medicamentos
    function pesquisarMedicamentos(termo) {
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const tbody = document.querySelector('#resultadosPesquisa tbody');
        tbody.innerHTML = '';
        
        let resultados = medicamentos;
        
        if (termo) {
            resultados = medicamentos.filter(med => {
                return med.nome.toLowerCase().includes(termo.toLowerCase()) || 
                       med.codigo.includes(termo) || 
                       med.lote.toLowerCase().includes(termo.toLowerCase());
            });
        }
        
        // Mostrar/ocultar coluna de ações baseado no tipo de usuário
        document.getElementById('thAcoes').style.display = isAdmin() ? 'table-cell' : 'none';
        
        if (resultados.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" style="text-align: center;">Nenhum medicamento encontrado</td>`;
            tbody.appendChild(tr);
            return;
        }
        
        resultados.forEach(med => {
            const tr = document.createElement('tr');
            
            // Verificar se está próximo do vencimento
            const hoje = new Date();
            const validade = new Date(med.dataValidade);
            const diasParaVencer = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));
            
            let status = '';
            if (diasParaVencer < 0) {
                status = '<span class="badge badge-danger">Vencido</span>';
            } else if (diasParaVencer < 30) {
                status = '<span class="badge badge-warning">Vence em ' + diasParaVencer + ' dias</span>';
            }
            
            tr.innerHTML = `
                <td>${med.codigo}</td>
                <td>${med.nome} ${status}</td>
                <td>${med.lote}</td>
                <td>${med.quantidade}</td>
                <td>${new Date(med.dataValidade).toLocaleDateString('pt-BR')}</td>
                <td>R$ ${med.valorUnitario.toFixed(2)}</td>
                <td style="display: ${isAdmin() ? 'table-cell' : 'none'}">
                    <button class="scan-btn" style="padding: 5px 10px; font-size: 12px;" onclick="excluirMedicamento(${med.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }
    
    // Excluir medicamento
    function excluirMedicamento(id) {
        if (!isAdmin()) {
            alert('Você não tem permissão para excluir medicamentos!');
            return;
        }
        
        if (confirm('Tem certeza que deseja excluir este medicamento?')) {
            const medicamentos = obterDados(MEDICAMENTOS_DB);
            const medicamentosAtualizados = medicamentos.filter(m => m.id !== id);
            salvarDados(MEDICAMENTOS_DB, medicamentosAtualizados);
            
            alert('Medicamento excluído com sucesso!');
            pesquisarMedicamentos('');
            atualizarDashboard();
        }
    }
    
    // Mudar tipo de relatório
    function mudarTipoRelatorio() {
        const tipo = document.getElementById('relatorioTipo').value;
        const periodoField = document.getElementById('periodoField');
        const mesField = document.getElementById('mesField');
        const anoField = document.getElementById('anoField');
        
        if (tipo === 'movimentacoes') {
            periodoField.style.display = 'block';
            mesField.style.display = 'none';
            anoField.style.display = 'none';
        } else if (tipo === 'gastos') {
            periodoField.style.display = 'none';
            mesField.style.display = 'block';
            anoField.style.display = 'block';
            
            // Definir mês e ano atual
            const hoje = new Date();
            document.getElementById('relatorioMes').value = hoje.getMonth() + 1;
            document.getElementById('relatorioAno').value = hoje.getFullYear();
        } else {
            periodoField.style.display = 'none';
            mesField.style.display = 'none';
            anoField.style.display = 'none';
        }
    }
    
    // Gerar relatório
    function gerarRelatorio() {
        if (!isAdmin()) {
            alert('Você não tem permissão para gerar relatórios!');
            return;
        }
        
        const tipo = document.getElementById('relatorioTipo').value;
        const periodo = tipo === 'movimentacoes' ? parseInt(document.getElementById('relatorioPeriodo').value) : 0;
        const mes = tipo === 'gastos' ? parseInt(document.getElementById('relatorioMes').value) : 0;
        const ano = tipo === 'gastos' ? parseInt(document.getElementById('relatorioAno').value) : 0;
        const resultado = document.getElementById('relatorioResultado');
        
        let html = '';
        let titulo = '';
        
        if (tipo === 'vencimentos') {
            titulo = 'Medicamentos Próximos do Vencimento';
            html = gerarRelatorioVencimentos();
        } else if (tipo === 'estoque') {
            titulo = 'Medicamentos com Estoque Baixo';
            html = gerarRelatorioEstoqueBaixo();
        } else if (tipo === 'movimentacoes') {
            titulo = 'Movimentações do Período';
            html = gerarRelatorioMovimentacoes(periodo);
        } else if (tipo === 'valor') {
            titulo = 'Valor Total em Estoque';
            html = gerarRelatorioValorEstoque();
        } else if (tipo === 'frequencia') {
            titulo = 'Frequência de Uso dos Medicamentos';
            html = gerarRelatorioFrequencia();
        } else if (tipo === 'gastos') {
            titulo = `Gastos com Medicamentos - ${mes}/${ano}`;
            html = gerarRelatorioGastos(mes, ano);
        }
        
        resultado.innerHTML = `
            <h3>${titulo}</h3>
            ${html}
        `;
    }
    
    // Gerar relatório de vencimentos
    function gerarRelatorioVencimentos() {
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const configuracoes = obterDados(CONFIGURACOES_DB);
        const diasAlerta = configuracoes.diasAlertaVencimento || 30;
        
        const hoje = new Date();
        const dataLimite = new Date();
        dataLimite.setDate(hoje.getDate() + diasAlerta);
        
        const vencimentos = medicamentos.filter(med => {
            const validade = new Date(med.dataValidade);
            return validade <= dataLimite && validade >= hoje;
        });
        
        if (vencimentos.length === 0) {
            return '<p>Nenhum medicamento próximo do vencimento.</p>';
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Medicamento</th>
                        <th>Lote</th>
                        <th>Quantidade</th>
                        <th>Data de Validade</th>
                        <th>Dias Restantes</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        vencimentos.forEach(med => {
            const validade = new Date(med.dataValidade);
            const diasRestantes = Math.floor((validade - hoje) / (1000 * 60 * 60 * 24));
            
            html += `
                <tr>
                    <td>${med.nome}</td>
                    <td>${med.lote}</td>
                    <td>${med.quantidade}</td>
                    <td>${validade.toLocaleDateString('pt-BR')}</td>
                    <td>${diasRestantes}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    // Gerar relatório de estoque baixo
    function gerarRelatorioEstoqueBaixo() {
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const configuracoes = obterDados(CONFIGURACOES_DB);
        const limite = configuracoes.limiteEstoqueBaixo || 10;
        
        const estoqueBaixo = medicamentos.filter(med => med.quantidade <= limite);
        
        if (estoqueBaixo.length === 0) {
            return '<p>Nenhum medicamento com estoque baixo.</p>';
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Medicamento</th>
                        <th>Lote</th>
                        <th>Quantidade</th>
                        <th>Valor Unitário</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        estoqueBaixo.forEach(med => {
            html += `
                <tr>
                    <td>${med.nome}</td>
                    <td>${med.lote}</td>
                    <td>${med.quantidade}</td>
                    <td>R$ ${med.valorUnitario.toFixed(2)}</td>
                    <td>R$ ${(med.quantidade * med.valorUnitario).toFixed(2)}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    // Gerar relatório de movimentações
    function gerarRelatorioMovimentacoes(dias) {
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        const usuarios = obterDados(USUARIOS_DB);
        
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);
        
        const movimentacoesFiltradas = movimentacoes.filter(mov => {
            return new Date(mov.data) >= dataLimite;
        });
        
        if (movimentacoesFiltradas.length === 0) {
            return '<p>Nenhuma movimentação no período.</p>';
        }
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Medicamento</th>
                        <th>Lote</th>
                        <th>Quantidade</th>
                        <th>Valor Total</th>
                        <th>Usuário</th>
                        <th>Tipo</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        movimentacoesFiltradas.forEach(mov => {
            const usuario = usuarios.find(u => u.id === mov.usuario) || { nome: 'Desconhecido' };
            
            html += `
                <tr>
                    <td>${new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                    <td>${mov.medicamento}</td>
                    <td>${mov.lote}</td>
                    <td>${mov.tipo === 'devolucao' ? '+' : ''}${mov.quantidade}</td>
                    <td>${mov.valorTotal ? 'R$ ' + mov.valorTotal.toFixed(2) : '-'}</td>
                    <td>${usuario.nome}</td>
                    <td>${mov.tipo === 'devolucao' ? 'Devolução' : (mov.tipo === 'saida' ? 'Saída' : 'Entrada')}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    // Gerar relatório de valor em estoque
    function gerarRelatorioValorEstoque() {
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Medicamento</th>
                        <th>Quantidade</th>
                        <th>Valor Unitário</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        let valorTotalGeral = 0;
        
        medicamentos.forEach(med => {
            const valorTotal = med.quantidade * med.valorUnitario;
            valorTotalGeral += valorTotal;
            
            html += `
                <tr>
                    <td>${med.nome}</td>
                    <td>${med.quantidade}</td>
                    <td>R$ ${med.valorUnitario.toFixed(2)}</td>
                    <td>R$ ${valorTotal.toFixed(2)}</td>
                </tr>
            `;
        });
        
        html += `
                <tr style="font-weight: bold;">
                    <td colspan="3">TOTAL GERAL</td>
                    <td>R$ ${valorTotalGeral.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
        `;
        
        return html;
    }
    
    // Gerar relatório de frequência de uso
    function gerarRelatorioFrequencia() {
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        
        // Filtrar apenas saídas (retiradas)
        const saidas = movimentacoes.filter(mov => mov.tipo === 'saida');
        
        if (saidas.length === 0) {
            return '<p>Nenhuma movimentação de saída registrada.</p>';
        }
        
        // Agrupar por medicamento e contar quantidade
        const frequencia = {};
        saidas.forEach(mov => {
            if (!frequencia[mov.medicamento]) {
                frequencia[mov.medicamento] = 0;
            }
            frequencia[mov.medicamento] += mov.quantidade;
        });
        
        // Converter para array e ordenar por quantidade (decrescente)
        const frequenciaArray = Object.entries(frequencia)
            .map(([medicamento, quantidade]) => ({ medicamento, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade);
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Posição</th>
                        <th>Medicamento</th>
                        <th>Quantidade Retirada</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        frequenciaArray.forEach((item, index) => {
            html += `
                <tr>
                    <td>${index + 1}º</td>
                    <td>${item.medicamento}</td>
                    <td>${item.quantidade}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    // Gerar relatório de gastos mensais
    function gerarRelatorioGastos(mes, ano) {
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        
        // Filtrar movimentações do mês/ano especificado
        const movimentacoesMes = movimentacoes.filter(mov => {
            const dataMov = new Date(mov.data);
            return dataMov.getMonth() + 1 === mes && 
                   dataMov.getFullYear() === ano;
        });
        
        if (movimentacoesMes.length === 0) {
            return `<p>Nenhuma movimentação registrada em ${mes}/${ano}.</p>`;
        }
        
        // Calcular totais
        let totalEntradas = 0;
        let totalSaidas = 0;
        let totalDevolucoes = 0;
        
        movimentacoesMes.forEach(mov => {
            if (mov.tipo === 'entrada' && mov.valorTotal) {
                totalEntradas += mov.valorTotal;
            } else if (mov.tipo === 'saida' && mov.valorTotal) {
                totalSaidas += mov.valorTotal;
            } else if (mov.tipo === 'devolucao') {
                // Para devoluções, subtrair do valor gasto
                totalDevolucoes += mov.valorTotal || 0;
            }
        });
        
        const totalLiquido = totalSaidas - totalDevolucoes;
        
        let html = `
            <div style="margin-bottom: 20px;">
                <h4>Resumo Financeiro</h4>
                <p><strong>Total em Compras (Entradas):</strong> R$ ${totalEntradas.toFixed(2)}</p>
                <p><strong>Total em Retiradas (Saídas):</strong> R$ ${totalSaidas.toFixed(2)}</p>
                <p><strong>Total em Devoluções:</strong> R$ ${totalDevolucoes.toFixed(2)}</p>
                <p><strong>Total Líquido Gasto:</strong> R$ ${totalLiquido.toFixed(2)}</p>
            </div>
            
            <h4>Detalhamento das Movimentações</h4>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Medicamento</th>
                        <th>Tipo</th>
                        <th>Quantidade</th>
                        <th>Valor Unitário</th>
                        <th>Valor Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        movimentacoesMes.forEach(mov => {
            const valorUnitario = mov.valorTotal && mov.quantidade ? mov.valorTotal / mov.quantidade : 0;
            
            html += `
                <tr>
                    <td>${new Date(mov.data).toLocaleDateString('pt-BR')}</td>
                    <td>${mov.medicamento}</td>
                    <td>${mov.tipo === 'devolucao' ? 'Devolução' : (mov.tipo === 'saida' ? 'Saída' : 'Entrada')}</td>
                    <td>${mov.quantidade}</td>
                    <td>${valorUnitario ? 'R$ ' + valorUnitario.toFixed(2) : '-'}</td>
                    <td>${mov.valorTotal ? 'R$ ' + mov.valorTotal.toFixed(2) : '-'}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        return html;
    }
    
    // Exportar para Excel
    function exportarParaExcel() {
        const tabela = document.getElementById('relatorioResultado');
        const tabelas = tabela.getElementsByTagName('table');
        
        if (tabelas.length === 0) {
            alert('Não há dados para exportar. Gere um relatório primeiro.');
            return;
        }
        
        // Criar uma nova pasta de trabalho
        const wb = XLSX.utils.book_new();
        
        // Para cada tabela no relatório
        for (let i = 0; i < tabelas.length; i++) {
            const worksheet = XLSX.utils.table_to_sheet(tabelas[i]);
            XLSX.utils.book_append_sheet(wb, worksheet, `Relatório${i + 1}`);
        }
        
        // Gerar nome do arquivo com data e hora
        const dataHora = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const nomeArquivo = `relatorio_medicamentos_${dataHora}.xlsx`;
        
        // Salvar arquivo
        XLSX.writeFile(wb, nomeArquivo);
        alert('Relatório exportado para Excel com sucesso!');
    }
    
    // Fazer backup
    function fazerBackup() {
        if (!isAdmin()) {
            alert('Você não tem permissão para fazer backup!');
            return;
        }
        
        const medicamentos = obterDados(MEDICAMENTOS_DB);
        const usuarios = obterDados(USUARIOS_DB);
        const movimentacoes = obterDados(MOVIMENTACOES_DB);
        const configuracoes = obterDados(CONFIGURACOES_DB);
        
        const backupData = {
            medicamentos: medicamentos,
            usuarios: usuarios,
            movimentacoes: movimentacoes,
            configuracoes: configuracoes,
            dataBackup: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_medicamentos_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Backup realizado com sucesso!');
    }
    
    // Carregar usuários
    function carregarUsuarios() {
        if (!isAdmin()) {
            alert('Você não tem permissão para gerenciar usuários!');
            return;
        }
        
        const usuarios = obterDados(USUARIOS_DB);
        const tbody = document.querySelector('#tabelaUsuarios tbody');
        tbody.innerHTML = '';
        
        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nome}</td>
                <td>${usuario.tipo === 'admin' ? 'Administrador' : 'Usuário Comum'}</td>
                <td>${new Date(usuario.dataCriacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button class="scan-btn" onclick="removerUsuario(${usuario.id})" ${usuario.id === 189 ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
    }
    
    // Adicionar usuário
    function adicionarUsuario() {
        if (!isAdmin()) {
            alert('Você não tem permissão para adicionar usuários!');
            return;
        }
        
        const nome = document.getElementById('novoUsuario').value;
        const id = parseInt(document.getElementById('novoUsuarioId').value);
        const tipo = document.getElementById('novoUsuarioTipo').value;
        
        if (!nome || !id) {
            alert('Preencha todos os campos!');
            return;
        }
        
        const usuarios = obterDados(USUARIOS_DB);
        
        if (usuarios.some(u => u.id === id)) {
            alert('Já existe um usuário com este ID!');
            return;
        }
        
        usuarios.push({ 
            id: id, 
            nome: nome,
            tipo: tipo,
            dataCriacao: new Date().toISOString()
        });
        salvarDados(USUARIOS_DB, usuarios);
        
        alert('Usuário adicionado com sucesso!');
        
        // Limpar formulário e atualizar lista
        document.getElementById('novoUsuario').value = '';
        document.getElementById('novoUsuarioId').value = '';
        document.getElementById('novoUsuarioTipo').value = 'comum';
        carregarUsuarios();
    }
    
    // Remover usuário
    function removerUsuario(id) {
        if (!isAdmin()) {
            alert('Você não tem permissão para remover usuários!');
            return;
        }
        
        if (id === 189) {
            alert('Não é possível remover o administrador master!');
            return;
        }
        
        if (confirm('Tem certeza que deseja remover este usuário?')) {
            const usuarios = obterDados(USUARIOS_DB);
            const usuariosAtualizados = usuarios.filter(u => u.id !== id);
            salvarDados(USUARIOS_DB, usuariosAtualizados);
            
            alert('Usuário removido com sucesso!');
            carregarUsuarios();
        }
    }
    
    // Inicializar a aplicação
    window.onload = function() {
        inicializarBancosDeDados();
        document.getElementById('userId').focus();
        toggleMotivoField(); // Inicializar visibilidade do campo motivo
        mudarTipoRelatorio(); // Inicializar visibilidade do campo período
    };
</script>
