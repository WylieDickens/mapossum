var window={userid:"", loggedUid:"",first:"", last:"", answerNum:"", qid:"", answer:"", curQuestion:"", curAnswers:"", picture:"", explain:""};
var questions={},count = 0, curlatlon, picture, answerCount, loc, curExtent, logged = 0, useCenter = 1, maptype, popup, crtData=[];
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
map.on('click', identify);
popup = L.popup();

getLocation();
getQuestions();

map.on('move', function(e) {
    b = map.getBounds()
    //console.log(b._northEast.lat, b._northEast.lat, b._southWest.lat, b._southWest.lat); // e is an event object (MouseEvent in this case)
});

$( ".leaflet-control-attribution" ).css( "display", "none" );

/* verify user login information -- if successful, user questions are stored for the account page*/
function verify(email, password){
    $.getJSON( "http://services.mapossum.org/verify?email=" + email + "&password=" + password + "&callback=?", function( data ) {
      window.userid = data.userid
      console.log(data)
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
					window.location.href = "http://mapossum.org/?qid="+ window.qid;					
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
					window.location.href = "http://mapossum.org/?qid="+ window.qid;			
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

/* retreive questions out of the database, push inital question tiles, and update title information*/
function getQuestions(){
	queryQuestion = parseInt(getParameterByName("qid"));
	maptype = getParameterByName("maptype");

	
	if (maptype == "") {
		maptype = "watercolor"
	}
	
	if(queryQuestion > 0){		
		$.getJSON( "http://services.mapossum.org/getquestions?count=1000&hasanswers=true&qids="+queryQuestion+"&callback=?", function( data ) {
			questions = data.data;
			   
			
			for(i=0;i<questions.length;i++){			
				if(questions[i].qid == queryQuestion){
					count = i;
					window.curQuestion = questions[i];
					window.curQuestion.qid = queryQuestion;
					window.qid = curQuestion.qid;
					window.explain = curQuestion.explain;
					getAnswers(window.curQuestion.qid);
					layoutQuestion = window.curQuestion.question
					updateTitle(layoutQuestion)
					getExtent(window.curQuestion.qid )
					d = new Date();
					iv = d.getTime(); 
					mapossumLayer = L.tileLayer('http://maps.mapossum.org/{qid}/{maptype}/{z}/{x}/{y}.png?v={v}', {maptype: maptype, qid:queryQuestion, v: iv, opacity: 0.7})
		    		mapossumLayer.addTo(map);
		    		getExtent(window.qid)
				}
			}
		});
	}
	else{		
		$.getJSON( "http://services.mapossum.org/getquestions?&count=1000&hasanswers=true&callback=?", function( data ) {	
			questions = data.data;
	    	window.curQuestion = questions[0];	    	
			window.qid = curQuestion.qid;
			window.explain = curQuestion.explain;			
			getAnswers(window.curQuestion.qid);
			layoutQuestion = window.curQuestion.question
			updateTitle(layoutQuestion)	    
			d = new Date();
			iv = d.getTime(); 
	    	mapossumLayer = L.tileLayer('http://maps.mapossum.org/{qid}/{maptype}/{z}/{x}/{y}.png?v={v}', {maptype: maptype, qid:window.curQuestion.qid, v: iv, opacity: 0.7})
		    mapossumLayer.addTo(map); 
		    getExtent(window.qid)	       
	});	
	}	
}

/* update quesiton title information in the footer */
function updateTitle(layoutQuestion){
	$("#curQuestion").empty();
	questionFooter = $('<center><h3>' + layoutQuestion + '</h3></center>');
	questionFooter.appendTo("#curQuestion")		
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
	
      	locationText = $('<h4>Choose your location below:</h4><p><small><b>"Use current location"</b> uses your current location provided through your browser. <b>"Use map center"</b> uses the centriod of the current map viewport. You may use the <b>"search"</b> option to make navigation to your desired location easier.</small></p>')
      	locationText.appendTo('#setLocation')  		
      	
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

/* moves to the next question in the footer navigation*/
function nextQuestion(questions){	
	if(count < questions.length - 1){
		count++
	}
	window.curQuestion = questions[count]
	window.qid = questions[count].qid
	window.explain = questions[count].explain	
	updateTitle(questions[count].question)	
	changeQuestion(window.qid)
	getExtent(window.qid)	
}

/* moves to the previous question in the footer navigation */
function previousQuestion(questions){
	if(count >= 1){
		count--
	}
	window.curQuestion = questions[count]
	window.qid = questions[count].qid
	window.explain = questions[count].explain	
	updateTitle(questions[count].question)
	changeQuestion(window.qid)
	getExtent(window.qid)
}

/* runs the set up map event on the server which builds all the configuration files */
function setUpMap(quesid){
	$.getJSON( "http://services.mapossum.org/setupmaps?qid=" + quesid + "&callback=?", function( data ) {});
}

/* retreives tiles for a question */
function changeQuestion(qid) {	
	mapossumLayer.options.qid = qid
	mapossumLayer.redraw()	
}

/* changes the maptype (ie. points, counties, states, etc.) */
function changemapType(newMapType) {
	maptype = newMapType
 	mapossumLayer.options.maptype = newMapType
 	mapossumLayer.redraw()
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
	$.getJSON( "http://services.mapossum.org/getextent?qid="+ qid +"&callback=?", function( data ) {      	
 		minExtent = data[0]; 		
 		maxExtent = data[1];
 		bounds = [minExtent, maxExtent];  			
 		fitBounds(bounds)
 	});
}

/* fits a questions extent in the map view */
function fitBounds(bounds){	
	map.fitBounds(bounds);
}

/* reformats lat/long to be used */
function formatLoc(position) {
    var latlon = position.coords.longitude+" "+position.coords.latitude;
    curlatlon = "Point("+ latlon + ")"; 
    loc = 1  
}

/* error switch for geolocation */
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
        	loc = 0
            alert("User denied the request for Geolocation. Please note that the map center will be used as your location for all answers.")
            break;
        case error.POSITION_UNAVAILABLE:
        	loc = 0
           	alert("Location information is unavailable.  Please note that the map center will be used as your location for all answers.")
            break;
        case error.TIMEOUT:
            loc = 0
            alert("The request to get user location timed out.  Please note that the map center will be used as your location for all answers.")
            break;
        case error.UNKNOWN_ERROR:
            loc = 0
            alert("An unknown error occurred.  Please note that the map center will be used as your location for all answers.")
            break;
    }
}

/* gets legend information for a questions */
function getLegend(qid){
	$("#legendPic").empty();	    	
	legendImage = $('<img src="http://services.mapossum.org/legend?qid='+qid+'">')
	legendImage.appendTo('#legendPic').trigger( "create" )
 
}

/* generates charts */
function genChart(data){
	crtData = [];
	$.each(data.data,function(i, item) {
	crtAtr = {value:data.data[i].count, color:data.data[i].color, highlight:data.data[i].color, label:data.data[i].answer}
	crtData.push(crtAtr)
	id = 'idChart'      					
	var ctx = document.getElementById(id).getContext("2d");
	window.myPie = new Chart(ctx).Pie(crtData);
});
}

/* gets identify based on click event, current maptype, and buffer area */
function identify(e){	
	var latlon = e.latlng.lng+" "+e.latlng.lat;
    point = "Point("+ latlon + ")";	
	$.getJSON( "http://services.mapossum.org/identify/"+window.qid+"/"+maptype+"?point="+point+"&buffer=1&callback=?", function( data ) {
		$("#idText").empty();
		$("#cvsDiv").empty();
		$( "#pnlIdent" ).panel( "open"); 
		txtId = $("<center><h2>"+data.data[0].name +"</h2></center>")		
		txtId.appendTo('#idText').trigger( "create" );
		cvs = $("<canvas id='idChart' width='250'></canvas>")		
		cvs.appendTo('#cvsDiv').trigger( "create" );
		genChart(data)	
	});
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
	console.log('sub Clicked')
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
    curlatlon = "Point("+ center.lng + " " + center.lat+")";
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
	nextQuestion(questions)
})

$("#previousQuestion").bind('click', function(){
	previousQuestion(questions)
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
	getLegend(window.qid);
	$( "#legendPopup" ).popup( "open" ).trigger("create")
	$('#legendPopup').css({position:'fixed',top:'90px',left:'10px'});
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
    			testingChart = data
    			pieData=[];
    			$.each(data.data,function(i, item) {
    				if(data.data[i].count == null){
    					data.data[i].count = 0;
    				}
    				chartData = {value:data.data[i].count, color:data.data[i].color, highlight:data.data[i].color, label:data.data[i].answer}
      				pieData.push(chartData)      			
      				if(data.data.length == i+1){
      					id = 'chart-'+index      					
      					var ctx = document.getElementById(id).getContext("2d");
    					window.myPie = new Chart(ctx).Pie(pieData);
      				}      				 
    			});
    		});		
		});
	}
});


});