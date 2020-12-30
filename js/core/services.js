define([
  "esri/layers/MapImageLayer",
  "esri/layers/FeatureLayer",
  "esri/layers/GroupLayer",

  "esri/config",

  ], function(
    MapImageLayer,
    FeatureLayer,
   GroupLayer,

   esriConfig

  ){

    // esriConfig.request.proxyUrl = "https://proxyphp.herokuapp.com/proxy.php"; //oficial
    esriConfig.request.proxyUrl = "./proxy_php/proxy.php"; 
    

    var url_electricidad='https://gisem.osinergmin.gob.pe/serverosih/rest/services/Electricidad/ELECTRICIDAD/MapServer';
    var url_gasnatural='https://gisem.osinergmin.gob.pe/serverosih/rest/services/Gas_Natural/GAS_NATURAL/MapServer';
    var url_hidrocarburos='https://gisem.osinergmin.gob.pe/serverosih/rest/services/Hidrocarburos_Liquidos/HIDROCARBUROS_LIQUIDOS/MapServer';
    var url_mineria='https://gisem.osinergmin.gob.pe/serverosih/rest/services/Mineria/MINERIA_MEM/MapServer';
    var url_fep='https://gisem.osinergmin.gob.pe/serverosih/rest/services/Transversal/ME_Solar_Hidraulica_Eolica_2017/MapServer';
    var url_aue ='https://gisem.osinergmin.gob.pe/serverosih/rest/services/Transversal/ACCESO_UNIVERSAL_ENERGIA/MapServer';

    var url_depa = "https://gisem.osinergmin.gob.pe/serverosih/rest/services/Cartografia/LIMITE_DEPARTAMENTAL/MapServer/0";
    var url_prov = "https://gisem.osinergmin.gob.pe/serverosih/rest/services/Cartografia/LIMITE_PROVINCIAL/MapServer/0";
    var url_dist = "https://gisem.osinergmin.gob.pe/serverosih/rest/services/Cartografia/LIMITES_DISTRITALES/MapServer/0";

    var _mil_electricidad = new MapImageLayer({
      url: url_electricidad,
      title:'ELECTRICIDAD',
      aux_alias: 'sectorelectricidad'
    });

    var _mil_gasnatural = new MapImageLayer({
      url: url_gasnatural,
      visible :false,
      title:'GAS NATURAL',
      aux_alias: 'sectorgasnatural'
    });

    var _mil_hidrocarburos = new MapImageLayer({
      url: url_hidrocarburos,
      visible :false,
      title:'HIDROCARBUROS',
      aux_alias: 'sectorhidrocarburos'
    });

    var _mil_mineria = new MapImageLayer({
      url: url_mineria,
      visible :false,
      title:'MINERÍA',
      aux_alias: 'sectormineria'
    });

    var _mil_aue = new MapImageLayer({
      url: url_aue,
      visible :false,
      title:'ACCESO UNIVERSAL ENERGÍA',
      aux_alias: 'sectoraue'
    });

    var _mil_fep = new MapImageLayer({
      url: url_fep,
      visible :false,
      title:'FUENTES DE ENERGÍA PRIMARIA',
      aux_alias: 'sectorfep'
    });

      // Grupo definido para Capas Añadidas Tmp
    var _gru_aniadido = new GroupLayer({
      title: 'Capas Añadidas',
      visible: false,
      visibilityMode: "independent",
      layers: [],
      opacity: 1,
      aux_alias: 'sectoraniadido'
    });

    // Informacion auxiliar de capas asignado en el espacio global de variables
    //INFORMACION AUXILIAR DE CAPAS

    /*
      NOTA: El objeto __globspace.infolayers se conforma por un array de objetos que corresponden a los grupos de capas. 
      Cada objeto tiene los siguientes atributos: 

      alias: coincide con el nombre de variable __mil
      aux_alias: coincide con el nombre del atributo aux_alias del objeto MIL definido en la variable __mil
      containerlyl: coincide con el id del contenedor DOM del layerlist
      layers: [] //objeto usado en el proceso de dinamicidad.
    */
    __globspace.infolayers = [
      {
        alias:'__mil_electricidad',
        containerlyl: 'lyl_electricidad',
        aux_alias: 'sectorelectricidad',
        layers:[], 
      },
      {
        alias:'__mil_gasnatural',
        containerlyl: 'lyl_gasnatural',
        aux_alias: 'sectorgasnatural',
        layers:[], 
      },
      {
        alias:'__mil_hidrocarburos',
        containerlyl: 'lyl_hidrocarburos',
        aux_alias: 'sectorhidrocarburos',
        layers:[], 
      },
      {
        alias:'__mil_mineria',
        containerlyl: 'lyl_mineria',
        aux_alias: 'sectormineria',
        layers:[], 
      },
      {
        alias:'__mil_fep',
        containerlyl: 'lyl_fep',
        aux_alias: 'sectorfep',
        layers:[], 
      },
      {
        alias:'__mil_aue',
        containerlyl: 'lyl_aue',
        aux_alias: 'sectoraue',
        layers:[], 
      },      
    ];	
  
    return {
      getLayerElectricidad : function(){return _mil_electricidad},
      getLayerGasNatural   : function(){return _mil_gasnatural},
      getLayerHidrocarburos: function(){return _mil_hidrocarburos},
      getLayerMineria      : function(){return _mil_mineria},
      getLayerAUE      : function(){return _mil_aue},
      getLayerFEP      : function(){return _mil_fep},
  
      getGruAniadido: function () { return _gru_aniadido; },

      getUrlElectricidad : function(){return url_electricidad},  
      getUrlGasNatural : function(){return url_gasnatural},  
      getUrlHidrocarburos : function(){return url_hidrocarburos},  
      getUrlMineria : function(){return url_mineria},  
      getUrlAUE : function(){return url_aue},  
      getUrlFEP : function(){return url_fep},  

      getUrlDepartamento : function(){return url_depa},
      getUrlProvincia : function(){return url_prov},
      getUrlDistrito : function(){return url_dist}
    }
});

// REVISADO