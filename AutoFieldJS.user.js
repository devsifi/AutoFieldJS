// ==UserScript==
// @name        AutoFieldJS
// @namespace   devsfiq
// @description Configurable Automation
// @include     *
// @version     1.0.0
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

// Default Stylings (Also praise Template Literals)
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

    #autofield-del-btn {
        background: red;
        color: white;
    }

    select.autofield {
        width: 150px;
    }

    button.autofield {
        margin: 0px 5px;
        padding: 5px 10px;
        text-align: center;
    }

    button.autofield:hover {
        cursor: pointer;
    }

    textarea.autofield:disabled, select.autofield:disabled, input.autofield, button.autofield {
        border: 1px solid grey;
        background: white;
    }

    textarea.autofield:disabled, select.autofield:disabled, input.autofield:disabled, button.autofield:disabled {
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
        width:150px;
        clear:left;
        text-align:left;
        padding-right:10px;
    }
    
    label.autofield {
        float:left;
    }

    select.autofield, .autofield-config-item, .autofield-field-item {
        border: 1px solid black;
    }

    .autofield-field-item {
        padding: 20px 10px;
    }

    .autofield-field-item button {
        float: right;
    }

    .autofield-glow {
        border: 2px solid #333333;
        border-radius: 7px;
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
        // if(url.length >= 90)
        //     url = url.substr(0, 77) + '...';

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
};

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
}

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
};

function generate(input) {
    var re = /\[(.*?)\]/g;
    var str = input;
    var extract = str.match(re); // Get array of words with square brackets like [this]

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

            str = str.replace(val, Generate.date(param[0], param[1], param[2]));
            break;

            case "TIME":
            var param = removeWhitespace(getParams(val));
            
            if(param == null) {
                param = [0,0,0];
            }

            if(!_.isArray(param))
                param = param.split(',');

            str = str.replace(val, Generate.time(param[0], param[1], param[2]));
            break;
        }
    });

    return str;
}

function removeWhitespace(str) {
    try {
        return str.replace(/ /g,'');
    } catch(err) {
        return str; // Code throws error when there's no whitespace
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
        var value = $(this).find('input, textarea').val();
        page.data.push(PageData(name, value));
    });

    console.log(page);

     AutoFieldDb.save(Utils.url() + '#' + name, page);
}

function cloneConfig(name) {
    var copyTo = promptConfig();
    var page = AutoFieldDb.get(Utils.url() + '#' + name);
    page.name = copyTo;
    AutoFieldDb.save(Utils.url() + '#' + copyTo, page);
    closeOverlay();
    viewConfig(copyTo);
}

function pickField() {
    alert('Please select field you wish to configure');
    closeOverlay();
    $('input[name][type="text"], input[name][type="number"], textarea[name]').not('[readonly], :disabled').addClass('autofield-glow');
    $('input[name][type="text"], input[name][type="number"], textarea[name]').not('[readonly], :disabled').click(function() {
        var page = AutoFieldDb.get(Utils.url() + '#' + currentConfig);
        var name = $(this).attr('name');

        var item = _.find(page.data, function(o) { 
            return o.field == name; 
        });

        if(item == undefined) {
            page.data.push(PageData($(this).attr('name'), $(this).val()));
            AutoFieldDb.save(Utils.url() + '#' + currentConfig, page);
        } else {
            alert('AutoFieldJS: Field already exists');
        }
        
        $('input[name][type="text"], input[name][type="number"], textarea[name]').not('[readonly], :disabled').off('click');
        $('input[name][type="text"], input[name][type="number"], textarea[name]').not('[readonly], :disabled').removeClass('autofield-glow');
        viewConfig(currentConfig);
    });
}

function createFieldItem(field, value) {
    var item = $('<p>', { class: 'autofield-field-item' });
    var editBtn = $('<button class="autofield">Edit</button>');
    var removeBtn = $('<button class="autofield">Remove</button>');
    item.append('<label class="autofield">' + field + '</label>');
    
    // var ref = $('[name="' + field + '"]').clone();
    var ref = $('<input>');
    ref.attr('class', 'autofield');
    item.append(ref);
    item.append(removeBtn);
    item.append(editBtn);

    editBtn.click(function() {
        var val = window.prompt('Please enter configuration for "' + field + '"');
        if(val != null)
            ref.val(val);
    })

    ref.val(value);

    removeBtn.click(function() {
        item.remove();
        saveConfig(currentConfig);
    });

    return item;
}

