export const metodosDialogos = {
    configurarDialogo() {
        const sobreposicao = document.getElementById('dialogOverlay');
        if (!sobreposicao) {
            this.dialogo = null;
            return;
        }

        const tituloElemento = document.getElementById('dialogTitle');
        const mensagemElemento = document.getElementById('dialogMessage');
        const contornoEntrada = document.getElementById('dialogInputWrapper');
        const entradaElemento = document.getElementById('dialogInput');
        const botaoConfirmar = document.getElementById('dialogConfirmBtn');
        const botaoCancelar = document.getElementById('dialogCancelBtn');

        this.dialogo = {
            sobreposicao,
            tituloElemento,
            mensagemElemento,
            contornoEntrada,
            entradaElemento,
            botaoConfirmar,
            botaoCancelar,
            opcoes: null,
            resolver: null
        };

        botaoConfirmar.addEventListener('click', () => this.tratarConfirmacaoDialogo());
        botaoCancelar.addEventListener('click', () => this.tratarCancelamentoDialogo());
        sobreposicao.addEventListener('click', (evento) => {
            if (evento.target === sobreposicao) {
                this.tratarCancelamentoDialogo();
            }
        });

        document.addEventListener('keydown', (evento) => {
            if (!this.dialogo || this.dialogo.sobreposicao.classList.contains('hidden')) {
                return;
            }

            if (evento.key === 'Escape') {
                evento.preventDefault();
                this.tratarCancelamentoDialogo();
            } else if (evento.key === 'Enter') {
                evento.preventDefault();
                this.tratarConfirmacaoDialogo();
            }
        });
    },

    exibirDialogo(opcoes = {}) {
        if (!this.dialogo) {
            return Promise.resolve({ confirmado: false, valor: null });
        }

        const {
            titulo = 'Aviso',
            mensagem = '',
            exibirEntrada = false,
            placeholderEntrada = '',
            valorEntrada = '',
            textoConfirmar = 'Confirmar',
            textoCancelar = 'Cancelar'
        } = opcoes;

        this.dialogo.opcoes = {
            exibirEntrada,
            textoCancelar
        };

        this.dialogo.tituloElemento.textContent = titulo;
        this.dialogo.mensagemElemento.innerHTML = mensagem.replace(/\n/g, '<br>');

        if (exibirEntrada) {
            this.dialogo.contornoEntrada.classList.remove('hidden');
            this.dialogo.entradaElemento.value = valorEntrada;
            this.dialogo.entradaElemento.placeholder = placeholderEntrada;
            setTimeout(() => {
                this.dialogo.entradaElemento.focus();
                this.dialogo.entradaElemento.select();
            }, 0);
        } else {
            this.dialogo.contornoEntrada.classList.add('hidden');
            this.dialogo.entradaElemento.value = '';
            setTimeout(() => {
                this.dialogo.botaoConfirmar.focus();
            }, 0);
        }

        this.dialogo.botaoConfirmar.textContent = textoConfirmar;

        if (textoCancelar === null) {
            this.dialogo.botaoCancelar.classList.add('hidden');
        } else {
            this.dialogo.botaoCancelar.classList.remove('hidden');
            this.dialogo.botaoCancelar.textContent = textoCancelar;
        }

        this.dialogo.sobreposicao.classList.remove('hidden');

        return new Promise((resolver) => {
            this.dialogo.resolver = resolver;
        });
    },

    tratarConfirmacaoDialogo() {
        if (!this.dialogo || !this.dialogo.resolver) {
            return;
        }

        const { opcoes } = this.dialogo;
        let valor = null;
        if (opcoes && opcoes.exibirEntrada) {
            valor = this.dialogo.entradaElemento.value;
        }

        this.dialogo.sobreposicao.classList.add('hidden');
        const resolver = this.dialogo.resolver;
        this.dialogo.resolver = null;
        this.dialogo.opcoes = null;
        resolver({ confirmado: true, valor });
    },

    tratarCancelamentoDialogo() {
        if (!this.dialogo || !this.dialogo.resolver) {
            return;
        }

        this.dialogo.sobreposicao.classList.add('hidden');
        const resolver = this.dialogo.resolver;
        this.dialogo.resolver = null;
        this.dialogo.opcoes = null;
        resolver({ confirmado: false, valor: null });
    },

    async exibirAlerta(mensagem, titulo = 'Atenção') {
        await this.exibirDialogo({
            titulo,
            mensagem,
            textoConfirmar: 'OK',
            textoCancelar: null
        });
    },

    async exibirDialogoEntrada({
        titulo = 'Entrada',
        mensagem = '',
        placeholderEntrada = '',
        valorEntrada = '',
        textoConfirmar = 'Confirmar',
        textoCancelar = 'Cancelar'
    } = {}) {
        const resultado = await this.exibirDialogo({
            titulo,
            mensagem,
            exibirEntrada: true,
            placeholderEntrada,
            valorEntrada,
            textoConfirmar,
            textoCancelar
        });

        if (!resultado.confirmado) {
            return null;
        }

        return typeof resultado.valor === 'string' ? resultado.valor : '';
    }
};
