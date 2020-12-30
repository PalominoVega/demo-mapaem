define([
    "js/helper",

    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/layers/GraphicsLayer"
], function (
    Helper,

    QueryTask,
    Query,
    GraphicsLayer
) {

    var __url_query = '',
        __filter = '',
        __titlereport='',

        _gly_searchinlayer = new GraphicsLayer({
            listMode: "hide",
            title: "Búsqueda en capa"
        });

    __globspace.map.add(_gly_searchinlayer);

    // Evento para inicializar busqueda
    $('#wg_searchinlayer').on('submit', '#form_searchinlayer', function (evt) {
        evt.preventDefault();
        Helper.showPreloader();

        let requiere = [
            {
              idfiel: 'txt_searchinlayer',
              label: 'Campo'
            }
        ];

        if(Helper.getValidationForm('form_searchinlayer', requiere)){
            Helper.hideGrid();
    
            let dataforsearch = __globspace.sublayersearch,
                sublayer = dataforsearch.sublayer;
                
            __filter = $('#txt_searchinlayer').val().trim().toUpperCase();
            __titlereport = 'Búsqueda en capa: \n ' + dataforsearch.titlereport; //title del reporte para el exportar
            __url_query = sublayer.url;
            getQuery();
        }
    });

    //Evento lanzado para hacer zoom a cada registro de la tabla resultado
    $('#container_tblsearchinlayer').on('click', '.tdzoom', function () {
        $('.tbl-result tr.active').removeClass('active');
        $(this).parent().toggleClass('active ');

        let objectid = $(this).attr('id');
        Helper.paintToZoom(objectid, __url_query, _gly_searchinlayer);
    });

    // Evento lanzado para limpiar toda la operación
    $('#wg_searchinlayer').on('click', '#btn_clearsearchinlayer', function () {
        Helper.hideGrid();
        __url_query = '';
        __filter = '';
        __titlereport='';
        __outfields='';
        _gly_searchinlayer.removeAll();
        $('#txt_searchinlayer').val('');
    });

    // FUNCIONES

    function getQuery(){
        _gly_searchinlayer.removeAll();
        
        let _queryt = new QueryTask({ url: __url_query }),
        _qparams = new Query();

        _qparams.where = '1<>1';
        _qparams.outFields = ['*'];
        _qparams.returnGeometry = false;
        _queryt.execute(_qparams).then(function (response) {
            let fields = response.fields,
                auxlength = fields.length,
                sql = '';

            for (let i = 0; i < auxlength; i++) {
                let field = fields[i],
                    typedata = field.type;
                
                switch (typedata) {
                    case 'double': case 'small-integer': case 'integer': case 'oid': case 'single':
                        if(!isNaN(parseFloat(__filter))){
                            sql += `${ field.name } = "${ __filter }" or `;
                        }
                        break;
                    case 'date':
                        let isformatdate = moment(__filter, 'YYYY-MM-DD', true).isValid();
                        if(isformatdate){
                            let fi = moment(__filter).add(5, 'hours').format('YYYY-MM-DD HH:mm:ss');  //consulta al servicio en hora utc (+5);
                            let ff = moment(__filter).add(29, 'hours').subtract(1, 'seconds').format('YYYY-MM-DD HH:mm:ss');
                            auxsql = `(${ field.name } BETWEEN timestamp '${ fi }' AND timestamp '${ ff }')`;
                        }
                        break;
                    default:
                        sql += `Upper(${ field.name }) like '%${ __filter }%' or `;
                        break;
                }
            }

            sql = sql.trim();
            let lengthsql = sql.lastIndexOf(' ');
            sql = sql.substring(lengthsql, -1);

            // obtener la data de la consulta
            let _queryt2 = new QueryTask({ url: __url_query }),
                _qparams2 = new Query();
                
            _qparams2.where = sql;
            _qparams2.returnGeometry = true;
            _qparams2.outFields = ['*'];
            return _queryt2.execute(_qparams2);
        })
        .then(function(response){
            let nreg = response.features.length;
            let fields = response.fields;
            if (nreg == 0) {
                alertMessage("La consulta no tiene registros a mostrar", "warning", 'top-center', true)
                Helper.hidePreloader();
                
            } else {
                Helper.loadTable(response, fields, __titlereport, '#tbl_searchinlayer', false);
                Helper.renderToZoom(response, _gly_searchinlayer);
                
                if (nreg >= 1000) {
                    alertMessage('El resultado supera el límite de registros a mostrar, por lo tanto solo se muestra los primeros 1000 registros.', 'warning', 'top-center', true);
                }
            }
        })
        .catch(function (error) {
            Helper.hidePreloader();
            console.log("query task error: "+ error);
        });
    }

});

/**
 * REVISADO PALOMINO 
 */