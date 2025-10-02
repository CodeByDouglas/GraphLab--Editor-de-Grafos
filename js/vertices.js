export const metodosVertices = {
    criarVertice(x, y, rotulo = null, opcoes = {}) {
        const { id = null, ignorarHistorico = false } = opcoes;
        const possuiIdDefinido = id !== null && id !== undefined;
        const idVertice = possuiIdDefinido ? id : this.contadorIdVertice++;

        if (possuiIdDefinido) {
            this.contadorIdVertice = Math.max(this.contadorIdVertice, idVertice + 1);
        }

        const containerVertice = new PIXI.Container();
        containerVertice.idVertice = idVertice;
        containerVertice.x = x;
        containerVertice.y = y;

        const circulo = new PIXI.Graphics();

        containerVertice.eventMode = 'static';
        containerVertice.cursor = 'pointer';
        containerVertice.hitArea = new PIXI.Circle(0, 0, this.raioVerticeSelecionado);

        const rotuloVertice = rotulo !== null && rotulo !== undefined ? rotulo : String(idVertice);
        const texto = new PIXI.Text(rotuloVertice, {
            fontFamily: 'Inter',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
        });
        texto.anchor.set(0.5);

        containerVertice.addChild(circulo);
        containerVertice.addChild(texto);

        this.containerVertices.addChild(containerVertice);

        this.vertices.set(idVertice, {
            id: idVertice,
            container: containerVertice,
            circulo,
            texto,
            x,
            y,
            rotulo: rotuloVertice,
            cor: this.corVertice,
            corBorda: this.corAresta,
            raio: this.raioBaseVertice,
            arestas: new Set()
        });

        this.aplicarEstiloVertice(idVertice, { selecionado: false, ignorarAtualizacaoArestas: true });
        this.configurarEventosVertice(containerVertice);

        if (!ignorarHistorico) {
            this.salvarNoHistorico();
        }
        this.atualizarEstatisticas();

        return idVertice;
    },

    async tratarCliqueConexao(idVertice) {
        if (!this.vertices.has(idVertice)) return;

        if (!this.selecaoConexao.length) {
            this.selecaoConexao = [idVertice];
            this.aplicarEstiloVertice(idVertice, { selecionado: true });
            return;
        }

        const [primeiroId] = this.selecaoConexao;
        if (primeiroId === idVertice) {
            const devePermanecerSelecionado = this.elementosSelecionados.has(idVertice);
            this.aplicarEstiloVertice(idVertice, { selecionado: devePermanecerSelecionado });
            this.selecaoConexao = [];
            return;
        }

        if (this.possuiConexao(primeiroId, idVertice)) {
            await this.exibirAlerta('Esses vértices já estão conectados.');
            const deveSelecionarPrimeiro = this.elementosSelecionados.has(primeiroId);
            const deveSelecionarSegundo = this.elementosSelecionados.has(idVertice);
            this.aplicarEstiloVertice(primeiroId, { selecionado: deveSelecionarPrimeiro });
            this.aplicarEstiloVertice(idVertice, { selecionado: deveSelecionarSegundo });
            this.selecaoConexao = [];
            return;
        }

        this.aplicarEstiloVertice(idVertice, { selecionado: true });

        const respostaPeso = await this.exibirDialogoEntrada({
            titulo: 'Nova aresta',
            mensagem: 'Qual o peso da aresta?',
            placeholderEntrada: 'Peso',
            valorEntrada: '1',
            textoConfirmar: 'Adicionar'
        });

        const finalizarSelecao = () => {
            const selecionarPrimeiro = this.elementosSelecionados.has(primeiroId);
            const selecionarSegundo = this.elementosSelecionados.has(idVertice);
            this.aplicarEstiloVertice(primeiroId, { selecionado: selecionarPrimeiro });
            this.aplicarEstiloVertice(idVertice, { selecionado: selecionarSegundo });
            this.selecaoConexao = [];
        };

        if (respostaPeso === null) {
            finalizarSelecao();
            return;
        }

        const pesoArestaTexto = respostaPeso.trim();
        if (!pesoArestaTexto.length) {
            await this.exibirAlerta('Informe um peso válido.');
            finalizarSelecao();
            return;
        }

        const pesoNumerico = Number(pesoArestaTexto);
        if (!Number.isInteger(pesoNumerico) || pesoNumerico <= 0) {
            await this.exibirAlerta('Informe um peso inteiro positivo.');
            finalizarSelecao();
            return;
        }

        this.criarAresta(primeiroId, idVertice, { peso: pesoNumerico });
        finalizarSelecao();
    },

    limparSelecaoConexao() {
        if (!this.selecaoConexao.length) return;
        this.selecaoConexao.forEach(idVertice => {
            if (!this.vertices.has(idVertice)) return;
            const devePermanecerSelecionado = this.elementosSelecionados.has(idVertice);
            this.aplicarEstiloVertice(idVertice, { selecionado: devePermanecerSelecionado });
        });
        this.selecaoConexao = [];
    },

    removerVerticeDaSelecaoConexao(idVertice) {
        if (!this.selecaoConexao.length) return;
        this.selecaoConexao = this.selecaoConexao.filter(id => id !== idVertice);
    },

    criarVerticesIniciais(quantidade) {
        if (quantidade <= 0) {
            return;
        }

        const centroGlobal = new PIXI.Point(
            this.aplicacao.screen.width / 2,
            this.aplicacao.screen.height / 2
        );
        const centro = this.containerGrafo.toLocal(centroGlobal);

        const espacamento = this.raioVerticeSelecionado * 3.2;

        if (quantidade === 1) {
            const posicao = this.encontrarPosicaoLivre(centro.x, centro.y, espacamento);
            this.criarVertice(posicao.x, posicao.y, null, { ignorarHistorico: true });
            return;
        }

        const anguloDourado = Math.PI * (3 - Math.sqrt(5));
        const espacamentoBase = espacamento;
        const raioMinimo = espacamentoBase;
        const raioMaximoCanvas = Math.min(this.aplicacao.screen.width, this.aplicacao.screen.height) * 0.45;
        const escala = Math.min(1, raioMaximoCanvas / (espacamentoBase * Math.sqrt(Math.max(quantidade - 1, 1))));

        for (let indice = 0; indice < quantidade; indice++) {
            if (indice === 0) {
                const posicao = this.encontrarPosicaoLivre(centro.x, centro.y, espacamento);
                this.criarVertice(posicao.x, posicao.y, null, { ignorarHistorico: true });
                continue;
            }

            const raio = Math.max(
                raioMinimo,
                espacamentoBase * Math.sqrt(indice) * escala
            );
            const angulo = anguloDourado * indice;

            const posicaoX = centro.x + Math.cos(angulo) * raio;
            const posicaoY = centro.y + Math.sin(angulo) * raio;

            const posicao = this.encontrarPosicaoLivre(posicaoX, posicaoY, espacamento);
            this.criarVertice(posicao.x, posicao.y, null, { ignorarHistorico: true });
        }
    },

    obterCentroDaJanela() {
        const centroGlobal = new PIXI.Point(
            this.aplicacao.screen.width / 2,
            this.aplicacao.screen.height / 2
        );
        return this.containerGrafo.toLocal(centroGlobal);
    },

    adicionarVerticeNoCentroDaJanela() {
        const centro = this.obterCentroDaJanela();
        const espacamento = this.raioVerticeSelecionado * 3;
        const posicao = this.encontrarPosicaoLivre(centro.x, centro.y, espacamento);
        this.criarVertice(posicao.x, posicao.y);
    },

    posicaoOcupada(x, y, espacamento) {
        for (const vertice of this.vertices.values()) {
            if (Math.hypot(vertice.x - x, vertice.y - y) < espacamento) {
                return true;
            }
        }
        return false;
    },

    encontrarPosicaoLivre(x, y, espacamento) {
        if (!this.posicaoOcupada(x, y, espacamento)) {
            return { x, y };
        }

        const anelMaximo = 6;
        const passosPorAnel = 16;

        for (let anel = 1; anel <= anelMaximo; anel++) {
            const raio = espacamento * anel;
            for (let passo = 0; passo < passosPorAnel; passo++) {
                const angulo = (Math.PI * 2 * passo) / passosPorAnel;
                const candidatoX = x + Math.cos(angulo) * raio;
                const candidatoY = y + Math.sin(angulo) * raio;
                if (!this.posicaoOcupada(candidatoX, candidatoY, espacamento * 0.85)) {
                    return { x: candidatoX, y: candidatoY };
                }
            }
        }

        return { x: x + espacamento, y };
    },

    configurarEventosVertice(containerVertice) {
        let dadosArraste = null;

        containerVertice.on('pointerdown', (evento) => {
            if (this.ferramentaAtual === 'mover') {
                dadosArraste = {
                    inicioX: evento.global.x,
                    inicioY: evento.global.y,
                    verticeInicioX: containerVertice.x,
                    verticeInicioY: containerVertice.y
                };
                this.estaArrastando = true;

                if (!evento.shiftKey) {
                    this.limparSelecao();
                }
                this.selecionarVertice(containerVertice.idVertice);
            } else if (this.ferramentaAtual === 'conectar') {
                this.tratarCliqueConexao(containerVertice.idVertice);
            } else if (this.ferramentaAtual === 'apagar') {
                this.removerVertice(containerVertice.idVertice);
            }

            evento.stopPropagation();
        });

        containerVertice.on('pointermove', (evento) => {
            if (this.ferramentaAtual === 'mover' && this.estaArrastando && dadosArraste) {
                const deslocamentoX = evento.global.x - dadosArraste.inicioX;
                const deslocamentoY = evento.global.y - dadosArraste.inicioY;

                containerVertice.x = dadosArraste.verticeInicioX + deslocamentoX / this.nivelZoom;
                containerVertice.y = dadosArraste.verticeInicioY + deslocamentoY / this.nivelZoom;

                const vertice = this.vertices.get(containerVertice.idVertice);
                vertice.x = containerVertice.x;
                vertice.y = containerVertice.y;

                this.agendarAtualizacaoArestasConectadas(containerVertice.idVertice);
            }
        });

        const finalizarArraste = () => {
            if (this.ferramentaAtual === 'mover' && this.estaArrastando && dadosArraste) {
                this.estaArrastando = false;
                dadosArraste = null;
                this.salvarNoHistorico();
            }
        };

        containerVertice.on('pointerup', finalizarArraste);
        containerVertice.on('pointerupoutside', finalizarArraste);

        containerVertice.on('rightclick', (evento) => {
            evento.preventDefault();
            this.exibirMenuContexto(evento.global.x, evento.global.y, containerVertice.idVertice);
        });
    },

    agendarAtualizacaoArestasConectadas(idVertice) {
        if (!idVertice) return;
        this.atualizacoesPendentesArestas.add(idVertice);
        if (!this.atualizacaoArestaAgendada) {
            this.atualizacaoArestaAgendada = true;
            requestAnimationFrame(() => this.processarAtualizacoesArestas());
        }
    },

    processarAtualizacoesArestas() {
        this.atualizacoesPendentesArestas.forEach(idVertice => this.atualizarArestasConectadas(idVertice));
        this.atualizacoesPendentesArestas.clear();
        this.atualizacaoArestaAgendada = false;
    },

    aplicarEstiloVertice(idVertice, { selecionado = this.elementosSelecionados.has(idVertice), ignorarAtualizacaoArestas = false } = {}) {
        const vertice = this.vertices.get(idVertice);
        if (!vertice) return;

        const corBorda = vertice.corBorda || this.corAresta;
        const larguraBorda = this.larguraBordaVertice;
        const raio = selecionado ? this.raioVerticeSelecionado : this.raioBaseVertice;
        vertice.raio = raio;

        vertice.circulo.clear();
        vertice.circulo.beginFill(vertice.cor);
        vertice.circulo.lineStyle(larguraBorda, corBorda, 1);
        vertice.circulo.drawCircle(0, 0, raio);
        vertice.circulo.endFill();

        vertice.container.hitArea = new PIXI.Circle(0, 0, raio);

        if (!ignorarAtualizacaoArestas) {
            this.atualizarArestasConectadas(vertice.id);
        }
    },

    selecionarVertice(idVertice) {
        const vertice = this.vertices.get(idVertice);
        if (!vertice) return;

        this.elementosSelecionados.add(idVertice);
        this.aplicarEstiloVertice(idVertice, { selecionado: true });

        this.atualizarPainelPropriedades(vertice);
    },

    limparSelecao() {
        this.elementosSelecionados.forEach(idElemento => {
            if (this.vertices.has(idElemento)) {
                const vertice = this.vertices.get(idElemento);
                if (vertice) {
                    const permaneceDestacado = this.selecaoConexao.includes(vertice.id);
                    this.aplicarEstiloVertice(vertice.id, { selecionado: permaneceDestacado });
                }
            }
        });
        this.elementosSelecionados.clear();
        this.limparPainelPropriedades();
    },

    removerVertice(idVertice) {
        const vertice = this.vertices.get(idVertice);
        if (!vertice) return;

        vertice.arestas.forEach(idAresta => {
            this.removerAresta(idAresta, { ignorarHistorico: true });
        });

        this.containerVertices.removeChild(vertice.container);
        vertice.container.destroy({ children: true });

        this.vertices.delete(idVertice);
        this.removerVerticeDaSelecaoConexao(idVertice);
        this.elementosSelecionados.delete(idVertice);
        this.atualizacoesPendentesArestas.delete(idVertice);

        this.salvarNoHistorico();
        this.atualizarEstatisticas();
    },

    excluirSelecionados() {
        const itensExcluir = Array.from(this.elementosSelecionados);
        itensExcluir.forEach(idElemento => {
            if (this.vertices.has(idElemento)) {
                this.removerVertice(idElemento);
            }
        });
        this.limparSelecao();
    },

    duplicarSelecionados() {
        const itensDuplicar = Array.from(this.elementosSelecionados);
        const deslocamento = 50;

        itensDuplicar.forEach(idElemento => {
            if (this.vertices.has(idElemento)) {
                const original = this.vertices.get(idElemento);
                if (original) {
                    this.criarVertice(
                        original.x + deslocamento,
                        original.y + deslocamento,
                        original.rotulo + '_copia'
                    );
                }
            }
        });
    },

    selecionarTodos() {
        this.vertices.forEach((vertice, idVertice) => {
            this.selecionarVertice(idVertice);
        });
    }
};
