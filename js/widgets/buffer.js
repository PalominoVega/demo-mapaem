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
    
    var $containertbl = $('#container_tblbuffer');

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


    /*********************** UX ****************************/

  //Evento lanzado al seleccionar una figura para dibujar
  $('#wg_buffer').on('click', '.btn-dibujar', function (event) {
    
    clearAllOperation();
    $('#wg_buffer .btn-dibujar').removeClass('active');
    $(this).addClass('active');
    Helper.createTooltipInstructions();

    let geometryType = $(this).val();
    _sketchviewmodel.create(geometryType);
    let msm = '';
    switch (geometryType) {
      case 'point':
        msm='Click en el mapa para agregar un punto'
        break;
      case 'polyline':
        msm='Click en el mapa para comenzar a dibujar una polilínea. Doble clic para finalizar.'
        break;
      case 'polygon':
        msm='Click en el mapa para comenzar a dibujar un polígono. Doble clic para finalizar.'
        break;
    }
    $('#tooltip_mouse span').text(msm);
  }); 

  //Evento lanzado al cambiar distancia de influencia
  $('#wg_buffer').on('change', '#txt_distancia', function (event) {
    __buffersize = $(this).val();
    updateBuffer();
  });

  //Evento lanzado al cambiar unidad de medida
  $('#wg_buffer').on('change', '#cmb_bufferunidad', function (event) {
    __unidadbuffer = $(this).val();
    updateBuffer();
  });

    //Evento lanzado para hacer zoom a cada registro de la tabla resultado
    $('#container_tblbuffer').on('click', '.tdzoom', function () {
      $('.tbl-result tr.active').removeClass('active');
      $(this).parent().toggleClass('active');
  
      let objectid = $(this).attr('id');
      let namefield = $(this).attr('data-namefield');
      let sql = `${ namefield } = ${ objectid }`;
      Helper.paintToZoom(sql, __url_layerselected, _gly_searchbuffer);
    });

    // boton limpiar -> limpiar área de influencia
    $('#btn_clearbuffer').on('click', function(){
      $('#container_tblbuffer').removeClass('visible').addClass('notvisible');
      $('#wg_buffer .btn-dibujar').removeClass('active');
      clearAllOperation();
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
      let layers = __globspace.map.layers.items,
        layersvisible = [],
        nlayers = layers.length;
  
      for (let i = 0; i < nlayers; i++) {
        let layer = layers[i],
          aux_layersvisible = [],
          result = [],
          islayervisible = '';
  
        layer.visible == true ? islayervisible = true : islayervisible = false;
  
        if (islayervisible == true && layer.listMode == "show") {  
          let layertype = layer.type; 
          switch (layertype) {
            case 'group':
              aux_layersvisible = getVisibleLayers(layer.layers.items, islayervisible, result);
              if(aux_layersvisible.length > 0){
                layersvisible.push(aux_layersvisible);
              }
              break;
            case 'map-image':
              aux_layersvisible = getVisibleLayers(layer.sublayers.items, islayervisible, result);
              if(aux_layersvisible.length > 0){
                layersvisible.push(aux_layersvisible);
              }
              break;
            case 'feature':
                const url_servicio = layer.parsedUrl.path;
                const titlelayer = layer.title;
                aux_layersvisible.push({
                  'titlelayers': titlelayer,
                  'idlayer': layer.id,
                  'aliasmil': 'no_mil',
                  'urlservicio': url_servicio,
                });
                layersvisible.push(aux_layersvisible);
              break;
          }
        }
      }
      // console.log(layersvisible);
      if (layersvisible.length > 0) {
        doFirstMatch(layersvisible);
      } else {
        Helper.hidePreloader();
        alertMessage('No hay capas prendidas', 'warning', 'top-center', true);
      }
    }

    // obtengo las capas prendidas
    function getVisibleLayers(layers, islayervisible, result) {
      let url_servicio = ''; 
      if (islayervisible) {
        for (let i = 0; i < layers.length; i++) {
          let layer = layers[i];
          let layertype = layers[i].type;
          layer.visible == true ? islayervisible = true : islayervisible = false;
          if(typeof layertype === 'undefined') layertype = 'map-image';
  
          if (islayervisible) {
            switch (layertype) {
              case 'group':
                getVisibleLayers(layer.layers.items, islayervisible, result);
                break;
              case 'map-image':
                let hassublayers = '';
                layer.sublayers != null ? hassublayers = true : hassublayers = false;
                if (hassublayers) {
                  getVisibleLayers(layer.sublayers.items, islayervisible, result);
                } else {
                  url_servicio = layer.url;
                  titlelayer = layer.parent.title + '/' + layer.title;
                  result.push({
                    'titlelayers': titlelayer,
                    'idlayer': layer.id,
                    'aliasmil': layer.alias,
                    'urlservicio': url_servicio,
                  });
                  islayervisible = false;
                  getVisibleLayers(layer, islayervisible, result);
                }
                break;
              case 'feature':
                url_servicio = layer.parsedUrl.path;
                titlelayer = layer.parent.title + '/' + layer.title;
                result.push({
                  'titlelayers': titlelayer,
                  'idlayer': layer.id,
                  'aliasmil': 'no_mil',
                  'urlservicio': url_servicio,
                });
                islayervisible = false;
                getVisibleLayers(layer, islayervisible, result);
                break;
            }
          }
        }
      } else {
        return
      }
      return result;
    }

    
    function activeEventsTabs() {
      // Evento lanzado para obtener los parametros para la consulta de una capa en especifico
      $('#tab_buffer a').on('click', function (e) {
        e.preventDefault()
        Helper.showPreloader();
  
        $('.dt-buttons').css('display', 'none');
        $('.tab-content > div').removeClass('active show');
        let datalayer = $(this).attr('href');
        $(datalayer).addClass('active show');
        
        let idtable = datalayer.substring(1),
          rowcount = $(`#tbl_${idtable} > tbody tr`).length,
          idcache = datalayer,
          cachelayer = __cachelayers.find(response => response.id == idcache); // caché de layers 
        __url_layerselected = cachelayer.urlservicio;
  
        if (rowcount == 0) {
          getDataIntersected(cachelayer, idtable, idcache); //consultar
        } else {
          $(`#container_tblbuffer .dt-buttons > button[aria-controls='tbl_${idtable}']`).parent().css('display', 'contents');
          let layer = __cacheresults.find(response => response.id == idcache); // caché de resultados 
          let response = layer.response;
          // Helper.renderGraphic(response, _gly_searchbuffer);
          Helper.renderToZoomBuffer(response, _gly_searchbuffer, __buffergeometry);
          Helper.hidePreloader();
        }
      });
  
      // start control del carusel
      $('#jcarousel_buffer.jcarousel').jcarousel().on('jcarousel:animateend', function (event, carousel) {
        let id = $(carousel._visible['0']).index();
        $('#jcarousel_buffer .jp-item').removeClass('active');
        $('#jcarousel_buffer .jp-item').eq(id).addClass('active');
      });
      // set width of item
      $('#jcarousel_buffer.jcarousel li').width($('.jcarousel').width());
      // move slider
      $containertbl.on('click', '.jc-right', function (event) {
        event.preventDefault();
        $('#jcarousel_buffer.jcarousel').jcarousel('scroll', '+=1');
      });
      $containertbl.on('click', '.jc-left', function (event) {
        event.preventDefault();
        $('#jcarousel_buffer.jcarousel').jcarousel('scroll', '-=1');
      });
      $containertbl.on('click', '.jp-item', function (event) {
        event.preventDefault();
        let id = $(this).index();
        $('#jcarousel_buffer.jcarousel').jcarousel('scroll', id);
      });
      // fin control del carusel
      
    }
   

    function doFirstMatch(layers) {
      $('#div_results .grilla').addClass('notvisible').removeClass('visible');
      let isfirstintersect = true,
        layersgroup = layers,
        auxlength = layersgroup.length,
        aux_count = 0,
        tabbuffer = '',
        tabbuffercontent = '',
        firstlayer = {},
        firstidtable = '',
        firstidcache = '';
  
      for (let i = 0; i < auxlength; i++) { // obtener el total de layars a recorrer
        const item = layersgroup[i];
        aux_count += item.length;
      }
  
      for (let i = auxlength - 1; i >= 0; i--) {
        let layer = layersgroup[i];
        let auxlength2 = layer.length;
        
        for (let j = auxlength2 - 1; j >= 0; j--) {
          let item = layer[j],
            titletab = item.titlelayers,
            url_servicio = item.urlservicio,
            iddom = `${item.aliasmil}¿${item.idlayer}¿buffer`,
            _queryt = new QueryTask({ url: url_servicio }),
            _qparams = new Query();
  
          _qparams.geometry = __buffergeometry;
          _qparams.spatialRelationship = "intersects";
          _qparams.outFields = ['*'];
          _qparams.where = '1=1';
          _queryt.executeForCount(_qparams).then(function (response) {
            let nreg = response;
  
            // create tabs y contenido
            if (nreg > 0) {
              let href = `#${iddom}`;
              tabbuffer += `
                  <li class="nav-item">
                    <a class="nav-link " data-toggle="tab" href="${href}" id="tab${iddom}" role="tab" >${titletab} (<span>${nreg}</span>)</a>
                  </li>`;
              tabbuffercontent += `
                  <div class="tab-pane fade " id="${iddom}" role="tabpanel" >
                    <table id="tbl_${iddom}" class="tbl-result table table-striped table-bordered nowrap" style="width:100%">
                      <thead></thead>
                      <tbody></tbody>
                    </table>
                  </div>`;
  
              let data= {
                urlservicio: url_servicio,
                title: titletab,
                id: href
              };
              __cachelayers.push(data);
            }
  
            // cargar una tabla resultado por defecto (primer layer con entidades intersectados en el buffer )
            if (nreg > 0 && isfirstintersect) {
              isfirstintersect = false;
              firstlayer = {
                urlservicio: url_servicio,
                title: titletab
              };
              firstidtable = `${iddom}`;
              firstidcache = `#${iddom}`;
              __url_layerselected = url_servicio;
            }
  
            // activar eventos en tabs -- renderizar los tab y contenido 
            if (aux_count == 1) {
              if (isfirstintersect) {
                Helper.hidePreloader();
                alertMessage('No hay entidades en esta área de influencia.', 'warning', 'top-center', true);
              } else {
                $('#tab_buffer').html(tabbuffer);
                $('#tab_content_buffer').html(tabbuffercontent);
    
                getDataIntersected(firstlayer, firstidtable, firstidcache);
                $(`#tab${firstidtable}`).addClass('active');
                $(`#${firstidtable}`).addClass('active show');
    
                activeEventsTabs();
              }
            }
            aux_count--;         
  
          }).catch(function (error) {
            Helper.hidePreloader();
            console.log("query task error \n", error);
          })
        }
      }
    }
  
  

  // ejecutar consulta de interseccion de buffer con capa determinada
  function getDataIntersected(layer, aux_idtable, idcache) {
    
    let isexportable = true;
    // (__permisos_others.indexOf('ExportarTabla') != -1)  ? isexportable = true : '';
    
    let url_servicio = layer.urlservicio;
    let titlelayer = 'Área de influencia: \n ' + layer.title; // title del reporte para el exportar

    let _queryt = new QueryTask({ url: url_servicio }),
      _qparams = new Query();

    _qparams.where = '1=1';
    _qparams.outFields = ['*'];
    _qparams.geometry = __buffergeometry;
    _qparams.spatialRelationship = "intersects";
    _qparams.returnGeometry = true;
    _queryt.execute(_qparams).then(function (response) {
      let nreg = response.features.length,
        fields = response.fields,
        idtable = `#tbl_${aux_idtable}`;

      Helper.loadTable2(response, fields, titlelayer, idtable, isexportable);
      // Helper.renderGraphic(response, _gly_searchbuffer);
      Helper.renderToZoomBuffer(response, _gly_searchbuffer, __buffergeometry);
      
      __cacheresults.push({
        'id': idcache,
        'response': response,
        'nreg': nreg
      }); // caché de resultados 
      
      if (nreg >= 1000) {
        alertMessage('El resultado supera el límite de registros a mostrar, por lo tanto solo se muestra los primeros 1000 registros.', 'warning', 'top-center', true);
      }
    }).catch(function (error) {
      Helper.hidePreloader();
      console.log("query task error \n", error);
    })
  }

    function clearAllOperation() {
      Helper.hideGrid();
      __sketchgeometry = null;
      __buffergeometry = null;
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
      let auxlength= $tabs.length;
      for (let i = 0; i < auxlength; i++) {
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

})

   