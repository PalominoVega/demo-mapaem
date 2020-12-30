define([
    "esri/widgets/DirectLineMeasurement3D",
    "esri/widgets/AreaMeasurement3D",
  ], function(
    DirectLineMeasurement3D,
    AreaMeasurement3D,
  ){
  
    let _distancia3d = new DirectLineMeasurement3D();
    let _area3 = new AreaMeasurement3D();
    $("#wg_medir3d").on('click','.btn-medir3d',function(){
        let typemeasure=$(this).val();
        $('.btn-medir3d').removeClass('active');
        $(this).addClass('active');
        switch (typemeasure) {
          case 'distancia3d':
            $('#container_distancia3d').toggleClass('visible notvisible');
            $('#container_area3d').addClass('notvisible').removeClass('visible');
            _distancia3d.view = __globspace.view3d;
            _distancia3d.container = "container_distancia3d";
            break;

          case 'area3d':
            $('#container_area3d').toggleClass('visible notvisible');
            $('#container_distancia3d').addClass('notvisible').removeClass('visible');
            _area3.view = __globspace.view3d;
            _area3.container = "container_area3d";
            break;

          case 'clear':
            _area3.view = null;
            _area3.container = null;

            _distancia3d.view = null;
            _distancia3d.container = null;
            $('#container_area3d, #container_distancia3d').addClass('notvisible').removeClass('visible');
            break;
        }
    })
  })

  
