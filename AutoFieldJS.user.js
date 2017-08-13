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
// ==/UserScript==

/*

    Issues Encountered:
     - JS Maps do not work, they do not de/serialize, Custom objects however work (But a hassle to deal with)

*/

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

    deserialize: function(name, def) { return eval(GM_getValue(name, (def || '({})'))); },
    serialize:  function(name, val) { GM_setValue(name, uneval(val)); }
}
var Generate = {
    char: function() { 
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz';
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
        data: data, //<Field, Value Enabled>
    };
};

function PageData(field, value, enabled = true) {
    return {
        field: field,
        value: value,
        enabled: enabled
    };
}

// Wrapping utils class, wrap much?
var AutoFieldDb = {
    get: function(key) {
        var config = Utils.deserialize(key.toUpperCase());
        if(_.isEmpty(config))
            return Page(Utils.url());  //No config(s) exists, returning empty array instead
        else
            return config;
    },

    save: function(key, obj) {
        Utils.serialize(key.toUpperCase(), obj);
    },

    clear: function(key) { if(window.confirm('Are you sure you want to delete data for \'' + key + '\'')) _.each(GM_listValues(), GM_deleteValue); },
    clearAll: function() { if(window.confirm('Are you sure you want to delete everything?')) GM_deleteValue(key); },
}

const AUTOFIELD_CSS = `
    #autofield-overlay {
        position: fixed;                    /* Sit on top of the page content */
        display: none;                      /* Hidden by default */
        width: 100%;                        /* Full width (cover the whole page) */
        height: 100%;                       /* Full height (cover the whole page) */
        top: 0; 
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);  /* Black background with opacity */
        z-index: 999998;                    /* Specify a stack order in case you're using a different order for other */
    }

    #autofield-launcher {
        position: fixed;                    /* Sit on top of the page content */
        width: 50px;
        height: 50px;
        left: 50px;
        bottom: 50px;
        border-radius: 50%;
        background-color: black;
        z-index: 999999;                    /* Specify a stack order in case you're using a different order for other */
    }

    #autofield-container {
        display: none;
        position: absolute;
        width: 60%;
        left: 50%;
        top: 30px;
        padding: 20px 10px;
        transform: translateX(-50%);
        border-radius: 20px;
        background: white;
        z-index: 999999;
    }

    #autofield-container.autofill-window {
        display: none;
    }

    #autofield-launcher-config {
        display: flex;
        flex-direction: column;
        width: 40%; 
        margin-left: 30px;
        background:lightgrey;
    }

    #autofield-launcher-config button {
        flex: 1;
        min-height: 50px;
        margin: 5px 0px;
    }

    #autofield-launcher-config button:first-child, #autofield-launcher-config button:last-child {
        margin: 0px;
    }

    #autofield-config-settings button {
        height: 30px;;
    }

    #autofield-config-settings {
        width: 100%;
        margin: 0px 30px;
        background: lightgrey;
    }

    #autofield-config-name {
        text-align: center;
    }

    #autofield-delete-config-btn {
        background: firebrick;
    }

    #autofield-new-config {
        text-align: center;
    }

    #autofield-launcher:hover {
        cursor: pointer;
        background: lightgrey;
    }

    .autofield-config-item {
        background: lightgrey;
    }

    .autofield-flex {
        display: flex;
    }

    .autofield-clickthrough {
        pointer-events: none;
    }

    .autofield-highlight {
        box-shadow: 0px 0px 5px #000 !important;
    }

    .autofield {
        margin: 0;
        padding: 0;
        border: 1px solid grey !important;
        font-size: 100%;
        font: inherit;
        vertical-align: baseline;
    }
`;

