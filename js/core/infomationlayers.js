define([
  // "js/visor",
  "js/core/services",

  "esri/widgets/Legend",
  "esri/widgets/LayerList",
  "esri/layers/GraphicsLayer",

  "esri/core/watchUtils",
  "esri/request",
  "esri/Graphic",
  
], function(
  // Visor,
  Services,

  Legend,
  LayerList,
  GraphicsLayer,

  watchUtils,
  esriRequest,
  Graphic
  
) {
  
  var $divmenu = $('#div_menu');

  var __layersectors={};
  var __pointclick={};
  // LAYERS (SECTORES)
  var __mil_electricidad = Services.getLayerElectricidad();  
  var __mil_gasnatural   = Services.getLayerGasNatural();
  var __mil_hidrocarburos= Services.getLayerHidrocarburos();
  var __mil_mineria      = Services.getLayerMineria();
  var __mil_aue = Services.getLayerAUE();
  var __mil_fep = Services.getLayerFEP();
  var __gru_aniadido = Services.getGruAniadido();


  /*********************** AÑADIR CAPAS DE INFORMACIÓN ***********************/
  __globspace.map.addMany([__gru_aniadido, __mil_aue, __mil_fep, __mil_mineria, __mil_hidrocarburos, __mil_gasnatural, __mil_electricidad]);

  
  // LAYERLISTS
  var _lyl_electricidad = new LayerList({
    view: __globspace.view,
    container:'lyl_electricidad',
  });

  var _lyl_gasnatural= new LayerList({
    view: __globspace.view,
    container:'lyl_gasnatural',
  });

  var _lyl_hidrocarburos= new LayerList({
    view: __globspace.view,
    container:'lyl_hidrocarburos',
  });
  
  var _lyl_mineria= new LayerList({
    view: __globspace.view,
    container:'lyl_mineria',
  });
  
  var _lyl_fep= new LayerList({
    view: __globspace.view,
    container:'lyl_fep',
  });
  
  var _lyl_aue= new LayerList({
    view: __globspace.view,
    container:'lyl_aue',
  });

  var _lyl_aniadido= new LayerList({
    view: __globspace.view,
    container:'lyl_aniadido',
  });

  // Leyenda
  var legend = new Legend({
    view: __globspace.currentview,
    container: "Legenda",
    layerInfos: [{
      layer: __gru_aniadido
    }]
  });

  /*********************** UX ****************************/

  getGraphicPopup(__globspace.currentview);

  __globspace.view.when(function(){
    //Interacción entre el Layerlist y el Menu de capas    
    __layersectors = _lyl_electricidad.operationalItems.items;//cualquier lyl tiene todos los sectores (_mil)
     let auxlength = __layersectors.length;
    for (let i = 0; i < auxlength; i++) {
      //poner un observador de visibilidad a cada _mil_sector
      watchUtils.watch(__layersectors[i], 'visible', updateVisibleSectorsInMenu);
    }
  });
  
  //Al terminar de actualizar el View
  watchUtils.whenFalse(__globspace.view, "updating", function(evt) {
    if($('body').hasClass("cargando")){ //acciones para el primer updating solamente (carga inicial)
      $("#lyl_electricidad > ul > li").not(":nth-child(1)").remove();
      $("#lyl_gasnatural > ul > li").not(":nth-child(2)").remove();
      $("#lyl_hidrocarburos > ul > li").not(":nth-child(3)").remove();
      $("#lyl_mineria > ul > li").not(":nth-child(4)").remove();
      $("#lyl_fep > ul > li").not(":nth-child(5)").remove();
      $("#lyl_aue > ul > li").not(":nth-child(6)").remove();
      $("#lyl_aniadido > ul > li").not(":nth-child(7)").remove();

      loadPopups();
      // createPopupDefault(); //crea popup y leyenda
      $('#div_preloadermain').removeClass('preloader').addClass('preloader-none');
      $('body').removeClass('cargando');
      console.log('View actualizado');
    }
  });  

  //Control active/desactive Popup
  __globspace.view.popup.autoOpenEnabled = true;
  __globspace.view.on('click', function(event){
    
    if($('#div_view').hasClass('desactive-click')) {
      __pointclick = __globspace.view.toMap(event);
      __globspace.view.popup.autoOpenEnabled = true;
    }else{
      __globspace.view.popup.autoOpenEnabled = false;
    }
  });

  // On/Off de cada Sector desde el Menu
  $($divmenu).on('click', '.chb-sectormenu', function() {
    $(this).toggleClass('icon-check_box icon-check_box_outline_blank active');
    let itemchb = $(this).attr('id');
    let isactive = $(this).hasClass("active");
    switch (itemchb) {        
      case 'chb_sectorelectricidad':
        __mil_electricidad.visible = isactive;
        break;
      case 'chb_sectorgasnatural':
        __mil_gasnatural.visible = isactive;
        break;
      case 'chb_sectorhidrocarburos':
        __mil_hidrocarburos.visible = isactive;
        break;
      case 'chb_sectormineria':
        __mil_mineria.visible = isactive;
        break;
      case 'chb_sectorfep':
        __mil_fep.visible = isactive;
        break;
      case 'chb_sectoraue':
        __mil_aue.visible = isactive;
        break;
      case 'chb_sectoraniadido':
        __gru_aniadido.visible = isactive;
        break;
    }
  });

  // Abrir cada Layerlist (sector) desde el Menu 
  $($divmenu).on('click', '.btn-sectormenu', function(){
    let $containerlyl = $($(this).attr('data-subcontainer'));
    let top = $containerlyl.attr('data-top');
    $containerlyl.addClass('visible').removeClass('notvisible');
    $containerlyl.css('top',top);
  });

  // Control de Opacidad de las capas
  $('#div_widgets').on('input','.ran-opacity',function(){
    let idlayer=$(this).attr('id').split('?')[0];
    
    let opacity = $(this).val()/100;
    $(this).siblings('span').text($(this).val()+"%");

    if($(this).hasClass('class-sector')){
      let layer = __globspace.currentmap.findLayerById(idlayer);
      layer.opacity = opacity;
    }else{
      let alias=$(this).attr('data-alias');
      idlayer=$(this).attr('id').split('¿')[0];
      let _mil_sectorx=eval(alias);
      let sublayer=_mil_sectorx.findSublayerById(parseInt(idlayer));      
      sublayer.opacity=opacity;
    }
  }).trigger('input');


  function updateVisibleSectorsInMenu() {
    let auxlength = __layersectors.length;
    for (let i = 0; i < auxlength; i++) {
      let itemsector = __layersectors[i];
      let isvisible = itemsector.visible;
      let auxalias = itemsector.layer.aux_alias;
      let classactive = '';
      let classcheck = 'icon-check_box_outline_blank';
      if(isvisible) { 
        classactive = 'active';
        classcheck = 'icon-check_box';
      }
      $('#chb_'+auxalias).attr('class', `chb-sectormenu ${classcheck}  ${classactive}`);      
    }
  }


  function loadPopups() { //obtener todos los sublayers finales(mil) para crear los popup por defecto o asignarlo un popup personalizado
    let layers = __globspace.map.allLayers.items,
      grouplayers = [],
      auxlength = layers.length;

    for (let i = 0; i < auxlength; i++) {
      let result = [],
        sublayers = [],
        hassublayers = '';

      if (layers[i].type == "map-image") { //si es MapImageLayer 
        let aux_alias = layers[i].aux_alias;
        let url_mil = layers[i].url;
        let title = layers[i].title;
        layers[i].sublayers != null ? hassublayers = true : hassublayers = false;
        if (hassublayers) {
          sublayers = getSublayers(layers[i].sublayers.items, hassublayers, result);
        } else {
          sublayers = getSublayers(layers[i], hassublayers, result);
        }
        grouplayers.push({
          'group': aux_alias,
          'title': title,
          'url_mil': url_mil,
          'sublayers': sublayers
        });
      }

    }

    createPopupDefault(grouplayers);
  }

  function getSublayers(layers, hassublayers, result) {
    if (hassublayers) {
      for (let i = 0; i < layers.length; i++) {
        let layer = layers[i];
        layer.sublayers != null ? hassublayers = true : hassublayers = false;
        if (hassublayers) {
          getSublayers(layer.sublayers.items, hassublayers, result);
        } else {
          let url_servicio = layer.url;
          result.push({
            'idsublayer': layer.id,
            'url': url_servicio,
            'sublayer': layer,
            'name': layer.title
          });
          hassublayers = false;
          getSublayers(layer, hassublayers, result);
        }
      }
    } else {
      return
    }
    return result;
  }

  /**
   * obtener la leyenda de los sublayers
   * añadir los popup por defecto o personalizados
   * añadir las url detalles a los sublayers
   * 
   * editar: el titulo de la capa
   */
  function createPopupDefault(grouplayers) {
    let auxcount = 1;
    let auxlength = grouplayers.length;
    for (let i = auxlength - 1; i >= 0; i--) {
      let grouplayer = grouplayers[i];
      let group = grouplayer.group;
      let urlmil = grouplayer.url_mil;
      let sublayers = grouplayer.sublayers;
      let urllegends = urlmil + '/legend';
      let sublayersector = [];

      let aux_sector = __globspace.infolayers.find(sublayer => sublayer.aux_alias == group);
      let alias_sector = aux_sector.alias;
      // let _mil_sectorx = eval(alias_sector);
      esriRequest(urllegends, {
        query: {
          f: 'json'
        },
        responseType: "json"
      })
      .then(function (response) {
        let layerslegends = response.data.layers; //leyendas de todas las capas de un mapImageLayer

        let auxlength2 = sublayers.length;
        for (let j = auxlength2 - 1; j >= 0; j--) {
          let item = sublayers[j];
          let idlayer = item.idsublayer;
          let sublayer = item.sublayer;

          // let sublayer = _mil_sectorx.findSublayerById(parseInt(idlayer));
          let layerlegend = layerslegends.find(layer => layer.layerId === idlayer);
          sublayer.layerlegend = layerlegend; //added legend
          sublayer.alias_sector = alias_sector;
          sublayersector.push(sublayer);
          
          // Popup por defecto para las capas
          sublayer.createFeatureLayer().then((featureLayer) => featureLayer.load())
          .then((featureLayer) => {
            sublayer.popupTemplate = featureLayer.createPopupTemplate(); //added popup;
            // sublayer.popupTemplate.title += `: { ${ featureLayer.displayField } }`;  
          });
        }

        aux_sector.layers = sublayersector;
        if (auxcount == auxlength) {
          createLegendActionsLyl();
          auxcount = 1;
        }
        auxcount++;
      });
    }
  }

  function createLegendActionsLyl() { //Crea Leyenda y Actions en Layerlists
    _lyl_electricidad.listItemCreatedFunction = defineActionsLyl;
    _lyl_electricidad.on("trigger-action", getTriggerActionLyl);

    _lyl_gasnatural.listItemCreatedFunction = defineActionsLyl;
    _lyl_gasnatural.on("trigger-action", getTriggerActionLyl);

    _lyl_hidrocarburos.listItemCreatedFunction = defineActionsLyl;
    _lyl_hidrocarburos.on("trigger-action", getTriggerActionLyl);

    _lyl_mineria.listItemCreatedFunction = defineActionsLyl;
    _lyl_mineria.on("trigger-action", getTriggerActionLyl);

    _lyl_fep.listItemCreatedFunction = defineActionsLyl;
    _lyl_fep.on("trigger-action", getTriggerActionLyl);

    _lyl_aue.listItemCreatedFunction = defineActionsLyl;
    _lyl_aue.on("trigger-action", getTriggerActionLyl);

    _lyl_aniadido.listItemCreatedFunction = defineActionsLyl;
  }

  function defineActionsLyl(event){
    let item = event.item;
    let layer = item.layer;
    let idlayer=layer.id;

    /* para poner transparencia solamente a los sectores  */
    //desglosar nivel sector
    if(layer.type=='map-image'){
      item.open='true';
      let class_sector='class-sector';
      idlayer=`${idlayer}?${item.aux_alias}`;
      // añadir caja de transparencia
      let div = document.createElement("div");
      div.className='caja-transparencia';
      div.id='div_'+idlayer;
      div.innerHTML=`<input type="range" min="0" max="100" value="100" step="5" id='${idlayer}' class="ran-opacity ${class_sector}" > <span id='lbl_${idlayer}' >100 %</span>`;    
      
      item.panel = {
        content:[div],
        title: "Transparencia",
        className: "esri-icon-environment-settings",
      };
    }

    if (layer.type == 'group') {
      let class_sector = 'class-sector';
      idlayer = `${idlayer}?group`;
      // añadir caja de transparencia
      let div = document.createElement("div");
      div.className = 'caja-transparencia';
      div.id = 'div_' + idlayer;
      div.innerHTML = `<input type="range" min="0" max="100" value="100" step="5" id='${idlayer}' class="ran-opacity ${class_sector}" > <span id='lbl_${idlayer}' >100 %</span>`;

      item.panel = {
        content: [div],
        title: "Transparencia",
        className: "esri-icon-environment-settings sector-123",
      };

    }
    /* fin transparencia secotres*/

    // formar leyenda y actions en las capas
    if (item.children.items.length !== 0) {
      // make array of the sublayers
      let childrensublayer = item.children.items
      let auxlength = childrensublayer.length;
      for (let i = 0; i < auxlength; i++) {
        if(childrensublayer[i].children.items.length == 0){
          let url = childrensublayer[i].layer.url;
          let layerlegend=childrensublayer[i].layer.layerlegend
          
          if (typeof layerlegend === 'undefined') {
            // caso de featurelayers crear su leyenda solo para los limites politicos
            childrensublayer[i].panel = {
              content: "legend",
              open: true
            };
          }else{
            // caso de MapImageLayer
            let auxlength2 = layerlegend.legend.length;
            let $containerlegend = document.createElement("div");
  
            for (let j = 0; j < auxlength2; j++) {  
              let $lbllegend = document.createElement("span");
              $lbllegend.style.margin = "2px";
              $lbllegend.style.verticalAlign = "middle";     
              $lbllegend.style.display = "block";     
                      
              let $imglegend = document.createElement("img");
              $imglegend.style.height = "20px";
              $imglegend.style.verticalAlign = "bottom";
              $imglegend.src = url + "/images/" + layerlegend.legend[j].url;
  
              let $textnode =  document.createTextNode(layerlegend.legend[j].label);
  
              $lbllegend.appendChild($imglegend);
              $lbllegend.appendChild($textnode);                                         
              $containerlegend.appendChild($lbllegend);
            } 
            
            childrensublayer[i].panel = {
              title: "Mostrar/Ocultar Leyenda",
              className: "esri-icon-layer-list",
              content: $containerlegend,
              open: true,
              visible: true
            };
            childrensublayer[i].actionsSections = [
              [{
                title: "Transparencia",
                className: "esri-icon-environment-settings opacity",
                id: "layer-opacity",
              },{
                title: "Buscar en Capa",
                className: "esri-icon-search icon-search-layer",
                id: "search-on-layer",
              }]
            ];

          }
          
        }
      }
    }
  }

  function getTriggerActionLyl(event) {
    
    let actionid = event.action.id;
    let itemlayer = event.item.layer;
    let idlayer = itemlayer.id;
    let group = itemlayer.aux_alias;

    if (actionid === "layer-opacity"){
      let titlesector=itemlayer.sector;
      let alias=itemlayer.alias_sector;
     
      let sector =__globspace.infolayers.find(layer => layer.alias==alias);
      let $parentopacity=`#${sector.containerlyl}_${event.item.uid}__title`; 
      let $aux_opacity=$(`#${sector.containerlyl}_${event.item.uid}_actions ul li:first`);
      $aux_opacity.toggleClass("esri-layer-list__item-actions-menu-item esri-layer-list__item-actions-menu-item--active");
      let opacity=(itemlayer.layer.opacity)*100;
      let $div_opacity=$(`#div_${event.item.uid}`);
      
      idlayer=`${idlayer}¿${event.item.uid}`
      
      if($('#'+idlayer).length>0){
        $div_opacity.toggleClass("visible notvisible");
        $(`#${idlayer}`).val(opacity);
        $(`#span${idlayer}`).text(opacity);
      }else{
        let $div=`<div class="caja-transparencia visible" id='div_${event.item.uid}'> 
          <input type="range" min="0" max="100" value="${opacity}" step="5" id="${idlayer}" data-sector=${titlesector} data-alias=${alias} class="ran-opacity"> 
          <span id="lbl_${idlayer}">100 %</span>
        </div>`;
        $($parentopacity).parent().parent().after($div);
      }
    }
    else if(actionid === 'search-on-layer'){
      $(".grilla").removeClass('min-size').addClass('max-size');
      
      $('#txt_searchinlayer').val('');
      // $('#txt_searchinlayer').attr({'data-idlayer':idlayer, 'data-uid':event.item.uid, 'data-aliasmil':`${aliasmil}`, 'data-titlereporte':`${sector} / ${grupo} / ${capas.substring(2)}`});
      $('#wg_searchinlayer').removeClass('notvisible').addClass('visible');
      let result = [],
        padres = '',
        hasparent = true;
      let parents = getParentsLayerlist(itemlayer, hasparent, padres, result);
      let aux_parents = parents[0].title.substring(1).split('?');
      let nparents = aux_parents.length;
      let sector = aux_parents[nparents - 1];
      let grupo = aux_parents[nparents - 2];
      let capas = '';
      for (let i = nparents - 3; i >= 0; i--) {
        capas += ' / ' + aux_parents[i];
      }
      
      $('#lbl_sector').text(sector);
      $('#lbl_group').text(grupo);
      $('#lbl_leyer').text(capas.substring(2));

      let titlereport = `${sector} / ${ grupo } / ${capas.substring(2)}`;
      let data = {
        'sublayer': itemlayer,
        'titlereport': titlereport
      };

      __globspace.sublayersearch = data;
    }
  }

  function getParentsLayerlist(layer, hasparent, padres, result) { //Obtiene cadena de layers padre de una capa
    //evaluación ascendente (de Capa a Sector) 
    if(!hasparent){
      return result.push({'title':padres});
    }else{
      typeof(layer.parent.title) === "undefined" ? hasparent=false : hasparent=true;
      padres += '?'+layer.title;
      getParentsLayerlist(layer.parent, hasparent, padres, result);
    }
    return result;
  }
   
  // poner graphics al popup
  function getGraphicPopup(view) { 
    var __gra_popup={};
    
    view.popup.watch("selectedFeature", function(feature){
      view.graphics.remove(__gra_popup);
      __gra_popup={};
      
      if (feature !== null) {
        // view.popup.updateLocationEnabled = true;
        let symbol=getSymbolPopup(feature.geometry);
        if (Object.keys(__gra_popup).length ==0) {
          __gra_popup = new Graphic({
                        geometry: feature.geometry, 
                        symbol: symbol     
                      });
        };
        __gra_popup.geometry=feature.geometry;
        view.graphics.add(__gra_popup);
      }
    });
    
    view.popup.watch("visible", function (visible) {
      if($('#div_view').hasClass('active-click') && visible)
        view.popup.visible=false;
      
      if(!visible){
        view.graphics.remove(__gra_popup);
        __gra_popup={};
      }
    });
  }
  
  function getSymbolPopup(geometry) {
    symbol='';
    switch (geometry.type) {
      case "point":
        symbol = {
          type: "simple-marker",
          outline: {  
              color: "#00faed",
              width: 1.5
          }
        }; 
        return symbol;
    case "polyline":
        symbol = {
            type: "simple-line",  
            color: [ 0,250, 237, 0.6 ],
            width: "2.5",
            outline: {  
                color: "#00faed",
                width: 1.5
            }
        };
        return symbol;
    case "polygon":
        symbol = {
          type: "simple-fill", 
          color: [ 0,250, 237, 0.6 ],
          outline: {  
            color: "#00faed",
            width: 1.5
          }
        };
        return symbol;
      default:
        break;
    }
  }

  /*********************************************** 3D *********************************************************** */
  var __map=__globspace.map;
  var __view=__globspace.view;

  var valor = false;
  var flagswitch2d3d = false;
  $("#btnswitch_2d3d").on('click',function(){
    if(!flagswitch2d3d){
      $(this).attr('disabled', 'disabled');
      $('body').addClass("cargando2d3d");
      flagswitch2d3d=true;
    }
  })

  $("#btnswitch_2d3d").on('change',function(){
    
    if (!valor){
      $(".btnswitch-2d3d").addClass('active');
        __globspace.view3d.map = __globspace.map3d;
        __globspace.view3d.viewpoint = __globspace.view.viewpoint;
        __globspace.view3d.container = __globspace.initParams.container;
        __globspace.view.container = null;

        $("#btnswitch_2d3d").val('3D');
        getLuminosidad(__globspace.view3d);
        
        _lyl_electricidad.view = __globspace.view3d;
        _lyl_gasnatural.view=__globspace.view3d;
        _lyl_hidrocarburos.view=__globspace.view3d;
        _lyl_mineria.view=__globspace.view3d;
        _lyl_fep.view=__globspace.view3d;
        _lyl_aue.view=__globspace.view3d;
        _lyl_aniadido.view=__globspace.view3d;
        
        __map = __globspace.map3d;
        __view=__globspace.view3d;
        valor = true;

        $(".modo3d").addClass('visible').removeClass('notvisible');
        $(".modo2d").addClass('notvisible').removeClass('visible');
        $("#wg_addlayer").addClass('notvisible').removeClass('visible');
        $('#div_btnmaximizadores').hide(400);
        $('#wg_leyend').hide(400);
        
        // $('#wg_leyend').removeClass('visible').addClass('notvisible');

    }else{

        $(".btnswitch-2d3d").removeClass('active');
        
        __globspace.view.map = __globspace.map;
        __globspace.view.viewpoint = __globspace.view3d.viewpoint;
        __globspace.view.viewpoint.rotation = 0;
        __globspace.view.container = __globspace.initParams.container;
        __globspace.view3d.container = null;
        
        $("#btnswitch_2d3d").val('2D');
        getLuminosidad(__globspace.view);
        _lyl_electricidad.view = __globspace.view;
        _lyl_electricidad.view = __globspace.view;
        _lyl_gasnatural.view=__globspace.view;
        _lyl_hidrocarburos.view=__globspace.view;
        _lyl_mineria.view=__globspace.view;
        _lyl_fep.view=__globspace.view;
        _lyl_aue.view=__globspace.view;
        _lyl_aniadido.view=__globspace.view;

        __map = __globspace.map;
        __view=__globspace.view
        // __globspace.view.aux_update=true;-
        valor = false;

        $(".modo3d").addClass('notvisible').removeClass('visible');
        $(".modo2d").addClass('visible').removeClass('notvisible');
        
        if (__gru_aniadido.layers.items.length>0) {
          $('#wg_leyend').show(400);
        }
        // $('#wg_leyend').addClass('visible').removeClass('notvisible');
    }
    __map.addMany([__globspace._gly_searchadvanced, __globspace._gly_searchinlayer, __globspace._gly_coodxy, __mil_aue, __mil_fep, __mil_mineria, __mil_hidrocarburos, __mil_gasnatural, __mil_electricidad]);

    
    // if (!valor){
    //   // __map.addMany([ __gru_aniadido]);
    // }

    __globspace.currentview=__view;
    __globspace.currentmap=__map;
    legend.view = __view
    getGraphicPopup(__globspace.currentview);
    loadView3D(__globspace.currentview);
  });
  
  function loadView3D(view) { 
    watchUtils.whenFalse(view, "updating", function(evt) {
      if($('body').hasClass("cargando2d3d")){ //acciones para el primer updating solamente (carga inicial)
        console.log('terminó de actualizar cambio de vista');
        $("#btnswitch_2d3d").removeAttr('disabled');
        $('body').removeClass("cargando2d3d");
        flagswitch2d3d=false;
      }
    }); 
  }

  function getLuminosidad(view){
    if(view.type==='3d'){
      view.when(function(){
        var _hora = "Sun Mar 10 2019  15:00:00 GMT-0500 (CET)";
        view.environment.lighting.date = new Date(_hora);
        $("#time-Hour").on('input', function(){
          $("#hour-value").html($(this).val()+'hrs');
          var hora = "Sun Mar 10 2019 "+$(this).val()+":00:00 GMT-0500 (CET)";
          view.environment.lighting.date = new Date(hora);
        });
      });
    }
  }

});

//REVISADO 