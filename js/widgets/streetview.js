define([
	"js/core/visor",
	"dijit/Menu", 
	"dijit/MenuItem", 
	"dijit/MenuSeparator",
	"dijit/popup",
    "esri/Graphic"

	],function(
		Visor,
		Menu, 
		MenuItem, 
		MenuSeparator,
		Popup,
		Graphic
	){
		
		// __view = Visor.getView();
		__view = __globspace.view;

		__isinited_streetview = false;
		__svpanorama = '';
		__svservice = '';
		
		__isactive_btnmark = false;   
		__gra_placemarker = {}; 
		__symbolsv = {
		  type: "picture-marker", 
		  url: "img/blueArrow4.png",
		  width: "24px",
		  height: "24px",
		  angle: 270
		}

		$('#btn_menusv').on('click', function() {
		  __isinited_streetview==false ? initStreetView() : '';
		});

		
		$('#btn_markstreet').on('click', function(){
		  $(this).toggleClass('active desactive');
		  $('#div_view').toggleClass('active-click desactive-click');
		  let $msg_instruc = $('.message-instruction-sv');
		  if($(this).hasClass('active')){
		    __isactive_btnmark = true;
		    $msg_instruc.css('visibility', 'visible');
		    $(this).addClass('parpadea').attr('title', 'Desactivar click en el mapa');
		  }else{
		    __isactive_btnmark = false;
		    $msg_instruc.css('visibility', 'hidden');
		    $(this).removeClass('parpadea').attr('title', 'Activar click en el mapa');
		  }
		});

		__view.on("click", function(event){
			console.log('aqui');
		  if(event.button === 0 && __isactive_btnmark){
		  	loadPanorama(event.mapPoint);
		  }
		});

		function initStreetView(){ 
		  let panooptions = { 
		    linksControl: false,
		    panControl: false,
		    zoomControlOptions: { style: google.maps.ZoomControlStyle.SMALL },
		    enableCloseButton: false
		  }
		  __svpanorama = new google.maps.StreetViewPanorama(document.getElementById('container_streetview'), panooptions);
		  __svservice = new google.maps.StreetViewService();
		  __isinited_streetview = true;
		}

		function loadPanorama(mappoint) {
		  __isinited_streetview==false ? initStreetView() : '';
		  let latylng = { lat: mappoint.latitude, lng: mappoint.longitude };
		  let $containersv = $('#container_streetview').css('display', 'block');
		  let $msg_noresult = $('.message-noresults-sv').css('display', 'none');
		  
		  __svservice.getPanorama({location: latylng, radius: 50}, function(data, status){
		    if (status === 'OK') {          
		      if(__isactive_btnmark) $('#btn_markstreet').click();          
		      __svpanorama.setPosition(latylng); // ó __svpanorama.setPano(data.location.pano);    
		      __svpanorama.setVisible(true);          
		    }else {
		      $containersv.css('display', 'none');
		      $msg_noresult.css('display', 'block');
		      __svpanorama.setVisible(false);
		      __view.graphics.remove(__gra_placemarker);     
		      status == 'ZERO_RESULTS' ? console.error('Street View no disponible en esta ubicación') : console.error('ERROR UNKNOWN - Street View no disponible en esta ubicación');
		    }        
		  });    

		  //event position changed
		  __svpanorama.addListener('position_changed', function() {
		    if (__view.graphics.items.length === 0) { 
		      __gra_placemarker = new Graphic({
		        geometry: mappoint, 
		        symbol: __symbolsv     
		      });   
		      __view.graphics.add(__gra_placemarker);
		    } 
		    let panoposition = __svpanorama.getPosition();
		    mappoint.latitude = panoposition.lat();
		    mappoint.longitude = panoposition.lng();
		    __gra_placemarker.geometry = mappoint;
		  });

		  //event rotation changed 
		  __svpanorama.addListener('pov_changed', function() {        
		    let panopov = __svpanorama.getPov();      
		    __symbolsv.angle = panopov.heading;
		    __gra_placemarker.symbol = __symbolsv;
		  });             
		}

		/**************** RETURN FUNCIONES ******************** */    

	    return{
	      loadPanorama: function(mappoint){ return loadPanorama(mappoint); }
	    }

	}
);

