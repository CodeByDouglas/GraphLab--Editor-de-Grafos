export const metodosExportacao = {
    exportarGrafo(formato) {
        switch (formato) {
            case 'png':
                this.exportarComoPNG();
                break;
            case 'svg':
                this.exportarComoSVG();
                break;
            case 'json':
                this.salvarGrafo();
                break;
            case 'adjacency':
                this.exportarComoMatrizAdjacencia();
                break;
        }
    },

    exportarComoPNG() {
        const texturaRender = PIXI.RenderTexture.create({
            width: this.aplicacao.view.width,
            height: this.aplicacao.view.height
        });

        this.aplicacao.renderer.render(this.aplicacao.stage, { renderTexture: texturaRender });

        const canvas = this.aplicacao.renderer.extract.canvas(texturaRender);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = document.getElementById('fileName').value + '.png';
            link.click();
            URL.revokeObjectURL(url);
        });

        texturaRender.destroy();
    },

    exportarComoSVG() {
        this.exibirAlerta('Exportação SVG será implementada em breve!', 'Em breve');
    },

    exportarComoMatrizAdjacencia() {
        const idsVertices = Array.from(this.vertices.keys());
        let csv = ',' + idsVertices.join(',') + '\n';

        idsVertices.forEach(idOrigem => {
            const linha = [idOrigem];
            idsVertices.forEach(idDestino => {
                const possuiAresta = Array.from(this.arestas.values()).some(aresta =>
                    (aresta.origem === idOrigem && aresta.destino === idDestino) ||
                    (aresta.origem === idDestino && aresta.destino === idOrigem)
                );
                linha.push(possuiAresta ? '1' : '0');
            });
            csv += linha.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = document.getElementById('fileName').value + '_matriz_adjacencia.csv';
        link.click();

        URL.revokeObjectURL(url);
    }
};
