// Preenchimento da Tabela via SQL
var listaDeEscolas = new Map();
var totalNumEscolas = 0;
var totalNumRotas = 0;

// Dados para serem plotados
var dataLocalidade = { series: [], labels: ["Área Urbana", "Área Rural"] };
var dataNumAtendimento = { series: [], labels: [] };
var dataNumRotas = { series: [], labels: [] };
var dataDependencia = { series: [], labels: ["Federal", "Estadual", "Municipal", "Privada"] };
var dataTipoEnsino = { series: [], labels: ["Ensino Fundamental", "Ensino Médio", "Ensino Superior"] };
var dataHorarioEnsino = { series: [], labels: ["Manhã", "Tarde", "Noite"] };
var dataRegimeEnsino = { series: [], labels: ["Regular", "EJA", "Profissionalizante"] };

// DataTables
var defaultTableConfig = GetTemplateDataTableConfig();
defaultTableConfig["columns"] = [
    { data: 'NOME', width: "50%" },
    { data: 'DEPENDENCIA' },
    { data: 'ENSINO' },
    { data: 'REGIME' },
    { data: 'HORARIO' },
    { data: 'LOCALIZACAO', width: "25%" },
    { data: 'ENSINO', width: "15%" },
    { data: 'HORARIO', width: "30%" },
    { data: 'NUM_ALUNOS', width: "300px" },
    {
        data: "ACOES",
        width: "110px",
        sortable: false,
        defaultContent: '<a href="#" class="btn btn-link btn-info escolaStudent"><i class="fa fa-user"></i></a>' +
            '<a href="#" class="btn btn-link btn-primary escolaView"><i class="fa fa-search"></i></a>' +
            '<a href="#" class="btn btn-link btn-warning escolaEdit"><i class="fa fa-edit"></i></a>' +
            '<a href="#" class="btn btn-link btn-danger escolaRemove"><i class="fa fa-times"></i></a>'
    }
]

defaultTableConfig["columnDefs"] = [
    {
        "targets": [1, 2, 3, 4],
        "visible": false,
        "searchable": true
    },
    {
        targets: 0,
        render: function (data, type, row) {
            return data.length > 50 ?
                data.substr(0, 50) + '…' :
                data;
        }
    },
];

var dataTablesRelatorio = $("#datatables").DataTable(defaultTableConfig);

function CalcularEstatisticas() {
    var totalEscolas = listaDeEscolas.size;
    var totalNumAlunos = 0;
    var totalNumRotas = 0;

    var statLocalizacao = { 1: 0, 2: 0 };
    var statDependencia = { 1: 0, 2: 0, 3: 0, 4: 0 };
    var statTipoEnsino = { 1: 0, 2: 0, 3: 0 };
    var statHorarioEnsino = { 1: 0, 2: 0, 3: 0 };
    var statRegimeEnsino = { 1: 0, 2: 0, 3: 0 };

    listaDeEscolas.forEach((escola) => {
        statLocalizacao[escola["MEC_TP_LOCALIZACAO"]] = statLocalizacao[escola["MEC_TP_LOCALIZACAO"]] + 1;
        statDependencia[escola["MEC_TP_DEPENDENCIA"]] = statDependencia[escola["MEC_TP_DEPENDENCIA"]] + 1;

        if (escola["ENSINO_FUNDAMENTAL"]) statTipoEnsino[1]++;
        if (escola["ENSINO_MEDIO"]) statTipoEnsino[2]++;
        if (escola["ENSINO_SUPERIOR"]) statTipoEnsino[3]++

        if (escola["HORARIO_MATUTINO"]) statHorarioEnsino[1]++;
        if (escola["HORARIO_NOTURNO"]) statHorarioEnsino[2]++;
        if (escola["HORARIO_VESPERTINO"]) statHorarioEnsino[3]++;

        if (escola["MEC_IN_REGULAR"]) statRegimeEnsino[1]++;
        if (escola["MEC_IN_EJA"]) statRegimeEnsino[2]++;
        if (escola["MEC_IN_PROFISSIONALIZANTE"]) statRegimeEnsino[3]++;

        totalNumAlunos = totalNumAlunos + escola["NUM_ALUNOS"];
        totalNumRotas = totalNumRotas + escola["NUM_ROTAS"];
    })

    dataNumAtendimento["series"].push(totalNumAlunos / totalEscolas);
    dataNumAtendimento["labels"].push("Número médio de alunos transportados por escola");

    dataNumRotas["series"].push(totalNumRotas / totalEscolas);
    dataNumRotas["labels"].push("Número médio de rotas cadastradas por escola");

    dataLocalidade["series"] = [statLocalizacao[1], statLocalizacao[2]]
    dataDependencia["series"] = [statDependencia[1], statDependencia[2], statDependencia[3], statDependencia[4]]
    dataTipoEnsino["series"] = [statTipoEnsino[1], statTipoEnsino[2], statTipoEnsino[3]]
    dataHorarioEnsino["series"] = [statHorarioEnsino[1], statHorarioEnsino[2], statHorarioEnsino[3]]
    dataRegimeEnsino["series"] = [statRegimeEnsino[1], statRegimeEnsino[2], statRegimeEnsino[3]]

    $("#listaTipoRelatorio").val("localidade").trigger("change");
    $("#menuRelatorio :first-child").click();
}

