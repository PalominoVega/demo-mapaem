define([
    "js/core/services",

    "esri/layers/GroupLayer",
    "esri/layers/FeatureLayer",
    "esri/layers/KMLLayer",
    "esri/layers/GeoJSONLayer",
    "esri/layers/GeoRSSLayer",
    "esri/layers/CSVLayer",
    "esri/layers/WMSLayer",      

    "esri/request",
    "esri/Graphic",
    "dojox/data/CsvStore",
    "dojo/_base/array",
    "esri/geometry/support/webMercatorUtils",
    "esri/geometry/Point",

    "dojo/domReady!"
    
  ], function(
    Services,

    GroupLayer,
    FeatureLayer,
    KMLLayer,
    GeoJSONLayer,
    GeoRSSLayer,
    CSVLayer,
    WMSLayer, 

    request,
    Graphic,
    CsvStore,
    arrayUtils,
    webMercatorUtils,
    Point

  ){

    var view = __globspace.currentview;
    var __gru_aniadido = Services.getGruAniadido();

    $(function () {
      view.popup.defaultPopupTemplateEnabled = true; 

      // Check for the various File API support.
      if (window.File && window.FileReader) { // && window.FileList && window.Blob
        console.log("Este navegador sí acepta la API de Archivos ♣ ");
      } else {
        alert('Este navegador no acepta APIs de archivos');
      }
      
    });
   

    //** AÑADIR CAPAS DESDE UNA URL

    $("#wg_addlayer").on("click", "#btn_addlayer", function(event) {
      $('#sp_uploadstatus_url').html("");

      let $preloader = $('#btn_preuploader').removeClass('notvisible').addClass('visible'),
        $btnadd = $(this).removeClass('visible').addClass('notvisible'),
        tipo = $('#cmb_tiposervice').val(),
        url_newcapa = $.trim($('#txt_urlservice').val()),
        nuevacapa = "";

      switch (tipo) {
        case 'shape':
          nuevacapa = new FeatureLayer(url_newcapa);
          break;

        case 'wms':
          nuevacapa = new WMSLayer({
            url: url_newcapa,
            legendEnabled: true,
          });
          break;

        case 'kml':
          nuevacapa = new KMLLayer(url_newcapa); //f: mostrar en leyenda (limitación de API)
          break;

        case 'geojson':
          nuevacapa = new GeoJSONLayer({url: url_newcapa});
          break;

        case 'georss':
          nuevacapa = new GeoRSSLayer(url_newcapa);
          nuevacapa.title = 'GeoRSS';
          break;
        
        case 'csv':
          let aux_arr = url_newcapa.split('/'); 
          let layername = aux_arr[aux_arr.length-1].split('.csv')[0];
          nuevacapa = new CSVLayer(url_newcapa);
          nuevacapa.title = layername;
          break;

        default: ''; break;
      }

      nuevacapa.load().then(function(){
        __gru_aniadido.visible = true;
        __gru_aniadido.layers.add(nuevacapa);

        $('#sp_uploadstatus_url').removeClass('failed').addClass('ok').html("Capa añadida correctamente");
        $preloader.removeClass('visible').addClass('notvisible');
        $btnadd.removeClass('notvisible').addClass('visible');
        $('#wg_leyend').show(400); // mostrar leyenda

        //Zoom to new layer
        if(tipo == 'georss') {
          let fcollections = nuevacapa.featureCollections;//always 3: Polygons, Lines, Points
          for (let i = 0; i < fcollections.length; i++) {
            let fcollection = fcollections[i];
            if(fcollection.featureSet.features.length > 0) {
              let sourceGraphics = [];
              let graphics = fcollection.featureSet.features.map(function(feature) {
                return Graphic.fromJSON(feature);
              });          
              sourceGraphics = sourceGraphics.concat(graphics);                 
              view.goTo(sourceGraphics);
              return; 
            }
          }
        }else if(tipo == 'kml') {
          (nuevacapa.extent) ? view.goTo(nuevacapa.extent) : ''; //funcional en 4.14           
        }else if(tipo == 'wms') {
          view.goTo(nuevacapa.fullExtent);
        }else {
          zoomTolayer(nuevacapa);
        }
      }, function(error){
        console.log("Error al cargar capa: "+error);
        $('#sp_uploadstatus_url').removeClass('ok').addClass('failed').html("Ingrese una URL correcta de acuerdo al Tipo seleccionado");
        $preloader.removeClass('visible').addClass('notvisible');
        $btnadd.removeClass('notvisible').addClass('visible');
      });  
    });    

    $('#wg_addlayer').on('click', '#btn_clear_addlayer', function() {
      $('#txt_urlservice').val("").focus();
      $('#sp_uploadstatus_url').html("");
    });



    //** AÑADIR CAPAS DESDE UN SHAPEFILE ZIPPEADO     

    var portalUrl = "https://www.arcgis.com";    

    $("#wg_addlayer").on("change", "#form_uploadshp", function(event) {
      let $msgstatus = $("#sp_uploadstatus_shp").html('');          
      let files = event.target.files;
      if(files.length == 1 ){
        let filename = event.target.value.toLowerCase();
        if (filename.indexOf(".zip") !== -1) { //Si archivo es .zip
          generateFeatureCollection(filename);
        } else {
          $msgstatus.removeClass('ok').addClass('failed').html('Solo se admite subir un shapefile comprimido con .zip');
        }
      }        
    });    

    function generateFeatureCollection(fileName) {
      let name = fileName.split(".");        
      name = name[0].replace("c:\\fakepath\\", ""); // Chrome and IE add c:\fakepath to the value - we need to remove it
      //Poner modo cargando ...
      let $preloader = $('#tabpane_addlayer_shp .preuploader').removeClass('notvisible').addClass('visible');
      let $placeholder = $('#tabpane_addlayer_shp .drop-zone-placeholder').removeClass('visible').addClass('notvisible');
      let $infile = $('#tabpane_addlayer_shp .infile').removeClass('visible').addClass('notvisible');
      let $msgstatus = $("#sp_uploadstatus_shp").removeClass('failed ok').html("<b>Cargando…  </b>" + name);

      let params = {
        name: name,
        targetSR: view.spatialReference,
        maxRecordCount: 80000, //Default=1000
        enforceInputFileSizeLimit: true,
        enforceOutputJsonSizeLimit: true
      };

      // generalizar features a 10 metros para un mejor rendimiento
      params.generalize = true;
      params.maxAllowableOffset = 10;
      params.reducePrecision = true;
      params.numberOfDigitsAfterDecimal = 0;

      let mycontent = {
        filetype: "shapefile",
        publishParameters: JSON.stringify(params),
        f: "json"
      };

      // use the REST generate operation to generate a feature collection from the zipped shapefile
      request(portalUrl + "/sharing/rest/content/features/generate", {
        query: mycontent,
        body: document.getElementById("form_uploadshp"),
        responseType: "json"
      })
      .then(function(response) {
          addShapefileToMap(response.data.featureCollection);
          let layername = response.data.featureCollection.layers[0].layerDefinition.name;
          handleSuccess($msgstatus, $preloader, $placeholder, $infile, layername);            
      })
      .catch(function(error){
        handleError($msgstatus, $preloader, $placeholder, $infile, 'Error al cargar capa', error);         
      });
    }      

    function addShapefileToMap(featureCollection) {
      // add the shapefile to the map and zoom to the feature collection extent        
      let sourceGraphics = [];
      let layers = featureCollection.layers.map(function(layer) {
        let graphics = layer.featureSet.features.map(function(feature) {
          return Graphic.fromJSON(feature);
        });  
        sourceGraphics = sourceGraphics.concat(graphics);

        let geometrytype = graphics[0].geometry.type; //point, polyline, polygon 
        let newrenderer = getRenderer(geometrytype);
        let fields = getCorrectFields(layer.layerDefinition.fields);

        let featureLayer = new FeatureLayer({
          title: layer.layerDefinition.name,
          source: graphics, 
          objectIdField: "FID",
          fields: fields,
          renderer: newrenderer
        });

        return featureLayer;
      });

      __gru_aniadido.visible = true;
      __gru_aniadido.layers.addMany(layers);
      view.goTo(sourceGraphics);
    }


    function getCorrectFields(esrifields){
      //Cambia typeFields con prefijo esri_ 
      //valid types: 'blob', 'date', 'double', 'geometry', 'global-id', 'guid', 'integer', 'long', 'oid', 'raster', 'single', 'small-integer', 'string', 'xml'
      let aux_length = esrifields.length;
      for (let i = 0; i < aux_length; i++) {
        let esrifield = esrifields[i];
        let fieldname = (esrifield.name).replace(/\./g, '_'); //replace . por _
        esrifield.name = fieldname;

        switch(esrifield.type){
          case 'esriFieldTypeOID':
            esrifield.type = 'oid';
            break;

          case 'esriFieldTypeString':
            esrifield.type = 'string';
            break;

          case 'esriFieldTypeInteger':
            esrifield.type = 'integer';
            break;

          case 'esriFieldTypeSmallInteger':
            esrifield.type = 'small-integer';
            break;

          case 'esriFieldTypeSingle':
            esrifield.type = 'single';
            break;

          case 'esriFieldTypeDouble':
            esrifield.type = 'double';
            break;

          case 'esriFieldTypeDate':
            esrifield.type = 'date';
            break;

          case 'esriFieldTypeGeometry':
            esrifield.type = 'geometry';
            break;

          case 'esriFieldTypeBlob':
            esrifield.type = 'blob';
            break;

          case 'esriFieldTypeRaster':
            esrifield.type = 'raster';
            break;

          case 'esriFieldTypeGUID':
            esrifield.type = 'guid';
            break;
          
          case 'esriFieldTypeGlobalID':
            esrifield.type = 'global-id';
            break;
            
          case 'esriFieldTypeXML':
            esrifield.type = 'xml';
            break;              

          default: ''; break;

        }
        esrifields[i] = esrifield;
      }
      return esrifields;
    }



    //** AÑADIR DATOS DESDE UN ARCHIVO CSV

    //Lista de nombres de campo permitidos para Long y Lat 
    var latfields = ["lat", "latitude", "y", "ycenter", "latitud"];
    var longfields = ["lon", "long", "longitude", "x", "xcenter", "longitud"];

    $("#wg_addlayer").on("change", "#form_uploadcsv", function(event) {
      let $msgstatus = $("#sp_uploadstatus_csv").html('');          
      let files = event.target.files;
      if(files.length == 1 ){
        let filename = event.target.value.toLowerCase();
        if (filename.indexOf(".csv") !== -1) { //si archivo es .csv
          let file = files[0];
          handleCsv(file);
        } else {
          $msgstatus.removeClass('ok').addClass('failed').html('Solo se admite subir un archivo .csv');
        }
      }
    });    

    function handleCsv (file) {
      console.log("Processing CSV: ", file, ", ", file.name, ", ", file.type, ", ", file.size);
      if (file.data) {
        let decoded = bytesToString(base64.decode(file.data));
        processCsvData(decoded, filename);
      }else {
        let reader = new FileReader();
        reader.onload = function () {
          console.log("Finished reading CSV data");
          processCsvData(reader.result, file.name);
        };
        reader.readAsText(file);
      }
    }

    function processCsvData (data, filename) {
      let $preloader = $('#tabpane_addlayer_csv .preuploader').removeClass('notvisible').addClass('visible'),
        $placeholder = $('#tabpane_addlayer_csv .drop-zone-placeholder').removeClass('visible').addClass('notvisible'),
        $infile = $('#tabpane_addlayer_csv .infile').removeClass('visible').addClass('notvisible'),
        $msgstatus = $("#sp_uploadstatus_csv").removeClass('failed ok').html("<b>Cargando…  </b>" + filename),

        newLineIndex = data.indexOf("\n"),
        firstLine = $.trim(data.substr(0, newLineIndex)), //remove extra whitespace, not sure if I need to do this since I threw out space delimiters
        separator = getSeparator(firstLine),
        csvStore = new CsvStore({
          data: data,
          separator: separator
        });

      csvStore.fetch({
        onComplete: function (items) {
          let objectId = 0,
            features = [],
            latfield, longfield,
            fieldnames = csvStore.getAttributes(items[0]),
            fields = generateFieldsCsv(fieldnames);

          arrayUtils.forEach(fieldnames, function (fieldname) {
            let matchId;
            matchId = arrayUtils.indexOf(latfields, fieldname.toLowerCase());
            if (matchId !== -1) {
              latfield = fieldname;
            }

            matchId = arrayUtils.indexOf(longfields, fieldname.toLowerCase());
            if (matchId !== -1) {
              longfield = fieldname;
            }
          });

          // Add records in this CSV store as graphics
          arrayUtils.forEach(items, function (item) {
            let attrs = csvStore.getAttributes(item);
            let attributes = {};
            // Read all the attributes for  this record/item
            arrayUtils.forEach(attrs, function (attr) {
              let value = Number(csvStore.getValue(item, attr));
              attributes[attr] = isNaN(value) ? csvStore.getValue(item, attr) : value;
            });

            attributes["__OBJECTID"] = objectId;
            objectId++;

            let latitude = parseFloat(attributes[latfield]);
            let longitude = parseFloat(attributes[longfield]);

            if (isNaN(latitude) || isNaN(longitude)) {
              return;
            }

            let geometry = webMercatorUtils.geographicToWebMercator(new Point(longitude, latitude));
            let feature = {
              "geometry": geometry, 
              "attributes": attributes
            };
            features.push(feature);
          });

          let newrenderer = getRenderer('point');
          let featureLayer = new FeatureLayer({
            title: filename,
            source: features, 
            objectIdField: 'ID',
            fields: fields,
            renderer: newrenderer
          });

          featureLayer.load().then(function(){
            __gru_aniadido.visible = true;
            __gru_aniadido.add(featureLayer);
            zoomTolayer(featureLayer);
            handleSuccess($msgstatus, $preloader, $placeholder, $infile, filename);
          }, function(error){
            handleError($msgstatus, $preloader, $placeholder, $infile, 'Error al cargar capa', error);
          });              

        },
        onError: function (err) {
          handleError($msgstatus, $preloader, $placeholder, $infile, 'Error al obtener datos del Csv', err);
        }
      });
    }

    function getSeparator (string) {
      let separators = [",", "      ", ";", "|"];
      let maxSeparatorLength = 0;
      let maxSeparatorValue = "";
      arrayUtils.forEach(separators, function (separator) {
        let length = string.split(separator).length;
        if (length > maxSeparatorLength) {
          maxSeparatorLength = length;
          maxSeparatorValue = separator;
        }
      });
      return maxSeparatorValue;
    }

    function generateFieldsCsv(fieldnames) {
      let fields = [];
      let aux_length = fieldnames.length;
      for (let i = 0; i < aux_length; i++) {
        let field = {
          name: fieldnames[i],
          alias: fieldnames[i],
          type: "string"
        };
        fields.push(field);
      }
      return fields;        
    }   
    

    //** AÑADIR CAPAS DESDE UN KML    

    $("#wg_addlayer").on("change", "#form_uploadkml", function(event) {
      let $msgstatus = $("#sp_uploadstatus_kml").html('');          
      let files = event.target.files;
      if(files.length == 1 ){
        let filename = event.target.value.toLowerCase();
        if (filename.indexOf(".kml") !== -1 || filename.indexOf(".kmz") !== -1) { //Si archivo es .kml o .kmz
          let file = files[0];
          addKmlLayer(file);
        } else {
          $msgstatus.removeClass('ok').addClass('failed').html('Solo se admite subir un archivo .kml');
        }
      }
    });


    function addKmlLayer(file){   
      let $preloader = $('#tabpane_addlayer_kml .preuploader').removeClass('notvisible').addClass('visible');
      let $placeholder = $('#tabpane_addlayer_kml .drop-zone-placeholder').removeClass('visible').addClass('notvisible');
      let $infile = $('#tabpane_addlayer_kml .infile').removeClass('visible').addClass('notvisible');
      let $msgstatus = $("#sp_uploadstatus_kml").removeClass('failed ok').html("<b>Cargando…  </b>" + file.name);

      if (window.FormData !== undefined) {
          let data = new FormData();
          data.append("file", file);
          let filename = file.name;
          filename = filename.replace(/\ /g, '%20'); //replace whitespace por %20
          $.ajax({
              type: "POST",
              url: "https://giscorporativo.com.pe/osinergmin/uploadfiles_php/index.php",
              contentType: false,
              processData: false,
              data: data,
              success: function(result) {
                if($.trim(result) == 'true'){           
                  let urlkml = "https://giscorporativo.com.pe/osinergmin/uploadfiles_php/uploaded/"+ filename;
                  let nuevacapa = new KMLLayer(urlkml, {
                      id: 'KMLLayer'
                  });

                  nuevacapa.load().then(function(){
                    __gru_aniadido.visible = true;
                    __gru_aniadido.layers.add(nuevacapa);
                    if(nuevacapa.extent){
                      view.goTo(nuevacapa.extent);
                    }
                    handleSuccess($msgstatus, $preloader, $placeholder, $infile, filename);
                  }, function(error){
                    handleError($msgstatus, $preloader, $placeholder, $infile, 'Error al cargar capa', error);
                  });                         

                }else{
                  handleError($msgstatus, $preloader, $placeholder, $infile, 'Error al subir archivo', $.trim(result));
                }
              }
          });
      }
    }
    //KML: no se muestra en la leyenda - es una limitación de API


    //Evento lanzado para abrir mensaje de confirmación al querer cerrar
    $("#wg_addlayer").on('click', '.btn-close', function (e) {
		  $('#lbl_titletool').text('Conectar / Cargar Capa Externa');
      
      $('#modalcleartool').modal('show');
      $('#btn_yescleartool').removeClass().addClass('btn-confirm wg-addlayer');
    });

    //Evento lanzado al confirmar el cerrar (limpiar)
    $('#modalcleartool').on('click', '#btn_yescleartool.wg-addlayer', function (event) {
      clearAllOperation();
      $('#modalcleartool').modal('hide');
      $('#btn_yescleartool').removeClass('wg-addlayer');

      $('#wg_addlayer').removeClass("visible").addClass("notvisible");
    });
     


  /***************************************** FUNCIONES DE APOYO *******************************************/


    function zoomTolayer(layer){
      return layer.queryExtent().then(function(response){
        view.goTo(response.extent);
      });
    }

    function getRenderer(geometrytype) {
      //retorna renderer para cada geometrytype con color random
      let newrenderer = null;
      let color = getRandomColor();
      let color2 = getRandomColor();        
      switch (geometrytype) {
        case 'esriGeometryPoint': case 'point':
          newrenderer = {
            type: "simple",
            symbol: {
              type: "simple-marker",
              color: color, 
              size: 7,
              outline: {
                color: color2,
                width: 1
              }
            }
          };            
          break;

        case 'esriGeometryPolygon': case 'polygon':
          newrenderer = {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: color,
              style: "solid",
              outline: {
                color: color2,
                width: 1
              }
            }
          };
          break;

        case 'esriGeometryPolyline': case 'polyline':
          newrenderer = {
            type: "simple",
            symbol: {
              type: "simple-line",
              color: color,
              style: "solid"
            }
          };
          break;
      }        
      return newrenderer;
    }

    function getRandomColor() {
      let letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    }

    function handleError($msgstatus, $preloader, $placeholder, $infile, str, error){
      console.log(`${str}: ${error.message}`);
      $msgstatus.removeClass('ok').addClass('failed').html(`${str}: ${error.message}`);
      $preloader.removeClass('visible').addClass('notvisible');
      $placeholder.removeClass('notvisible').addClass('visible');
      $infile.removeClass('notvisible').addClass('visible');
    }

    function handleSuccess($msgstatus, $preloader, $placeholder, $infile, layername){
      $msgstatus.removeClass('failed').addClass('ok').html(`Capa añadida correctamente: ${layername}`);
      $preloader.removeClass('visible').addClass('notvisible');
      $placeholder.removeClass('notvisible').addClass('visible');
      $infile.removeClass('notvisible').addClass('visible');
      $('#wg_leyend').show(400); // mostrar leyenda
    }

    function clearAllOperation(){
      $('#txt_urlservice').val("");
      $('#fil_upshp').val("");
      $('#fil_upcsv').val("");
      $('#fil_upkml').val("");
      $('#sp_uploadstatus_url').html("");
      $('#sp_uploadstatus_shp').html("");
      $('#sp_uploadstatus_csv').html("");
      $('#sp_uploadstatus_kml').html("");
    }    

  });


  /* REVISADO ♣ */