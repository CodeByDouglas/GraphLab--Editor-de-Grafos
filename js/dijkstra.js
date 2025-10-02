export const metodosDijkstra = {
    configurarPainelDijkstra() {
        const entradaInicio = document.getElementById('dijkstraStart');
        const entradaFim = document.getElementById('dijkstraEnd');
        const botaoExecutar = document.getElementById('runDijkstraBtn');
        const resultadoElemento = document.getElementById('dijkstraResult');

        if (!entradaInicio || !entradaFim || !botaoExecutar || !resultadoElemento) return;

        const exibirResultado = (mensagem, erro = false) => {
            resultadoElemento.textContent = mensagem;
            resultadoElemento.classList.toggle('error', erro);
            resultadoElemento.classList.remove('hidden');
        };

        botaoExecutar.addEventListener('click', async () => {
            if (this.vertices.size === 0) {
                exibirResultado('Adicione vértices ao grafo antes de calcular.', true);
                return;
            }

            const inicio = this.resolverEntradaVertice(entradaInicio.value);
            const fim = this.resolverEntradaVertice(entradaFim.value);

            if (inicio == null || fim == null) {
                exibirResultado('Informe vértices inicial e final válidos.', true);
                return;
            }

            if (!this.vertices.has(inicio) || !this.vertices.has(fim)) {
                exibirResultado('Os vértices informados precisam existir no grafo.', true);
                return;
            }

            exibirResultado('Calculando menor caminho...');
            botaoExecutar.disabled = true;

            try {
                const resultado = await this.executarDijkstra(inicio, fim);
                if (resultado.erro) {
                    exibirResultado(resultado.erro, true);
                    return;
                }

                const { caminho, distancia, mensagem } = resultado;

                if (Array.isArray(caminho) && caminho.length) {
                    const nomesCaminho = caminho.map(id => this.obterRotuloVertice(id));
                    const textoDistancia = distancia != null ? `Distância total: ${distancia}` : '';
                    exibirResultado(`Caminho encontrado: ${nomesCaminho.join(' → ')}${textoDistancia ? `\n${textoDistancia}` : ''}`);
                } else if (mensagem) {
                    exibirResultado(mensagem, true);
                } else {
                    exibirResultado('Não foi possível determinar o menor caminho.', true);
                }
            } catch (erro) {
                console.error(erro);
                exibirResultado('Ocorreu um erro ao executar o algoritmo.', true);
            } finally {
                botaoExecutar.disabled = false;
            }
        });
    },

    resolverEntradaVertice(valorEntrada) {
        if (typeof valorEntrada !== 'string') {
            return null;
        }

        const texto = valorEntrada.trim();
        if (!texto) {
            return null;
        }

        const numero = Number(texto);
        if (!Number.isNaN(numero) && this.vertices.has(numero)) {
            return numero;
        }

        for (const [id, vertice] of this.vertices.entries()) {
            if (vertice.rotulo.toLowerCase() === texto.toLowerCase()) {
                return id;
            }
        }

        return null;
    },

    obterRotuloVertice(idVertice) {
        const vertice = this.vertices.get(idVertice);
        if (!vertice) {
            return String(idVertice);
        }
        return vertice.rotulo || String(idVertice);
    },

    async garantirPyodide() {
        if (this.promessaPyodidePronta) {
            return this.promessaPyodidePronta;
        }

        if (typeof loadPyodide !== 'function') {
            throw new Error('Pyodide não foi carregado.');
        }

        this.promessaPyodidePronta = (async () => {
            const pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });

            const arquivos = [
                { caminho: '/algoritmos/__init__.py', conteudo: '' },
                { caminho: '/algoritmos/algoritmo_de_dijkstra.py', url: 'algoritmos/algoritmo_de_dijkstra.py' },
                { caminho: '/algoritmos/conversor_grafo.py', url: 'algoritmos/conversor_grafo.py' }
            ];

            for (const arquivo of arquivos) {
                if (arquivo.url) {
                    const resposta = await fetch(arquivo.url);
                    if (!resposta.ok) {
                        throw new Error(`Não foi possível carregar ${arquivo.url}`);
                    }
                    arquivo.conteudo = await resposta.text();
                }

                const diretorio = arquivo.caminho.slice(0, arquivo.caminho.lastIndexOf('/')) || '/';
                if (diretorio && diretorio !== '/') {
                    try {
                        pyodide.FS.mkdirTree(diretorio);
                    } catch (erro) {
                        // diretório já existente
                    }
                }

                pyodide.FS.writeFile(arquivo.caminho, arquivo.conteudo);
            }

            await pyodide.runPythonAsync("import sys; sys.path.append('/')");
            return pyodide;
        })();

        return this.promessaPyodidePronta;
    },

    async executarDijkstra(verticeInicial, verticeFinal) {
        try {
            const pyodide = await this.garantirPyodide();
            const grafoJson = this.serializarGrafo();

            pyodide.globals.set('grafo_json', grafoJson);
            pyodide.globals.set('vertice_inicio', verticeInicial);
            pyodide.globals.set('vertice_final', verticeFinal);

            const resultadoPython = await pyodide.runPythonAsync(`
import json, importlib, io, contextlib, ast
import algoritmos.conversor_grafo as conversor_grafo
import algoritmos.algoritmo_de_dijkstra as dijkstra_mod
dijkstra_mod = importlib.reload(dijkstra_mod)

grafo = json.loads(grafo_json)
lista = conversor_grafo.grafo_json_para_lista(grafo)

saida = io.StringIO()
with contextlib.redirect_stdout(saida):
    dijkstra_mod.algoritmo_de_dijkstra(lista, int(vertice_inicio), int(vertice_final))

saida_texto = saida.getvalue().strip()

try:
    ultima_linha = saida_texto.splitlines()[-1]
except IndexError:
    ultima_linha = ''

try:
    caminho = ast.literal_eval(ultima_linha)
    if not isinstance(caminho, list):
        caminho = None
except Exception:
    caminho = None

try:
    distancia = dijkstra_mod.menor_distancia_de_cada_vertice[int(vertice_final)]
    if distancia == 0 and int(vertice_inicio) != int(vertice_final):
        distancia = None
except Exception:
    distancia = None

resultado = {
    "saida": saida_texto,
    "caminho": caminho,
    "distancia": distancia
}
json.dumps(resultado)
            `);

            pyodide.globals.delete('grafo_json');
            pyodide.globals.delete('vertice_inicio');
            pyodide.globals.delete('vertice_final');

            const resultado = JSON.parse(resultadoPython || '{}');

            if (!resultado) {
                return { erro: 'Não foi possível interpretar o resultado.' };
            }

            if (Array.isArray(resultado.caminho) && resultado.caminho.length) {
                return {
                    caminho: resultado.caminho,
                    distancia: resultado.distancia,
                    mensagem: null
                };
            }

            const texto = resultado.saida || 'Não foi possível determinar o menor caminho.';
            return {
                caminho: null,
                distancia: resultado.distancia,
                mensagem: texto
            };
        } catch (erro) {
            return { erro: erro.message || 'Ocorreu um erro desconhecido.' };
        }
    }
};