function createConfigItem(config) {
    var item = $('<p style="text-align:center;"><button class="autofield" style="width:50%;" id="autofield-load-btn">' + config + '</button></p>');
    return item;
}

function configExists(name) {
    return (AutoFieldDb.get(Utils.url() + '#' + name) != null);
}

function viewConfig(name) {

    if(configExists(name)) {
        currentConfig = name;

        var url = Utils.url();
        if(url.length >= 80)
            url = url.substr(0, 77) + '...';

        if(createOverlay(`
            <div>
                <h1 class="autofield" style="text-align: center;">` + url + '#' + name + `</h1>
                <hr>
                <div style="display:flex; justify-content: space-between;">
                    <div>
                        <button class="autofield" id="autofield-run-btn">Run Config</button>
                        <button class="autofield" id="autofield-save-btn">Save Config</button>
                        <button class="autofield" id="autofield-del-btn">Delete Config</button>
                    </div>
                    <div>
                        <button class="autofield" id="autofield-clone-btn">Clone</button>
                    </div>
                </div>
                <hr>
                <button class="autofield" id="autofield-add-btn">Add Field</button>
                <hr>
                <p style="color:red">If for some reason the field cannot be edited, please click on the edit button to set the configuration</p>
                <p>To generate a custom string, key in '[String(<span style="font-style:italic">length</span>)]' where length (optional) is the number of characters to generate</p>
                <ul>
                    <li><p>eg. [String] or [String()] will generate a random string of 10 characters</p></li>
                    <li><p>eg. [String(200)] will generate a random string of 200 characters</p></li>
                </ul>

                <p>To generate a custom date, key in '[Date(<span style="font-style:italic">days, months, years</span>)]' where days/months/years is the number of days/months/years to add or subtract (use negative numbers to subtract) to the date. If any of the params are empty, the scrpit will use today's day/month/year</p>
                <ul>
                    <li><p>eg. [Date] or [Date()] will generate a today's date</p></li>
                    <li><p>eg. [Date(0,0,1)] will generate a date a year ahead and [Date(0,0,-1)] will generate a date a year before</p></li>
                </ul>

                <p>To generate a custom time, key in '[Time(<span style="font-style:italic">seconds, minutes, hours</span>)]' where seconds/minutes/hours is the number of seconds/minutes/hours to add or subtract (use negative numbers to subtract) to the time. If any of the params are empty, the scrpit will use the current seconds/minutes/hours</p>
                <ul>
                    <li><p>eg. [Time] or [Time()] will generate a today's time</p></li>
                    <li><p>eg. [Time(0,0,1)] will generate a time 1 hour from now and [Date(0,0,-1)] will generate a date a time an hour earlier</p></li>
                </ul>
                <p>eg. <span style="font-weight: bold">Test [Date] [Time] [String(20)]'</span> will generate <span style="font-weight: bold">'Test ` + Generate.date() + ' ' + Generate.time() + ' ' + Generate.string(20) + `'</span></p>
                <hr>
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

            // Populate fields
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

            $('#autofield-clone-btn').click(function() {
                cloneConfig(name);
            });

            $('#autofield-export-btn').click(function() {
                var page = AutoFieldDb.get(Utils.url() + '#' + name);
                download(Generate.date() + '_AutoField_' + name, page);
            });
        };
    } else {
        alert('AutoFieldJS: Please load a config first');
        viewConfigList(Utils.url());
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
        var arr = _.filter(keys, item => item.includes(url.toUpperCase()));
        $('#autofield-config-list').html('');

        if(arr.length > 0) {
            _.each(arr, function(key) {
                console.log(key);
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

            case ')':
            if(window.confirm('Are you sure you want to delete everything? (Every configuration, etc.)')) {
                _.each(GM_listValues(), GM_deleteValue);
            }
            break;
        } 
    }

    if(e.key == 'Escape')
        closeOverlay();
});