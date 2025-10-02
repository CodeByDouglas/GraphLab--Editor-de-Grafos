# Documentação do GraphFlow

## Visão geral
GraphFlow é um editor interativo de grafos orientado ao navegador. Ele usa PixiJS para renderização 2D, Pyodide para executar o algoritmo de Dijkstra escrito em Python e uma arquitetura modular em JavaScript para organizar comportamentos de interface, persistência e análise. O fluxo principal instancia `EditorGrafo` quando o DOM é carregado e delega funções a mixins especializados.

## Tecnologias principais
- **PixiJS 7**: renderização acelerada por GPU para nós, arestas, rótulos e grid de fundo.
- **Pyodide 0.24**: runtime Python no navegador para reaproveitar algoritmos escritos na disciplina.
- **JavaScript ES modules**: código organizado por responsabilidade (vértices, arestas, interface, histórico, etc.).
- **HTML/CSS**: layout da aplicação, barra lateral, barra inferior e diálogos customizados.

## Estrutura de pastas
```
AlgoritmoII/
├─ app.js                 # ponto de entrada do frontend
├─ index.html             # layout principal e marcação dos painéis
├─ styles.css             # tema escuro, barras, diálogos e overlays
├─ js/
│  ├─ editor-grafo.js     # classe principal que orquestra os módulos
│  ├─ vertices.js         # criação e seleção de vértices
│  ├─ arestas.js          # manipulação de arestas e pesos
│  ├─ interface.js        # eventos de UI, atalhos e toolbar
│  ├─ dialogos.js         # sistema de diálogos reutilizáveis
│  ├─ historico.js        # undo/redo, serialização e I/O de arquivos
│  ├─ exportacao.js       # exportações para PNG/CSV/JSON
│  └─ dijkstra.js         # integração com Pyodide e painel do algoritmo
├─ algoritmos/
│  ├─ algoritmo_de_dijkstra.py # implementação original do algoritmo
│  └─ conversor_grafo.py       # conversão JSON → lista de adjacência
├─ img/                   # logotipo e favicon
├─ package.json           # scripts utilitários e dependências npm
└─ DOCUMENTACAO.md        # este documento
```

## Fluxo de inicialização
1. `index.html` importa PixiJS, Pyodide e `app.js` como módulo.
2. `app.js` aguarda o evento `DOMContentLoaded` e instancia `EditorGrafo`.
3. Em `EditorGrafo`:
   - Cria a aplicação Pixi (`PIXI.Application`) ajustada à janela atual.
   - Configura containers (`containerGrafo`, `containerVertices`, `containerArestas`, `containerRotulos`).
   - Desenha a malha de fundo e registra mixins: vértices, arestas, UI, diálogos, histórico, exportação e Dijkstra.
   - Inicializa controles (atalhos, barra, cores, zoom, painel lateral, contexto, Pyodide sob demanda).

## Módulos JavaScript
### `vertices.js`
- `criarVertice`: instancia o display Pixi (gráfico + label), registra eventos de arrasto, adiciona ao histórico e atualiza estatísticas.
- `tratarCliqueConexao`: implementa a ferramenta de conexão (seleção dupla, validação de peso via diálogo, criação de aresta).
- Funções auxiliares para seleção, duplicação, cálculo de espaçamento, reposicionamento automático e gerenciamento da lista `selecaoConexao`.

### `arestas.js`
- `criarAresta`: garante origem/destino válidos, evita duplicidades, cria o gráfico (triângulo + linha), sincroniza peso e rótulo.
- `atualizarDesenhoAresta`: recalcula posição e suaviza o desenho conforme os vértices se movem.
- `gerarArestasAleatorias`: usa densidade dinâmica para criar grafos de teste.
- `tentarApagarArestaNoPonto`: permite apagar arestas clicando no espaço (modo borracha).

### `interface.js`
- Eventos globais de pointer para arrastar o canvas, limpar seleção, iniciar pan.
- Toolbar (`data-tool`, `data-action`) e atalhos de teclado (`M`, `C`, `A`, `R`, `X`, `Delete`, `Ctrl+Z/Y/S/O/A`).
- `configurarSelecionadoresCor`: atualiza bordas e cores em tempo real.
- `configurarOperacoesArquivo`: conecta botões de novo, abrir, salvar.
- `configurarModalExportacao`: exibe opções de exportação.
- `configurarMenuContexto`: ações de duplicar/excluir por clique direito.
- Painel de ajuda e controle de zoom (botões e scroll do mouse).

### `dialogos.js`
- Implementa o overlay modal reutilizável (alertas e prompts).
- Suporta confirmação/cancelamento, campo de texto opcional, acessibilidade via teclado.

