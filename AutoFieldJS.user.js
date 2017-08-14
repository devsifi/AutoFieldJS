﻿// ==UserScript==
// @name        AutoFieldJS
// @namespace   devsfiq
// @description Configurable Automation
// @include     *
// @version     0.0.2
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
// ==/UserScript==

/*

    Issues Encountered:
     - JS Maps do not work, they do not de/serialize, Custom objects however work (But a hassle to deal with)

*/

// Emergency REEEEset
// _.each(GM_listValues(), GM_deleteValue);

// Default Stylings
GM_addStyle(`
    #autofield-overlay {
        position: fixed;                    /* Sit on top of the page content */
        width: 100%;                        /* Full width (cover the whole page) */
        height: 100%;                       /* Full height (cover the whole page) */
        top: 0; 
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);  /* Black background with opacity */
        z-index: 999998;                    /* Specify a stack order in case you're using a different order for other */
    }

    #autofield-overlay-container {
        position: absolute;
        width: 1000px;
        height: 600px;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
        border-radius: 20px;
        background: white;
        z-index: 999999; 
    }

    #autofield-overlay-container > div {
        position: relative;
        width: 100%;
        height: 500px;
        overflow: auto;
        margin-top: 80px;
        padding: 10px 20px;
    }

    .autofield {
        all: unset;
    }

    button.autofield {
        padding: 5px 10px;
        text-align: center;
    }

    button.autofield:hover {
        cursor: pointer;
    }

    input.autofield, button.autofield {
        border: 1px solid grey;
        background: white;
    }

    input.autofield:disabled, button.autofield:disabled {
        opacity: 0.4;
        cursor: unset;
    }

    p.autofield {
        display: block;
        margin-top: 1em;
        margin-bottom: 1em;
        margin-left: 0;
        margin-right: 0;
    }

    h1.autofield {
        display: block;
        font-size: 2em;
        margin-top: 0.67em;
        margin-bottom: 0.67em;
        margin-left: 0;
        margin-right: 0;
        font-weight: bold;
    }

    label.autofield {
        width:100px;
        clear:left;
        text-align:left;
        padding-right:10px;
    }
    
    input.autofiekd, label.autofield {
        float:left;
    }

    .autofield-config-item, .autofield-field-item {
        border: 1px solid black;
    }

    a.close {
        float:right;
        margin-top:30px;
        margin-right:30px;
        cursor:pointer;
        color: #fff;
        border: 1px solid #AEAEAE;
        border-radius: 30px;
        background: #605F61;
        font-size: 31px;
        font-weight: bold;
        display: inline-block;
        line-height: 0px;
        padding: 11px 3px;       
    }
    
    .close:before {
        content: "×";
    }
`);

// Core Functions

var Utils = {
    url: function() {
        var url = window.location.href;

        // Remove URL Scheme
        if(url.indexOf('file:///') >= 0)
            url = url.substr(8);

        if(url.indexOf('http://') >= 0)
            url = url.substr(7);

        if(url.indexOf('https://') >= 0)
            url = url.substr(8);

        // Remove Query Parameters
        var index = url.indexOf("?");
        if (index >= 0)
            url = url.substr(0, index);

        // Remove Hashbangs
        index = url.indexOf('#');
        if (index >= 0)
            url = url.substr(0, index);

        // Remove any slash notations at the end of URL
        if(url[url.length - 1] == '/')
            url = url.substr(0, url.length - 1);

        //Concat String if URL is too long (Maybe not necessary)
        if(url.length >= 90)
            url = url.substr(0, 77) + '...';

        return url;
    },

    deserialize: function(name, def) { 
        try {
            if(GM_getValue(name).indexOf('$1') == -1) {
                return eval(GM_getValue(name, (def || '({})'))); 
            } else {
                var result = GM_getValue(name);
                result = result.substring(result.indexOf('{'), result.lastIndexOf('}') + 1);
                return JSON.parse(result); 
            }
        } catch (err) {
            return null; //If nothing exists
        } 
    },
    serialize:  function(name, val) { GM_setValue(name, uneval(val)); }
}

var Generate = {
    char: function() { 
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        return chars.charAt(Math.floor(Math.random() * chars.length)); 
    },

    string: function(length) {
        var str = '';
        for(var i = 0; i < length; i++) {
            str += Generate.char();
        }
        return str;
    },

    date: function(days = 0, months = 0, years = 0, format = 'DD-MM-YYYY') {
        var date = moment();
        date = date.add(days, 'd').add(months, 'M').add(years, 'y');
        return date.format(format);
    },

    time: function(seconds = 0, minutes = 0, hours = 0, format = 'h:mm:ssa') {
        var date = moment();
        date = date.add(hours, 's').add(minutes, 'm').add(hours, 'h');
        return date.format(format);
    }
};

