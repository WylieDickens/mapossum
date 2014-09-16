var window={userid:"", loggedUid:"",first:"", last:"", answerNum:"", qid:"", answer:"", curQuestion:"", curAnswers:"", picture:"", explain:""};
var questions={},count = 0, curlatlon, picture, answerCount, loc, curExtent, logged = 0, useCenter = 1, maptype, popup, crtData=[], curdata;
var userAcc=[];
var mapossumLayer;
var testingChart;

$( window ).load(function() {

$( "#boundaryMenu" ).popup({ overlayTheme: "b" });
$( "#legendPopup" ).popup({ overlayTheme: "b" });
$( "#descriptionPopup" ).popup({ overlayTheme: "b"});
$("#pnlIdent").panel({});
	
var map = L.map('map', {trackResize:true, maxZoom:16});

map.attributionControl.addAttribution("&copy Mapossum");

var bwlayer = L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/roadsg/x={x}&y={y}&z={z}', {
	minZoom: 0,
	maxZoom: 16
});

// replace "toner" here with "terrain" or "watercolor"
//var bwlayer = new L.StamenTileLayer("watercolor");
map.addLayer(bwlayer);

//this code is a hack to distiguish single clicks from double clicks
var clickCount = 0;
var popupOpen = false;
// Add new pin, every time the map gets clicked
map.on('click', function(e) {
  if (popupOpen) return;
  clickCount += 1;
  if (clickCount <= 1) {

	setTimeout(function() {
      if (clickCount <= 1) {
        identify(e);
      }
      clickCount = 0;
    }, 500);
	
  }
});

// old identify that fires both on single and double clicks
//map.on('click', identify);
popup = L.popup();

getLocation();
getQuestions();

map.on('move', function(e) {
    updateHash();
});

$( ".leaflet-control-attribution" ).css( "display", "none" );

/* verify user login information -- if successful, user questions are stored for the account page*/
function verify(email, password){
    $.getJSON( "http://services.mapossum.org/verify?email=" + email + "&password=" + password + "&callback=?", function( data ) {
      window.userid = data.userid;
      if(data.userid != -1){
        localStorage.setItem("semail", email)
        localStorage.setItem("spassword", password)
      	$('#loginIcon').css( "background-color", "green" );     	
      	logged = 1
      	window.first = data.first
      	window.last = data.last
      	window.loggedUid = data.userid
      	$.getJSON( "http://services.mapossum.org/getquestions?users=" + window.loggedUid + "&minutes=0" + "&callback=?", function( userQuestions ) {
      		info = userQuestions.data      		     	
      		for(var i = 0; i < info.length; i++ ){ 
      			ques = {question:info[i].question, explain:info[i].explain, uid:info[i].userid, qid:info[i].qid, hashtag:info[i].hashtag}
      			userAcc.push(ques)   			
      		}
      		
      	});
      }
      else{
      	alert(data.message)
      	$( "#login" ).panel( "open")
      }
      
    });
}

sem = localStorage.semail;
spass = localStorage.spassword;

if (sem != undefined) {
	verify(sem,spass)
}


/* create new user account */
function addUser(email, password, affiliation, first, last, location){
    $.getJSON( "http://services.mapossum.org/adduser?email=" + email + "&password=" + password + "&affiliation=" + affiliation + "&first=" + first + "&last=" + last + "&location=" + location +"&callback=?", function( data ) {
    		if (data.success == true) {
    			verify(data.email,password)
    		} else {
	    		alert("your account was not created")
    		}
    });
}

