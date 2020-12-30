define([
	"js/core/visor",
	"js/widgets/streetview",
	"dijit/Menu", 
	"dijit/MenuItem", 
	"dijit/MenuSeparator",
	"dijit/popup",
    "esri/Graphic",
    "esri/PopupTemplate",

    "esri/tasks/Locator",   
     "esri/core/watchUtils"

	],function(
		Visor,
		StreetView,
		Menu, 
		MenuItem, 
		MenuSeparator,
		Popup,
		Graphic, 
		PopupTemplate,

		Locator,
		watchUtils
	){

		$(function() {
	      console.log( "ready context Menu - widget!" );
	      createContextMenu();

	    });

	    __view = Visor.getView();
		
		__ctxmenu = {}; //context menu
		__mappoint = {} //map point in clicked (point geometry)

		__locator = new Locator({url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"}); 
		__gra_locator = {}; 

		function createContextMenu() { 
		  __ctxmenu = new Menu();
		  __ctxmenu.addChild(new MenuItem({
		    label: "Abrir Street View aquí",
		    iconClass: "esri-icon-media",
		    onClick: function (evt) {  
		      $('#wg_streetview').removeClass('notvisible').addClass('visible');
		      StreetView.loadPanorama(__mappoint);
		      Popup.close(__ctxmenu);
		    }
		  }));
		  __ctxmenu.addChild(new MenuItem({
		    label: "Ver dirección aquí",
		    iconClass: "esri-icon-map-pin",
		    onClick: function () {
		      showAddressLocator(__mappoint);
		      Popup.close(__ctxmenu);
		    }
		  }));
		  __ctxmenu.startup();
		}

		__view.on("click", function(event){
		  __mappoint = event.mapPoint;
		  if (event.button === 2) { //if(right click)
		    Popup.open({
		      popup: __ctxmenu,
		      x: event.x,
		      y: event.y          
		    }); 
		  }else{
		    Popup.close(__ctxmenu);
		    __view.graphics.remove(__gra_locator);
		  }
		});

		
		function showAddressLocator(mappoint){
			let _pop_locator = new PopupTemplate({
			  title: "Location",
			  content : [{       
			    type: "fields",
			    fieldInfos: [{
			      fieldName: "Address",
			      label: "Adress"
			    },{
			      fieldName: "Neighborhood",
			      label: "Neighborhood",          
			    },{
			      fieldName: "City",
			      label: "City",          
			    },{
			      fieldName: "Subregion",
			      label: "Subregion",          
			    },{
			      fieldName: "Region",
			      label: "Region",          
			    },{
			      fieldName: "Postal",
			      label: "Postal Code",          
			    },{
			      fieldName: "CountryCode",
			      label: "Country Code",          
			    },{
			      fieldName: "PlaceName",
			      label: "Place Name",          
			    }]
			  }]
			});
			
			__locator.locationToAddress({ location: mappoint }).then(function(response){
		        __view.graphics.remove(__gra_locator);
		        __gra_locator = new Graphic({
		          geometry: response.location, 
		          symbol: { type: "simple-marker", size: 8 }, 
		          attributes: response.attributes, 
		          popupTemplate: _pop_locator
		        });
		        __view.graphics.add(__gra_locator);

		        __view.popup.open({
		            location: __gra_locator.geometry,
		            features: [__gra_locator]
		        });          
		    });
		}
	}
);