function Page(url, name, data = []) {
    return {
        url:  url,
        name: name,
        data: data, //<Field, Value>
    };
};

function PageData(field, value) {
    return {
        field: field,
        value: value
    };
}

// Simplifying Core code for this userscript
var AutoFieldDb = {
    get: function(key) {
        var config = Utils.deserialize(key.toUpperCase());
        if(_.isEmpty(config))
            return null;
        else
            return config;
    },

    save: function(key, obj) {
        Utils.serialize(key.toUpperCase(), obj);
    },
}

function generate(input) {
    var re = /\[(.*?)\]/g;
    var str = input;
    var extract = str.match(re);

    _.each(extract, function(val, index) {
        var tmp = removeWhitespace(val);

        switch(getExpression(tmp).toUpperCase()) {
            case "STRING": 
                var param = getParams(val);
                if(param == null || isNaN(param)) {
                    param = 10;
                }

                str = str.replace(val, Generate.string(param));
            break;

            case "DATE":
            var param = removeWhitespace(getParams(val));
            
            if(param == null) {
                param = [0,0,0];
            }

            if(!_.isArray(param))
                param = param.split(',');

            var d = parseInt(param[0]);
            var m = parseInt(param[1]);
            var y = parseInt(param[2]);

            if(isNaN(d))
                d = 0;

            if(isNaN(m))
                m = 0;

            if(isNaN(y))
                y = 0;

            str = str.replace(val, Generate.date(d, m, y));
            break;

            case "TIME":
            var param = removeWhitespace(getParams(val));
            
            if(param == null) {
                param = [0,0,0];
            }

            if(!_.isArray(param))
                param = param.split(',');

            var s = parseInt(param[0]);
            var m = parseInt(param[1]);
            var h = parseInt(param[2]);

            if(isNaN(s))
                s = 0;

            if(isNaN(m))
                m = 0;

            if(isNaN(h))
                h = 0;

            str = str.replace(val, Generate.time(s, m, h));
            break;
        }
    });

    return str;
}

function removeWhitespace(str) {
    try {
        return str.replace(/ /g,'');
    } catch(err) {
        return str; //No whitespace
    }
}

function getParams(str) { // String should be formatted like this (val)
    var re = /\((.*?)\)/g;
    var tmp = str.match(re);
    if(tmp != null)
        return str.substring(str.indexOf('(') + 1, str.length - 2);
    else
        return null;
}

function getExpression(str) { // String should be formatted like this [Expression(val)]
    var re = /\((.*?)\)/g;
    str = str.replace(re, '');
    return str.substring(1, str.length - 1);
}

// UI Functions (To make life easier)

var currentConfig = '';

function overlayExists() {
    return ($('#autofield-overlay').length > 0);
}

function createOverlay(html = null) {
    if(!overlayExists()) { 
        var overlay = $('<div>', { id: 'autofield-overlay' });
        var overlayContainer = $('<div>', { id: 'autofield-overlay-container'});
        var closeBtn = $('<a>', { class: 'close'});
        closeBtn.click(closeOverlay);
        overlay.append(overlayContainer);
        overlayContainer.append(closeBtn);
        if(html != null)
            overlayContainer.append($(html));
        $('body').append(overlay);
        return true;
    } else {
        console.warn('Overlay already exists');
        return false; //Failed to create overlay
    }
}

function closeOverlay() {
    var overlay = $('#autofield-overlay');
    if(overlay.length > 0) {
        overlay.remove();
    }
}

function runConfig(name) {
    saveConfig(name);
    var page = AutoFieldDb.get(Utils.url() + '#' + name);
    _.each(page.data, function(item) {
        var elem = $('[name="' + item.field + '"]')[0];
        $(elem).val(generate(item.value));
    });
    closeOverlay();
}

function saveConfig(name) {
    var page = AutoFieldDb.get(Utils.url() + '#' + name);
    page.data = [];
    $('.autofield-field-item').each(function() {
        var name = $(this).find('label').html();
        var value = $(this).find('input').val();
        page.data.push(PageData(name, value));
    });

     AutoFieldDb.save(Utils.url() + '#' + name, page);
}

function pickField() {
    alert('Please select field you wish to configure');
    closeOverlay();
    $('input[name], textarea[name]').click(function() {

        var page = AutoFieldDb.get(Utils.url() + '#' + currentConfig);

        console.log($(this).attr('name'), page, _.find(page.data, function(o) { return o.field == $(this).attr('name'); }));
        if(_.find(page.data, function(item) { return item.field == $(this).attr('name'); }) == undefined) {
            page.data.push(PageData($(this).attr('name'), $(this).val()));
            AutoFieldDb.save(Utils.url() + '#' + currentConfig, page);
        } else {
            alert('AutoFieldJS: Field already exists');
        }
        
        $('input[name], textarea[name], select[name]').off('click');
        viewConfig(currentConfig);
    });
}