/* create question along with logic to add questions answers and pictures */
function addQuestion(userid, question, hashtag, description){				
    $.getJSON( "http://services.mapossum.org/addquestion?userid=" + window.userid + "&question=" + question + "&hashtag=" + hashtag + "&explain="+description+"&callback=?", function( data ) {
  
      window.qid = data.qid

      if(picture == "yes"){ 

	      var generateTextBoxes = function( qty, container ) {
	        if (container) {
	            for (var i = 1; i <= window.answerNum; i++ ) {
	                $('<label for="answer-'+i+'">Answer '+i+'</label>&nbsp;<input id="Answer-'+i+'" name="Answer-'+i+'" type="text" /><br><label for="picture-'+i+'">Picture URL '+i+'</label>&nbsp;<input id="Picture-'+i+'" name="Picture-'+i+'" type="text" /><br>').appendTo( container );
	            }
	        }
	    	}        
	         generateTextBoxes( $('#answer-0').val(), $('#answers') );
	    
	      $( "#addAnswers" ).panel( "open");
 	 }
 	 else{
 	 	var generateTextBoxes = function( qty, container ) {
	        if (container) {
	            for (var i = 1; i <= window.answerNum; i++ ) {
	                $('<label for="answer-'+i+'">Answer '+i+'</label>&nbsp;<input id="Answer-'+i+'" name="Answer-'+i+'" type="text" /><br>').appendTo( container );
	            }
	        }
	    	}        
	         generateTextBoxes( $('#answer-0').val(), $('#answers') );
	    
	      $( "#addAnswers" ).panel( "open");
 	 }
	});
	
}

/* push question answers into database */
function addAnswer(qid){	
	answerCount = 1;
	if(picture == "yes"){
		console.log('yes ')
		for(var i = 1; i <= window.answerNum; i++){	   		
	   		ansDiv = '#Answer-'+i;
	   		answerDiv = String(ansDiv)
	   		window.answer = $(answerDiv).val()
	   		picDiv = '#Picture-'+i;
	   		pictureDiv = String(picDiv)
	   		window.picture = $(pictureDiv).val()
	   		$.getJSON( "http://services.mapossum.org/addanswer?qid=" + window.qid + "&answer=" + window.answer +"&link=" + window.picture + "&callback=?", function( data ) {
	          	if(answerCount == window.answerNum){
	          		setUpMap(window.qid);
					//window.location.href = "http://mapossum.org/?qid="+ window.qid;					
				}      
				answerCount++
	    	});
		}	
	}
	else{		
		for(var i = 1; i <= window.answerNum; i++){	   		
	   		ansDiv = '#Answer-'+i;
	   		answerDiv = String(ansDiv)
	   		window.answer = $(answerDiv).val()	
	   		$.getJSON( "http://services.mapossum.org/addanswer?qid=" + window.qid + "&answer=" + window.answer +"&callback=?", function( data ) {
	   			if(answerCount == window.answerNum){								
					setUpMap(window.qid);		
					//window.location.href = "http://mapossum.org/?qid="+ window.qid;			
				}	
				answerCount++				
	    	});	
	    	   	    		         	
		}
	}  
		
}

/* pull query string out of url */
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function updateHash() {
	
	bh = []
	c = map.getCenter();
	//b = map.getBounds()
	//lngdif = b._northEast.lng - b._southWest.lng;
	//latdif = b._northEast.lat - b._southWest.lat;
	
	//lngd = (lngdif - (lngdif * 0.75)) / 2;
	//latd = (latdif - (latdif * 0.75)) / 2;
	
	bh.push(questions[count].qid);
	bh.push(maptype);
	bh.push(map.getZoom())
	bh.push(c.lat);
	bh.push(c.lng);
	//bh.push((b._southWest.lat + latdif).toFixed(3));
	//bh.push((b._southWest.lng + lngdif).toFixed(3));
	//bh.push((b._northEast.lat - latdif).toFixed(3));
	//bh.push((b._northEast.lng - lngdif).toFixed(3));
	
	window.location.hash = bh.join("|")
}

