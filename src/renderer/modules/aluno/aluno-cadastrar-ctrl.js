// aluno-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela aluno-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um aluno.
// Também é feito consultas nos dados de escolas para permitir vincular um aluno
// a uma escola no momento de cadastro ou posteriormente.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarAluno") {
    estaEditando = true;
}

// Posição do Aluno (Mapa)
var posicaoAluno;
var mapa = novoMapaOpenLayers("mapCadastroAluno", cidadeLatitude, cidadeLongitude);

window.onresize = function () {
    setTimeout(function () {
        if (mapa != null) { mapa["map"].updateSize(); }
    }, 200);
}

var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca
mapa["activateGeocoder"]();

// Ativa camadas
mapa["activateImageLayerSwitcher"]();

// Lida com click de usuário
mapaOL.on('singleclick', function (evt) {
    // if (evt.originalEvent.path.length > 21) {
    //     return;
    // }

    if (posicaoAluno != null) {
        try {
            vectorSource.removeFeature(posicaoAluno);
        } catch (err) {
            console.log(err);
        }
    }
    
    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat.toPrecision(8));
    $("#reglon").val(lon.toPrecision(8));
    $("#reglat").valid();
    $("#reglon").valid();

    posicaoAluno = gerarMarcador(lat, lon, "img/icones/aluno-marcador.png", 25, 50);
    vectorSource.addFeature(posicaoAluno);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoAluno])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(lat.toPrecision(8));
        $("#reglon").val(lon.toPrecision(8));
    }, posicaoAluno);

    mapaOL.addInteraction(translate);
});

// Máscaras
$(".datanasc").mask('00/00/0000');
$('.cep').mask('00000-000');
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".cpfmask").mask('000.000.000-00', { reverse: true });

// Estrutura de validação do formulário
var validadorFormulario = $("#wizardCadastrarAlunoForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            reglat: {
                required: false,
                posicao: true
            },
            reglon: {
                required: false,
                posicao: true
            },
            regdata: {
                required: true,
                datanasc: true
            },
            regnome: {
                required: true,
                lettersonly: true
            },
            areaUrbana: {
                required: true,
            },
            regnomeresp: {
                required: false,
                lettersonly: true
            },
            listareggrauresp: {
                required: false,
            },
            modoSexo: {
                required: true
            },
            corAluno: {
                required: true
            },
            listaescola: {
                required: true,
            },
            listarota: {
                required: true,
            },
            turnoAluno: {
                required: true
            },
            nivelAluno: {
                required: true
            }
        },
        messages: {
            regdata: {
                required: "Por favor digite a data de nascimento do aluno"
            },
            regnome: {
                required: "Por favor digite um nome válido"
            },
            regnomeresp: {
                required: "Por favor digite um nome válido"
            },
            listareggrauresp: {
                required: "Selecione o grau de parentesco"
            }
        }
    }
});


$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarAlunoForm'),
    ...{
        onTabShow: function (tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index + 1;

            var $wizard = navigation.closest('.card-wizard');

            // If it's the last tab then hide the last button and show the finish instead
            if ($current >= $total) {
                $($wizard).find('.btn-next').hide();
                $($wizard).find('.btn-finish').show();
            } else {
                $($wizard).find('.btn-next').show();
                $($wizard).find('.btn-finish').hide();
            }

            if (estaEditando) {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }

        }
    }
});


var completeForm = () => {
    Swal2.fire({
        title: "Aluno salvo com sucesso",
        text: "O aluno " + $("#regnome").val() + " foi salvo com sucesso. " +
              "Clique abaixo para retornar ao painel.",
        type: "info",
        icon: "info",
        showCancelButton: false,
        closeOnConfirm: false,
        allowOutsideClick: false,
    })
        .then(() => {
            navigateDashboard("./modules/aluno/aluno-listar-view.html");
        });
}

