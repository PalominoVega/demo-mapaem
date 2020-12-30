define([
    "js/helper",

    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/layers/GraphicsLayer",
  ], function(
    Helper,

    QueryTask,
    Query,
    GraphicsLayer,
    ){
        
        var __url_query='';
        var _gly_searchinlayer = new GraphicsLayer({
            listMode:"hide",
            title:"Busqueda en capa"
        });
        __globspace.map.add(_gly_searchinlayer);

        // Evento para inicializar busqueda
        $('#form_searchinlayer').on('submit', function (evt) {
            evt.preventDefault();
            Helper.showPreloader();
            let idsublayer=$('#txt_searchinlayer').attr('data-idlayer'),
                titlereporte='Búsqueda en capa: \n '+$('#txt_searchinlayer').attr('data-titlereporte'),
                aliasmil =$('#txt_searchinlayer').attr('data-aliasmil'),
                filter=$('#txt_searchinlayer').val().trim().toUpperCase();

                aux_sector = __globspace.infolayers.find( sublayer => sublayer.alias == aliasmil),
                sublayer=aux_sector.layers.find( sublayer => sublayer.id == idsublayer),
            
                sql='',
                outFields='',
                fields=sublayer.popupTemplate.fieldInfos;
                nfields=fields.length,
                aux_fields=[];

            for (let i = 0; i < nfields; i++) {
                let field = fields[i];
                sql +=`Upper(${field.fieldName}) like '%${filter}%' or `;
                outFields +=`,${field.fieldName}`;
                aux_fields.push({'fieldname':field.fieldName, 'fieldlabel':field.label});
            }
            
            sql=sql.trim();
            let lengthsql= sql.lastIndexOf(' ');
            sql=sql.substring(lengthsql,-1);
            
            __url_query=sublayer.url;
            _queryt = new QueryTask({url:__url_query});
            
            let _qparams = new Query();
            _qparams.where = sql;
            _qparams.returnGeometry = true;
            _qparams.outFields = `${outFields}`;
            _queryt.execute(_qparams).then(function(response){
                let nreg = response.features.length;
                if(nreg==0){
                    alertMessage("La consulta no tiene registros a mostrar", "warning", '', true)
                    Helper.hidePreloader();
                }else{
                    if(nreg>=1000){
                        alertMessage('El resultado supera el límite de registros a mostrar, por lo tanto solo se muestra los primeros 1000 registros.','warning', 'bottom-right');
                    }
                    Helper.loadTable(response, aux_fields, titlereporte, '#tbl_searchinlayer', false);
                    Helper.renderToZoom(response, _gly_searchinlayer);
                }
            }).catch(function (error) {
                Helper.hidePreloader();
                console.log("query task error", error);
            });
        });

        // zoom individual
        $('#container_tblsearchinlayer').on('click', '.tdzoom', function(){
            $('.tbl-result tr.active').removeClass('active');
            $(this).parent().toggleClass('active ');
            
            let objectid=$(this).attr('id');
            let namefield = $(this).attr('data-namefield');
            let sql = `${ namefield } = ${ objectid }`;
            Helper.paintToZoom(sql, __url_query, _gly_searchinlayer);
        })

        $('#btn_clearsearchinlayer').on('click', function(){
            Helper.hideGrid();
            __url_query='';
            _gly_searchinlayer.removeAll();
            $('#txt_searchinlayer').val('');
        })

        $("#btnswitch_2d3d").on('change',function(){
            __globspace.currentview.map.add(_gly_searchinlayer);
        })
})