/* retreive questions out of the database, push inital question tiles, and update title information*/
function getQuestions(){
	queryQuestion = parseInt(getParameterByName("qid"));
	maptype = getParameterByName("maptype");
	
	hashy = (window.location.hash);
	hashy = hashy.replace("#","");
	
	hashvals = hashy.split("|");
	
	var bounds;
	
	if (hashvals.length > 2) {
		
		//console.log(hashvals);
		//bounds = [[hashvals[2], hashvals[3]],[hashvals[4], hashvals[5]]]
		map.setView([hashvals[3],hashvals[4]],(hashvals[2]));
		

	}
	
	if (hashvals.length > 1) {
		maptype = hashvals[1];
	}
	
	if (hashvals.length > 0) {
		queryQuestion = hashvals[0];
	}

	
	if (maptype == "") {
		maptype = "subs"
	}
	
	console.log(queryQuestion)
	console.log("http://services.mapossum.org/getquestions?count=1000&hasanswers=true&qids="+queryQuestion)
	
	params = {"count":1000, "hasanswers":true}
	
	if(queryQuestion > 0){		
	
		params.qid = queryQuestion
		
		}
			
	$.getJSON( "http://services.mapossum.org/getquestions?callback=?",params, function( data ) {
			questions = data.data;
			   
			count=0
			nowqid = questions[0].qid
			
			for(i=0;i<questions.length;i++){			
				if(questions[i].qid == queryQuestion){
					count = i;
					nowqid = queryQuestion;
				  }
				}

					d = new Date();
					iv = d.getTime(); 
					mapossumLayer = L.tileLayer('http://maps.mapossum.org/{qid}/{maptype}/{z}/{x}/{y}.png?v={v}', {maptype: maptype, qid:nowqid, v: iv, opacity: 0.7})
		    		mapossumLayer.addTo(map);
		    		moveQuestion(count, false)
		    		
		    		
		});
		
}

/* update quesiton title information in the footer */
function updateTitle(layoutQuestion){	
	$("#curQuestion").html( '<center><h3>' + layoutQuestion + '</h3></center>' );	
}

/* get possible answers for a question*/
function getAnswers(id){
	$.getJSON( "http://services.mapossum.org/getanswers?qid=" + id + "&callback=?", function( data ) {      	
      	window.curAnswers = data.data;      
    });
}

/* build the responses panel which allows users to answer questions */
function buildReponses(qid){	
	$("#question").empty();
	$("#answerList").empty();
	$("#setLocation").empty();
	$("#descriptionTxt").empty()

	$.getJSON( "http://services.mapossum.org/getanswers?qid=" + qid + "&callback=?", function( data ) {
	  		
      	
      	for(i=0; i < data.data.length; i++){      		
      		if(data.data[i].link.length > 1 && i==0){      			
      			answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><legend>'+ window.curQuestion.question +'&nbsp<a href="#descriptionPopup" data-theme="b" data-role="button" data-inline="true" data-mini="true" data-icon="info" data-transition="pop" data-rel="popup">Description</a></legend><input type="radio" name="radioAid" value="' + data.data[i].answerid + '" id="Response-' + i + '"><label for="Response-' + i + '">'+data.data[i].answer+'<br><img src="'+data.data[i].link + '"style="width:70%;"></label></fieldset>');
	      		desc = $('<p class="black">'+window.explain+'</p>')
	      		answerBtn.appendTo('#answerList').trigger( "create" );
	      		desc.appendTo('#descriptionTxt').trigger( "create" );
	      	}
      		else if(data.data[i].link.length > 1){
      			answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><input type="radio" name="radioAid" value="' + data.data[i].answerid + '" id="Response-' + i + '"><label for="Response-' + i + '">'+data.data[i].answer+'<br><img src="'+data.data[i].link + '"style="width:70%;"></label></fieldset>');
	      		answerBtn.appendTo('#answerList').trigger( "create" );
      		}
      		else{
      			if(data.data[i].link.length == 0 && i==0){  		       		   		
		      		answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><legend>'+ window.curQuestion.question +'&nbsp<a href="#descriptionPopup" data-theme="b" data-role="button" data-inline="true" data-mini="true" data-icon="info" data-transition="pop" data-rel="popup">Description</a></legend><input type="radio" name="radioAid" value="' + data.data[i].answerid + '"id="Response-' + i + '"/><label for="Response-' + i + '">'+data.data[i].answer+'</label></fieldset>');
		      		desc = $('<p class="black">'+window.explain+'</p>')
		      		answerBtn.appendTo('#answerList').trigger( "create" );
		      		desc.appendTo('#descriptionTxt').trigger( "create" );
		      		

	      		}
	      		else{
	      			answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><input type="radio" name="radioAid" value="' + data.data[i].answerid + '"id="Response-' + i + '"/><label for="Response-' + i + '">'+data.data[i].answer+'</label></fieldset>');
	      			answerBtn.appendTo('#answerList').trigger( "create" );

	      		}
      		}
      	}      	    
    });
	$( "#responses" ).panel( "open");  
}