var listaDeOpcoesRelatorio = {
    "localidade": {
        TXTMENU: "Localidade",
        SERIE: dataLocalidade,
        TITULO: "Distribuição de Escolas Atendidas por Localidade",
        TIPO: "barra",
        FILTRO: "LOCALIZACAO",
    },
    "dependencia": {
        TXTMENU: "Dependência",
        SERIE: dataDependencia,
        TITULO: "Porcentagem de Escolas Atendidas por Tipo de Dependência",
        TIPO: "pizza",
        FILTRO: "DEPENDENCIA"
    },
    "ensino": {
        TXTMENU: "Nível de Ensino",
        SERIE: dataTipoEnsino,
        TITULO: "Porcentagem de Escolas Atendidas por Nível de Ensino",
        TIPO: "pizza",
        FILTRO: "ENSINO",
        FILTROULTIMA: true
    },
    "nivel": {
        TXTMENU: "Regime de Ensino",
        SERIE: dataRegimeEnsino,
        TITULO: "Porcentagem de Escolas Atendidas por Regime de Ensino",
        TIPO: "pizza",
        FILTRO: "REGIME"
    },
    "horario": {
        TXTMENU: "Horário de Funcionamento",
        SERIE: dataHorarioEnsino,
        TITULO: "Porcentagem de Escolas Atendidas por Horário de Funcionamento",
        TIPO: "pizza",
        FILTRO: "HORARIO"
    },
}

GetTemplateMenu("#menuRelatorio", listaDeOpcoesRelatorio);
SetMainFilterMenu("#listaTipoRelatorio", listaDeOpcoesRelatorio);

$("#listaTipoRelatorio").change((e) => {
    var $that = $(e.target);
    var optName = $that.val();
    var opt = listaDeOpcoesRelatorio[optName];

    $("#listaFiltroRelatorio").empty();
    $("#listaFiltroRelatorio").append(`<option value="">Selecione uma opção ...</option>`);
    var labels = opt["SERIE"]["labels"];

    if (opt["CUSTOM"]) {
        opt["CUSTOMFN"]();
    } else {
        for (let i = 0; i < labels.length; i++) {
            $("#listaFiltroRelatorio").append(`<option value="${labels[i]}">${labels[i]}</option>`);
        }
    }

    dataTablesRelatorio.search("", false, true, false).draw();
    $("#totalNumAlunos").html(dataTablesRelatorio.page.info().recordsDisplay);

    $("#listaFiltroRelatorio").change((e) => {
        var filtroValue = $(e.currentTarget).val();
        var optValue = listaDeOpcoesRelatorio[$("#listaTipoRelatorio").val()];

        if (optValue["FILTROULTIMA"]) {
            filtroValue = filtroValue.split(" ").slice(-1)[0];
        }

        if (optValue["CUSTOM"]) {
            dataTablesRelatorio.search(filtroValue).draw();
        } else {
            dataTablesRelatorio.search(filtroValue, false, true, false).draw();
        }
        $("#totalNumAlunos").html(dataTablesRelatorio.page.info().recordsDisplay);
    })
})

