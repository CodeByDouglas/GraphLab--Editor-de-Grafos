export const metodosInterface = {
    configurarEventos() {
        this.aplicacao.stage.on('pointerdown', (evento) => {
            if (evento.button === 2) {
                return;
            }

            const posicaoLocal = this.containerGrafo.toLocal(evento.global);

            if (this.ferramentaAtual === 'apagar') {
                const apagou = this.tentarApagarArestaNoPonto(posicaoLocal);
                if (apagou) {
                    return;
                }
            }

            if (this.ferramentaAtual === 'conectar' && this.selecaoConexao.length) {
                this.limparSelecaoConexao();
            }

            if (this.ferramentaAtual === 'mover' && !evento.shiftKey) {
                this.limparSelecao();
            }

            this.estaArrastandoVista = true;
            this.inicioArrasteVista = { x: evento.global.x, y: evento.global.y };
            this.posicaoInicialContainer = {
                x: this.containerGrafo.x,
                y: this.containerGrafo.y
            };
        });

        this.aplicacao.stage.on('pointermove', (evento) => {
            if (this.estaArrastandoVista && this.inicioArrasteVista) {
                const deslocamentoX = evento.global.x - this.inicioArrasteVista.x;
                const deslocamentoY = evento.global.y - this.inicioArrasteVista.y;
                this.containerGrafo.x = this.posicaoInicialContainer.x + deslocamentoX;
                this.containerGrafo.y = this.posicaoInicialContainer.y + deslocamentoY;
            }
        });

        const finalizarArrasteVista = () => {
            this.estaArrastandoVista = false;
            this.inicioArrasteVista = null;
        };

        this.aplicacao.stage.on('pointerup', finalizarArrasteVista);
        this.aplicacao.stage.on('pointerupoutside', finalizarArrasteVista);

        window.addEventListener('resize', () => {
            this.aplicacao.renderer.resize(window.innerWidth, window.innerHeight);
            this.atualizarTamanhoGrade();
        });

        document.getElementById('menuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('hidden');
        });
    },

    configurarBarraFerramentas() {
        const barraFerramentas = document.querySelector('.bottom-toolbar');
        if (!barraFerramentas) return;

        const botoesFerramenta = barraFerramentas.querySelectorAll('[data-tool]');
        botoesFerramenta.forEach(botao => {
            botao.addEventListener('click', () => {
                this.definirFerramenta(botao.dataset.tool);
            });
        });

        const botoesAcao = barraFerramentas.querySelectorAll('[data-action]');
        botoesAcao.forEach(botao => {
            botao.addEventListener('click', () => {
                this.executarAcaoBarraFerramentas(botao.dataset.action);
            });
        });

        this.definirFerramenta(this.ferramentaAtual);
    },

    configurarAtalhosTeclado() {
        document.addEventListener('keydown', (evento) => {
            const elementoAtivo = document.activeElement && document.activeElement.tagName;
            if (elementoAtivo && ['INPUT', 'TEXTAREA'].includes(elementoAtivo)) {
                return;
            }

            if (!evento.ctrlKey && !evento.metaKey) {
                switch (evento.key.toLowerCase()) {
                    case 'm':
                        this.definirFerramenta('mover');
                        break;
                    case 'c':
                        this.definirFerramenta('conectar');
                        break;
                    case 'a':
                        this.executarAcaoBarraFerramentas('adicionar-vertice');
                        break;
                    case 'r':
                        this.executarAcaoBarraFerramentas('arestas-aleatorias');
                        break;
                    case 'x':
                        this.definirFerramenta('apagar');
                        break;
                    case 'escape':
                        this.definirFerramenta('mover');
                        break;
                    case 'delete':
                    case 'backspace':
                        if (this.elementosSelecionados.size > 0) {
                            this.excluirSelecionados();
                        } else {
                            this.definirFerramenta('apagar');
                        }
                        break;
                }
            }

            if (evento.ctrlKey || evento.metaKey) {
                switch (evento.key.toLowerCase()) {
                    case 'z':
                        evento.preventDefault();
                        this.desfazer();
                        break;
                    case 'y':
                        evento.preventDefault();
                        this.refazer();
                        break;
                    case 's':
                        evento.preventDefault();
                        this.salvarGrafo();
                        break;
                    case 'o':
                        evento.preventDefault();
                        document.getElementById('fileInput').click();
                        break;
                    case 'a':
                        evento.preventDefault();
                        this.selecionarTodos();
                        break;
                }
            }
        });
    },

    definirFerramenta(nomeFerramenta) {
        const barraFerramentas = document.querySelector('.bottom-toolbar');
        if (barraFerramentas) {
            barraFerramentas.querySelectorAll('[data-tool]').forEach(botao => {
                if (botao.dataset.tool === nomeFerramenta) {
                    botao.classList.add('active');
                } else {
                    botao.classList.remove('active');
                }
            });
        }

        if (this.ferramentaAtual === 'conectar' && nomeFerramenta !== 'conectar') {
            this.limparSelecaoConexao();
        }

        this.ferramentaAtual = nomeFerramenta;
        this.atualizarCursor();
    },

    atualizarCursor() {
        switch (this.ferramentaAtual) {
            case 'conectar':
                this.aplicacao.view.style.cursor = 'crosshair';
                break;
            case 'apagar':
                this.aplicacao.view.style.cursor = 'not-allowed';
                break;
            case 'mover':
            default:
                this.aplicacao.view.style.cursor = 'default';
                break;
        }
    },

    executarAcaoBarraFerramentas(acao) {
        switch (acao) {
            case 'adicionar-vertice':
                this.adicionarVerticeNoCentroDaJanela();
                break;
            case 'arestas-aleatorias':
                this.gerarArestasAleatorias();
                break;
            default:
        }
    },

    configurarSelecionadoresCor() {
        const seletorCorVertices = document.getElementById('nodeColorPicker');
        const seletorCorArestas = document.getElementById('edgeColorPicker');

        seletorCorVertices.addEventListener('change', (evento) => {
            this.corVertice = parseInt(evento.target.value.replace('#', '0x'));
        });

        seletorCorArestas.addEventListener('change', (evento) => {
            this.corAresta = parseInt(evento.target.value.replace('#', '0x'));
            this.vertices.forEach(vertice => {
                vertice.corBorda = this.corAresta;
                this.aplicarEstiloVertice(vertice.id, { selecionado: this.elementosSelecionados.has(vertice.id) });
            });
            this.arestas.forEach(aresta => {
                aresta.cor = this.corAresta;
                this.atualizarDesenhoAresta(aresta);
            });
        });
    },

    configurarOperacoesArquivo() {
        document.getElementById('newFileBtn').addEventListener('click', async () => {
            const entrada = await this.exibirDialogoEntrada({
                titulo: 'Novo grafo',
                mensagem: 'Quantos vértices deseja criar no novo grafo?',
                placeholderEntrada: 'Quantidade de vértices',
                valorEntrada: '0',
                textoConfirmar: 'Criar'
            });
            if (entrada === null) {
                return;
            }

            const quantidade = Number(entrada.trim());
            if (!Number.isInteger(quantidade) || quantidade < 0) {
                await this.exibirAlerta('Informe um número inteiro maior ou igual a zero.');
                return;
            }

            this.limparGrafo();
            this.restaurarZoom();
            if (quantidade > 0) {
                this.criarVerticesIniciais(quantidade);
            }
            this.salvarNoHistorico();
            document.getElementById('fileName').value = 'Grafo sem título';
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.salvarGrafo();
        });

        document.getElementById('openFileBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (evento) => {
            const arquivo = evento.target.files[0];
            if (arquivo) {
                this.carregarGrafo(arquivo);
            }
        });

        const botaoDesfazer = document.getElementById('undoBtn');
        if (botaoDesfazer) {
            botaoDesfazer.addEventListener('click', () => this.desfazer());
        }

        const botaoRefazer = document.getElementById('redoBtn');
        if (botaoRefazer) {
            botaoRefazer.addEventListener('click', () => this.refazer());
        }
    },

    configurarModalExportacao() {
        const botaoExportar = document.getElementById('exportBtn');
        const modal = document.getElementById('exportModal');
        const botaoFechar = document.getElementById('closeExportModal');

        botaoExportar.addEventListener('click', () => {
            modal.classList.add('show');
        });

        botaoFechar.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        modal.addEventListener('click', (evento) => {
            if (evento.target === modal) {
                modal.classList.remove('show');
            }
        });

        const opcoesExportacao = document.querySelectorAll('.export-option');
        opcoesExportacao.forEach(opcao => {
            opcao.addEventListener('click', () => {
                const formato = opcao.dataset.format;
                this.exportarGrafo(formato);
                modal.classList.remove('show');
            });
        });
    },

    configurarMenuContexto() {
        const menuContexto = document.getElementById('contextMenu');

        document.addEventListener('click', () => {
            menuContexto.classList.remove('show');
        });

        document.getElementById('duplicateBtn').addEventListener('click', () => {
            this.duplicarSelecionados();
            menuContexto.classList.remove('show');
        });

        document.getElementById('deleteContextBtn').addEventListener('click', () => {
            this.excluirSelecionados();
            menuContexto.classList.remove('show');
        });

        this.aplicacao.view.addEventListener('contextmenu', (evento) => {
            evento.preventDefault();
        });
    },

    configurarPainelAjuda() {
        const alternadorAjuda = document.getElementById('helpToggle');
        const conteudoAjuda = document.getElementById('helpContent');

        alternadorAjuda.addEventListener('click', () => {
            conteudoAjuda.classList.toggle('show');
        });

        document.addEventListener('click', (evento) => {
            if (!alternadorAjuda.contains(evento.target) && !conteudoAjuda.contains(evento.target)) {
                conteudoAjuda.classList.remove('show');
            }
        });
    },

    configurarControlesZoom() {
        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.ajustarZoom(1.2);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.ajustarZoom(0.8);
        });

        document.getElementById('resetZoomBtn').addEventListener('click', () => {
            this.restaurarZoom();
        });

        this.aplicacao.view.addEventListener('wheel', (evento) => {
            evento.preventDefault();
            const fator = evento.deltaY > 0 ? 0.9 : 1.1;
            const retangulo = this.aplicacao.view.getBoundingClientRect();
            const resolucao = this.aplicacao.renderer.resolution || 1;
            const ancora = new PIXI.Point(
                (evento.clientX - retangulo.left) * resolucao,
                (evento.clientY - retangulo.top) * resolucao
            );
            this.ajustarZoom(fator, ancora);
        });
    },

    ajustarZoom(fator, pontoAncora = null) {
        const novoZoom = Math.min(this.zoomMaximo, Math.max(this.zoomMinimo, this.nivelZoom * fator));
        this.aplicarNivelZoom(novoZoom, pontoAncora);
    },

    aplicarNivelZoom(nivel, pontoAncora = null) {
        const nivelAjustado = Math.min(this.zoomMaximo, Math.max(this.zoomMinimo, nivel));
        const ancora = pontoAncora || new PIXI.Point(
            this.aplicacao.screen.width / 2,
            this.aplicacao.screen.height / 2
        );

        const mundoAntes = this.containerGrafo.toLocal(ancora);

        this.nivelZoom = nivelAjustado;
        this.containerGrafo.scale.set(this.nivelZoom);

        const mundoDepois = this.containerGrafo.toGlobal(mundoAntes);
        this.containerGrafo.x += ancora.x - mundoDepois.x;
        this.containerGrafo.y += ancora.y - mundoDepois.y;

        document.getElementById('zoomLevel').textContent = Math.round(this.nivelZoom * 100) + '%';
    },

    restaurarZoom() {
        this.aplicarNivelZoom(1);
        this.containerGrafo.position.set(0, 0);
        document.getElementById('zoomLevel').textContent = '100%';
    },

    exibirMenuContexto(x, y, idVertice) {
        const menuContexto = document.getElementById('contextMenu');
        menuContexto.style.left = x + 'px';
        menuContexto.style.top = y + 'px';
        menuContexto.classList.add('show');
    },

    atualizarPainelPropriedades(vertice) {
        const painel = document.getElementById('propertiesPanel');
        painel.innerHTML = `
            <div class="property-item">
                <label>ID:</label>
                <span>${vertice.id}</span>
            </div>
            <div class="property-item">
                <label>Label:</label>
                <input type="text" value="${vertice.rotulo}" id="nodeLabelInput" />
            </div>
            <div class="property-item">
                <label>Posição X:</label>
                <span>${Math.round(vertice.x)}</span>
            </div>
            <div class="property-item">
                <label>Posição Y:</label>
                <span>${Math.round(vertice.y)}</span>
            </div>
            <div class="property-item">
                <label>Conexões:</label>
                <span>${vertice.arestas.size}</span>
            </div>
        `;

        const estilo = document.createElement('style');
        estilo.textContent = `
            .property-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 13px;
            }
            .property-item label {
                color: var(--gray-lighter);
            }
            .property-item input {
                background: var(--black-charcoal);
                border: 1px solid var(--gray-light);
                color: var(--white-90);
                padding: 2px 6px;
                border-radius: 4px;
                width: 100px;
            }
        `;
        document.head.appendChild(estilo);

        document.getElementById('nodeLabelInput').addEventListener('change', (evento) => {
            vertice.rotulo = evento.target.value;
            vertice.texto.text = evento.target.value;
        });
    },

    limparPainelPropriedades() {
        const painel = document.getElementById('propertiesPanel');
        painel.innerHTML = '<p class="empty-state">Selecione um elemento para ver suas propriedades</p>';
    },

    atualizarEstatisticas() {
        document.getElementById('nodeCount').textContent = this.vertices.size;
        document.getElementById('edgeCount').textContent = this.arestas.size;

        const componentes = this.calcularComponentes();
        document.getElementById('componentCount').textContent = componentes;
    },

    calcularComponentes() {
        if (this.vertices.size === 0) return 0;

        const visitados = new Set();
        let componentes = 0;

        const percorrer = (idVertice) => {
            visitados.add(idVertice);
            const vertice = this.vertices.get(idVertice);

            vertice.arestas.forEach(idAresta => {
                const aresta = this.arestas.get(idAresta);
                const vizinhoId = aresta.origem === idVertice ? aresta.destino : aresta.origem;

                if (!visitados.has(vizinhoId)) {
                    percorrer(vizinhoId);
                }
            });
        };

        this.vertices.forEach((vertice, idVertice) => {
            if (!visitados.has(idVertice)) {
                componentes++;
                percorrer(idVertice);
            }
        });

        return componentes;
    }
};
