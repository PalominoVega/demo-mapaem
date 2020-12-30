define([
 "esri/widgets/DistanceMeasurement2D",
 "esri/widgets/AreaMeasurement2D",

], function(
  DistanceMeasurement2D, 
  AreaMeasurement2D,
){

  let _distancia2d = new DistanceMeasurement2D();
  let _area2d = new AreaMeasurement2D();

  $("#wg_medir2d").on('click','.btn-medir2d',function(){
    let typemeasure=$(this).val();
    $('.btn-medir2d').removeClass('active');
    $(this).addClass('active');
    switch (typemeasure) {
      case 'distancia2d':
        $('#container_distancia2d').toggleClass('visible notvisible');
        $('#container_area2d').addClass('notvisible').removeClass('visible');
        _distancia2d.view = __globspace.view;
        _distancia2d.container = "container_distancia2d";
        break;

      case 'area2d':
        $('#container_area2d').toggleClass('visible notvisible');
        $('#container_distancia2d').addClass('notvisible').removeClass('visible');
        _area2d.view = __globspace.view;
        _area2d.container = "container_area2d";
        _area2d.unit='hectares';
        break;

      case 'clear':
        _area2d.view = null;
        _area2d.container = null;

        _distancia2d.view = null;
        _distancia2d.container = null;
        $('#container_area2d, #container_distancia2d').addClass('notvisible').removeClass('visible');
        $('.btn-medir2d').removeClass('active');
        break;
    }
  })

})
