//If we do not find out BC communication element then simply return
(function(window, document, $, undefined) {
  var ID_OF_COMMUNICATION_ELEMENT = 'BCTookKitCommElement'
  
  //The element ID that is used to communicate back and forth with the page.  The BC.js file creates this.
  var $comm = $('#' + ID_OF_COMMUNICATION_ELEMENT);
  
  //Keeps track of the last message sent so that we know whether or not to send another.
  var interval;
  
  //Holds the HTML strings for the styles and settings for a given component
  var style_and_settings_html = [];
  
  //Tracks where the user is moving their mouse when pulling on the tab
  var startPos = 0;
  
  var startHeight;
  
  var drag = false;
  
  if($comm.length < 1) 
    return;  
  
  var html = "<div id='BCToolKitContainer'></div>"
  $(html).appendTo('body');

  
  $('#BCToolKitContainer').html($comm.html()); 
  
  //Check for the components until you find them.
  interval = setInterval(function() {
    html = "<div class='container leftContainer'><div></div>";
    if($comm.html() != "") {
      $('.component', $comm).each(function() {
        var $this = $(this);
        html += "<div class='button' data-component='" + $this.attr('data-bc-component-name') + "'><h3>" + $this.attr('data-bc-component-name') + "</h3></div>";
      
        //get the styles for this component
        var styles_object = JSON.parse($('.styles', this).html());
        var style_html = "";
        for(var style in styles_object) {
          style_html += styleRow(style, styles_object[style].type, $this.attr('data-bc-component-id'), false);     
        }
        style_and_settings_html[$this.attr('data-bc-component-name')] = style_html;
      })
      
      //Grab all of the inline components from the page
      $('[data-bc-configurable-styles]').each(function() {
        var $this = $(this);
        var name = $this.attr('data-bc-component-type');
        
        var type = $this.attr('data-bc-configurable-styles');
        
        html += "<div class='button' data-component='" + name + "'><h3>" + name + "</h3></div>";

        style_and_settings_html[name] = styleRow(name, type, name, true);
                
      });
      
      html += "</div><div class='container rightContainer'>.<h2>Styles and Settings</h2></div>" 
           +  "<div class='tab'><div class='line'></div><div class='line'></div><div class='line'></div></div>"
           +  "<div class='clear'></div>"
      
      
      $('#BCToolKitContainer').html(html); 
      clearInterval(interval);
    }
  }, 500);
  
  /************************************
   **  Event listeners
   *************************************/
  $('.button').live('click', function() {
    var $this = $(this);
    $('.rightContainer').html(style_and_settings_html[$this.attr('data-component')])
  }); 
   
   
  $('.input').live('blur', function() {
    var $this = $(this);
    var msg = {};
    msg[$this.attr('data-component')] = {style: $this.attr('data-style'), value: $this.val(), type: $this.attr('data-type')};
    $comm.html(JSON.stringify(msg));
  });
  
  $('.inline_input').live('blur', function() {
    var $this = $(this);
    $('[data-bc-component-type=' + $this.attr('data-component') + ']').css($this.attr('data-type'), handleImageURL($this.attr('data-type'), $this.val()));
    
  });
  
  $('.tab').live('mousedown', function(evt) {
    startPos = evt.clientY;
    startHeight = $('#BCToolKitContainer').height();
    $(window).bind('mousemove', handleTabAdjustment)
  });
  
  $(window).mouseup(function() {
    $(window).unbind('mousemove', handleTabAdjustment);  
  })

  $('#clear').click(function() {
    window.localStorage.clear();
  });
  
  /************************************
   ** Helper functions
   *************************************/
  function handleImageURL(type, image) {
    if(type === 'background-image' || type === 'backgroundImage') {
      return "url(" + image + ")";
    }
    return image;
  }
  
  function styleRow(name, type, id, inline) {
     return "<div class='row'><div class='left'>" + name + ": </div><div class='right'><input class='" 
            + ((inline) ? 'inline_input' : 'input') + "' type='text' data-type='" + type + "' data-component='" 
            + id + "' data-style='" + name + "'></input></div></div>";  
  }
  
  function handleTabAdjustment(evt) {
    $('#BCToolKitContainer').height(startHeight + (startPos - evt.clientY));
  }

})(window, document, $);