/* answer a question */
function addResponse(qid, answerid, loc){
	$.getJSON( "http://services.mapossum.org/addresponse?qid=" + qid + "&answerid=" + answerid + "&location=" + loc + "&callback=?", function( data ) {  
	  d = new Date();
	  v = d.getTime();    	
      mapossumLayer.options.v = v;
	  mapossumLayer.redraw()	
    });

}


/* moves to the previous question in the footer navigation */
function moveQuestion(count, zoom){

	if (zoom == undefined) {zoom = true}
	
	$("#previousQuestion").css( "display", "" );
	$("#nextQuestion").css( "display", "" );
	
	if (count == 0) {
		$("#previousQuestion").css( "display", "none" );
	}
	
	if (count == (questions.length - 1)) {
		$("#nextQuestion").css( "display", "none" );
	}

	window.curQuestion = questions[count]
	window.qid = questions[count].qid
	window.explain = questions[count].explain	
	updateTitle(questions[count].question)
	changeQuestion(window.qid)
	
	if (zoom) {
		getExtent(window.qid)
	} 
	
	$.getJSON( "http://services.mapossum.org/getanswers?qid=" + window.qid + "&callback=?", function( data ) {
	  data.data[0].name = "All Responses"
	  curdata = data.data
	})
		
}

/* runs the set up map event on the server which builds all the configuration files */
/* It also adds the quesition to the question list being maintained on the front end. */
function setUpMap(quesid){
	$.getJSON( "http://services.mapossum.org/setupmaps?qid=" + quesid + "&callback=?", function( data ) {
		$.getJSON( "http://services.mapossum.org/getquestions?qids=" + quesid + "&minutes=0" + "&callback=?", function( newq ) {
			
			questions.push(newq.data[0]);
			
			count = 0;
			for(i=0;i<questions.length;i++){			
				if(questions[i].qid == quesid){
					count = i;
					nowqid = quesid;
				  }
				}

		    moveQuestion(count)
			
		});
	});
}

/* retreives tiles for a question */
function changeQuestion(qid) {	
    getLegend(qid)
	mapossumLayer.options.qid = qid
	mapossumLayer.redraw()	
}

/* changes the maptype (ie. points, counties, states, etc.) */
function changemapType(newMapType) {
	maptype = newMapType
 	mapossumLayer.options.maptype = newMapType
 	mapossumLayer.redraw();
 	updateHash();
}

/* retreives a lat/long for a location and pans to that location */
function searchLocation(query){	
	$.getJSON( "http://nominatim.openstreetmap.org/search?q="+ query +"&format=json", function( data ) {      	
 		map.panTo([data[0].lat, data[0].lon]);
 		map.setZoom(12)
 	});
}

/* gets a users location using navigator geolocation */
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(formatLoc,showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

/* gets the geographic extent of a questions answers */
function getExtent(qid){	
	$.getJSON( "http://services.mapossum.org/getextent/"+ qid + "/" + maptype + "?callback=?", function( data ) {      	
 		minExtent = data[0]; 		
 		maxExtent = data[1];
 		bounds = [minExtent, maxExtent];  			
 		fitBounds(bounds)
 	});
}

/* fits a questions extent in the map view */
function fitBounds(bounds){	
	map.fitBounds(bounds, {padding:0});
}

/* reformats lat/long to be used */
function formatLoc(position) {
    setcurlatlon(position.coords.longitude,position.coords.latitude);
    loc = 1;
}

function setcurlatlon(xlng,ylat) {
	 curlatlon = "Point("+ xlng + " " + ylat +")";
	 
	 $.getJSON( "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + ylat + "&lon=" + xlng + "&zoom=18&addressdetails=1", function( data ) { 
	 	    
	 		$("#curLocationText").html( "<h4>Current Response Position: <h4><small>Lat: " + ylat.toFixed(3) + " " + "Lon: " + xlng.toFixed(3) + "<br>" + "<br>Which is near:<br>" + data.display_name  + "</small>");
	 })
}