function createFieldItem(field, value) {
    var item = $('<p>', { class: 'autofield-field-item' });
    var removeBtn = $('<button class="autofield">Remove</button>');
    item.append('<label class="autofield">' + field + '</label>');
    item.append('<input type="text" class="autofield" value="' +  value + '"/>');
    item.append(removeBtn);

    removeBtn.click(function() {
        item.remove();
        saveConfig(currentConfig);
    });

    return item;
}

function createConfigItem(config) {
    var item = $('<p>', { class: 'autofield-config-item' });
    item.append('<p class="autofield">' + config + '</p>');
    item.append('<button class="autofield" id="autofield-load-btn">Load Config</button>');

    return item;
}

function configExists(name) {
    return (AutoFieldDb.get(Utils.url() + '#' + name) != null);
}

function viewConfig(name) {
    if(configExists(name)) {
        currentConfig = name;
        if(createOverlay(`
            <div>
                <h1 class="autofield" style="text-align: center;">` + Utils.url() + '#' + name + `</h1>
                <hr>
                <button class="autofield" id="autofield-run-btn">Run Config</button>
                <button class="autofield" id="autofield-save-btn">Save Config</button>
                <button class="autofield" id="autofield-del-btn">Delete Config</button>
                <hr>
                <button class="autofield" id="autofield-add-btn">Add Field</button>
                <div id="autofield-field-list">
                    <p class="autofield">No field exists</p>
                    <p class="autofield-field-item">
                        <label class="autofield">Foo</label>
                        <input type="text" class="autofield"/>
                        <input type="text" class="autofield"/>
                    </p>
                </div>
            </div>
        `)) {

            var page = AutoFieldDb.get(Utils.url() + '#' + name);
            $('#autofield-field-list').html('');

            if(page.data.length > 0) {
                _.each(page.data, function(item) {
                    $('#autofield-field-list').append(createFieldItem(item.field, item.value));
                });
            } else {
                $('#autofield-field-list').html('<p class="autofield">No field exists</p>');
            }

            $('#autofield-run-btn').click(function() {
                runConfig(name);
            });
            
            $('#autofield-save-btn').click(function() {
                saveConfig(name);
            });

            $('#autofield-del-btn').click(function() {
                deleteConfig(name);
            });

            $('#autofield-add-btn').click(function() {
                pickField();
            });
        };
    } else {
        alert('AutoFieldJS: Please load a config first (Shortcut Key: Alt + Shift + 3)');
    }
}

function deleteConfig(name) {
    if(window.confirm('Are you sure you want to delete config "' + name + '"')) 
        GM_deleteValue((Utils.url() + '#' + name).toUpperCase());

    closeOverlay();
}

function promptConfig() {
    var prompt = window.prompt('Please enter new config name');
    while(configExists(prompt) || prompt == '')
        prompt = window.prompt('Please enter a valid or unique config name');

    return prompt;
}

function createConfig(name) {
    var page = Page(Utils.url(), name);
    AutoFieldDb.save(Utils.url() + '#' + name, page);
    closeOverlay(); //Close any open overlay
    viewConfig(name);
}

function viewConfigList(url) {
    if(createOverlay(`
        <div>
            <h1 class="autofield" style="text-align: center;">` + Utils.url() + `</h1>
            <div id="autofield-config-list">
                <p class="autofield">No config exists</p>
                <p class="autofield-config-item">
                    <p class="autofield">Foo</p>
                    <button class="autofield" id="autofield-load-btn>Load</button>
                </p>
            </div>
        </div>
    `)) {
        var keys = GM_listValues();
        var arr = _.filter(keys, item => item.indexOf(url >= 0));
        $('#autofield-config-list').html('');

        if(arr.length > 0) {
            _.each(arr, function(key) {
                var page = AutoFieldDb.get(key);
                var item = createConfigItem(page.name);
                item.find('#autofield-load-btn').click(function() {
                    closeOverlay();
                    viewConfig(page.name);
                });
                $('#autofield-config-list').append(item);
            });
        } else {
            $('#autofield-config-list').html('<p class="autofield">No config exists</p>');
        }
    };
}

// Logic

$(document).keypress(function(e) {
    if(e.altKey && e.shiftKey) {
        switch(e.key) {

            // View Config
            case '!':
            viewConfig(currentConfig);
            break;

            // New Config
            case '@':
            var name = promptConfig();
            if(name != null)
                createConfig(name);
            break;

            // Load Config
            case '#':
            viewConfigList(Utils.url());
            break;

            // List all Configs
            case '(':
            break;

            case ')':
            alert('Settings');
            break;
        } 
    }

    if(e.key == 'Escape')
        closeOverlay();
});