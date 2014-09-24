var mpapp={userid:"", loggedUid:"",first:"", last:"", answerNum:"", qid:"", answer:"", curQuestion:"", curAnswers:"", picture:"", explain:""};
var questions={},count = 0, curlatlon, picture, answerCount, loc, curExtent, logged = 0, useCenter = 1, resLocation = 0,maptype, popup, crtData=[], curdata;
var userAcc=[];
var mapossumLayer;
var testingChart;
var legendsize = 150;


$( window ).load(function() {
	if (window.top!=window.self) {
		$("#menu").hide();
		$("#answerBar").hide();
		$("#loginIcon").hide();
		$("#welcome").hide();
		$("#globe").hide();
	}

$( "#boundaryMenu" ).popup({ overlayTheme: "b" });
$( "#legendPopup" ).popup({ overlayTheme: "b" });
$( "#descriptionPopup" ).popup({ overlayTheme: "b"});
$( "#welcome" ).popup({ overlayTheme: "a" });
$( "#welcome" ).popup({ theme: "b" });
$( "#welcome" ).popup( "option", "history", false );
$('#showWelcome').slider()
$("#pnlIdent").panel({});
$("#pnlShare").panel({});
	
var map = L.map('map', {trackResize:true, maxZoom:16});

map.attributionControl.addAttribution("&copy Mapossum");

var bwlayer = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	minZoom: 0,
	maxZoom: 16
});

map.addLayer(bwlayer);

getLocation();
getQuestions();



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

map.on('move', function(e) {
    updateHash();
});

$( ".leaflet-control-attribution" ).css( "display", "none" );