$("#salvaraluno").on('click', () => {
    $("[name='turnoAluno']").valid();
    $("[name='nivelAluno']").valid();

    var $valid = $('#wizardCadastrarAlunoForm').valid();
    if (!$valid) {
        return false;
    } else {
        var alunoJSON = GetAlunoFromForm();
        var idEscola = $("#listaescola").val();
        var idRota = $("#listarota").val();
    
        if (estaEditando) {
            var idAluno = estadoAluno["ID"];

            loadingFn("Atualizando os dados do(a) aluno(a) ...")

            dbAtualizarPromise(DB_TABLE_ALUNO, alunoJSON, idAluno)
            .then(() => {
                let promiseArray = new Array();
                if (idEscola != idEscolaAnterior && idEscola != null) {
                    promiseArray.push(dbRemoverDadoCompostoPromise(DB_TABLE_ESCOLA_TEM_ALUNOS,
                                      "ID_ESCOLA", String(idEscolaAnterior), 
                                      "ID_ALUNO", idAluno))
                    if (idEscola != 0 && idEscola != null) {
                        promiseArray.push(dbInserirPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, {
                            "ID_ESCOLA": idEscola, 
                            "ID_ALUNO": idAluno
                        }))
                    }
                }

                if (idRota != idRotaAnterior && idRota != null) {
                    promiseArray.push(dbRemoverDadoCompostoPromise(DB_TABLE_ROTA_ATENDE_ALUNO,
                                      "ID_ROTA", String(idRotaAnterior),
                                      "ID_ALUNO", idAluno))
                    if (idRota != 0 && idRota != null) {
                        promiseArray.push(dbInserirPromise(DB_TABLE_ROTA_ATENDE_ALUNO, {
                            "ID_ROTA": idRota,
                            "ID_ALUNO": idAluno
                        }))
                    }
                }

                return Promise.all(promiseArray);
            })
            .then(() => dbAtualizaVersao())
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao atualizar o(a) aluno na escola!", err));
        } else {
            loadingFn("Cadastrando o(a) aluno(a) ...")
            
            dbInserirPromise(DB_TABLE_ALUNO, alunoJSON)
            .then((res) => {
                let promisses = [];

                if (idEscola != 0) {
                    promisses.push(dbInserirPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, {
                                   "ID_ESCOLA": idEscola,
                                   "ID_ALUNO": res.id
                    }))
                } 

                if (idRota != 0) {
                    promisses.push(dbInserirPromise(DB_TABLE_ROTA_ATENDE_ALUNO, {
                                  "ID_ROTA": idRota,
                                  "ID_ALUNO": res.id
                    }))
                }

                return Promise.all(promisses)
            })
            .then(() => dbAtualizaVersao())
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao salvar o aluno.", err))
        }
    }
});

dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA)
.then((res) => {
    res.sort((e1, e2) => {
        return ('' + e1["NOME"]).localeCompare(e2["NOME"]);
    })

    res.forEach((escola) => {
        var eID = escola["ID"];
        var eNome = escola["NOME"];
        $('#listaescola').append(`<option value="${eID}">${eNome}</option>`);
    });

    return res;
})
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ROTA))
.then((res) => {
    res.sort((e1, e2) => {
        return ('' + e1["NOME"]).localeCompare(e2["NOME"]);
    })
    
    res.forEach((rota) => {
        var rID = rota["ID"];
        var rNome = rota["NOME"];
        $('#listarota').append(`<option value="${rID}">${rNome}</option>`);
    });

    return res;
})
.then(() => { if (estaEditando) preencheDadosParaEdicao() })
.catch((err) => errorFn)


// Variável armazena o ID da escola do aluno 
// Importante ter para caso o usuário modifique os dados do aluno/escola e aluno/rota
var idEscolaAnterior;
var idRotaAnterior;

function preencheDadosParaEdicao() {
    $(".pageTitle").html("Atualizar Aluno");
    PopulateAlunoFromState(estadoAluno);
    
    // ID da escola anterior
    idEscolaAnterior = estadoAluno["ID_ESCOLA"];
    idRotaAnterior = estadoAluno["ID_ROTA"];

    // Reativa máscaras
    $(".cep").trigger('input')
    $(".datanasc").trigger('input')
    $(".telmask").trigger('input')
    $(".cpfmask").trigger('input')
    
    // Coloca marcador da casa do aluno caso tenha a localização
    if (estadoAluno["LOC_LONGITUDE"] != null && estadoAluno["LOC_LONGITUDE"] != undefined &&
        estadoAluno["LOC_LATITUDE"] != null && estadoAluno["LOC_LATITUDE"] != undefined) {
        posicaoAluno = gerarMarcador(estadoAluno["LOC_LATITUDE"],
                                        estadoAluno["LOC_LONGITUDE"], 
                                        "img/icones/casamarker.png", 25, 40);
        vectorSource.addFeature(posicaoAluno);

        mapa["map"].getView().fit(vectorSource.getExtent(), {
            padding: [40, 40, 40, 40]
        });
        mapa["map"].updateSize();
    }

    $("#cancelarAcao").on('click', () => {
        cancelDialog()
        .then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
    });
}

action = "cadastrarAluno"