/* error switch for geolocation */
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
        	loc = 0
            alert("User denied the request for Geolocation. Please note that you will be required to enter a map location from the map center as your location for all answers.")
            break;
        case error.POSITION_UNAVAILABLE:
        	loc = 0
           	alert("Location information is unavailable.  Please note that you will be required to enter a map location from the map center as your location for all answers.")
            break;
        case error.TIMEOUT:
            loc = 0
            alert("The request to get user location timed out.  Please note that you will be required to enter a map location from the map center as your location for all answers.")
            break;
        case error.UNKNOWN_ERROR:
            loc = 0
            alert("An unknown error occurred.  Please note that you will be required to enter a map location from the map center as your location for all answers.")
            break;
    }
}

/* gets legend information for a questions */
function getLegend(qid){
	$("#legendPic").empty();	    	
	legendImage = $('<img src="http://services.mapossum.org/legend/'+qid+'?opacity=0&color=white" width="230">')
	legendImage.appendTo('#legendPic').trigger( "create" )
 
}

/* generates charts */
function genChart(data){
	crtData = [];
	$.each(data,function(i, item) {
		crtAtr = {value:data[i].count, color:data[i].color, highlight:data[i].color, label:data[i].answer}
		crtData.push(crtAtr)
	});
	id = 'idChart'      					
	var ctx = document.getElementById(id).getContext("2d");
	window.myPie = new Chart(ctx).Pie(crtData);
}

/* gets identify based on click event, current maptype, and buffer area */
function identify(e){	
	var latlon = e.latlng.lng+" "+e.latlng.lat;
    point = "Point("+ latlon + ")";	
	$.getJSON( "http://services.mapossum.org/identify/"+window.qid+"/"+maptype+"?point="+point+"&buffer=1&callback=?", function( data ) {
		showChart(data.data)
	});
}

function showChart(data) {

	$("#idText").empty();
	$("#cvsDiv").empty();
	$( "#pnlIdent" ).panel( "open"); 
	if(data.length == 0){
		txtId = $("<center><h2>No features found</h2></center>")		
		txtId.appendTo('#idText').trigger( "create" );
	}
	else{		 
		txtId = $("<center><h2>"+data[0].name +"</h2></center>")		
		txtId.appendTo('#idText').trigger( "create" );
		cvs = $("<canvas id='idChart' width='250'></canvas>")		
		cvs.appendTo('#cvsDiv').trigger( "create" );
		genChart(data)	
	}	
	
}

/* click events */
$("#verify").bind('click', function(e) {
	email = $("#txtUsername").val()
	password = $("#txtPassword").val()  
	verify(email, password)
});

$("#subUser").bind('click', function(e) {
	 email = $("#username").val()
	 password = $("#password").val()
	 first = $("#first").val()
	 last = $("#last").val()
	 affiliation = $("#affiliation").val()  
	 addUser(email, password, affiliation, first, last, curlatlon)	 
});

$("#subQues").bind('click', function(e) {	
	question = $("#questionFld").val()
	answerNum = $("#sliderFld").val()
	description = $("#descriptionFld").val()
	picture = $("#flip-b").val()
	window.answerNum = answerNum
	hash = $("#hashFld").val()
	hash1 = hash.replace("#", "");
	hashtag = hash1.trim();	

	if(window.userid == null){		
		alert("Please login to create a question")
		$( "#login" ).panel( "open");  		
	}
	else{
		addQuestion(window.userid, question, hashtag, description)
	}
});