/* verify user login information -- if successful, user questions are stored for the account page*/
function verify(email, password){
    $.getJSON( "http://services.mapossum.org/verify?email=" + email + "&password=" + password + "&callback=?", function( data ) {
      mpapp.userid = data.userid;
      if(data.userid != -1){
        localStorage.setItem("semail", email)
        localStorage.setItem("spassword", password)
      	$('#loginIcon').css( "background-color", "green" );     	
      	logged = 1
      	mpapp.first = data.first
      	mpapp.last = data.last
      	mpapp.loggedUid = data.userid
      	$.getJSON( "http://services.mapossum.org/getquestions?users=" + mpapp.loggedUid + "&minutes=0" + "&callback=?", function( userQuestions ) {
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
    $.getJSON( "http://services.mapossum.org/addquestion?userid=" + mpapp.userid + "&question=" + question + "&hashtag=" + hashtag + "&explain="+description+"&callback=?", function( data ) {
  
      mpapp.qid = data.qid

      if(picture == "yes"){ 

	      var generateTextBoxes = function( qty, container ) {
	        if (container) {
	            for (var i = 1; i <= mpapp.answerNum; i++ ) {
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
	            for (var i = 1; i <= mpapp.answerNum; i++ ) {
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
		for(var i = 1; i <= mpapp.answerNum; i++){	   		
	   		ansDiv = '#Answer-'+i;
	   		answerDiv = String(ansDiv)
	   		mpapp.answer = $(answerDiv).val()
	   		picDiv = '#Picture-'+i;
	   		pictureDiv = String(picDiv)
	   		mpapp.picture = $(pictureDiv).val()
	   		$.getJSON( "http://services.mapossum.org/addanswer?qid=" + mpapp.qid + "&answer=" + mpapp.answer +"&link=" + mpapp.picture + "&callback=?", function( data ) {
	          	if(answerCount == mpapp.answerNum){
	          		setUpMap(mpapp.qid);			
				}      
				answerCount++
	    	});
		}	
	}
	else{		
		for(var i = 1; i <= mpapp.answerNum; i++){	   		
	   		ansDiv = '#Answer-'+i;
	   		answerDiv = String(ansDiv)
	   		mpapp.answer = $(answerDiv).val()	
	   		$.getJSON( "http://services.mapossum.org/addanswer?qid=" + mpapp.qid + "&answer=" + mpapp.answer +"&callback=?", function( data ) {
	   			if(answerCount == mpapp.answerNum){								
					setUpMap(mpapp.qid);				
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
	try {
		bh = []
		c = map.getCenter();
		bh.push(questions[count].qid);
		bh.push(maptype);
		bh.push(map.getZoom())
		bh.push(c.lat);
		bh.push(c.lng);
		window.location.hash = bh.join("|")
	} catch(e) {
		console.log('hash not set');
	}
}

/* retreive questions out of the database, push inital question tiles, and update title information*/
function getQuestions(){
	queryQuestion = parseInt(getParameterByName("qid"));
	maptype = getParameterByName("maptype");
	
	if (maptype == "") {
		maptype = "subs"
	}
	
	hashy = (window.location.hash);
	hashy = hashy.replace("#","");	
	moveit = true;

	if (hashy != "") {
		hashvals = hashy.split("|");
		
		var bounds;
		
		if (hashvals.length > 2) {
			map.setView([hashvals[3],hashvals[4]],(hashvals[2]));
			moveit = false;			
		}
		
		if (hashvals.length > 1) {
			maptype = hashvals[1];
		}
		
		if (hashvals.length > 0) {
			queryQuestion = hashvals[0];
		}
	}
	
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
	    		moveQuestion(count, moveit)
	    		if(localStorage.welDiv != "no" && window.top==window.self){					
	    			$( "#welcome" ).popup( "open" );
	    		}	    			    				    		
	});		
		
}

/* update quesiton title information in the footer */
function updateTitle(layoutQuestion){	
	$("#curQuestion").html( '<center>' + layoutQuestion + '</center>' );
	$("#curQuestion").css('font-size', "30px");
	$("#curQuestion").autoSizr();	
}

/* get possible answers for a question*/
function getAnswers(id){
	$.getJSON( "http://services.mapossum.org/getanswers?qid=" + id + "&callback=?", function( data ) {      	
      	mpapp.curAnswers = data.data;      
    });
}

/* build the responses panel which allows users to answer questions */
function buildReponses(qid){	
	$("#question").empty();
	$("#answerList").empty();
	$("#setLocation").empty();
	$("#descriptionTxt").empty()
	
	$( "#answerLoading" ).css( "display", "" );

	$.getJSON( "http://services.mapossum.org/getanswers?qid=" + qid + "&callback=?", function( data ) {
	  		
      	
      	for(i=0; i < data.data.length; i++){      		
      		if(data.data[i].link.length > 1 && i==0){      			
      			answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><legend>'+ mpapp.curQuestion.question +'&nbsp<a href="#descriptionPopup" data-theme="b" data-role="button" data-inline="true" data-mini="true" data-icon="info" data-transition="pop" data-rel="popup">Description</a></legend><input type="radio" name="radioAid" value="' + data.data[i].answerid + '" id="Response-' + i + '"><label for="Response-' + i + '">'+data.data[i].answer+'<br><img src="'+data.data[i].link + '"style="width:70%;"></label></fieldset>');
	      		desc = $('<p class="black">'+mpapp.explain+'</p>')
	      		answerBtn.appendTo('#answerList').trigger( "create" );
	      		desc.appendTo('#descriptionTxt').trigger( "create" );
	      	}
      		else if(data.data[i].link.length > 1){
      			answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><input type="radio" name="radioAid" value="' + data.data[i].answerid + '" id="Response-' + i + '"><label for="Response-' + i + '">'+data.data[i].answer+'<br><img src="'+data.data[i].link + '"style="width:70%;"></label></fieldset>');
	      		answerBtn.appendTo('#answerList').trigger( "create" );
      		}
      		else{
      			if(data.data[i].link.length == 0 && i==0){  		       		   		
		      		answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><legend>'+ mpapp.curQuestion.question +'&nbsp<a href="#descriptionPopup" data-theme="b" data-role="button" data-inline="true" data-mini="true" data-icon="info" data-transition="pop" data-rel="popup">Description</a></legend><input type="radio" name="radioAid" value="' + data.data[i].answerid + '"id="Response-' + i + '"/><label for="Response-' + i + '">'+data.data[i].answer+'</label></fieldset>');
		      		desc = $('<p class="black">'+mpapp.explain+'</p>')
		      		answerBtn.appendTo('#answerList').trigger( "create" );
		      		desc.appendTo('#descriptionTxt').trigger( "create" );
	      		}
	      		else{
	      			answerBtn = $('<fieldset data-role="controlgroup" data-mini="true"><input type="radio" name="radioAid" value="' + data.data[i].answerid + '"id="Response-' + i + '"/><label for="Response-' + i + '">'+data.data[i].answer+'</label></fieldset>');
	      			answerBtn.appendTo('#answerList').trigger( "create" );
	      		}
      		}
      	}
		$( "#answerLoading" ).css( "display", "none" );
    });
	$( "#responses" ).panel( "open");  
}

/* answer a question */
function addResponse(qid, answerid, loc){
	$.getJSON( "http://services.mapossum.org/addresponse?qid=" + qid + "&answerid=" + answerid + "&location=" + loc + "&callback=?", function( data ) {  
	  d = new Date();
	  v = d.getTime();    	
      mapossumLayer.options.v = v;
	  mapossumLayer.redraw();
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

	mpapp.curQuestion = questions[count]
	mpapp.qid = questions[count].qid
	mpapp.explain = questions[count].explain	
	updateTitle(questions[count].question)
	changeQuestion(mpapp.qid)

	if (zoom) {
		getExtent(mpapp.qid)
	} 
	
	$.getJSON( "http://services.mapossum.org/getanswers?qid=" + mpapp.qid + "&callback=?", function( data ) {
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
	mapossumLayer.redraw();
	updateHash();
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
    resLocation++
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
    if (resLocation > 1){
    	$("#responses").panel("open");
	}
}

function setcurlatlon(xlng,ylat) {

	$( "#locationLoading" ).css( "display", "" );
	$( "#locationLoading2" ).css( "display", "" );
	$("#curLocationText").html( "");
	$("#curLocationText2").html( "");
	 curlatlon = "Point("+ xlng + " " + ylat +")";	 
	 $.getJSON( "http://nominatim.openstreetmap.org/reverse?format=json&lat=" + ylat + "&lon=" + xlng + "&zoom=18&addressdetails=1", function( data ) { 	 	    
	 		$("#curLocationText").html( "<small>Lat: " + ylat.toFixed(3) + " " + "Lon: " + xlng.toFixed(3) + "<br>" + "<br>Which is near:<br>" + data.display_name  + "</small>");
	 		$("#curLocationText2").html( "<small>Lat: " + ylat.toFixed(3) + " " + "Lon: " + xlng.toFixed(3) + "<br>" + "<br>Which is near:<br>" + data.display_name  + "</small>");
			$( "#locationLoading" ).css( "display", "none" );
			$( "#locationLoading2" ).css( "display", "none" );
	 })
}

/* error switch for geolocation */
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
        	loc = 0
        	if(resLocation > 1){
            alert("You must enable your location settings to use your current location.")
        	}
            break;
        case error.POSITION_UNAVAILABLE:
        	loc = 0
        	if(resLocation > 1){
            alert("Location information is unavailable.")
        	}           	
            break;
        case error.TIMEOUT:
            loc = 0
            if(resLocation > 1){
            alert("The request to get user location timed out.")
        	}
            break;
        case error.UNKNOWN_ERROR:
            loc = 0
            if(resLocation > 1){
            alert("An unknown error occurred.")
        	}
            break;
    }
}

/* gets legend information for a questions */
function getLegend(qid){
	$("#legendPic").empty();
	d = new Date();
	iv = d.getTime(); 	    	
	legendImage = $('<img src="http://services.mapossum.org/legend/'+qid+'?v='+ iv + '&opacity=0&color=white" width="230">')
	legendImage.appendTo('#legendPic').trigger( "create" )
	
	$("#maplegend").empty();	    	
	legendImage = $('<img src="http://services.mapossum.org/legend/' +qid+'?v='+ iv + '&opacity=0&color=white" width="' + legendsize + '">')
	legendImage.appendTo('#maplegend').trigger( "create" )
 
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
	mpapp.myPie = new Chart(ctx).Pie(crtData);
}

/* gets identify based on click event, current maptype, and buffer area */
function identify(e){	
	var latlon = e.latlng.lng+" "+e.latlng.lat;
    point = "Point("+ latlon + ")";	
	$.getJSON( "http://services.mapossum.org/identify/"+mpapp.qid+"/"+maptype+"?point="+point+"&buffer=1&callback=?", function( data ) {
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

function updateUrl(){
	$('#eLink').html("<iframe src='index.html?qid="+mpapp.qid+"' style='width:"+$('#sldWidth').val()+"px;height:"+$('#sldHeight').val()+"px' frameborder='none'></iframe>")
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
	mpapp.answerNum = answerNum
	hash = $("#hashFld").val()
	hash1 = hash.replace("#", "");
	hashtag = hash1.trim();	

	if(mpapp.userid == null){		
		alert("Please login to create a question")
		$( "#login" ).panel( "open");  		
	}
	else{
		addQuestion(mpapp.userid, question, hashtag, description)
	}
});

$("#subAnswer").bind('click', function(e) {	
	addAnswer(mpapp.qid);
});

$("#answerQuestion").bind('click', function(e) {	 
	buildReponses(mpapp.curQuestion.qid);
});

$("#isp").bind('click', function(){	
	getLocation();
});

$("#mapcenter").bind('click', function(){
	console.log('center')
	center = map.getCenter(); 
	setcurlatlon(center.lng, center.lat);
	$("#responses").panel("open");
});

$("#subResponse").bind('click', function() {	
	$("input[name=radioAid]:checked").each(function() {
        aid = $(this).val();        
    });
    if (curlatlon == undefined) {
	    alert("Please set your location below.")
	    $( "#responses" ).panel( "open");
    } else {
        addResponse(mpapp.curQuestion.qid, aid, curlatlon)
    }
});

$("#subLocation").click(function(){	
	locText = $("#searchText").val()	
	searchLocation(locText)	
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

$("#closeWelcome").bind('click', function(){
	welVal = $("#showWelcome").val()
	console.log(welVal)
	

if (welVal == "no") {
	localStorage.setItem("welDiv", welVal)
	console.log(localStorage.welDiv)
		
}
})

$("#globe").bind('click', function(){
	getExtent(mpapp.qid)
})

$( ".slideout" ).panel({ swipeClose: false });


$("#share").bind('click', function(){
	$( "#pnlShare" ).panel( "open");
	//$("#maplegend").hide();
	urlout = document.URL //.replace("#","%23")
	$('#dLink').html(urlout);
	$("#facbookshare").empty();
	
	$('#facbookshare').share({
        networks: ['facebook','twitter','stumbleupon','googleplus','tumblr','digg'],
        theme: 'square',
		urlToShare: urlout
    });
			
	updateUrl()

})

/*$( "#share" ).on( "panelclose", function( event, ui ) {
	$("#maplegend").show();
	} 
);*/


$( "#sldHeight, #sldWidth" ).bind( "change", function(event, ui) {
	updateUrl()
});

$("#acc").bind('click', function(){
	$("#accountDiv").empty();
	$(".charts").empty();

	if(logged == 0){
		accUpdate = $('<p>Please login to view account details.</p>')
		accUpdate.appendTo('#accountDiv').trigger( "create" )		
	}
	else{
		accUpdate = $('<h3>Welcome '+mpapp.first+ ' ' + mpapp.last +'</h3>')
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
			mpapp.myPie = new Chart(ctx).Pie(pieData);
      			     				 
    			
    		});		
		});
	}
});

$(document).bind("orientationchange", function(e){
      $(window).trigger("throttledresize")
});

function checkWidth() {
        var windowsize = $(window).width();
		$("#curQuestion").css('font-size', "30px");
		$("#curQuestion").autoSizr();
        if (windowsize > 800) {
            // if GT assum legend can be displayed
			legendsize = 150;
			$( "#maplegend" ).css( "display", "" );
			getLegend(mpapp.qid);
        } else if (windowsize > 500) {
			$( "#maplegend" ).css( "display", "" );
			legendsize = windowsize / 8
			getLegend(mpapp.qid);
		}else {
			$( "#maplegend" ).css( "display", "none" );
		}
		
    //All pages at least 100% of viewport height
    var viewPortHeight = $(window).height();
    var headerHeight = $('div[data-role="header"]').height();
    var footerHeight = $('div[data-role="footer"]').height();
    var contentHeight = viewPortHeight - headerHeight - footerHeight;

    // Set all pages with class="page-content" to be at least contentHeight
    $('div[data-role="content"]').css({'height': contentHeight + 'px'});	
	// $('#map').css({'height': contentHeight + 'px'});	
	
		
    }
	
$(window).resize(checkWidth);

$.fn.autoSizr = function () {
  var el, elements, _i, _len, _results;

  elements = $(this);
  if (elements.length < 0) {
    return;
  }
  _results = [];
  for (_i = 0, _len = elements.length; _i < _len; _i++) {
    el = elements[_i];
    _results.push((function(el) {
      var resizeText, _results1;
      resizeText = function() {
        var elNewFontSize;
        elNewFontSize = (parseInt($(el).css('font-size').slice(0, -2)) - 1) + 'px';
        return $(el).css('font-size', elNewFontSize);
      };
      _results1 = [];
      while (el.scrollHeight > el.offsetHeight) {
        _results1.push(resizeText());
      }
      return _results1;
    })(el));
  }
  return $(this); 
};

checkWidth()

$.mobile.resetActivePageHeight();

$( window ).on( "orientationchange", function( event ) {
    if(document.documentElement.scrollHeight<window.outerHeight/window.devicePixelRatio)
    document.documentElement.style.height=(window.outerHeight/window.devicePixelRatio)+'px';
  setTimeout(window.scrollTo(1,1),0);
 
});



});