$("#menuRelatorio a.list-group-item").click((e) => {
    $(".card-report").fadeOut(300, () => {
        e.preventDefault()
        var $that = $(e.target);
        $($that).parent().find('a').removeClass('active');
        $that.addClass('active');

        var optName = $that.attr('name');
        var opt = listaDeOpcoesRelatorio[optName];

        // Titulo
        $(".card-title").html(opt["TITULO"]);

        // Grafico
        $("#grafico").empty();
        plotGraphic("#grafico", opt);

        // Legenda
        $("#legendPlace").empty();
        var isLong = false;
        if (opt["LEGENDA_GRANDE"]) isLong = true;
        if (opt["TIPO"] != "barra") {
            plotLegend("#legendPlace", opt["SERIE"]["labels"], isLong)
        }
        $(".card-report").fadeIn(300);
    });
});

dataTablesRelatorio.on('click', '.escolaStudent', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTablesRelatorio.row($tr).data();
    action = "gerirAlunosEscola";
    navigateDashboard("./modules/escola/escola-gerir-alunos-view.html");
});

dataTablesRelatorio.on('click', '.escolaView', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTablesRelatorio.row($tr).data();
    action = "visualizarEscola";
    navigateDashboard("./modules/escola/escola-dados-view.html");
});

dataTablesRelatorio.on('click', '.escolaEdit', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTablesRelatorio.row($tr).data();
    action = "editarEscola";
    navigateDashboard("./modules/escola/escola-cadastrar-view.html");
});

dataTablesRelatorio.on('click', '.escolaRemove', function () {
    var $tr = getRowOnClick(this);

    estadoEscola = dataTablesRelatorio.row($tr).data();
    action = "apagarEscola";
    Swal2.fire({
        title: 'Remover essa escola?',
        text: "Ao remover uma escola os alunos remanescentes da mesma deverão ser alocados novamente a outra(s) escola(s).",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Cancelar",
        confirmButtonText: 'Sim, remover'
    }).then((result) => {
        if (result.value) {
            RemoverEscola(estadoEscola["ID_ESCOLA"], (err, result) => {
                if (result) {
                    dataTablesRelatorio.row($tr).remove();
                    dataTablesRelatorio.draw();
                    Swal2.fire({
                        type: 'success',
                        title: "Sucesso!",
                        text: "Escola removida com sucesso!",
                        confirmButtonText: 'Retornar a página de administração'
                    });
                } else {
                    Swal2.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: 'Tivemos algum problema. Por favor, reinicie o software!',
                    });
                }
            })
        }
    })
});

// Função para relatar erro
var errorFnEscolas = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao listar as escolas! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

// Callback para pegar número de alunos da escola
var listaNumAlunosCB = (err, result) => {
    if (err) {
        errorFnEscolas(err);
    } else {
        for (let escolaRaw of result) {
            let eID = escolaRaw["ID_ESCOLA"];
            let qtde = escolaRaw["NUM_ALUNOS"];
            let escolaJSON = listaDeEscolas.get(eID);
            escolaJSON["NUM_ALUNOS"] = qtde;
            listaDeEscolas.set(eID, escolaJSON);
        }

        listaDeEscolas.forEach((escola) => {
            dataTablesRelatorio.row.add(escola);
        });

        ListarTodasAsRotasAtendidasPorEscolaPromise()
            .then((res) => {
                for (let e of res) {
                    var escolaRes = listaDeEscolas.get(e["ID_ESCOLA"]);
                    escolaRes["NUM_ROTAS"] = e["NUM_ROTAS"]
                }

                dataTablesRelatorio.draw();
                CalcularEstatisticas();
            })
    }
};

// Callback para pegar dados inicia da escolas
var listaInicialCB = (err, result) => {
    if (err) {
        errorFnEscolas(err);
    } else {
        $("#totalNumEscolas").text(result.length);
        for (let escolaRaw of result) {
            let escolaJSON = parseEscolaDB(escolaRaw);
            escolaJSON["LOCALIZACAO"] = "Área " + escolaJSON["LOCALIZACAO"];
            escolaJSON["NUM_ESCOLAS"] = 0;
            listaDeEscolas.set(escolaJSON["ID_ESCOLA"], escolaJSON);
        }
        NumeroDeAlunosEscolas(listaNumAlunosCB);
    }
};

var buscarTotalNumEscolasPromise = BuscarTodosDadosPromise("Escolas");
var buscarTotalNumRotasPromise = BuscarTodosDadosPromise("Rotas");

Promise.all([buscarTotalNumEscolasPromise, buscarTotalNumRotasPromise])
    .then((res) => {
        totalNumEscolas = res[0].length;
        totalNumRotas = res[1].length;
        BuscarTodasEscolas(listaInicialCB);
    })

action = "relatorioEscola";