import { metodosVertices } from './vertices.js';
import { metodosArestas } from './arestas.js';
import { metodosInterface } from './interface.js';
import { metodosDialogos } from './dialogos.js';
import { metodosHistorico } from './historico.js';
import { metodosExportacao } from './exportacao.js';
import { metodosDijkstra } from './dijkstra.js';

class EditorGrafo {
    constructor() {
        this.vertices = new Map();
        this.arestas = new Map();
        this.elementosSelecionados = new Set();
        this.ferramentaAtual = 'mover';
        this.estaArrastando = false;
        this.estaArrastandoVista = false;
        this.contadorIdVertice = 1;
        this.contadorIdAresta = 0;
        this.nivelZoom = 1;
        this.zoomMinimo = 0.35;
        this.zoomMaximo = 3;
        this.historico = [];
        this.indiceHistorico = -1;
        this.historicoMaximo = 50;

        this.selecaoConexao = [];
        this.atualizacoesPendentesArestas = new Set();
        this.atualizacaoArestaAgendada = false;
        this.promessaPyodidePronta = null;
        this.dialogo = null;

        this.corVertice = 0x0A84FF;
        this.corAresta = 0x2E2E2E;

        this.raioBaseVertice = 30;
        this.raioVerticeSelecionado = 36;
        this.larguraBordaVertice = 8;

        this.iniciar();
    }

    iniciar() {
        this.aplicacao = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1A1C1F,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        const containerCanvas = document.getElementById('graphCanvas');
        containerCanvas.appendChild(this.aplicacao.view);

        this.containerGrafo = new PIXI.Container();
        this.aplicacao.stage.addChild(this.containerGrafo);

        this.spriteGrade = this.criarGradeFundo();
        this.containerGrafo.addChild(this.spriteGrade);

        this.containerArestas = new PIXI.Container();
        this.containerVertices = new PIXI.Container();
        this.containerRotulos = new PIXI.Container();

        this.containerGrafo.addChild(this.containerArestas);
        this.containerGrafo.addChild(this.containerVertices);
        this.containerGrafo.addChild(this.containerRotulos);

        this.aplicacao.stage.eventMode = 'static';
        this.aplicacao.stage.hitArea = this.aplicacao.screen;

        this.configurarEventos();
        this.configurarBarraFerramentas();
        this.configurarAtalhosTeclado();
        this.configurarDialogo();
        this.configurarSelecionadoresCor();
        this.configurarOperacoesArquivo();
        this.configurarPainelDijkstra();
        this.configurarModalExportacao();
        this.configurarMenuContexto();
        this.configurarPainelAjuda();
        this.configurarControlesZoom();
        this.atualizarEstatisticas();
        this.atualizarCursor();
    }

    criarGradeFundo() {
        const tamanhoTile = 80;
        const corBase = 0x1f1f20;
        const linhaPrimaria = 0x2c2c2e;
        const linhaSecundaria = 0x353538;

        const grafico = new PIXI.Graphics();
        grafico.beginFill(corBase);
        grafico.drawRect(0, 0, tamanhoTile, tamanhoTile);
        grafico.endFill();

        grafico.lineStyle(2, linhaPrimaria, 0.45);
        grafico.moveTo(tamanhoTile, 0);
        grafico.lineTo(tamanhoTile, tamanhoTile);
        grafico.moveTo(0, tamanhoTile);
        grafico.lineTo(tamanhoTile, tamanhoTile);

        grafico.lineStyle(1, linhaSecundaria, 0.3);
        grafico.moveTo(0, 0);
        grafico.lineTo(tamanhoTile, 0);
        grafico.moveTo(0, 0);
        grafico.lineTo(0, tamanhoTile);

        const textura = this.aplicacao.renderer.generateTexture(grafico);
        grafico.destroy(true);

        const multiplicadorGrade = 12;
        const grade = new PIXI.TilingSprite(
            textura,
            this.aplicacao.screen.width * multiplicadorGrade,
            this.aplicacao.screen.height * multiplicadorGrade
        );
        grade.alpha = 0.95;
        grade.pivot.set(grade.width / 2, grade.height / 2);
        grade.position.set(0, 0);

        return grade;
    }

    atualizarTamanhoGrade() {
        if (!this.spriteGrade) return;
        const multiplicadorGrade = 12;
        this.spriteGrade.width = this.aplicacao.screen.width * multiplicadorGrade;
        this.spriteGrade.height = this.aplicacao.screen.height * multiplicadorGrade;
        this.spriteGrade.pivot.set(this.spriteGrade.width / 2, this.spriteGrade.height / 2);
    }
}

Object.assign(
    EditorGrafo.prototype,
    metodosVertices,
    metodosArestas,
    metodosInterface,
    metodosDialogos,
    metodosHistorico,
    metodosExportacao,
    metodosDijkstra
);

export default EditorGrafo;
