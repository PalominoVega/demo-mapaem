define([
    "js/helper",
    "esri/layers/GraphicsLayer",
    "esri/widgets/Sketch",
    "esri/widgets/Sketch/SketchViewModel",
    
], function(
    Helper,

    GraphicsLayer,
    Sketch,
    SketchViewModel,
    ){
   
    let sketchLayer = new GraphicsLayer({listMode:"hide"});
    __globspace.view3d.map.addMany([sketchLayer]);

    let sketchViewModel = new SketchViewModel({
        layer: sketchLayer,
        view: __globspace.view3d,
        pointSymbol: {
          type: "simple-marker",
          style: "circle",
          size: 10,
          color: [255, 255, 255, 0.8],
          outline: {
            color: [211, 132, 80, 0.7],
            size: 10
          }
        },
        polylineSymbol: {
          type: "simple-line",
          color: [211, 132, 80, 0.7],
          width: 6
        },
        polygonSymbol: {
          type: "polygon-3d",
          symbolLayers: [
            {
              type: "fill",
              material: {
                color: [255, 255, 255, 0.8]
              },
              outline: {
                color: [211, 132, 80, 0.7],
                size: "2px"
              }
            }
          ]
        },
        defaultCreateOptions: { hasZ: false }
    });

    sketchViewModel.on(["create"], function (event) {
        if (event.state == "complete") {
            sketchViewModel.create(event.tool);
        }
    });

    $('#container-btnmedir3d').on('click', '.btn-dibujar', function(){
      Helper.createTooltipInstructions();
      $('.btn-dibujar').removeClass('active');
      $(this).addClass('active');

      let geometryType = $(this).val();
      sketchViewModel.create(geometryType);
      let msm='';
      if(geometryType=='clear'){
          sketchLayer.removeAll();
          Helper.hideTooltipInstructions();
      }else{
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
          case 'seleccionar':
            sketchViewModel.cancel();
            Helper.hideTooltipInstructions();
            break;
        }
      }
      $('#tooltip_mouse span').text(msm);
    })
})