const AUTOFIELD_CONTAINER_HTML = `
    <div id="autofield-container">
        <h1 style="text-align:center;">AutoFieldJS</h1><hr>
        <h3 id="autofield-url" style="text-align:center;"></h3><hr>
        <div id="autofield-main" class="autofield-flex autofill-window">
            <div id="autofield-launcher-config">
                <button class="autofield" id="autofield-new-config-btn">New Config</button>
                <button class="autofield" id="autofield-load-config-btn">Load Config</button>
                <hr>
                <button class="autofield" id="autofield-export-config-btn">Export Config</button>
                <button class="autofield" id="autofield-delete-config-btn">Delete Config</button>
            </div>
            <div id="autofield-config-settings" class="autofill-window">
                <h3 id="autofield-config-name">Current Config: <input class="autofield" type="text" disabled readonly></h3>
                <p style="text-align: center;">
                    <button class="autofield" id="autofield-add-field-btn" disabled>Add Field</button>
                    <button class="autofield" id="autofield-save-config-btn" disabled>Save</button>
                    <button class="autofield" id="autofield-run-config-btn" disabled>Run Config</button>
                </p>
                <div id="autofield-field-item-list">
                </div>
            </div>
        </div>
        <div id="autofield-new-config" class="autofill-window">
            <h3>Please enter name for new config</h3>
            <p><input type="text" id="autofield-new-config-name" class="autofield"></p>
            <p><button class="autofield" id="autofield-create-config-btn">Create</button></p>
        </div>
        <div id="autofield-load-config" class="autofill-window">
            <h3>Please select config to load</h3>
            <div id="autofield-config-item-list">
            </div>
        </div>
    </div>
`;

// Logic/Functions/Variables

const WINDOWS = [
    '#autofield-main',
    '#autofield-new-config',
    '#autofield-load-config'
];

var currentConfig = '';

function getURL() {
    return Utils.url() + '#' + currentConfig;
}

function configCheckFieldExists(name)  {
    var page = AutoFieldDb.get(getURL());
    return _.find(page.data, function(item) {
        return item.field == name;
    }) == undefined;
}

function reloadUI() {
    $('#autofield-url').html(Utils.url());
    $('#autofield-config-name input').val(currentConfig);

    if(currentConfig != '') {
        $('#autofield-add-field-btn').removeAttr('disabled');
        $('#autofield-save-config-btn').removeAttr('disabled');
        $('#autofield-run-config-btn').removeAttr('disabled');
    } else {
        $('#autofield-add-field-btn').attr('disabled', 'disabled');
        $('#autofield-save-config-btn').attr('disabled', 'disabled');
        $('#autofield-run-config-btn').attr('disabled', 'disabled');
    }

    showWindow('#autofield-main');
}

function listConfigs(url) {
    var keys = GM_listValues();
    var arr = _.filter(keys, item => item.indexOf(url >= 0));
    
    $('#autofield-config-item-list').html('');
    _.each(arr, function(pageKey) {
        var page = AutoFieldDb.get(pageKey);
        var item = $('<div>', { class: 'autofield-config-item' });
        var button = $('<button>', { class: 'autofield-load-config' });
        
        button.html('Load Config');
        button.click(function() {
            loadConfig(page.name);
        });

        item.append($('<h3>' + page.name + '</h3>'));
        item.append(button);
        $('#autofield-config-item-list').append(item);
    });
}

function loadConfig(name)  {
    currentConfig = name;
    var page = AutoFieldDb.get(getURL());

    if(!_.isEmpty(page)) {
        $('#autofield-field-item-list').html('');
        _.each(page.data, function(config) {
            var item = $('<div>', { class: 'autofield-field-item' });
            item.append($('<label>' + config.field + '</label>'));
            item.append($('<input>', {
                class: 'autofield',
                type: 'text',
                value: config.value
            }));
            $('#autofield-field-item-list').append(item);
        });
    }

    reloadUI();
}

function toggleLauncher() {
    $('#autofield-container').fadeToggle('fast', function() {
        $('#autofield-overlay').fadeToggle('fast');
        showWindow('#autofield-main'); //Reset state to main window
    });
}

function showWindow(name = WINDOWS[0]) {
    if(WINDOWS.indexOf(name) == -1)
        name = WINDOWS[0];

    var arr = WINDOWS.filter(item => item != name); //Items to hide
    _.each(arr, function(val) {
        $(val).hide();
    });
    $(name).show();
}

function download(filename, obj) {
    var hiddenDownloadLink = $('<a>', {
        style:      'display: none',
        href:       'data:text/plain;charset=utf-8,' + encodeURIComponent(uneval(obj)),
        download:   filename
    });

    $('body').append(hiddenDownloadLink);
    hiddenDownloadLink[0].click();
    hiddenDownloadLink.remove();
}

function upload(callback) {
    var hiddenFileInput = $('<input>', {
        style:  'display: none',
        type:   'file'
    });

    hiddenFileInput.change(function() {
        var fileName = $(this).val();
        var file = $(this)[0].files[0];
        var result = null;
        if(file) {
            var reader = new FileReader();
            reader.readAsText(file, 'UTF-8');
            reader.onload = function(e) {
                 callback(e.target.result);
            }
            reader.onerror = function(e) {
                throw 'Failed to read file "' + fileName + '"';
            }
        }

        $(this).remove();
    });

    $('body').append(hiddenFileInput);
    hiddenFileInput[0].click();
}

