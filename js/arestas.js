export const metodosArestas = {
    encontrarAresta(idOrigem, idDestino) {
        return Array.from(this.arestas.values()).find(aresta => aresta.origem === idOrigem && aresta.destino === idDestino) || null;
    },

    possuiConexao(idOrigem, idDestino) {
        return !!this.encontrarAresta(idOrigem, idDestino) || !!this.encontrarAresta(idDestino, idOrigem);
    },

    criarAresta(idOrigem, idDestino, opcoes = {}) {
        if (!this.vertices.has(idOrigem) || !this.vertices.has(idDestino)) {
            return null;
        }

        if (idOrigem === idDestino) {
            return null;
        }

        const { ignorarHistorico = false, cor = this.corAresta, peso = null, permitirOposta = false } = opcoes;

        const verticeOrigem = this.vertices.get(idOrigem);
        const verticeDestino = this.vertices.get(idDestino);

        if (!verticeOrigem || !verticeDestino) {
            return null;
        }

        const arestaOposta = this.encontrarAresta(idDestino, idOrigem);
        if (arestaOposta && !permitirOposta) {
            return null;
        }

        const arestaExistente = this.encontrarAresta(idOrigem, idDestino);
        if (arestaExistente) {
            const pesoNormalizado = (peso !== null && peso !== undefined && peso !== '') ? peso : null;
            if (pesoNormalizado !== null) {
                arestaExistente.peso = pesoNormalizado;
                if (!arestaExistente.rotulo) {
                    arestaExistente.rotulo = this.criarRotuloAresta(pesoNormalizado);
                    this.containerRotulos.addChild(arestaExistente.rotulo);
                }
                arestaExistente.rotulo.text = String(pesoNormalizado);
                this.atualizarDesenhoAresta(arestaExistente);
            } else if (arestaExistente.rotulo) {
                this.containerRotulos.removeChild(arestaExistente.rotulo);
                arestaExistente.rotulo.destroy();
                arestaExistente.rotulo = null;
                arestaExistente.peso = null;
            }
            if (!ignorarHistorico) {
                this.salvarNoHistorico();
                this.atualizarEstatisticas();
            }
            return arestaExistente.id;
        }

        const idAresta = `aresta_${this.contadorIdAresta++}`;
        const containerAresta = new PIXI.Container();
        containerAresta.idAresta = idAresta;

        const grafico = new PIXI.Graphics();
        containerAresta.addChild(grafico);
        this.containerArestas.addChild(containerAresta);

        const pesoNormalizado = (peso !== null && peso !== undefined && peso !== '') ? peso : null;

        let rotulo = null;
        if (pesoNormalizado !== null) {
            rotulo = this.criarRotuloAresta(pesoNormalizado);
            this.containerRotulos.addChild(rotulo);
        }

        const aresta = {
            id: idAresta,
            origem: idOrigem,
            destino: idDestino,
            container: containerAresta,
            grafico,
            cor,
            peso: pesoNormalizado,
            rotulo
        };

        this.arestas.set(idAresta, aresta);

        verticeOrigem.arestas.add(idAresta);
        verticeDestino.arestas.add(idAresta);

        this.atualizarDesenhoAresta(aresta);

        if (!ignorarHistorico) {
            this.salvarNoHistorico();
        }

        this.atualizarEstatisticas();
        return idAresta;
    },

    atualizarDesenhoAresta(aresta, corAlternativa = null) {
        if (!aresta) return;

        const verticeOrigem = this.vertices.get(aresta.origem);
        const verticeDestino = this.vertices.get(aresta.destino);
        if (!verticeOrigem || !verticeDestino) {
            return;
        }

        const grafico = aresta.grafico;
        const cor = corAlternativa || aresta.cor || this.corAresta;
        aresta.cor = cor;

        grafico.clear();

        const posicaoOrigem = verticeOrigem.container;
        const posicaoDestino = verticeDestino.container;

        const deltaX = posicaoDestino.x - posicaoOrigem.x;
        const deltaY = posicaoDestino.y - posicaoOrigem.y;
        const distanciaCentros = Math.hypot(deltaX, deltaY);

        if (distanciaCentros === 0) {
            return;
        }

        const direcaoX = deltaX / distanciaCentros;
        const direcaoY = deltaY / distanciaCentros;

        const raioOrigem = verticeOrigem.raio || this.raioBaseVertice;
        const raioDestino = verticeDestino.raio || this.raioBaseVertice;

        const deslocamentoInicial = Math.max(raioOrigem - this.larguraBordaVertice * 0.5, 0);
        const deslocamentoFinal = Math.max(raioDestino - this.larguraBordaVertice * 0.5, 0);

        const inicioX = posicaoOrigem.x + direcaoX * deslocamentoInicial;
        const inicioY = posicaoOrigem.y + direcaoY * deslocamentoInicial;
        const fimX = posicaoDestino.x - direcaoX * deslocamentoFinal;
        const fimY = posicaoDestino.y - direcaoY * deslocamentoFinal;

        const segmentoX = fimX - inicioX;
        const segmentoY = fimY - inicioY;
        const comprimentoSegmento = Math.hypot(segmentoX, segmentoY);

        if (comprimentoSegmento <= 0) {
            return;
        }

        const direcaoSegmentoX = segmentoX / comprimentoSegmento;
        const direcaoSegmentoY = segmentoY / comprimentoSegmento;

        const comprimentoSeta = Math.min(
            Math.max(comprimentoSegmento * 0.25, raioOrigem * 0.45),
            Math.min(comprimentoSegmento, raioOrigem * 0.9)
        );

        const deslocamentoBase = 0;
        const centroBaseX = inicioX - direcaoSegmentoX * deslocamentoBase;
        const centroBaseY = inicioY - direcaoSegmentoY * deslocamentoBase;

        const pontaX = inicioX + direcaoSegmentoX * comprimentoSeta;
        const pontaY = inicioY + direcaoSegmentoY * comprimentoSeta;

        const larguraBase = Math.max(raioOrigem * 1.35, comprimentoSeta * 0.95);
        const meiaBase = larguraBase / 2;
        const normalX = -direcaoSegmentoY;
        const normalY = direcaoSegmentoX;

        const baseEsquerdaX = centroBaseX + normalX * meiaBase;
        const baseEsquerdaY = centroBaseY + normalY * meiaBase;
        const baseDireitaX = centroBaseX - normalX * meiaBase;
        const baseDireitaY = centroBaseY - normalY * meiaBase;

        grafico.beginFill(cor, 1);
        grafico.moveTo(baseEsquerdaX, baseEsquerdaY);
        grafico.lineTo(baseDireitaX, baseDireitaY);
        grafico.lineTo(pontaX, pontaY);
        grafico.lineTo(baseEsquerdaX, baseEsquerdaY);
        grafico.endFill();

        grafico.lineStyle(3, cor, 1);
        const inicioLinhaX = pontaX - direcaoSegmentoX * 0.5;
        const inicioLinhaY = pontaY - direcaoSegmentoY * 0.5;
        grafico.moveTo(inicioLinhaX, inicioLinhaY);
        grafico.lineTo(fimX, fimY);

        if (aresta.rotulo) {
            const meioX = (pontaX + fimX) / 2;
            const meioY = (pontaY + fimY) / 2;
            const deslocamentoRotulo = 12;
            aresta.rotulo.position.set(
                meioX + normalX * deslocamentoRotulo,
                meioY + normalY * deslocamentoRotulo
            );
        }
    },

    criarRotuloAresta(peso) {
        const rotulo = new PIXI.Text(String(peso), {
            fontFamily: 'Inter',
            fontSize: 12,
            fill: 0xFFFFFF,
            fontWeight: '600',
            align: 'center'
        });
        rotulo.anchor.set(0.5);
        return rotulo;
    },

    gerarArestasAleatorias() {
        const idsVertices = Array.from(this.vertices.keys());
        if (idsVertices.length < 2) {
            this.exibirAlerta('São necessários pelo menos dois vértices para gerar arestas.');
            return;
        }

        let criouAlguma = false;
        const densidade = Math.min(0.6, 3 / idsVertices.length + 0.15);

        for (let i = 0; i < idsVertices.length; i++) {
            for (let j = i + 1; j < idsVertices.length; j++) {
                if (Math.random() > densidade) continue;

                const [idOrigem, idDestino] = Math.random() < 0.5
                    ? [idsVertices[i], idsVertices[j]]
                    : [idsVertices[j], idsVertices[i]];

                if (this.possuiConexao(idOrigem, idDestino)) {
                    continue;
                }

                const peso = Math.floor(Math.random() * 9) + 1;
                const idAresta = this.criarAresta(idOrigem, idDestino, {
                    peso,
                    ignorarHistorico: true
                });

                if (idAresta) {
                    criouAlguma = true;
                }
            }
        }

        if (criouAlguma) {
            this.salvarNoHistorico();
            this.atualizarEstatisticas();
        }
    },

    removerAresta(idAresta, { ignorarHistorico = false } = {}) {
        const aresta = this.arestas.get(idAresta);
        if (!aresta) return;

        const verticeOrigem = this.vertices.get(aresta.origem);
        const verticeDestino = this.vertices.get(aresta.destino);

        if (verticeOrigem) verticeOrigem.arestas.delete(idAresta);
        if (verticeDestino) verticeDestino.arestas.delete(idAresta);

        if (aresta.rotulo) {
            this.containerRotulos.removeChild(aresta.rotulo);
            aresta.rotulo.destroy();
        }

        this.containerArestas.removeChild(aresta.container);
        aresta.container.destroy({ children: true });

        this.arestas.delete(idAresta);

        if (!ignorarHistorico) {
            this.salvarNoHistorico();
        }

        this.atualizarEstatisticas();
    },

    tentarApagarArestaNoPonto(ponto, tolerancia = 16) {
        for (const aresta of this.arestas.values()) {
            const verticeOrigem = this.vertices.get(aresta.origem);
            const verticeDestino = this.vertices.get(aresta.destino);
            if (!verticeOrigem || !verticeDestino) continue;

            const distancia = this.distanciaPontoParaSegmento(
                ponto.x,
                ponto.y,
                verticeOrigem.container.x,
                verticeOrigem.container.y,
                verticeDestino.container.x,
                verticeDestino.container.y
            );

            if (distancia <= tolerancia) {
                this.removerAresta(aresta.id);
                return true;
            }
        }
        return false;
    },

    distanciaPontoParaSegmento(px, py, ax, ay, bx, by) {
        const vetorABX = bx - ax;
        const vetorABY = by - ay;
        const vetorAPX = px - ax;
        const vetorAPY = py - ay;
        const comprimentoABQuadrado = vetorABX * vetorABX + vetorABY * vetorABY;

        if (comprimentoABQuadrado === 0) {
            return Math.hypot(px - ax, py - ay);
        }

        let proporcao = (vetorAPX * vetorABX + vetorAPY * vetorABY) / comprimentoABQuadrado;
        proporcao = Math.max(0, Math.min(1, proporcao));

        const pontoMaisProximoX = ax + vetorABX * proporcao;
        const pontoMaisProximoY = ay + vetorABY * proporcao;
        return Math.hypot(px - pontoMaisProximoX, py - pontoMaisProximoY);
    },

    atualizarArestasConectadas(idVertice) {
        const vertice = this.vertices.get(idVertice);
        if (!vertice) return;

        vertice.arestas.forEach(idAresta => {
            const aresta = this.arestas.get(idAresta);
            if (!aresta) return;

            this.atualizarDesenhoAresta(aresta);
        });
    }
};
