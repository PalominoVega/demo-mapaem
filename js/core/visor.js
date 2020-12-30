define([
    "esri/Map",
    "esri/views/MapView",
    "esri/views/SceneView",

    "dojo/domReady!"
  ],function(
    Map,
    MapView,
    SceneView

  ){
    
    __globspace={};
    
    __globspace.initParams = {
      zoom: 6,
      center: [-72,-11],
      container: "div_view"
    };

    __globspace.map = new Map({
      basemap: "osm"
    });

    __globspace.map3d = new Map({
      basemap : "satellite",
      ground: "world-elevation"
    });

    __globspace.view = new MapView({
      container: "div_view",
      map: __globspace.map,
      zoom: 6,
      center: [-72,-10],
      popup: {
        dockEnabled: false,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false
        }
      }
    });

    __globspace.view3d = new SceneView({
      container: null,
      map: __globspace.map3d,
      zoom: 6,
      center: [-72,-10]
    });

    __globspace.currentview = __globspace.view;
    __globspace.currentmap = __globspace.map;

    return {

      getInitParams : function(){ return initParams;},
      getMap : function(){ return __globspace.map;},
      getMap3d : function (){ return __globspace.map3d;},
      getView : function(){ return __globspace.view;},
      getview3d: function(){ return __globspace.view3d;},
    }
  });
 
 /*REVISADO*/