### `historico.js`
- `salvarNoHistorico`, `desfazer`, `refazer`: mantêm histórico limitado a `historicoMaximo` estados.
- `serializarGrafo`: gera JSON com chaves em português e em inglês (retrocompatibilidade).
- `carregarDoHistorico`: reconstrói o cenário a partir do JSON salvo.
- `limparGrafo`: esvazia mapas, containers Pixi e zera contadores.
- `salvarGrafo`/`carregarGrafo`: persistem em arquivos `.json` via `Blob` e `FileReader`.

### `exportacao.js`
- `exportarComoPNG`: captura o canvas Pixi com `RenderTexture` e baixa como PNG.
- `exportarComoMatrizAdjacencia`: gera CSV simétrico (1 para presença de aresta, 0 caso contrário).
- `exportarComoSVG`: placeholder (exibe alerta informando recurso futuro).

### `dijkstra.js`
- Configura o painel lateral (campos de início/fim, mensagens, loading).
- Normaliza entrada (ID numérico ou label textual).
- `garantirPyodide`: baixa Pyodide uma única vez, injeta scripts Python na FS virtual e adiciona `/` ao `sys.path`.
- `executarDijkstra`: serializa grafo atual, roda o algoritmo Python assíncrono, parses do stdout e retorna caminho/distância.

## Backend Python (Pyodide)
### `algoritmo_de_dijkstra.py`
- Algoritmo original utilizado na disciplina, baseado em listas globais.
- Recebe lista de adjacência `[[[destino, peso], ...], ...]`, calcula menor caminho e imprime o trajeto.

### `conversor_grafo.py`
- `grafo_json_para_lista`: converte o JSON serializado pelo editor em lista compatível com o algoritmo (IDs inteiros, pesos inteiros).
- Valida presença de `source`, `target` e `weight`, disparando exceção caso falte algum campo.

## Layout e estilos
- `index.html`:
  - **Header**: botões de menu, zoom, exportação e campo de nome de arquivo.
  - **Sidebar**: seções de Arquivo, Dijkstra, Propriedades, Estatísticas e Estilo.
  - **Canvas container**: div `#graphCanvas` para o canvas Pixi e toolbar inferior.
  - **Menu contextual**: duplicar e deletar nós selecionados.
  - **Painel de ajuda**: mostra atalhos rápidos.
  - **Modal de exportação**: opções para PNG, SVG, JSON, matriz de adjacência.
  - **Dialog overlay**: usado pelo sistema de diálogos do JavaScript.
- `styles.css`: define cores, tipografia (Inter), efeitos de hover, sombras, transições e responsividade básica.

## Persistência e formato de arquivos
Ao salvar um grafo:
```json
{
  "vertices": [ {"id": 1, "x": 10, "y": 20, "rotulo": "A", ... }, ... ],
  "arestas": [ {"id": "aresta_0", "origem": 1, "destino": 2, "peso": 3, ... }, ... ],
  "nodes": [...],
  "edges": [...],
  "contadorIdVertice": 5,
  "contadorIdAresta": 8,
  "nodeIdCounter": 5,
  "edgeIdCounter": 8
}
```
- `vertices`/`arestas`: chaves em português.
- `nodes`/`edges`: espelho em inglês para compatibilidade com versões anteriores.
- Os pesos são inteiros; qualquer JSON inválido causará erro explícito ao carregar.

## Fluxo de uso típico
1. Abrir página servida por `python3 -m http.server 8000` ou `npm run serve`.
2. Adicionar vértices com o botão da toolbar ou atalhos.
3. Usar ferramenta de conexão (`C`) para criar arestas com peso.
4. Selecionar/mover múltiplos vértices com `Shift+clique` e arrasto.
5. Exportar PNG/CSV/JSON conforme necessário.
6. Calcular menor caminho fornecendo IDs ou rótulos no painel Dijkstra.
7. Usar `Ctrl+Z`/`Ctrl+Y` para desfazer/refazer alterações.

## Considerações de extensão
- **SVG**: implementar `exportarComoSVG` convertendo shapes Pixi para paths.
- **Algoritmos adicionais**: reaproveitar estrutura do Pyodide adicionando novos módulos Python.
- **Personalização visual**: ajustar variáveis CSS ou atualizar `configurarSelecionadoresCor`.
- **Persistência em backend**: enviar JSON gerado por `serializarGrafo` para APIs externas.

## Scripts disponíveis
- `npm run start`: sobe servidor HTTP simples via Python (porta 8000).
- `npm run serve`: usa `live-server` com recarregamento automático.

