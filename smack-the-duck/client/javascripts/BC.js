
(function(window, document, $, undefined){

  /** Brightcove constants */
  $.SERVER_URL = "%SERVER_URL%";
  $.appID = null;
  $.viewID = null;
  $.stubData = [];
  $.icons = [];
  $.HEIGHT_JQM_HEADER = 40;
  $.components = {};
  $.db = null;

  /** Should look into how we may want to do this with jQuery. */
  $.extendClass = function(subClass, superClass) {
    var F = function() {};
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;

    subClass.superclass = superClass.prototype;
    if(superClass.prototype.constructor == Object.prototype.constructor) {
      superClass.prototype.constructor = superClass;
    }
  }
	
	$.width = function() {
		return ($('#BCDeviceWrapper').length > 0) ? $('#BCDeviceWrapper').width() : $(window).width(); 
	}
	
	$.height = function() {
		return ($('#BCDeviceWrapper').length > 0) ? $('#BCDeviceWrapper').height() : $(window).height(); 
	}
	
  $.BCcache = function(key, value) {
    try {
      if(value){
				try {
					window.localStorage.setItem(key, value);
					updateDB(key);
				} catch(e) {
					console.warn("ERROR: we are assuming that our local storage is full and will now remove half of the existing cache:" + e.toString());
					pruneCache();
				}        
      } else {
				try {
					updateDB(key);
				} catch (e) {
					console.warn('ERROR: we were unable to updated the DB with this cache hit');
				}
        return window.localStorage.getItem(key);
      }
    } catch(e) {
      console.warn("Error storing and/or receiving values in local storage: " + e.toString());
    }	
  }

  $.getData = function(component) {
    if(component.id && $.cache(component.id + '_data')) {
      return JSON.parse($.cache(component.id + '_data'));
    } else if($.stubData[component.name]) {
      return $.stubData[component.name];
    }
    
    return {};
  }

  $.getStyles = function(component) {
    /** If we have a component id then we are in app mode, rather then template mode and thus we can grab data */
    if(typeof component == 'string') {
      return JSON.parse($.cache(component + "_styles"));
    } else {
      if(component.id  && $.cache(component.id + "_styles")) {
        return JSON.parse($.cache(component.id + "_styles"));
      }
    }

    /**If we have no styles then return the components defaults.  Can happen on first load of app*/
    return component.getStyleConfig();
  }

  /** Place holder for when settings are implemented */
  $.getSettings = function(component) {
    if(typeof component == 'string') {
      return JSON.parse($.cache(component + '_setting'));
    } else {
      if(component.id && $.cache(component.id + '_setting')) {
        return JSON.parse($.cache(component.id + '_setting'));
      }
    }

    return component.getSettingConfig();
  }

  $.setStyle = function(componentID, attribute, newValue) {
    try {
      var newStyles = $.getStyles(componentID.toString());
      newStyles[attribute].value = newValue;
      $.cache(componentID + "_styles", JSON.stringify(newStyles));
    } catch(e) {
      console.warn(e.toString());
    }

  }

  $.setSetting = function(componentID, attribute, newValue) {
    try {
      var newSettings = $.getSettings(componentID.toString());
      newSettings[attribute].value = newValue;
      $.cache(componentID + "_setting", JSON.stringify(newSettings));
    } catch(e) {
      console.warn(e.toString());
    }
  }

  $.fetchConfigsFromServer = function(json) {
    var url = (json != undefined && json) ?  ($.SERVER_URL + "/apps/" + $.appID + "/views/" + $.viewID + ".json") : ($.SERVER_URL + "/apps/" + $.appID + "/views/" + $.viewID + ".json?callback=?") ;
    $.getJSON(url, function(configs) {
      /** Data comes back as collection components, where the components store the data, styles and settings for that component */
      try {
        for(var i = 0; i < configs.components.length; i++) {
          storeStyles(configs.components[i]);
          storeData(configs.components[i]);
          storeSettings(configs.components[i]);

          //inline components do not define buildHTML();
          if($.components[configs.components[i].id] )
            $.components[configs.components[i].id].buildHTML();
          
        }
      } catch(e) {
        console.warn("ERROR: problem retrieving configs form server " + e.toString());
      }
    });
  }

  $.fetchTheme = function(json) {
    var url = (json != undefined && json) ? $.SERVER_URL + "/apps/" + $.appID + "/theme.json" : $.SERVER_URL + "/apps/" + $.appID + "/theme.json?callback=?";
    $.getJSON(url, function(theme){
      if(theme) {
        $.cache('theme' + $.appID, theme.uri);
        $('head').append("<link rel='stylesheet' href='" + theme.uri + "' type='text/css' />");
      } else {
        console.warn('No theme was returned by server');
      }

    });
  }

  $.setTheme = function(uri) {
    if(uri) {
      $.cache('theme' + $.appID, uri);
      $('head').append("<link rel='stylesheet' href='" + uri + "' type='text/css' />");
    } else if($.cache('theme' + $.appID)) {
      $('head').append("<link rel='stylesheet' href='" + $.cache('theme'+$.appID) + "' type='text/css' />");
    }

  }

  $.getNum = function(number) {
    if(typeof(number) === 'number')
      return number;

    var ret = (number.indexOf("px") > -1) ? parseInt(number.substring(0, number.indexOf("px"))) : parseInt(number);
    return (ret) ? ret : 0;
  }

  $.hexToRGB = function(hex) {
    if(!hex)
      return;

    if(hex.indexOf('#') > -1)
      hex = hex.replace('#', '0x');

    try {
      var red = (hex & 0xff0000) >> 16;
		  var green = (hex & 0x00ff00) >> 8;
		  var blue = hex & 0x0000ff;

      return {red: red, green: green, blue: blue}
    } catch (e) {
      console.warn("Bad value passed into hexToRGB of: " + hex + ".  Threw error of: " + e.toString());
    }
  }

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

  $.getMatrixFromNode = function(node) {
		return new WebKitCSSMatrix(window.getComputedStyle(node).webkitTransform);
  }

  $.setURL = function(url) {
    location.href = url;
  }

  $.numberOfElements = function(obj) {
    var count = 0;
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop))
        ++count;
    }

    return count;
  }

  $.setWindowHeight = function() {
    var height = $.height - $.HEIGHT_JQM_HEADER + "px"
    $("[data-role='content']").css({minHeight: height});
  }

  // this sucks.  should have the native JS api adapter define this function
  // and check for typeof "isNative" === undefined
  $.isNative = function() {
    if(location.href.indexOf('http') === -1)
      return true;

    return false;
  }

  $.isPreview = function() {
    return (window.location != window.parent.location) ? true : false;
  }

  $.unescapeHTML = function(htmlString) {
    var div = $('<div>').appendTo(document.body).html(htmlString).remove();
    return div.text();
  }

   /**
    *
    * @param index - The index of the page that we would like to go to.
    */
  $.navigateTo = function(index) {
    if($.isNative()) {
      navigateToIndex(index);
    } else {
      $(window).trigger('bc:navigateTo', [index]);
    }
  }

  // mit license. paul irish. 2010.
  // webkit fix from Oren Solomianik. thx!
  $.fn.imagesLoaded = function(callback){
    var elems = this.filter('img'),
        len   = elems.length;

    elems.bind('load',function(){
      if (--len <= 0){ callback.call(elems,this); }
    }).each(function(){
      // cached images don't fire load sometimes, so we reset src.
      if (this.complete || this.complete === undefined){
        var src = this.src;
        // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
        // data uri bypasses webkit log warning (thx doug jones)
        this.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        this.src = src;
      }
    });

    return this;
  }

  $.hoursAgoInWords = function(pastDate){
    var now = new Date()
      , hoursAgo = Math.floor(((now.getTime() - pastDate.getTime()) / 3600000));
    if(hoursAgo == 0) {
      var minutesAgo= Math.ceil((now.getTime() - pastDate.getTime()) / 60000);
      return minutesAgo + ' minute' + (minutesAgo > 1 ? 's' : '') + ' ago';
    } else if(hoursAgo < 24) {
      return hoursAgo + ' hour' + (hoursAgo > 1 ? 's' : '') + ' ago';
    } else if(hoursAgo < 168) {
      var daysAgo = Math.floor(hoursAgo / 24);
      return daysAgo + ' day' + (daysAgo > 1 ? 's' : '') + ' ago';
    } else if(hoursAgo < 744) {
      var weeksAgo = Math.floor(hoursAgo / 168);
      return  weeksAgo + ' week' + (weeksAgo > 1 ? 's' : '') + ' ago';
    } else {
      var monthsAgo = Math.floor(hoursAgo / 744);
      return monthsAgo + ' month' + (monthsAgo > 1 ? 's' : '') + ' ago';
    }
  }

  $.stripTags = function(string) {
    return string.replace(/<\/?[^>]+>/gi, '');
  };

  /***************************************************************************************
   * Private helper functions
   ***************************************************************************************/

  /** For elements that are not part of the DOM we can set their inline CSS immediately */
  function setElementalStyles() {
    $('*[data-bc-configurable-styles]').each(function() {
      if($.cache($(this).attr('data-bc-component-id') + "_styles")) {
        var styles = JSON.parse($.cache($(this).attr('data-bc-component-id') + "_styles"));
        for(var i in styles) {
          if(styles[i].value && styles[i].value.toString() != "") {
            if (i === 'src')
              $(this).attr(i, styles[i].value.toString())
            else
              $(this).css(i, styles[i].value.toString());
          }
        }
      }
    });
  }

  /**
   * Stores the data for this component if it is different then what is in the cache.
   * @param component
   */
  function storeData(component) {
    if(component.get_data && $.cache(component.id + "_data") != JSON.stringify(component.get_data)) {
      $.cache(component.id + "_data", JSON.stringify(component.get_data));
      $.components[component.id].resetData();
    }
  }

  function storeSettings(component) {
    if(component.settings) {
      var settings = {};

      for(var i in component.settings) {
        settings[component.settings[i].name] = {input_type: component.settings[i].input_type, value: component.settings[i].value};
      }
      $.cache(component.id + "_setting", JSON.stringify(settings));
    }
  }

  function storeStyles(component) {
    for(var i in component) {
      var styles = {};
      for(var j in component.configurations) {
        styles[component.configurations[j].name] = {type: component.configurations[j].configuration_type, value: component.configurations[j].value};
      }
      $.cache(component.id + "_styles", JSON.stringify(styles));
    }
  }

  function setGlobalIDValues() {
    $.viewID = $('body').attr('data-bc-view-id');
    $.appID = $('body').attr('data-bc-app-id');
		BCMobileDB();
  }

	function BCMobileDB() {
		if(typeof(window.openDatabase) != 'function')
			return null;
		
		$.db = window.openDatabase($.appID, "1.0", "BC_" + $.appID, 1024*1024*4);	
		createTables();
	}
	
	function createTables() {
		if(!$.db) 
			return;
			
		$.db.transaction(  
			function (transaction) {  
	     	transaction.executeSql('CREATE TABLE IF NOT EXISTS components(id INTEGER NOT NULL PRIMARY KEY, component_id TEXT NOT NULL, modified TIMESTAMP NOT NULL);');		      
			}  
	  );  
	}
	
	function pruneCache() {
		//remove have the cache in a worker thread.
		if($.db != null) {
			var ids_to_remove = "";
			$.db.transaction(  
				function (transaction) {  
	      	transaction.executeSql("SELECT component_id from components ORDER BY modified;", [], function(tx, results) {
						//TODO - do we want a more robust decision maker for, perhaps sorting by payload?
						for (var i = 0; i < (results.rows.length/2); i++) {
							window.localStorage.removeItem(results.rows.item(i).component_id);
							ids_to_remove += "component_id = '" + results.rows.item(i).component_id + "' OR ";
						}
						
						//Once we have cleaned up the local storage we should now clean up the DB.
						ids_to_remove = ids_to_remove.substring(0,(ids_to_remove.length - 4));
				 		$.db.transaction(
				    	function (transaction) { 
								transaction.executeSql("DELETE FROM components WHERE " + ids_to_remove + ";", []);		      
							}
						);
					});		      
				}  
	    );
		}else {
			//If there is no DB then we do not have a more intelligent way to prune other then to remove 
			window.localStorage.clear();
		}
	}
	
	function updateDB(component_id) {
		//put this in a worker thread
		if($.db == null)
			return;
		
		$.db.transaction(  
			function (transaction) {
				transaction.executeSql("SELECT component_id FROM components WHERE component_id ='" + component_id +"';", [], function(tx, results) {
					if(results.rows.length === 0) {
						$.db.transaction(  
							function (transaction) {  
				      	transaction.executeSql("INSERT INTO components (component_id, modified) VALUES ('" + component_id + "', '" + Date() + "');");		      
							}  
				    );
					} else {
						$.db.transaction(
				    	function (transaction) { 
								transaction.executeSql("UPDATE components SET modified = '" + Date() + "' WHERE component_id ='" + component_id + "';");		      
							}
						);
						
					}
				})		      	      
			}  
    );
	}

  $(document).ready(function() {
    $.setTheme();
    $.setWindowHeight();
    setGlobalIDValues();
    setElementalStyles();
    if($.viewID && $.appID) {
      $.fetchTheme();
      $.fetchConfigsFromServer();
    }

    //If we are in preview mode then set the overflow of the body
    if($.isPreview()) {
      $('body').css({overflow: 'hidden'});
    }
  })
})(window, document, $);

  /*
   * Resizes the width of the element based off the fixed widths of the two sibling elements.
   */
