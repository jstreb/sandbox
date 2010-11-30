//If we do not find out BC communication element then simply return
(function(window, document, $, undefined) {
  injectToolKitIntoPage();     
  
  var ID_OF_COMMUNICATION_ELEMENT = 'BCToolKitCommElement'
  
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
    
  var heightOfToolKit = window.localStorage.getItem('BCToolKitHeight') || 200;
  
  var html = "<div id='BCToolKitContainer' style='height:" + heightOfToolKit + "px'></div>";
  $(html).appendTo('body');

  //Check for the components until you find them.
  interval = setInterval(function() {
    $comm = $('#' + ID_OF_COMMUNICATION_ELEMENT);
    if($comm.length > 0  && $comm.html() != "") {
      html = "<div class='header'><div class='button_icon close'> X</div><div class='button_icon minimize'><div class='down_arrow'></div></div><div class='button_icon restore none'><div class='up_arrow'></div></div></div><div class='container leftContainer'><div></div>";
      $('.component', $comm).each(function() {
        var $this = $(this);
        html += "<div class='button' data-component='" + $this.attr('data-bc-component-name') + "'><h3>" + $this.attr('data-bc-component-name') + "</h3></div>";
      
        var style_and_setting_html = "";
        
        //get the styles for this component
        var styles_object = JSON.parse($('.styles', this).html());
        for(var style in styles_object) {
          style_and_setting_html += styleRow(style, styles_object[style].type, $this.attr('data-bc-component-id'), false);     
        }
        
        //parse out the settings for this component
        var settings_object = JSON.parse($('.settings', this).html());
        for(var setting in settings_object) {
          style_and_setting_html += settingRow(setting, setting, $this.attr('data-bc-component-id'));
        }
        
        style_and_settings_html[$this.attr('data-bc-component-name')] = style_and_setting_html;
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
      
      if(window.localStorage.getItem('BCToolKitShow') == 'show') {
        $('#BCToolKitContainer').css('display', 'block');
      }
        
    } else if($('#bc-remove').length > 0) {
      $('#bc-remove').remove();
      $('#BCToolKitContainer').remove();
      clearInterval(interval);
    }
  }, 500);
  
  handleIconDisplay();
  
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
  
  $('.setting_input').live('blur', function() {
    var $this = $(this);
    var msg = {};
    msg[$this.attr('data-component')] = {setting: $this.attr('data-name'), value: $this.val()};
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
    window.localStorage.setItem('BCToolKitHeight', $('#BCToolKitContainer').height());
    $(window).unbind('mousemove', handleTabAdjustment);  
  });
  
  //header icons
  $('.close').live('click', function() {
    window.localStorage.setItem('BCToolKitShow', 'hide');
    $('#BCToolKitContainer').css('display', 'none');
  });
  
  $('.minimize').live('click', function() {
     $('#BCToolKitContainer').height($('.header').height());
     handleIconDisplay(); 
  })
  
  $('.restore').live('click', function() {
     $('#BCToolKitContainer').height(200);
     handleIconDisplay();
  })
  
  /************************************
   ** Helper functions
   *************************************/
  function injectToolKitIntoPage() {
    var head = document.getElementsByTagName('head')[0]; 
    var script= document.createElement('script'); 
    script.type='text/javascript'; 
    script.src='http://ec2-174-129-180-30.compute-1.amazonaws.com/javascripts/toolkit/bc-toolkit.js'; 
    head.appendChild(script);
  } 
  
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
  
  function settingRow(name, type, id) {
    return "<div class='row'><div class='left'>" + name + ": </div><div class='right'><input class='setting_input' type='text' data-name='" 
    + name + "' data-component='" + id + "'></input></div></div>"; 
  }
  
  function handleTabAdjustment(evt) {
    $('#BCToolKitContainer').height(startHeight + (startPos - evt.clientY));
  }
  
  function handleIconDisplay() {
    if($('#BCToolKitContainer').height() > $('.header').height()) {
      $('.restore').addClass('none');
      $('.minimize').removeClass('none');
    } else {
      $('.minimize').addClass('none');
      $('.restore').removeClass('none');
    }
  }

})(window, document, $);