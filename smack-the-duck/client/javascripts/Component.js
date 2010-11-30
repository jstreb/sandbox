/**
 * Constructor for a new Brightcove Component
 * @param {object} An object that contains the various options that can be overridden.  Valid child key/value pairs are pOptions.settings and pOptions.styles.
 * @return A new Component.
 * @name Component
 */
var Component = (function(window, document, $, undefined){
  function Component(element, name) {
    this.element = element;
    this.name =  name; // for debugging
    this.id = $(element).attr('data-bc-component-id') || ('generated-' + Math.floor(Math.random()*10000000) + '-' + this.name);
    
    // data used by components to render
  	this.styleConfig = {};
    this.dataConfig = {};
    this.settingConfig = {};
    
    // raw server responses
    this.styles = null;
    this.data = null;
    this.settings = null;
    
    // register with BC.js
    $.components[this.id] = this;
  }
  
  var
    /** Default styling values for all components.  Used with theming. */
    defaults = {}
    /** An object to hold the events we will react to.  Still need this for non jQM-based components */
  , events = {};
  
  if("createTouch" in document) {
    events =
    { start: "touchstart"
    , move: "touchmove"
    , end: "touchend"
    , cancel: "touchcancel"
    };
  } else {
    events =
    { start: "mousedown"
    , move: "mousemove"
    , end: "mouseup"
    , cancel: "touchcancel" // unnecessary here
    };
  }
  
  function onRotate() {/** TODO */}

  function getSettingConfig() { return this.settingConfig }
  function getStyleConfig() { return this.styleConfig }
  function getDataConfig() { return this.dataConfig }

  function getData(optionalData) {
    if(optionalData) {
      this.data = optionalData;
    } else if(!this.data) {
      this.data = $.getData(this);
    }
    return this.data
  }

  function getStyles() {
    if(!this.styles) {
       this.styles = $.getStyles(this);
    }
    return this.styles; 
  }

  function getSettings() {
    if(!this.settings) {
      this.settings = $.getSettings(this);
    }
    return this.settings
  }
  
  function resetData() {
    this.data = $.getData(this);
  }

  function resetSettings() {
    this.settings = $.getSettings(this);
  }

  function setSetting(attribute, newValue) {
    var newSetting = this.getSettings();
    newSetting[attribute].value = newValue;
    $.cache(this.id + "_setting", JSON.stringify(newSetting));
  }
  
  /** Expects property formatted values, e.g. `32px`, `#F5F5F5` */
  function setStyle(attribute, newValue) {
    var newStyles = this.getStyles();
    newStyles[attribute].value = newValue;
    $.cache(this.id + "_styles", JSON.stringify(newStyles));
  }

  /** Creates the appropriate CSS off of the key and value that are passed in, or returns an empty string if there is none*/
  function getCSSStyle(key, value) {
    if(value && value.value) {
      return key + ": " + value.value +";";
    }
    else
      return "";
  }
  
  /**
   * Creates and injects any of the overwritten styles for this element
   */
  function injectCSS() {
    var styleElement = document.createElement('style')
      , cssString = ""
      , styles = this.getStyles();

    styleElement.className = this.id + '-injected-style injected-style'
    styleElement.type = 'text/css';

    for(var className in styles) {
      //We are setting the !important tag in order to override any specificity issues since we KNOW this is the style we want.
      if(className != 'swatch' && styles[className].value) {
        cssString += "." + className + this.id + " { " + styles[className].type + ":" + styles[className].value + " !important }\n";
      }
    }

    styleElement.appendChild(document.createTextNode(cssString));

    $('.' + this.id + '-injected-style').remove();  // clean up, clean up, everybody do your share.

    document.getElementsByTagName('head')[0].appendChild(styleElement);
  }
  
  // publicify
  $.extend(Component.prototype,
    { defaults: defaults
    , events: events
    /** functions */
    , onRotate: onRotate
    , getStyles: getStyles
    , getSettings: getSettings
    , resetSettings: resetSettings
    , getData: getData
    , resetData: resetData
    , getStyleConfig: getStyleConfig
    , getSettingConfig: getSettingConfig
    , getDataConfig: getDataConfig
    , setStyle: setStyle
    , setSetting: setSetting
    , getCSSStyle: getCSSStyle
    , injectCSS: injectCSS
    }
  );

  return Component;

})(this, this.document, $);