(function($){

    $.fn.extend({

        //pass the options variable to the function
        bc_resize_width: function(options) {

            //Set the default values, use comma to separate the settings, example:
            var defaults = {

            }

            var options =  $.extend(defaults, options);

            return this.each(function() {
                var o = options;

                var elem = $(this);
                var parent = elem.parent().innerWidth() - $.getNum(elem.parent().css('margin-left')) - $.getNum(elem.parent().css('margin-right'));
                var left = $(elem.siblings().get(0)).width();
                var right = (elem.siblings().length > 1) ? $(elem.siblings().get(1)).width() : 0;

                elem.width(parent - left - right + "px");
            });
        }
    });

 })(jQuery);


/**
 * Loads in icon images and replaces them with the appropriate styled icon by drawing them as a canvas object
 * and manipulating the pixel appropriately.
 */

(function($, undefined) {
  $.fn.bc_setIcons = function(options) {

    return this.each(function() {

      var defaults = {
        'inactive_top': '#ABABAB',
        'inactive_bottom': '#545454',
        'selected_top': '#85BAEE',
        'selected_bottom': '#2E91E5'
      }

      if(options) {
        $.extend(defaults, options);
      }

      var myCanvas = document.createElement("canvas");
      var myCanvasContext = myCanvas.getContext("2d");

      var imgWidth = this.width;
      var imgHeight = this.height;

      myCanvas.width = imgWidth;
      myCanvas.height = imgHeight;

      try {
        myCanvasContext.drawImage(this,0,0);
      } catch(e) {
        /*
         * If we get an error here it is most likely caused by the image not being loaded yet.  The correct use of this
         * is to wait for the image to load and then call bc_setIcons.
         */
        console.log("ERROR setting icons:  mostly likely caused by the image not being loaded yet.  Please use imagesLoaded");
        return;
      }


      var imageData = myCanvasContext.getImageData(0,0, imgWidth, imgHeight);

      var pix = imageData.data;

      if($(this).hasClass('selected')) {
        var topRGB = $.hexToRGB(defaults.selected_top);
        var bottomRGB = $.hexToRGB(defaults.selected_bottom);
        var colors = {top: [topRGB.red, topRGB.green, topRGB.blue], bottom: [bottomRGB.red, bottomRGB.green, bottomRGB.blue]}
        var count = 0;
        var even = true;

        for (var i = 0, n = pix.length; i < n; i += 4) {
          if((i/4)%imageData.width === 0) {
            count++;
          }

          pix[i] = ((count * 2) + (i/4) % imageData.width > (imageData.height)/.7) ? colors.bottom[0] : colors.top[0];
          pix[i+1] = ((count * 2) + (i/4) % imageData.width > (imageData.height)/.7) ? colors.bottom[1] : colors.top[1];
          pix[i+2] = ((count * 2) + (i/4) % imageData.width > (imageData.height)/.7) ? colors.bottom[2] : colors.top[2];
        }
      } else {
        var greyStart = $.hexToRGB(defaults.inactive_top).red;
        var greyFinish = $.hexToRGB(defaults.inactive_bottom).red;
        var change = (greyStart - greyFinish)/imageData.height;
        var even = true;
        var grey = greyStart;
        for (var i = 0, n = pix.length; i < n; i += 4) {
          if((i/4)%imageData.width === 0) {
            grey = Math.ceil(grey - change)
          }

          pix[i] = grey;
          pix[i+1] = grey;
          pix[i+2] = grey;
        }
      }

      myCanvasContext.putImageData(imageData,0,0,0,0, imageData.width,   imageData.height);

      $(this).replaceWith(myCanvas);

    });
  };
  //trigger build
})(jQuery, undefined);