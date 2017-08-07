// ==UserScript==
// @name        AutoFieldJS
// @namespace   devsfiq
// @description Configurable Automation
// @include     *
// @version     0.0.1
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getResourceURL
// @grant       GM_getValue 
// @grant       GM_setValue 
// @grant       GM_deleteValue
// @grant       GM_listValues
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.5.0/jquery.contextMenu.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.5.0/jquery.ui.position.min.js
// @resource    jqueryContextMenuCSS https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.5.0/jquery.contextMenu.min.css
// ==/UserScript==

// Value Generation
function generateChar() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz';
    return chars.charAt(Math.floor(Math.random() * chars.length));
}

function generateString(length) {
    var str = '';
    for(var i = 0; i < length; i++) {
        str += Generate.char();
    }

    return str;
}

function generateDate(days = 0, months = 0, years = 0, format = 'DD-MM-YYYY') {
    var date = moment();
    date = date.add(days, 'd').add(months, 'M').add(years, 'y');

    return date.format(format);
}

function generateTime(seconds = 0, minutes = 0, hours = 0, format = 'h:mm:ssa') {
    var date = moment();
    date = date.add(hours, 's').add(minutes, 'm').add(hours, 'h');

    return date.format(format);
}

// Classes/Prototypes/Objects
// Config
var Config = function(name, data = []) {
    this.name = name;
    this._data = data;
}

Config.prototype.getField = function(fieldName) {
    return _.find(this._data, function(o) {
        return o.field == fieldName;
    });
}

Config.prototype.fieldExists = function(fieldName) {
    return (this.getField(fieldName) != undefined);
}

Config.prototype.addField = function(fieldName, value) {
    if(!this.fieldExists(fieldName)) {
        this._data.push({
            field: fieldName,
            value: value
        });
    } else {
        console.warn('AutoFieldJS: Field \'' + fieldName + '\' in Config \'' + this.name + '\'' + ' already exists');
    }
}

Config.prototype.removeField = function(fieldName) {
    this._data = _.without(this._data, this.getField(fieldName));
}

var PageConfig = function(url, data = []) {
    this.url = url;
    this._data = data;
}

// PageConfig
PageConfig.prototype.getField = function(configName) {
    return _.find(this._data, function(o) {
        return o.configName == configName;
    });
}

PageConfig.prototype.fieldExists = function(configName) {
    return (this.getField(configName) != undefined);
}

PageConfig.prototype.addConfig = function(configName, enabled = true) {
    if(!this.fieldExists(configName)) {
        this._data.push({
            configName: configName,
            enabled: enabled
        });
    } else {
        console.warn('AutoFieldJS: Config \'' + configName + '\' in PageConfig \'' + this.url + '\'' + ' already exists');
    }
}

// Serialization (Saving Data into GM)
function deserialize(name, def) {
  return eval(GM_getValue(name, (def || '({})')));
}

function serialize(name, val) {
  GM_setValue(name, uneval(val));
}

function clearAllData() {
    if(confirm('Are you sure you want to wipe everything (configs, page configs)?')) {
        _.each(GM_listValues(), GM_deleteValue);
    }
}

function saveConfig(config) {
    serialize(config.name, config);
}

function loadConfig(configName) {
    var config = deserialize(config);
    if(_.isEmpty(config)) {
        console.warn('Config \'' + configName + '\' does not exists, creating an empty config');
        config = new Config(configName);
        saveConfig(config);
    } else {
        console.log('Loaded Config \'' + configName + '\'');
    }

    return config;
}

function savePageConfig(pageConfig) {
    serialize(pageConfig.url, pageConfig);
}

function loadPageConfig(pageConfigName) {
    var pageConfig = deserialize(pageConfigName);
    if(_.isEmpty(pageConfig)) {
        console.warn('PageConfig \'' + pageConfigName + '\' does not exists, creating an empty page config for \'' + pageConfigName + '\'');
        pageConfig = new PageConfig(pageConfigName);
        savePageConfig(pageConfig);
    } else {
        console.log('Loaded PageConfig \'' + pageConfigName + '\'');
    }

    return pageConfig;
}

// Setup

// Setup Overlay UI
GM_addStyle(`
    body {
        position: relative;
    }

    .autofield-overlay {
        display: none;
        position:absolute;
        z-index: 999999;
        overflow:auto;
        width:100%;
        height:100%;
        top: 0px;
        left: 0px;
        background: rgba(0, 0, 0, 0.33);
    }

    .autofield-config-container:hover {
        background: black;  
    }

    .autofield-config-container {
        position:fixed;
        display: flex;
        padding: 50px;
        top: 50%;
        left: 50%;
        width: 600px;
        transform: translateX(-50%) translateY(-50%);
        border-radius: 20px;
        background: white;
    }

    .autofield-config-aside {
        display: block; 
        background: grey;
    }

    .autofield-config-content {
        background: black;
    }

    .autofield-overlay-enabled {
        display: block;
    }
`);
var autoFieldOverlay = $('<div>', {class:'autofield-overlay'});
var autoFieldConfigManager = $(`
    <div class="autofield-config-container">
        <div class="autofield-config-aside"></div>
        <div class="autofield-config-content"></div>
    </div>
`);

if ($(document).height() <= $(window).height()) // Might break resize events on browser, not sure
{
    $(window).on("resize", function(){
        var win = $(this);
        autoFieldOverlay.height(win.height());
    });

    $(window).trigger("resize");
}

$('body').append(autoFieldOverlay);
autoFieldOverlay.append(autoFieldConfigManager);

// Setup Context Menu
GM_addStyle(GM_getResourceText('jqueryContextMenuCSS'));
$.contextMenu({
    selector: 'input', 
    callback: function(key, options) {
        var m = "clicked: " + key;
        window.console && console.log(m) || alert(m); 
    },
    items: {
        'add' : {
            name:       'Add Config',
            visible:    function(key, opt) {
                return true;
            },
            callback:   function(itemKey, opt) {
                console.log(opt.$trigger);
            }
        },
        'edit' : {
            name:       'Edit Config',
            visible:    function(key, opt) {
                return false;
            },
            callback:   function(itemKey, opt) {
                console.log(opt.$trigger);
            }
        }
    }
});

// Logic
document.addEventListener('keydown', (event) => 
{
    switch(event.code) 
    {
        case "F1":
        $(".autofield-overlay").toggleClass("autofield-overlay-enabled");
        break;
    }
});