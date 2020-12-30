define([
    "js/helper",

    "esri/layers/GraphicsLayer",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/widgets/Sketch/SketchViewModel",
    "esri/Graphic",
    "esri/geometry/geometryEngine"
      
  ], function(
    Helper,

    GraphicsLayer,
    QueryTask,
    Query,
    SketchViewModel,
    Graphic,
    GeometryEngine
    ) {
    
    var __url_layerselected ='',
      __cacheresults=[], // caché de resultados, array de jsons
      __cachelayers = [], // caché de layers del resultados, array de jsons  
      __buffersize=$('#txt_distancia').val(),
      __unidadbuffer = 'meters',
      __sketchgeometry = null,
      __buffergeometry = null;

    var _gly_sketchbuffer = new GraphicsLayer({
      listMode:"hide", 
      title:'Sketck Buffer'
    });
    var _gly_buffer = new GraphicsLayer({
      listMode:"hide", 
      title:'Buffer'
    });
    var _gly_searchbuffer = new GraphicsLayer({
      listMode:"hide", 
      title:"Busqueda en Buffer"
    });
    __globspace.view.map.addMany([_gly_buffer, _gly_sketchbuffer, _gly_searchbuffer]);

    let _sketchviewmodel = new SketchViewModel({
      layer: _gly_sketchbuffer,
      view: __globspace.view,
      pointSymbol: {
        type: "picture-marker", 
        url: "img/marker.png",
        width: "24px",
        height: "24px",
      },
      polylineSymbol: {
        type: "simple-line",
        color: [7, 93, 170],
        width: 2
      },
      polygonSymbol: {
        type: "simple-fill",
        color: [7, 93, 170, 0.2],
        style: "solid",
        outline: {
          color: [7, 93, 170],
          width: 2
        }
      },
      defaultUpdateOptions:{
        tool:'move', 
      },
    });

    _sketchviewmodel.on(["create"], function (event) {
      if (event.state == "complete") {
        __sketchgeometry = event.graphic.geometry;
        updateBuffer();
        Helper.hideTooltipInstructions();
      }
    });

    _sketchviewmodel.on(["update"], function (event) {
      let eventInfo = event.toolEventInfo;
      // update the filter every time the user moves the __buffergeometry
      if (eventInfo && eventInfo.type.includes("move")) {
        if (eventInfo.type === "move-stop") {
          __sketchgeometry = event.graphics[0].geometry;
          updateBuffer();
        }
      }
    });

    $('#wg_buffer').on('click', '.btn-dibujar', function(event){
      remove();
      $('#wg_buffer .btn-dibujar').removeClass('active');
      $(this).addClass('active');
      Helper.createTooltipInstructions();
      let geometryType = $(this).val();
      _sketchviewmodel.create(geometryType);
      let msm='';
      switch (geometryType) {
        case 'point':
          msm='Click en el mapa para agregar un punto'
          break;
        case 'polyline':
          msm='Click en el mapa para comenzar a dibujar la polilínea. Doble clic para terminar.'
          break;
        case 'polygon':
          msm='Click en el mapa para comenzar a dibujar un polígono. Doble clic para terminar.'
          break;
        case 'rectangle':
          msm='Click en el mapa para agregar un rectángulo o mantén presionado el botón izquierdo del ratón para comenzar y suelta para finalizar'
          break;
        case 'circle':
          msm='Clic en el mapa para agregar un círculo o mantén presionado el botón izquierdo del ratón para comenzar y suelta para finalizar'
          break;
      }
      $('#tooltip_mouse span').text(msm);
    })
    $('#wg_buffer').on('change', '#txt_distancia', function(event) {
      __buffersize=$(this).val();
      updateBuffer();
    })
    $('#wg_buffer').on('change', '#cmb_bufferunidad', function(event) {
      __unidadbuffer=$(this).val();
      updateBuffer();
    })

    // actualizar el buffer
    function updateBuffer(){
      removeTabsContents();
      if (__sketchgeometry) {
        if (__buffersize > 0) {
          let aux_buffergeometry = GeometryEngine.geodesicBuffer(__sketchgeometry, __buffersize, __unidadbuffer);
          if (_gly_buffer.graphics.length === 0) {
            _gly_buffer.add(
              new Graphic({
                geometry: aux_buffergeometry,
                symbol: _sketchviewmodel.polygonSymbol 
              })
            );
          } else {
            _gly_buffer.graphics.getItemAt(0).geometry = aux_buffergeometry;
          }
          __buffergeometry = aux_buffergeometry;
          
          __globspace.view.when(function(){
            __globspace.view.goTo({
              target: _gly_buffer.graphics.toArray()
            });
          });
        } else {
          _gly_buffer.removeAll();
          __buffergeometry = __sketchgeometry;
          __globspace.view.when(function(){
            __globspace.view.goTo({
              target: _gly_sketchbuffer.graphics.toArray()
            });
          }); 
        }
        matchVisibleLayers();
      }
    }

    // cargar las capas prendidas
    function matchVisibleLayers() {
      Helper.showPreloader();
      let layers =__globspace.map.layers.items,
        layersvisible=[],
        nlayers=layers.length;

      for (let i = 0; i < nlayers; i++) {
        let aux_layersvisible=[],
          result=[],
          islayervisible='';
  
        layers[i].visible==true ? islayervisible=true : islayervisible=false;

        if(islayervisible==true && layers[i].listMode== "show"){
          aux_layersvisible=getVisibleLayers(layers[i].sublayers.items, islayervisible, result);
          layersvisible.push(aux_layersvisible);
        }
      }
      doFirstMatch(layersvisible);
    } 

    // obtengo las capas prendidas
    function getVisibleLayers(layers, islayervisible, result) {
      if(islayervisible){
        for (let i = 0; i < layers.length; i++) {
          let layer = layers[i];
          let hassublayers='';
          layer.visible==true ? islayervisible=true : islayervisible=false;
          layer.sublayers!=null ? hassublayers=true : hassublayers=false;
          if(islayervisible){
            if(hassublayers){
              getVisibleLayers(layer.sublayers.items, islayervisible, result);
            }else{
              ur_servicio=layer.url;
              titlelayer=layer.parent.title+'/'+layer.title;
              result.push({'titlelayers':titlelayer, 'idlayer':layer.id, 'aliasmil':layer.alias, 'sublayer':layer});
              islayervisible=false;
              getVisibleLayers(layer, islayervisible, result);
            }
          }
        }
      }else{
        return
      }
      return result;
    }

    function activeEventsTabs() {
      // obtengo los parametros para la consulta de una capa en especifico
      $('#tab_buffer a').on('click', function (e) {
        e.preventDefault()
        Helper.showPreloader();
        
        $('.dt-buttons').css('display','none');
        $('.tab-content > div').removeClass('active show');
        let datalayer=$(this).attr('href');
        $(datalayer).addClass('active show');
        
        let aux= datalayer.substring(1).split('¿');
        let aliasmil=aux[0];
        let idlayer=aux[1];

        let aux_sector = __globspace.infolayers.find( layer => layer.alias == aliasmil);
        let layer=aux_sector.layers.find( layer => layer.id == idlayer);
        
        __url_layerselected=layer.url;
        let idtable= datalayer.substring(1);
        let rowcount = $(`#tbl_${datalayer.substring(1)} > tbody tr`).length;

        let idcache=datalayer;
        if (rowcount==0) {
          getDataIntersected(layer, idtable, idcache); //consultar
        }else{
          $(`#container_tblbuffer .dt-buttons > button[aria-controls='tbl_${idtable}']`).parent().css('display','contents');
          let layer=__cacheresults.find( response => response.id == idcache); // caché de resultados 
          console.log(layer);
          let response=layer.response;
          Helper.renderToZoom(response, _gly_searchbuffer);
          Helper.hidePreloader();
        }
      })
      
      // start control del carusel
      $('.jcarousel').jcarousel().on('jcarousel:animateend', function(event, carousel) {
        let id = $(carousel._visible['0']).index();
        $('#wg_buffer .jp-item').removeClass('active'); 
        $('#wg_buffer .jp-item').eq(id).addClass('active');
      });
       // set width of item
      $('#wg_buffer .jcarousel li').width($('.jcarousel').width());
       // move slider
      $('#container_tblbuffer').on('click', '.jc-right', function() {
         event.preventDefault();
        $('.jcarousel').jcarousel('scroll', '+=1');
      });
      $('#container_tblbuffer').on('click', '.jc-left', function() {
         event.preventDefault();
        $('.jcarousel').jcarousel('scroll', '-=1');
      });
      $('#container_tblbuffer').on('click', '.jp-item', function() {
        event.preventDefault();
        let id = $(this).index();
        $('.jcarousel').jcarousel('scroll', id);
      });
      // fin control del carusel
    }

    // hacer la primera interseccion( resultado por defecto)
    function doFirstMatch(layers) {
      $('#div_results .grilla').addClass('notvisible').removeClass('visible');
      let isfirstintersect=true;
      let nlayers=layers.length
      for (let i = nlayers-1; i>=0 ; i--) {
        let layer = layers[i];
        let nlayer=layer.length;
        for (let j = nlayer-1; j>=0 ; j--) {
          let item=layer[j];
          let aliasmil=item.aliasmil;
          let url_servicio=item.sublayer.url; 
          let _queryt = new QueryTask({url:url_servicio}); 
          let _qparams = new Query(); 
          _qparams.geometry = __buffergeometry;
          _qparams.spatialRelationship = "intersects";
          _qparams.outFields = ['*'];
          _qparams.where = '1=1';
          _queryt.executeForCount(_qparams).then(function(response){
            let nreg = response,
              titletab=item.titlelayers,
              idlayer=item.idlayer,
              tabbuffer='',
              tabbuffercontent='';

            // render tabs y contenido
            if(nreg > 0){
              tabbuffer =`
                <li class="nav-item">
                  <a class="nav-link " data-toggle="tab" href="#${aliasmil}¿${idlayer}" id="tab${aliasmil}¿${idlayer}" role="tab" >${titletab} (<span>${nreg}</span>)</a>
                </li>`;
              tabbuffercontent =`
                <div class="tab-pane fade " id="${aliasmil}¿${idlayer}" role="tabpanel" >
                  <table id="tbl_${aliasmil}¿${idlayer}" class="tbl-result table table-striped table-bordered nowrap" style="width:100%">
                    <thead></thead>
                    <tbody></tbody>
                  </table>
                </div>`;

                $('#tab_buffer').append(tabbuffer);
                $('#tab_content_buffer').append(tabbuffercontent);
            }

            // cargar una tabla resultado por defecto (primer layer con entidades intersectados en el buffer )
            if(nreg>0 && isfirstintersect){
              isfirstintersect=false;
              let firstlayer=item.sublayer;
              let firstidtable=`${aliasmil}¿${idlayer}`;
              let firstjson=`#${aliasmil}¿${idlayer}`; 
              getDataIntersected(firstlayer, firstidtable, firstjson);
              __url_layerselected=url_servicio;

              $(`#tab${aliasmil}¿${item.idlayer}`).addClass('active');
              $(`#${aliasmil}¿${item.idlayer}`).addClass('active show');
            }

            // activar eventos en tabs 
            if(j==0){
              activeEventsTabs();
              if(isfirstintersect){
                Helper.hidePreloader();
                alertMessage('No hay entidades en esta área de influencia.','warning','',true);
              }
            }

          }).catch(function (error) {
            Helper.hidePreloader();
            console.log("query task error \n", error);
          })
        }
      }
    }

    // ejecutar consulta de interseccion de buffer con capa determinada
    function getDataIntersected(layer, aux_idtable, idcache) {

      let url_servicio=layer.url;
      let titlelayer='Área de influencia: \n '+layer.parent.title+'-'+layer.title;
      let aux_fields=layer.popupTemplate.fieldInfos;
      let fields=[];
      let outfields='';
      let nfiels=aux_fields.length;
      for (let i = 0; i < nfiels; i++) {
        let field = aux_fields[i];
        fields.push({'fieldname':field.fieldName, 'fieldlabel':field.label});
        outfields +=`,${field.fieldName}`;
      }

      let _queryt = new QueryTask({url:url_servicio}); 
      let _qparams = new Query(); 
      _qparams.returnGeometry = true;
      _qparams.geometry = __buffergeometry;
      _qparams.spatialRelationship = "intersects";
      _qparams.outFields = `${outfields}`;
      _qparams.where = '1=1';
      _queryt.execute(_qparams).then(function(response){
        let nreg = response.features.length;
        let fields = response.fields;
        let isexportable=true;
        let idtable=`#tbl_${aux_idtable}`;
        Helper.loadTable(response, fields, titlelayer, idtable, isexportable);
        Helper.renderToZoom(response, _gly_searchbuffer);
        __cacheresults.push({'id':idcache, 'response': response, 'nreg': nreg}); // caché de resultados 
        if(nreg>=1000){
          alertMessage('El resultado supera el límite de registros a mostrar, por lo tanto solo se muestra los primeros 1000 registros.','warning', 'bottom-right');
        }
      }).catch(function (error) {
          Helper.hidePreloader();
          console.log("query task error \n", error);
      })
    }

    function remove() {
      __sketchgeometry = null;
      __buffergeometry = null;
      Helper.hideGrid();
      _gly_sketchbuffer.removeAll();
      _gly_buffer.removeAll();
      removeTabsContents();
    }

    function removeTabsContents() {
      _gly_searchbuffer.removeAll();
      __url_layerselected='';
      __cacheresults=[];

      $('#container_tblbuffer').addClass('notvisible').removeClass('visible');
      let $tabs=$('#tab_buffer');
      let ntabs= $tabs.length;
      for (let i = 0; i < ntabs; i++) {
        let aux_idtable =$tabs[i].id.split('tab')[1];
        let idtable=`#tbl${aux_idtable}`;
        // limpiar tabla
        let rowcount = $(`${idtable} > tbody tr`).length;
        if (rowcount > 0) {
          $(idtable).DataTable().clear();
          $(idtable).DataTable().destroy();
          $(`${idtable} > thead`).html('');
          $(`${idtable} > tbody`).html('');
        }
      }
      $('#container_tblbuffer').find('.dt-buttons').remove();
      $('#container_tblbuffer .txt-dt-filtar').val('');

      $('#tab_buffer').html('');
      $('#tab_content_buffer').html('');
    }

    // boton limpiar -> limpiar área de influencia
    $('#btn_clearbuffer').on('click', function(){
      $('#container_tblbuffer').removeClass('visible').addClass('notvisible');
      $('#wg_buffer .btn-dibujar').removeClass('active');
      remove();
    })

    // hacer zoom a cada registro
    $('#container_tblbuffer').on('click', '.tdzoom', function(){
      let objectid=$(this).attr('id');
      $('.tbl-result tr.active').removeClass('active');
      $(this).parent().toggleClass('active');
      Helper.paintToZoom(objectid, __url_layerselected, _gly_searchbuffer);
    })
})

   