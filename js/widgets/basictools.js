let _prevExtent, _preExtent,_currentvExtent, _extentHistory

define([
    "esri/widgets/Zoom",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Locate",
    "esri/widgets/Search",
    "esri/widgets/Print",
    "esri/widgets/NavigationToggle",
    "esri/widgets/Compass",
    "esri/Basemap",
    "esri/layers/WebTileLayer",

    "esri/geometry/coordinateFormatter",
    "esri/geometry/support/webMercatorUtils",
  ], function(
    Zoom,
    BasemapGallery,
    Locate,
    Search,
    Print,
    NavigationToggle,
    Compass,
    Basemap, 
    WebTileLayer,

    CoordinateFormatter,
    WebMercatorUtils
  ){
    coordenadasFooter(__globspace.currentview);

    // basemap Imagery galery google
    let _webtilelayer = new WebTileLayer({
      urlTemplate: "https://mts1.google.com/vt/lyrs=s@186112443&hl=x-local&src=app&x={col}&y={row}&z={level}&s=Galile",
      title: "google maps"
    });
    let _basemap = new Basemap({
      baseLayers : [_webtilelayer],
      thumbnailUrl: "img/widget/mapgoogle.png",
      title: "Google Imagery"
    });

    let _basemapgallery = new BasemapGallery({
      view: __globspace.view,
      container: "container_basemap"
    });
    _basemapgallery.source.basemaps.items.push(_basemap);
        
    // mi ubicacion 
    let _location = new Locate({
      view: __globspace.view,
      container: 'btn_location'
    });
   
    // search
    let _searchWidget = new Search({
      view: __globspace.view,
      container: "container_wgdirectionsearch"
    });

    // zoom 
    let _zoom = new Zoom({
      view: __globspace.view
    });
    $("#btn_zoom_minus").on('click', function(){
      _zoom.zoomOut();
    });
    $("#btn_zoom_add").on('click', function(){
      _zoom.zoomIn();
    });

    // home
    $("#btn_home").on('click', function(){
      __globspace.currentview.zoom = __globspace.initParams.zoom;
      __globspace.currentview.center = __globspace.initParams.center;
      __globspace.view.rotation = 0;
    });

    // print
    let _print = new Print({
      view: __globspace.view,
      container: 'container_printmap',
      printServiceUrl: "https://gisem.osinergmin.gob.pe/serverosih/rest/services/ExportWebMapMEM/GPServer/Export%20Web%20Map"
    });

    // _navegacion 3D
    let _navegacion = new NavigationToggle({
      view: __globspace.view,
      container:"btn_navegacion3d"
    });
    let _compass = new Compass({
      view: __globspace.view,
      container:"btn_compass3d"
    });

    // coordenadas footer
    function coordenadasFooter(view){
      view.on(["pointer-down","pointer-move"], function(event) {
        let point = view.toMap(event);
        if (point!=null){
          // coordenadas coordenada geografica
          let coordgeografica = "<b>GCS : </b>" + point.longitude.toFixed(6)+' , '+ point.latitude.toFixed(6) +' &nbsp &nbsp'; 
          $('#lbl_coordgeografica').html(coordgeografica);
          // escala
          let scale="<b> ESCALA </b>  1 : " + Math.round(view.scale * 1) / 1 ;
          $('#lbl_scale').html(scale);
          
          // coordenadas UTM
          let returnpoint = point.spatialReference.isWGS84 ? point : WebMercatorUtils.webMercatorToGeographic(point);
          CoordinateFormatter.load().then(function(){
            let pointutm = CoordinateFormatter.toUtm(returnpoint,"latitude-band-indicators", true);
            let aux_pointutm =  pointutm.split(" ");
            let cadenautm = '<b>UTM WGS84 : </b>'+aux_pointutm[1]+"E"+" "+aux_pointutm[2]+"N " + " <b>ZONA : </b>"+aux_pointutm[0];
            $("#lbl_coordutm").html(cadenautm);
          });
        }
      });
    }

    $("#btnswitch_2d3d").on('change',function(){
      _location.view = __globspace.currentview;
      _zoom.view = __globspace.currentview;
      _basemapgallery.view = __globspace.currentview;
      _searchWidget.view = __globspace.currentview;
      _print.view = __globspace.currentview;
      // 3d
      _navegacion.view=__globspace.currentview;
      _compass.view=__globspace.currentview;
      
      coordenadasFooter(__globspace.currentview);
    })
});