$("#subAnswer").bind('click', function(e) {	 
	//console.log('sub Clicked')
	addAnswer(window.qid)
});

$("#answerQuestion").bind('click', function(e) {	 
	buildReponses(window.curQuestion.qid);
});

$("#isp").bind('click', function(){	
	getLocation();
});

$("#mapcenter").bind('click', function(){
	console.log('center')
	center = map.getCenter(); 
	setcurlatlon(center.lng, center.lat);
});

$("#subResponse").bind('click', function() {	
	$("input[name=radioAid]:checked").each(function() {
        aid = $(this).val();        
    });
    if (curlatlon == undefined) {
	    alert("Please set your location below.")
	    $( "#responses" ).panel( "open");
    } else {
        addResponse(window.curQuestion.qid, aid, curlatlon)
    }
});

$("#subLocation").click(function(){	
	locText = $("#searchText").val()	
	searchLocation(locText)	
	$( "#responses" ).panel( "open"); 

})

$("#nextQuestion").bind('click', function(){
	if(count < questions.length - 1){
		count++
	} 
    moveQuestion(count);
})

$("#previousQuestion").bind('click', function(){
	if(count >= 1){
		count--
	} 
	moveQuestion(count);
})

$("a#updatePoints").bind('click', function(){
	changemapType("points")
	$( "#boundaryMenu" ).popup( "close" )
})

$("a#updateCounties").bind('click', function(){	
	changemapType("counties")
	$("#boundaryMenu" ).popup( "close" )
})

$("a#updateSubCountries").bind('click', function(){
	changemapType("subs")
	$( "#boundaryMenu" ).popup( "close" )
})

$("a#updateCountries").bind('click', function(){
	changemapType("countries")
	$( "#boundaryMenu" ).popup( "close" )
})

$("a#updateWatercolor").bind('click', function(){
	changemapType("watercolor")
	$( "#boundaryMenu" ).popup( "close" )
})


$("#boundaryChange").bind('click', function(){
	$( "#boundaryMenu" ).popup( "open" ).trigger("create")
	$('#boundaryMenu').css({position:'fixed',top:'70px',left:'10px'});
})

$("#legend").bind('click', function(){
	$( "#pnlIdent" ).panel( "open");
	showChart(curdata)
})

$("#globe").bind('click', function(){
	getExtent(window.qid)
})


$("#acc").bind('click', function(){
	$("#accountDiv").empty();
	$(".charts").empty();

	if(logged == 0){
		accUpdate = $('<p>Please login to view account details.</p>')
		accUpdate.appendTo('#accountDiv').trigger( "create" )		
	}
	else{
		accUpdate = $('<h3>Welcome '+window.first+ ' ' + window.last +'</h3>')
		accUpdate.appendTo('#accountDiv').trigger( "create" )	
		$.each(userAcc,function(index, item) {
    		accUpdate = $('<div><p><b>Question:</b> '+userAcc[index].question+'</p><p><b>Hashtag:</b> '+userAcc[index].hashtag+'</p><p><b>Direct link: </b>http://mapossum.org/?qid='+userAcc[index].qid+'</p></div><canvas class="charts" id="chart-'+index+'"></canvas><br>')
			accUpdate.appendTo('#accountDiv').trigger( "create" )
			$.getJSON( "http://services.mapossum.org/getanswers?qid=" + userAcc[index].qid + "&callback=?", function( data ) {    			
    			pieData=[];
    			$.each(data.data,function(i, item) {
    				if(data.data[i].count == null){
    					data.data[i].count = 0;
    				}
	    				chartData = {value:data.data[i].count, color:data.data[i].color, highlight:data.data[i].color, label:data.data[i].answer}
	      				pieData.push(chartData)
      			});  
			id = 'chart-'+index      					
			var ctx = document.getElementById(id).getContext("2d");
			window.myPie = new Chart(ctx).Pie(pieData);
      			     				 
    			
    		});		
		});
	}
});


});