requirejs.config({
    appDir: ".",
    baseUrl: "js",
    paths: { 
        /* Load jquery from google cdn. On fail, load local file. */
        'jquery': ['//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min', 'libs/jquery-min'],
        'leaflet': '//cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.2/leaflet'
    }
});

define(['jquery', 'leaflet'], function($, L) {
    
  	console.log("loaded");
   
    setup = function() {
   
    
	var map = L.map('map', {trackResize:true, maxZoom:16}).setView([-41.2858, 174.78682], 14);
	
	
	var bwlayer = L.tileLayer(
	            'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	            attribution: '&copy; Mapossum',
	            maxZoom: 18,
	            })
	
	bwlayer.on("tileload", function(evt) {
						//console.log(evt.tile)
				
						//a = '<img class="olTileImage" crossorigin="anonymous" src="//c.tile.openstreetmap.org/3/3/2.png" style="visibility: inherit; opacity: 1; position: absolute; left: 55px; top: -67px; width: 256px; height: 256px;">'
						
						//evt.tile.src = "//c.tile.openstreetmap.org/3/3/2.png"
						
						evt.tile.setAttribute("crossorigin", "anonymous");
						
						//t = evt.tile.cloneNode(true);
						t = new Image();
						t.setAttribute("crossorigin", "anonymous");
						t.src = evt.tile.src;
						t.realtile = evt.tile;
						
						t.onload = function() {
						
						console.log(this);
						
						iw = (t.width);
						ih = (t.height);
						
						var canvas = document.createElement('canvas');
						canvas.width  = iw;
						canvas.height = ih;
						canvas.style.zIndex   = 8;
						canvas.style.position = "absolute";
						canvas.style.border   = "1px solid";
					
						var ctx = canvas.getContext('2d');
						//delete evt.tile['crossorigin'];
						
						
						ctx.drawImage(this, 0, 0);			
						
                        //var ctx = context; //evt.tile.getCanvasContext();
                        if (ctx) {
	                        var imgd = ctx.getImageData(0, 0, iw, ih);
                            var pix = imgd.data;
                            for (var i = 0, n = pix.length; i < n; i += 4) {
                                pix[i] = pix[i + 1] = pix[i + 2] = (3 * pix[i] + 4 * pix[i + 1] + pix[i + 2]) / 8;
                            }
                            ctx.putImageData(imgd, 0, 0);
                            //evt.tile.imgDiv.removeAttribute("crossorigin");
                            t.realtile.src = ctx.canvas.toDataURL();
                        }
                        }
                        
                        }
                        );
	
	map.addLayer(bwlayer);
    
    
    
    
    
    }
    
    
    $( document ).ready( setup )
     
      
    return {};
    
});
