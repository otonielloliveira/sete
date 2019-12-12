var escolaVisualizada = null;
var escolas = new Map();

var mapaViz = novoMapaOpenLayers("mapVizEscola", cidadeLatitude, cidadeLongitude);
var vSource = mapaViz["vectorSource"];
var vLayer = mapaViz["vectorSource"];
// mapaViz["activateImageLayerSwitcher"]();

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFn("Erro ao visualizar a escola!", err);
    } else {
        for (let escolaRaw of result) {
            var eID = escolaRaw["ID_ESCOLA"];
            var eNome = escolaRaw["NOME"];

            escolas.set(eID, escolaRaw);
            $('#escolaViz').append(`<option value="${eID}">${eNome}</option>`);
        }
    }
};

// Callback para plotar alunos no mapa
var plotarEscolaAlunoCB = (err, result) => {
    vLayer.clear();
    if (err) {
        errorFn("Erro ao listar alunos da escola!", err);
    } else {
        // Desenha marcador escola
        var elat = escolaVisualizada["LOC_LATITUDE"];
        var elng = escolaVisualizada["LOC_LONGITUDE"]
        var posicaoEscola = new ol.Feature({
            "geometry": new ol.geom.Point(ol.proj.fromLonLat([elng, elat]))
        });
        posicaoEscola.setStyle(new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [12, 37],
                anchorXUnits: 'pixels',
                anchorYUnits: 'pixels',
                opacity: 1,
                src: "img/icones/escola-marcador.png"
            })
        }));
        vLayer.addFeature(posicaoEscola);

        for (let alunoRaw of result) {
            // Desenha marcador
            // var alat = alunoRaw["LATITUDE"];
            // var alng = alunoRaw["LONGITUDE"];
            // var posicaoAluno = new ol.Feature({
            //     "geometry": new ol.geom.Point(ol.proj.fromLonLat([alng, alat]))
            // });
            // posicaoAluno.setStyle(new ol.style.Style({
            //     image: new ol.style.Icon({
            //         anchor: [12, 37],
            //         anchorXUnits: 'pixels',
            //         anchorYUnits: 'pixels',
            //         opacity: 1,
            //         src: "img/icones/escola-marcador.png"
            //     })
            // }));
            // vLayer.addFeature(posicaoAluno);
        }
        mapaViz["map"].getView().fit(vSource.getExtent());
        mapaViz["map"].getView().setZoom(Math.min(mapaViz["map"].getView().getZoom(), minZoom));
        mapaViz["map"].updateSize();
        $("#mapVizEscola").show();
    }
};

$("#escolaViz").on('change', function (e) {
    var eID = this.value;

    if (eID == 0) {
        $("#mapVizEscola").hide();
        escolaVisualizada = null;
    } else {
        escolaVisualizada = escolas.get(parseInt(eID));
        ListaDeAlunosPorEscola(eID, plotarEscolaAlunoCB);
    }
});

BuscarTodasEscolas(listaInicialCB);

// Botões
$("#btnVoltar").click(() => {
    navigateDashboard(lastPage);
})

$("#btnExpJPEG").click(() => {
    htmlToImage.toPng(document.getElementById("mapaCanvas"))
        .then(function (dataUrl) {
            var link = document.createElement('a');
            link.download = 'mapa-escola' + escolaVisualizada["NOME"] + ' .jpeg';
            link.href = dataUrl;
            link.click();
        });
})

