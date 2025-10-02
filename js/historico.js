export const metodosHistorico = {
    limparGrafo() {
        this.vertices.forEach(vertice => {
            this.containerVertices.removeChild(vertice.container);
            vertice.container.destroy({ children: true });
        });

        this.arestas.forEach(aresta => {
            this.containerArestas.removeChild(aresta.container);
            aresta.container.destroy({ children: true });
            if (aresta.rotulo) {
                this.containerRotulos.removeChild(aresta.rotulo);
                aresta.rotulo.destroy();
            }
        });
        this.containerRotulos.removeChildren();

        this.vertices.clear();
        this.arestas.clear();
        this.elementosSelecionados.clear();
        this.selecaoConexao = [];
        this.atualizacoesPendentesArestas.clear();
        this.atualizacaoArestaAgendada = false;

        this.contadorIdVertice = 1;
        this.contadorIdAresta = 0;

        this.historico = [];
        this.indiceHistorico = -1;

        this.atualizarEstatisticas();
        this.limparPainelPropriedades();
    },

    salvarNoHistorico() {
        const estado = this.serializarGrafo();

        if (this.indiceHistorico < this.historico.length - 1) {
            this.historico = this.historico.slice(0, this.indiceHistorico + 1);
        }

        this.historico.push(estado);

        if (this.historico.length > this.historicoMaximo) {
            this.historico.shift();
        }

        this.indiceHistorico = this.historico.length - 1;
    },

    desfazer() {
        if (this.indiceHistorico > 0) {
            this.indiceHistorico--;
            this.carregarDoHistorico(this.historico[this.indiceHistorico]);
        }
    },

    refazer() {
        if (this.indiceHistorico < this.historico.length - 1) {
            this.indiceHistorico++;
            this.carregarDoHistorico(this.historico[this.indiceHistorico]);
        }
    },

    carregarDoHistorico(estado) {
        this.limparGrafo();
        const dados = JSON.parse(estado);

        const listaVertices = Array.isArray(dados.vertices) ? dados.vertices
            : Array.isArray(dados.nodes) ? dados.nodes
            : [];
        const listaArestas = Array.isArray(dados.arestas) ? dados.arestas
            : Array.isArray(dados.edges) ? dados.edges
            : [];

        listaVertices.forEach(dadosVertice => {
            const id = dadosVertice.id;
            const rotulo = dadosVertice.rotulo ?? dadosVertice.label;
            const cor = dadosVertice.cor ?? dadosVertice.color ?? this.corVertice;
            const corBorda = dadosVertice.corBorda ?? dadosVertice.borderColor ?? this.corAresta;

            const idVerticeCriado = this.criarVertice(
                dadosVertice.x,
                dadosVertice.y,
                rotulo,
                { id, ignorarHistorico: true }
            );
            const vertice = this.vertices.get(idVerticeCriado);
            vertice.cor = cor;
            vertice.corBorda = corBorda;
            vertice.rotulo = rotulo;
            vertice.texto.text = rotulo;
            this.aplicarEstiloVertice(vertice.id, { selecionado: false, ignorarAtualizacaoArestas: true });
        });

        listaArestas.forEach(dadosAresta => {
            this.criarAresta(dadosAresta.origem ?? dadosAresta.source, dadosAresta.destino ?? dadosAresta.target, {
                ignorarHistorico: true,
                cor: dadosAresta.cor ?? dadosAresta.color ?? this.corAresta,
                peso: dadosAresta.peso ?? dadosAresta.weight,
                permitirOposta: true
            });
        });

        if (typeof dados.contadorIdVertice === 'number') {
            this.contadorIdVertice = dados.contadorIdVertice;
        } else if (typeof dados.nodeIdCounter === 'number') {
            this.contadorIdVertice = dados.nodeIdCounter;
        } else {
            const maiorId = Math.max(0, ...Array.from(this.vertices.keys()));
            this.contadorIdVertice = maiorId + 1;
        }
        if (typeof dados.contadorIdAresta === 'number') {
            this.contadorIdAresta = dados.contadorIdAresta;
        } else if (typeof dados.edgeIdCounter === 'number') {
            this.contadorIdAresta = dados.edgeIdCounter;
        } else {
            this.contadorIdAresta = this.arestas.size;
        }
    },

    serializarGrafo() {
        const dados = {
            vertices: [],
            arestas: [],
            nodes: [],
            edges: [],
            contadorIdVertice: this.contadorIdVertice,
            contadorIdAresta: this.contadorIdAresta,
            nodeIdCounter: this.contadorIdVertice,
            edgeIdCounter: this.contadorIdAresta
        };

        this.vertices.forEach(vertice => {
            const verticePortugues = {
                id: vertice.id,
                x: vertice.x,
                y: vertice.y,
                rotulo: vertice.rotulo,
                cor: vertice.cor,
                corBorda: vertice.corBorda
            };
            const verticeIngles = {
                id: vertice.id,
                x: vertice.x,
                y: vertice.y,
                label: vertice.rotulo,
                color: vertice.cor,
                borderColor: vertice.corBorda
            };
            dados.vertices.push(verticePortugues);
            dados.nodes.push(verticeIngles);
        });

        this.arestas.forEach(aresta => {
            const arestaPortugues = {
                id: aresta.id,
                origem: aresta.origem,
                destino: aresta.destino,
                cor: aresta.cor,
                peso: aresta.peso
            };
            const arestaIngles = {
                id: aresta.id,
                source: aresta.origem,
                target: aresta.destino,
                color: aresta.cor,
                weight: aresta.peso
            };
            dados.arestas.push(arestaPortugues);
            dados.edges.push(arestaIngles);
        });

        return JSON.stringify(dados, null, 2);
    },

    salvarGrafo() {
        const dados = this.serializarGrafo();
        const blob = new Blob([dados], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = document.getElementById('fileName').value + '.json';
        link.click();

        URL.revokeObjectURL(url);
    },

    carregarGrafo(arquivo) {
        const leitor = new FileReader();

        leitor.onload = (evento) => {
            try {
                const conteudo = evento.target.result;
                this.carregarDoHistorico(conteudo);

                const nomeArquivo = arquivo.name.replace('.json', '');
                document.getElementById('fileName').value = nomeArquivo;

                this.historico = [conteudo];
                this.indiceHistorico = 0;
            } catch (erro) {
                this.exibirAlerta('Erro ao carregar arquivo: ' + erro.message);
            }
        };

        leitor.readAsText(arquivo);
    }
};