function promptSelection() {
    if($('input[name]:not(:checkbox, :radio), textarea[name]').length > 0) {
        $('#autofield-container').fadeOut('fast');
        $('#autofield-overlay').addClass('autofield-clickthrough');
        $('input[name]:not(:checkbox, :radio), textarea[name]').addClass('autofield-highlight');

        // Prompt Selection
        $('input[name]:not(:checkbox, :radio), textarea[name]').on('click', function(e) {
            e.preventDefault();
            $(this).blur();
            window.focus();

            if(configCheckFieldExists($(this).attr('name'))) {
                var page = AutoFieldDb.get(getURL());
                page.data.push(PageData($(this).attr('name'), ''));
                AutoFieldDb.save(getURL(), page);
            }

            $('#autofield-container').fadeIn('fast');
            $('#autofield-overlay').removeClass('autofield-clickthrough');
            $('input[name]:not(:checkbox, :radio), textarea[name]').removeClass('autofield-highlight');

            $('input[name]:not(:checkbox, :radio), textarea[name]').off('click');

            loadConfig(currentConfig);
        });
    } else {
        alert('Nothing to configure in this page');
    }
}

function generate(input) {
    var re = /\[(.*?)\]/g;
    var str = input;
    var extract = str.match(re);

    _.each(extract, function(val, index) {
        var tmp = removeWhitespace(val);

        console.log(getExpression(tmp));
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

$(document).ready(function() {

    //$('#autofield-container *').removeAttr('style');

    // Setup UI
    GM_addStyle(AUTOFIELD_CSS);
    var body = $('body');
    var overlay = $('<div>', { id: 'autofield-overlay' });

    var launcher = $('<div>', { id: 'autofield-launcher' });
    launcher.click(toggleLauncher);

    body.append(overlay);
    body.append($(AUTOFIELD_CONTAINER_HTML));
    body.append(launcher);

    $('#autofield-new-config-btn').click(function() { showWindow('#autofield-new-config'); });
    $('#autofield-load-config-btn').click(function() { 
        listConfigs(Utils.url());
        showWindow('#autofield-load-config'); 
    });

    $('#autofield-import-config-btn').click(function() {
        upload(function(val) {
            var o = eval(val || '({})');

            if(_.isArray(o)) {
                _.each(o, function(item) {
                    AutoFieldDb.save(item.url + '#' + item.name, item);
                });
            }
        });
    });
    $('#autofield-export-config-btn').click(function() {

        var arr = [];

        _.each(GM_listValues(), function(val) {
            var page = Utils.deserialize(val);
            arr.push(page);
        });

        download('AutoFieldExportedConfig.txt', arr);
    });

    /*
    <p><input type="text" id="autofield-new-config-name"></p>
    <p><button id="autofield-create-config-btn">Create</button></p>
    */

    $('#autofield-create-config-btn').click(function() {
        var name = $('#autofield-new-config-name').val();
        if(name == '') {
            alert('Name cannot be null');
        } else {
            currentConfig = name;
            var page = Page(Utils.url(), name);
            console.log(page, getURL());
            AutoFieldDb.save(getURL(), page);
            $('#autofield-new-config-name').val('');
            loadConfig(name);
        }
    });

    $('#autofield-add-field-btn').click(function() {
        promptSelection();
    });

    $('#autofield-save-config-btn').click(function() {
        $('.autofield-field-item').each(function() {
            var name = $(this).children('label').html();
            var val = $(this).children('input').val();

            var page = AutoFieldDb.get(getURL());
            var result = _.find(page.data, function(o) {
                return o.field == name;
            });
            result.value = val;

            AutoFieldDb.save(getURL(), page);
        });
    });

    $('#autofield-run-config-btn').click(function() {
        $('#autofield-save-config-btn').click(); // Saves everything first

        toggleLauncher();

        var page = AutoFieldDb.get(getURL());
        _.each(page.data, function(item) {
            var elem = $('[name="' + item.field + '"]')[0];
            console.log(item.value);
            $(elem).val(generate(item.value));
        });
    });

    $('#autofield-delete-config-btn').click(function() {
        GM_deleteValue(getURL().toUpperCase());
        loadConfig('');
    });

    loadConfig('');
    reloadUI();
});