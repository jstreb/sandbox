(function(window, document, $, undefined){

	$.hasTouchSupport = (function(){
    if("createTouch" in document){ // True on the iPhone
      return true;
    }
    try{
      var event = document.createEvent("TouchEvent"); // Should throw an error if not supported
      return !!event.initTouchEvent; // Check for existance of initialization method
    }catch(error){
      return false;
    }
  }());
	
	var sketchpad;
	var lastPos = {}
	var threshold = 10;
	var brush;
	
	//This will allow it to work in both a browser and a phone
	var events;
  if($.hasTouchSupport){
    events = {
      start: "touchstart",
      move: "touchmove",
      end: "touchend",
      cancel: "touchcancel"
    };
  }else{
    events = {
      start: "mousedown",
      move: "mousemove",
      end: "mouseup",
      cancel: "touchcancel" // unnecessary here
    };
  }
	
	
	$(document).ready(function() {
		$('#notepad').height($(window).height() - 40);
		$("<canvas id='sketchpad' width='" + ($(window).width()) + "' height='" + ($(window).height()) + "' ></canvas>").appendTo($('#notepad'));
		sketchpad = document.getElementById('sketchpad')
		brush = sketchpad.getContext('2d');
		brush.strokeStyle = "#333";
		brush.lineWidth = "10";
		brush.lineCap = "round";
		initializeFacebook();
		registerEventListeners();
		
		//example data
		var data = { game1: { round1: {number: '1', type: 'phrase', text: 'hello phrase', image: 'null'},
													round2: {number: '2', type: 'picture', text: 'null', image: 'base64'},
													round3: {number: '3', type: 'phrase', text: 'hello phrase', image: 'null'},
													round4: {number: '4', type: 'picture', text: 'null', image: 'base64'},
													round5: {number: '5', type: 'phrase', text: 'hello phrase', image: 'null'},
													round6: {number: '6', type: 'picture', text: 'null', image: 'base64'},
													round7: {number: '7', type: 'phrase', text: 'hello phrase', image: 'null'}
							 			  	},
								game2: { round1: {number: '1', type: 'phrase', text: 'hello phrase', image: 'null'},
												 round2: {number: '2', type: 'picture', text: 'null', image: 'base64'},
												 round3: {number: '3', type: 'phrase', text: 'hello phrase', image: 'null'},
												 round4: {number: '4', type: 'picture', text: 'null', image: 'base64'},
												 round5: {number: '5', type: 'phrase', text: 'hello phrase', image: 'null'},
												 round6: {number: '6', type: 'picture', text: 'null', image: 'base64'},
												 round7: {number: '7', type: 'phrase', text: 'hello phrase', image: 'null'}
											 }
							 }
							
		buildCompletedGames(data);
	});
	
	function buildCompletedGames(data) {
		var listHTML = "<ul data-role='list-view'>"
		var page = "";
		var count = 0;
		
		for(var game in data) {
			listHTML += "<li><a href='game_" + count + "' /></li>";
			for(var round in data[game]) {
				//build up HTML for the each round
				if(data[game][round].text && data[game][round].text != 'null') {
					page += "<div class='round_container'><h4>" + data[game][round].text + "</h4></div>";
				} else {
					page += "<div class='round_container'><img src='" + data[game][round].image + "'/></div>";
				}
			}
			count++;
		}
		listHTML += "</ul>"
		$(listHTML).appendTo('#completed');
	}
	
	function initializeFacebook() {
			FB.init({appId: '164723710231881', status: true, cookie: true, xfbml: false}); 
			FB.getLoginStatus(function(response) {
				if(response.session) {
					//hide the login page
					$('#signin_button').css('display', 'none');
					
					//Make sure that the user id in the local storage matches this ID  (this is the ID used to request DATA from server);
					window.localStorage.setItem('user_id', response.session.uid);
				}
			}); 
	}
	
	function registerEventListeners() {
		$('#sketchpad').live(events.start, function(event) {
			if(event.originalEvent.touches && event.originalEvent.touches.length){
				event = event.originalEvent.touches[0];
		  }
			
			lastPos.x = event.pageX;
			lastPos.y = event.pageY;
			brush.moveTo(lastPos.x, (lastPos.y - 40));
			$('#sketchpad').bind(events.move, handleMouseMove);
			$(document).bind(events.end, function(event) {
				//remove our mousedown event listener;
				$('#sketchpad').unbind(events.move, handleMouseMove);
			});
		});
		
		//temp 
		$('h1').click(function() {
			window.location = document.getElementById('sketchpad').toDataURL('image/png');
		});
		
		$('.save').click(function() {
			var img = document.getElementById('sketchpad').toDataURL('image/png');
			location.href = img;
			//send img to server
		})
		
		$('.clear').click(function() {
			clearCanvas();
		});
		
		$('#login').click(function() {
			FB.login();
		});
		
		FB.Event.subscribe('auth.sessionChange', function(response) {
	    if (response.session) {
	      console.log("Logged into FB")
	    } else {
	      console.log("no dice");
	    }
	  });
	}
	
	function handleMouseMove(event) {
		event.preventDefault();
    event.stopPropagation();
		if(event.originalEvent.touches && event.originalEvent.touches.length){
			event = event.originalEvent.touches[0];
	  }
	
		if((Math.abs(lastPos.x - event.pageX) > threshold) || (Math.abs(lastPos.y - event.pageY) > threshold)) {
			brush.lineTo(event.pageX, (event.pageY - 40));
			brush.stroke(); 
			lastPos.x = event.pageX
			lastPos.y = event.pageY;
		}
	}
	
	function clearCanvas() {
		$('#notepad').html("<canvas id='sketchpad' width='" + ($(window).width()) + "' height='" + ($(window).height()) + "' ></canvas>");
		sketchpad = document.getElementById('sketchpad')
		brush = sketchpad.getContext('2d');
		brush.strokeStyle = "#333";
		brush.lineWidth = "10";
		brush.lineCap = "round";
		//brush.clearRect(0, 0, $(sketchpad).width(), $(sketchpad).height());
	}
	
})(window, document, $)