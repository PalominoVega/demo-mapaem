define([
  "js/helper",

  "esri/widgets/Sketch",
  "esri/layers/GraphicsLayer",
  
  "dojo/domReady!"
], function(
  Helper,

  Sketch,
  GraphicsLayer,
){
    let _gly_draw2d = new GraphicsLayer({
      listMode:"hide",
      title:"Draw"
    });
    __globspace.map.add(_gly_draw2d);

    let _sketch = new Sketch({
      view: __globspace.view,
      layer: _gly_draw2d,
      container: 'container_sketch'
    });

    // White fill color with 50% transparency
    let fillColor = [255,255,255,.5];
    
    // Red stroke, 1px wide
    let stroke = {
      color: [255,0,0],
      width: 1
    }
    
    // Override all default symbol colors and sizes
    let pointSymbol = _sketch.viewModel.pointSymbol;
    pointSymbol.color = fillColor;
    pointSymbol.outline = stroke;
    pointSymbol.size = 8;
    
    let polylineSymbol = _sketch.viewModel.polylineSymbol;
    polylineSymbol.color = stroke.color;
    polylineSymbol.width = stroke.width;
    
    let polygonSymbol = _sketch.viewModel.polygonSymbol;
    polygonSymbol.color = fillColor;
    polygonSymbol.outline = stroke;
    
    _sketch.on("create", function(event) {
      Helper.createTooltipInstructions();
    });

    $('#container_draw').on('click','.esri-sketch__button', function(){
      let msm='';
      // if($(this).hasClass('esri-icon-pan')){msm};
      // if($(this).hasClass('esri-icon-cursor')){msm};
      // if($(this).hasClass('esri-icon-redo')){msm};
      // if($(this).hasClass('esri-icon-undo')){msm};
      if($(this).hasClass('esri-icon-map-pin')  && !$(this).hasClass('esri-sketch__button--selected')){msm='Click en el mapa para agregar un punto.'};
      if($(this).hasClass('esri-icon-polyline') && !$(this).hasClass('esri-sketch__button--selected')){msm='Click en el mapa para comenzar a dibujar la polilínea. Doble clic para terminar.'};
      if($(this).hasClass('esri-icon-polygon') && !$(this).hasClass('esri-sketch__button--selected')){msm='Click en el mapa para comenzar a dibujar un polígono. Doble clic para terminar.'};
      if($(this).hasClass('esri-icon-checkbox-unchecked') && !$(this).hasClass('esri-sketch__button--selected')){msm='Click en el mapa para agregar un rectángulo o mantén presionado el botón izquierdo del ratón para comenzar y suelta para finalizar'};
      if($(this).hasClass('esri-icon-radio-unchecked') && !$(this).hasClass('esri-sketch__button--selected')){msm='Clic en el mapa para agregar un círculo o mantén presionado el botón izquierdo del ratón para comenzar y suelta para finalizar'};
      if(msm==''){
        Helper.hideTooltipInstructions();
      }else{
        $('#tooltip_mouse span').text(msm);
        Helper.createTooltipInstructions();
      }
    })

    $('#wg_draw').on('click','.icon-close', function(){
      _sketch.cancel();
      Helper.hideTooltipInstructions();
    })

    $('#btn_cleardraw').on('click', function(){
      _gly_draw2d.removeAll();
      _sketch.cancel();
      Helper.hideTooltipInstructions();
    })

    $("#btnswitch_2d3d").on('change',function(){
      _sketch.view=__globspace.currentview;
      __globspace.currentview.map.add(_gly_draw2d);
      if(__globspace.currentview.type=='3d'){
        pointSymbol.size = 10;
        polylineSymbol.width = 6
      }else{
        pointSymbol.size = 8;
        polylineSymbol.width = 1
      }
  })
})
