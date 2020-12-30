define([
    "esri/tasks/GeometryService",
    "esri/tasks/support/ProjectParameters",
    "esri/geometry/SpatialReference",
    "esri/geometry/Point",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
  ], function(
      GeometryService,
      ProjectParameters,
      SpatialReference,
      Point,
      GraphicsLayer,
      Graphic
    ){
        var __aux_zona='',
            __zona='',
            __isproyectada=false,
            __symbol={
                type: "simple-marker",
                color: 'red',
                width: 1,
                size:10, 
                outline: {  
                    color: "red",
                    width: 1
                }
            }, 
            __lblnom = {
                type: "text",
                color: "#075daa",
                haloColor: "white",
                haloSize: "2px",
                text: null,
                yoffset: -15,
                font: {  
                size: 11,
                family: "arial",
                }
            };

        let sr_z17_psad = new SpatialReference({wkid: 32717}),
            sr_z18_psad = new SpatialReference({wkid:32718}),
            sr_z19_psad = new SpatialReference({wkid:32719}),
            sr_geografica = new SpatialReference({wkid:4326});
        
        __globspace._gly_coodxy = new GraphicsLayer({listMode:"hide", title:'gly_coodXY'});
        __globspace.map.add(__globspace._gly_coodxy);

        $('#cmb_sistemacoord').on('change', function(){
            let option= $(this).val();
            $('#txt_coord').val('');
            $('#txt_coord2').val('');
            if(option=='proyectada'){
                __isproyectada=true;
                $('#cmb_proyectada_zona').parents('.container-proyectada').removeClass('notvisible').addClass('visible');
                $('#lbl_coord').text('Este');
                $('#lbl_coord2').text('Norte');
            }else{
                $('#lbl_coord').text('Longitud');
                $('#lbl_coord2').text('Latitud');
                $('#cmb_proyectada_zona').parents('.container-proyectada').removeClass('visible').addClass('notvisible');
                __isproyectada=false;
            }
        })

        // $('#btn_searchXY').on('click', function(){
        $('#form_searchXY').on('submit', function (evt) {
            evt.preventDefault();
            let coordx=$('#txt_coord').val();
            let coordy=$('#txt_coord2').val();
            let zona=$('#cmb_proyectada_zona').val();
            if(coordy.trim().length==0 || coordx.trim().length==0){
                alertMessage('Coordenadas Obligatorias','warning');
            }else{
                if(__isproyectada){
                    switch (zona) {
                        case 'sr_z17_psad':
                            __aux_zona=sr_z17_psad;
                            __zona='17';
                            break;
                        case 'sr_z18_psad':
                            __aux_zona=sr_z18_psad;
                            __zona='18';
                            break;
                        case 'sr_z19_psad':
                            __aux_zona=sr_z19_psad;
                            __zona='19';
                            break;
                        default:
                            alertMessage('Seleccione una zona UTM !','warning');
                            break;
    
                    }
                    if(!zona==''){
                        let point = new Point(coordx, coordy, __aux_zona);
                        __lblnom.text=`${coordx}E \n ${coordy}N \n Zona: ${__zona}`;
                        goLocation(point, __lblnom);
                    }
                }else{
                    if(!(coordx>-181 && coordx<181)){
                        alertMessage('La longitud ingresada esta fuera de rango.  Por favor ingrese un valor comprendido entre (-180, 180). ','warning');
                    }else if(!(coordx>-91 && coordx<91)){
                        alertMessage('La latitud ingresada esta fuera de rango.  Por favor ingrese un valor comprendido entre (-90, 90). ','warning');
                    }else{
                        __aux_zona=sr_geografica;
                        let point = new Point(coordx, coordy, __aux_zona);
                        __lblnom.text=` Longitud: ${point.longitude} \n Latitud: ${point.latitude}` ;
                        goLocation(point, __lblnom);
                    }
                }
            }
        })
        
        function goLocation(point, lbl){
            
            let _geometryservice = new GeometryService("https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");
            let _projectparams = new ProjectParameters();
            _projectparams.geometries = [point];
            _projectparams.outSpatialReference = sr_geografica;
                        
            _geometryservice.project(_projectparams).then(function(projectedPoint){
                let geometry=projectedPoint[0];
                
                if(__globspace._gly_coodxy.graphics.length === 0) {
                    let _gra_coordxy = new Graphic({
                      geometry: geometry, 
                      symbol: __symbol     
                    });
                    let _gra_lblnom = new Graphic({
                        geometry: geometry, 
                        symbol: lbl
                    });
                    __globspace._gly_coodxy.addMany([_gra_coordxy, _gra_lblnom]);
                }else {
                    __globspace._gly_coodxy.graphics.getItemAt(0).geometry = geometry;
                    __globspace._gly_coodxy.graphics.getItemAt(1).geometry = geometry;
                    __globspace._gly_coodxy.graphics.getItemAt(1).symbol=lbl;
                }

                __globspace.currentview.when(function(){
                    __globspace.currentview.goTo({
                      target: __globspace._gly_coodxy.graphics.toArray()
                    });
                });
                
            }, function(error) {
                console.error(error);
                console.error(error.details);
            });
        }; 

        $('#btn_clearxy').on('click', function(){
            __globspace._gly_coodxy.removeAll();
            $('#txt_coord').val('');
            $('#txt_coord2').val('');
            $('#cmb_proyectada_zona').parents('.container-proyectada').removeClass('visible').addClass('notvisible');
            $('#cmb_sistemacoord').prop('selectedIndex',0);
            $('#cmb_proyectada_zona').prop('selectedIndex',0);
        })
})