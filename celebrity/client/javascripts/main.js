(function(window, document, $, undefined){
	
	$(document).ready(function() {
		$('[data-role="page"]').css({height: $(window).height()});
		registerEventListeners()
	});
	
	function registerEventListeners() {
		$('#start').click(function() {
			var number_of_names = parseInt($('#number_of_names').val());
			var seconds = parseInt($('#seconds').val());
			
			if(number_of_names == NaN || seconds == NaN)) {
				if (number_of_names == NaN) {
					//highlight input field
				} else if (seconds == NaN) {
					//highlight input field
				}
				return;
			}		
			
			$.mobile.changePage("#game")
		});
	}
})(window, document, $)