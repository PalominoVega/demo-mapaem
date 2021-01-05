define([
    "esri/Graphic",

    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
  ],function(
    Graphic,
    
    QueryTask,
    Query
  ){

    var __idgrilla='';
    var __idtable='';
    var __datatable='';
    var __arr_fieldhide = [];

    function loadTable(response, fields, titlereporte, idtable, isexportable) {
        __idgrilla = '#' + $(idtable).parents('.grilla').attr('id');
        __idtable = idtable;
        $('#div_results .grilla').addClass('notvisible');
        hideGrid();
        
        let data = response.features,
            nreg = data.length,
            tbody = '',
            nfieldresponse = '0',
            nfield = fields.length,
            theader = '',
            aux_theader = '<th>#</th>',
            aligncolum = [],
            textalign = '';

        nreg != 0 ? nfieldresponse = Object.keys(data[0].attributes).length : ''; //saber si hay data que mostrar o no

        // limpiar tabla
        let rowcount = $(`${__idtable} > tbody tr`).length;
        if (rowcount > 0) {
            $(__idtable).DataTable().clear();
            $(__idtable).DataTable().destroy();
            $(`${__idtable} > thead`).html('');
            $(`${__idtable} > tbody`).html('');
        }

        // armar cabecera theader
        for (let j = 0; j < nfield; j++) {
            let columname = (fields[j].alias).toUpperCase();
            let typedata = fields[j].type;
            let textaligncolum = 'L';
            
            if(['double','small-integer','integer', 'single'].includes(typedata)){
                textaligncolum = 'R';
            }

            if ($.inArray(fields[j].name, __arr_fieldhide) == -1) { 
                
                if(typedata == 'oid'){
                    aux_theader += `<th>Zoom</th>`;
                    textaligncolum = 'C';
                }else{
                    aux_theader += `<th>${columname}</th>`;
                }

            }

            aligncolum.push(textaligncolum);
        }
        theader = `<tr>${aux_theader}</tr>`;

        if (nreg != 0 && nfieldresponse != 0) {
            // armar cuerpo tbody
            for (let i = 0; i < nreg; i++) {
                let row = data[i].attributes;
                let aux_tbody = '<td></td>';
                for (let j = 0; j < nfield; j++) {
                    let item = row[fields[j].name];
                    let typedata = fields[j].type;
                    
                    // alineacion de los campos
                    textalign ='text-left';
                    if(['double','small-integer','integer', 'single'].includes(typedata)){
                        textalign ='text-right';
                    }

                    if ($.inArray(fields[j].name, __arr_fieldhide) == -1) {

                        if (item == undefined || item === null) {
                            aux_tbody += `<td> </td>`;
                        }else {
                            // dar formado de fecha cuando es string y tenga este formato 01/05/2003 12:00:00 a.m.
                            let regexdate = /^\d{1,2}\/\d{1,2}\/\d{2,4}\s\d{1,2}:\d{1,2}:\d{1,2}\s(AM|am|PM|pm|A.M.|a.m.|P.M.|p.m.)$/;
                            if(regexdate.test(item)){
                                item = item.substring(0,11);
                            };

                            // dar formato a la fecha
                            if(typedata=='date'){
                                item = getFormatDate(item, 'DD/MM/YYYY');
                            }
                            
                            // dar formnato a numero con dos decimales
                            if(typedata=='double'){
                                item = item.toFixed(2);
                            }

                            // solamente para campo con la palabra MES 
                            if (fields[j].name == 'MES') {
                                item = getMonthName(parseInt(item)).f;
                            }
    
                            // asigno la zoom 
                            if (typedata == 'oid') {
                                aux_tbody += `<td class='tdzoom' id="${item}" data-namefield="${fields[j].name}" data-toggle="tooltip" data-placement="left" title="Acercar" ><span class='esri-icon-zoom-in-magnifying-glass' ></span></td>`;
                            } else {
                                aux_tbody += `<td class='${textalign}'>${item} </td>`;
                            }
                        }
                    }
                }
                tbody += `<tr>${aux_tbody}</tr>`;
            }
        } else {
            isexportable = false;
        }

        // luego llenar tabla con nueva data
        $(`${__idtable} > thead`).html(theader);
        $(`${__idtable} > tbody`).html(tbody);
        $(`${__idgrilla} .lbl-titlereporte`).text(titlereporte);
        
        // mostrar tabla
        showGrid();
        if ($('#div_results .grilla').hasClass('max-size')) { 
            $('#div_results .grilla').removeClass('max-size').addClass('min-size');
        }

        // obtengo el tamaño para tbody del datatable 
        let heightgrilla = $(__idgrilla).outerHeight();
        let heightgrillaheader = $(__idgrilla+' .card-header-gis').outerHeight();
        let heighttabsbuffer = $(__idgrilla+' .jcarousel').outerHeight();
        let heightdtheader = 38; // altura del header del datatable
        let heightdtfooter=37; // altura del footer del datatble 
        heightgrillaheader<28 ? heightgrillaheader=34: '';
        typeof heighttabsbuffer === 'undefined' ? heighttabsbuffer=0: '';

        let lengthscrolly= heightgrilla - (heightgrillaheader + heightdtheader + heightdtfooter + heighttabsbuffer);

        // formateo con datatable
        let table = '';

        if (isexportable) {
            table = getDataTableExport(titlereporte, lengthscrolly);
        } else {
            table = getDataTable(lengthscrolly);
        }

        setTimeout(function(){ table.columns.adjust().draw(); },500);
        
        __datatable = table;
        hidePreloader();
    }


    function getDataTableExport(titlereporte, lengthscrolly){
        let filename=titlereporte.replace(/\ \/\ /g,'-');
        filename=filename.replace(': ','-');
        filename=filename.replace(/\ /g,'_');

        let table =   $(__idtable).DataTable({
            dom: 't<"dt-footer"<"dt-info"i><"dt-pag-length"pl>>',
            "language":getDataTableIdioma(),
            buttons:  [
                {
                    extend: 'csvHtml5',
                    text:      '<i class="icon-file-excel-o"></i> CSV',
                    titleAttr: 'CSV',
                    title : titlereporte,
                    filename: filename,
                    exportOptions: {
                        columns: ':visible'
                    }
                },{
                    extend: 'excelHtml5',
                    text:      '<i class="icon-file-excel-o"></i> XLS',
                    titleAttr: 'XLS',
                    title : titlereporte,
                    filename: filename,
                    exportOptions: {
                        columns: ':visible'
                    }
                },{
                    extend: 'pdfHtml5',
                    text:      '<i class="icon-file-pdf-o"></i> PDF',
                    titleAttr: 'PDF, ocultar columnas innecesarias para evitar desborde en el documento.',
                    title : titlereporte,
                    filename: filename,
                    pageSize: 'A4',
                    customize: function(doc){
                        // orientacion del doc. 
                        let tableNode;
                        let auxlength = doc.content.length;
                        for (i = 0; i < auxlength ; ++i) {
                            if(doc.content[i].table !== undefined){
                              tableNode = doc.content[i];
                              break;
                            }
                        }         
                        let rowIndex = 0;
                        let tableColumnCount = tableNode.table.body[rowIndex].length;
                        if(tableColumnCount > 7){
                            doc.pageOrientation = 'landscape';
                        }

                        // style de doc
                        doc.pageMargins = [20,60,20,60];
                        doc.styles.tableHeader.fontSize = 8;
                        doc.styles.tableHeader.fillColor = "#075daa";
                        doc.defaultStyle.fontSize = 8;
                        // quito la propiedad *title* 
                        doc.content.splice(0,1);

                        // header => logo   title de reporte
                        doc['header']=(function(){
                            return {
                                table: {
                                    // widths: [150,'*',150],
                                    body: [
                                        [
                                            {
                                                image: 'data:image/png;base64,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',
                                                width: 150,
                                                border: [false,false,false,false]
                                            },
                                            {text: titlereporte, style:'header', fontSize: 12, bold:true, alignment:'center', border: [false,false,false,false]},
                                            // {text:'', border: [false,false,false,false]}
                                        ]
                                    ]
                                },
                                margin: [20,20,20,0]
                            }
                        });
                        console.log(doc);
                        // footer => fecha y hora   numeracion de paginas
                        let now = new Date();                    
                        let hour = now.getHours();
                        let jsDate = now.getDate() + "/" + (now.getMonth()+1)+ "/" + now.getFullYear() + " Hora: "  +hour+ ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes() + ":" + (now.getSeconds() < 10 ? "0" : "") + now.getSeconds() ;
                        doc['footer']=(function(page, pages) {
                            return {
                                columns: [
                                    {
                                        alignment: 'left',
                                        text: ['Fecha : ' ,{ text: jsDate.toString() }]
                                    },
                                    {
                                        alignment: 'right',
                                        text: ['Pagina ',{ text: page.toString() },  ' de ', { text: pages.toString() }]
                                    }
                                ],
                                margin: 20
                            }
                        });

                        // Styling the table: create style object
                        let objLayout = {};
                        // Horizontal line width
                        objLayout['hLineWidth'] = function(i) { return .0; };
                        // Vertikal line width
                        objLayout['vLineWidth'] = function(i) { return .5; };
                        // Horizontal line color
                        objLayout['hLineColor'] = function(i) { return '#BCBCBC'; };
                        // Vertical line color
                        objLayout['vLineColor'] = function(i) { return '#BCBCBC'; };
                        // Left padding of the cell
                        objLayout['paddingLeft'] = function(i) { return 4; };
                        // Right padding of the cell
                        objLayout['paddingRight'] = function(i) { return 4; };
                        // Inject the object in the document
                        doc.content[0].layout = objLayout;
                    },
                    exportOptions: {
                        columns: ':visible'
                    }
                },{
                    extend: 'colvis',
                    text: '<i class="icon-add"></i>',
                    columns: ':not(.noVis)'
                }
            ],
            columnDefs: [
                { targets: 0, searchable: false, orderable:false, className: 'noVis'},
                { targets: 1, searchable: false, orderable:false}
            ],
            // "order": [[ 2, "desc" ]],
            "bDestroy": true,
            "retrieve":true,
            "scrollX": true,
            // "scrollY": 170,
            "scrollY": lengthscrolly,
            "drawCallback": function( settings ) {
                $('ul.pagination').addClass("pagination-sm");
            }
        });
        
        // añado los botones a un div personalizado
        table.buttons().container().insertAfter(`${__idgrilla} .txt-dt-filtar`);
        
        // pongo un indice a la tabla - solo se muestra en los docs exportado
        table.on('order.dt search.dt', function () {
            table.column(0, {
                search: 'applied',
                order: 'applied'
            }).nodes().each(function (cell, i) {
                cell.innerHTML = i + 1; // asigo el número para el indice
                table.cell(cell).invalidate('dom'); //para exportar el indece de la tabla: para indicar a DataTables que vuelva a leer la información del DOM para la celda que contiene el índice. 
            });
        }).draw();

        table.columns.adjust().draw();
        return table;
    }

    function getDataTable(lengthscrolly){
        let table =   $(__idtable).DataTable({
            dom: 't<"dt-footer"<"dt-info"i><"dt-pag-length"pl>>',
            "language":getDataTableIdioma(),
            buttons:  [
                {
                    extend: 'colvis',
                    text: '<i class="icon-add"></i>',
                    columns: ':not(.noVis)'
                }
            ],
            columnDefs: [
                { targets: 0, searchable: false, orderable:false, className: 'noVis' },
                { targets: 1, searchable: false, orderable:false, className: 'noVis' }
            ],
            "order": [[ 2, "desc" ]],
            "bDestroy": true,
            "retrieve":true,
            "scrollX": true,
            // "scrollY": 170,
            "scrollY": lengthscrolly,
            "drawCallback": function( settings ) {
                $('ul.pagination').addClass("pagination-sm");
            }
        });
        
        // añado los botones a un div personalizado
        table.buttons().container().insertAfter(`${__idgrilla} .txt-dt-filtar`);
    
        // pongo un indice a la tabla 
        table.on( 'order.dt search.dt', function () {
            table.column(0, {search:'applied', order:'applied'}).nodes().each( function (cell, i) {
               cell.innerHTML = i + 1; // asigo el número para el indice
               table.cell(cell).invalidate('dom'); //para exportar el indece de la tabla: para indicar a DataTables que vuelva a leer la información del DOM para la celda que contiene el índice. 
            });
         }).draw();

        $(`${__idgrilla} .tbl-exportar`).css('min-width', 'auto');
        table.columns.adjust().draw();
        return table;
    }

    // añado search a un input personalizado
    $(`${__idgrilla} .txt-dt-filtar`).on( 'keyup', function () {
        __datatable.search( this.value ).draw();
    });

    function getDataTableIdioma() {
        let idioma ={
            "sProcessing":     "Procesando...",
            "sLengthMenu":     " _MENU_ ",
            "sZeroRecords":    "No se encontraron registros!",
            "sEmptyTable":     "No se encontraron registros!",
            "sInfo":           "_START_ - _END_ de _TOTAL_ resultados",
            "sInfoEmpty":      "0 - 0 de 0 resultados",
            "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
            "sInfoPostFix":    "",
            "sSearch":         "Buscar:",
            "sUrl":            "",
            "sInfoThousands":  ",",
            "sLoadingRecords": "Cargando...",
            "oPaginate": {
                "sFirst":    "<<",
                "sLast":     ">>",
                "sNext":     ">",
                "sPrevious": "<"
            },
            "oAria": {
                "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                "sSortDescending": ": Activar para ordenar la columna de manera descendente"
            },
            "buttons": {
                "copy": "Copiar",
                "colvis": "Visibilidad"
            }
        };
    return idioma;
    }
    
    function renderToZoom(response, _gl_search) {
        _gl_search.removeAll();
        let symbol=getTypeSymbol(response.geometryType);
        response.features.forEach(function(item){
            let _gra_search = new Graphic({
                geometry: item.geometry,
                symbol: symbol, 
            });
            _gl_search.add(_gra_search);
        });
        __globspace.currentview.when(function(){
            __globspace.currentview.goTo({
                target: _gl_search.graphics.toArray()
            });
        }); 
    }

    function renderGraphic(response, _gl_search) {
        _gl_search.removeAll();
        let symbol = getTypeSymbol(response.geometryType);
        let auxlength = response.features.length;
        let graphics = [];
        
        for (let i = 0; i < auxlength; i++) {
            let item = response.features[i];
            let _gra_search = new Graphic({
                geometry: item.geometry,
                symbol: symbol,
            });
            graphics.push(_gra_search);
        }
        
        _gl_search.addMany(graphics);
    }

    function renderToZoomBuffer(response, _gl_search, geometrybuffer) {
        _gl_search.removeAll();
        let symbol=getTypeSymbol(response.geometryType);
        response.features.forEach(function(item){
            let _gra_search = new Graphic({
                geometry: item.geometry,
                symbol: symbol, 
            });
            _gl_search.add(_gra_search);
        });
        __globspace.currentview.when(function(){
            __globspace.currentview.goTo({
                target: geometrybuffer
            });
        }); 
    }

    function paintToZoom(sql, url_servicio, _gl_search) {
        _gl_search.removeAll();
        let _queryt = new QueryTask({url: url_servicio}),
        _qparams = new Query();
        // _qparams.where = "OBJECTID = "+objectid+"";
        _qparams.where = sql;
        _qparams.returnGeometry = true;
        _queryt.execute(_qparams).then(function(response){
            let geometrytype=response.geometryType,
                symbol=getTypeSymbol(geometrytype),
                _gra_search = new Graphic({
                    geometry: response.features[0].geometry,
                    symbol: symbol, 
                });
            _gl_search.add(_gra_search);

            __globspace.currentview.when(function(){
                if(geometrytype!='point'){
                    __globspace.currentview.goTo({
                        target: _gl_search.graphics,
                    });
                }else{
                    __globspace.currentview.goTo({
                        target: _gl_search.graphics,
                        zoom: 19
                    });
                }
            }); 
        }).catch(function (error) {
            hidePreloader();
            console.log("query task error", error);
        });
    }

    function getTypeSymbol(geometrytype) {
        let symbol = '';
        switch (geometrytype) {
            case "point":
                symbol = {
                    type: "simple-marker",
                    outline: {
                        color: [0, 250, 237, 0.6], //"#00d200",
                        width: 1.5
                    }
                };
                return symbol;
            case "polyline":
                symbol = {
                    type: "simple-line",
                    color: [0, 250, 237, 0.6],
                    width: "2.5",
                    outline: {
                        color: "#00faed", //"#00d200",
                        width: 1.5
                    }
                }
                return symbol;
            case "polygon":
                symbol = {
                    type: "simple-fill",
                    color: [0, 250, 237, 0.6],
                    outline: {
                        color: "#00faed", //"#00d200",
                        width: 1.5
                    }
                };
                return symbol;
            default:
                break;
        }
    }



    // tooltip mouse 
    let $tooltip = $('#tooltip_mouse'),
        popperinstance = null,
        virtualelement = {
            getBoundingClientRect: generateGetBoundingClientRect()
        };
        
    function generateGetBoundingClientRect(x = 0, y = 0) {
        return () => ({
            width: 0,
            height: 0,
            top: y,
            right: x,
            bottom: y,
            left: x
        });
    }
    function createTooltipInstructions() {
        $tooltip.addClass('visible').removeClass('notvisible');
        popperinstance = new Popper(virtualelement, $tooltip, {
            onCreate({ instance }) {
                document.onmousemove = ({ x, y }) => {
                    virtualelement.getBoundingClientRect = generateGetBoundingClientRect(x, y);
                    instance.scheduleUpdate();
                };
            }
        });

        // Popper.createPopper(circulo, tcirculo,{
		// 	placement:'bottom-start'
		// });
    }
    function hideTooltipInstructions() {
        $tooltip.addClass('notvisible').removeClass('visible');
        if (popperinstance) {
            popperinstance.destroy();
            popperinstance = null;
        }
    }

    // trabajando con fechas
    function getFormatDate(date, format) { //dar formato cuando se pasa como paremtro en milisegundos
        let fecha = moment(date);
        if(fecha.isValid() && date != '' && date != 0 && typeof date != 'undefined'){
            // fecha = fecha.format(format); // 
            fecha = fecha.add(5,'hours').format(format);
        }else if(typeof date == 'undefined')
            fecha = 'undefined';
        else
            fecha = '';
        return fecha;
    }

    function getMonthName(nummes){ // s: small  f: full
        nombremeses = {
            1: {
                s: "Ene",
                f: "Enero"
            },
            2: {
                s: "Feb",
                f: "Febrero"
            },
            3: {
                s: "Mar",
                f: "Marzo"
            },
            4: {
                s: "Abr",
                f: "Abril"
            },
            5: {
                s: "May",
                f: "Mayo"
            },
            6: {
                s: "Jun",
                f: "Junio"
            },
            7: {
                s: "Jul",
                f: "Julio"
            },
            8: {
                s: "Ago",
                f: "Agosto"
            },
            9: {
                s: "Set",
                f: "Setiembre"
            },
            10: {
                s: "Oct",
                f: "Octubre"
            },
            11: {
                s: "Nov",
                f: "Noviembre"
            },
            12: {
                s: "Dic",
                f: "Diciembre"
            }
        }

        return nombremeses[nummes];
    }

    function getValidationForm(form, requiere){
        let $form = $(`#${ form }`);
        let auxlength = requiere.length;

        let v_continue = true;
        let counterror = 0;
        $('.form-group', $form).removeClass('error');
        $('.form-group span.lbl-error', $form).remove();

        for (let i = 0; i < auxlength; i++) {
            const idfiel = requiere[i].idfiel;
            const label = requiere[i].label;

            if ($(`#${ idfiel }`).val().trim() === '') {
                $(`#${ idfiel }`).parent().addClass('error').append(`<span class=lbl-error> ${ label } obligatorio</span>`);
                $(`#${ idfiel }`).val('');
                counterror++;
            }

        }

        $('.error input:first', $form).focus();
        $('.error select:first', $form).focus();

        if (counterror != 0) {
            v_continue = false;
            hidePreloader();
        }
        return v_continue;
    }



    // funciones html
    function showGrid() {
        $(__idgrilla).addClass('visible').removeClass('notvisible');
    }
    function hideGrid() {
        $(__idgrilla).addClass('notvisible').removeClass('visible');
    }

    function showPreloader() {  
        $('#div_preloader').addClass('preloader').removeClass('preloader-none');
    }
    function hidePreloader() {
        $('#div_preloader').removeClass('preloader').addClass('preloader-none');
    }

    return {
        loadTable: function(response, queryfields,titlereporte, url_servicio, isexportable){return loadTable(response, queryfields, titlereporte, url_servicio, isexportable); },
        renderToZoom: function(response,_gly_search){return renderToZoom(response, _gly_search);},
        renderGraphic: function(response,_gly_search){return renderGraphic(response, _gly_search);},
        renderToZoomBuffer: function(response,_gly_search, geometrybuffer){return renderToZoomBuffer(response, _gly_search, geometrybuffer);},
        paintToZoom: function(objectid, url_servicio, _gly_search){return paintToZoom(objectid, url_servicio, _gly_search);},
        showGrid:  function () { return showGrid(); },
        hideGrid:  function () { return hideGrid(); },
        showPreloader:  function () { return showPreloader(); },
        hidePreloader:  function () { return hidePreloader(); },

        createTooltipInstructions:  function () { return createTooltipInstructions(); },
        hideTooltipInstructions:  function () { return hideTooltipInstructions(); },

        getValidationForm: function (form, requiere) {
            return getValidationForm(form, requiere);
        },

        getMonthName: function (nummes) {
            return getMonthName(nummes);
        },
        
        getFieldsHide: function () {
            return __arr_fieldhide;
        },
    }
    
  });
