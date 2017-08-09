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

    #autofield-overlaycontainer {
        position: absolute;
        display: none;
        left: 0;
        top: 0;
        width: 100%;
        z-index: 999999;
    }

    #autofield-header::before {
        content: "AutoFieldJS: "
    }

    #autofield-header {
        width: 80%;
        height: 100px;
        margin: 20px auto;
        line-height: 100px;
        text-align: center;
        vertical-align: middle;

        font-size: 18px;
        font-weight: 300;
    }

    #autofield-active-config, #autofield-active-selection {
        position: relative;
        width: 80%;
        left: 50%;
        margin-bottom: 20px;
        padding: 20px;
        top: 0;
        transform: translateX(-50%);
        background: white;
    }

    #autofield-active-selection {
        display: none;
    }

    #autofield-active-config div.container-title {
        padding: 20px;
    }

    .autofield-simple-config {
        display: flex;
        background: #E0E0E0;
        padding: 10px;
        margin: 10px 0px;
    }

    .autofield-simple-config p::before {
        content: "Field '";
    }

    .autofield-simple-config p::after {
        content: "'";
    }

    .autofield-simple-config input[type="text"] {
        width: 500px;
    }

    .autofield-simple-config input[type="checkbox"] {
        margin-right: 20px;
    }

    .autofield-simple-config p {
        font-weight: bold;
        margin-right: 50px;
    }

    .autofield-simple-config .autofield-config-input {
        position: relative;
        right: 20px;
    }

    #autofield-config-menu {
        display: flex;
        justify-content: space-between;
    }

    .autofield-container-title {
        display: block;
        font-size: 24px;
        margin-left: 0;
        margin-right: 0;
    }

    .autofield-container {
        min-height: 100px;
        border-radius: 10px;
        background: white;
    }

    .autofield-clickthrough {
        pointer-events: none;
    }

    .autofield-highlight {
        box-shadow: 0px 0px 5px #000 !important;
    }
`;

const AUTOFIELD_HTML = `
        <div id="autofield-overlaycontainer">
            <div>
                <div id="autofield-header" class="autofield-container">
                    You shouldn't be able to see this sentence! It's supposed to be a URL.
                </div>

                <div id="autofield-active-selection" class="autofield-container">
                    <div id="autofield-active-selection-title" class="autofield-container-title">This should display the &lt;input&gt; name</div>
                     <div id="autofield-selection">
                        <p>This should be dynamic, based on &lt;input&gt; type</p>
                     </div>
                     <button id="autofield-button-save-selection" class="autofield-button">Save</button>
                </div>

                <div id="autofield-active-config" class="autofield-container">
                    <div class="autofield-container-title">Active Configuration(s)</div>
                    <div id="autofield-config-menu">
                        <div id="autofield-config">
                            <button id="autofield-button-save" class="autofield-button">Save</button>
                            <button id="autofield-button-add" class="autofield-button">Add</button>
                        </div>
                        <div id="autofield-config-extern">
                            <button id="autofield-button-clear" class="autofield-button">Clear</button>
                            <button id="autofield-button-import" class="autofield-button">Import</button>
                            <button id="autofield-button-export" class="autofield-button">Export</button>
                        </div>
                    </div>
                    <div id="autofield-config-items">
                        <div class="autofield-simple-config">
                            <p>Foo</p>
                            <div class="autofield-config-input">
                                <input type="text"></input>
                                <input type="checkbox"></input>
                                <button class="autofield-button">Remove</button>
                            </div>
                        </div>
                        <div class="autofield-simple-config">
                            <p>Foo</p>
                            <div class="autofield-config-input">
                                <input type="text"></input>
                                <input type="checkbox"></input>
                                <button class="autofield-button">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

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

function Page(url, data = []) {
    return {
        url:  url,
        data: data, //<<Field, Value>, Enabled>
    };
};

function ConfigData(field, value) {
    return {
        field: field,
        value: value
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

// Logic/Functions

// [TODO] Reorganise this, logic is messy e.e
function reset() {

    $('#autofield-active-selection-title').html('');
    $('#autofield-selection').html('');
    reloadData();

    $('input[name], select[name], textarea[name]').off(); // Might break jquery pages?
    $('input[name], select[name], textarea[name]').removeClass('autofield-highlight');
    $('#autofield-overlaycontainer').show();
    $('#autofield-active-config').show();
    $('#autofield-active-selection').hide();
}

/*
    <div class="autofield-simple-config">
        <p>Foo</p>
        <div class="autofield-config-input">
            <input type="text"></input>
            <input type="checkbox"></input>
            <button class="autofield-button">Remove</button>
        </div>
    </div>
*/

function reloadData() {

    $('#autofield-config-items').html('');

    var page = AutoFieldDb.get(Utils.url());
    _.each(page.data, function(config) {
        var val = config.field.value;
        try {
            val = JSON.parse(config.field.value);
        } catch(err) { }

        var item = $('<div>', {class:'autofield-simple-config'});
        item.append($('<p>' + config.field.field + '</p>'));

        var itemConfigInput = $('<div>', {class:'autofield-config-input'});
        itemConfigInput.append($('<input>', {type:'text', value: val}));
        itemConfigInput.append($('<input>', {type:'checkbox', checked: eval(config.enabled)}));

        var removeBtn = $('<button>', {class:'autofield-button', text:'Remove'});
        removeBtn.click(function() {
            alert('Removing ' + config.field.field);
        });

        itemConfigInput.append(removeBtn);

        item.append(itemConfigInput);

        $('#autofield-config-items').append(item);
    });
}

// [TODO] Radio & Checkbox Selection are the same, except Checkbox is multi-valued, to refactor to DRY (Don't Repeat Yourself)
function promptRadioSelection(element) {
    $('#autofield-active-selection-title').html('Configuration for "' + element + '"');
    $('input[name="' + element + '"]').each(function() {
        var container = $('<p>');
        container.append($(this).val());
        container.append($('<input>', {
            type: 'radio',
            name: 'autofill-radio',
            value: $(this).val()
        }));
        $('#autofield-selection').append(container);
    });
    $('#autofield-active-selection').show();
    $('#autofield-active-config').hide();
    $('#autofield-overlaycontainer').show();

    $('#autofield-button-save-selection').click(function() {
        var page = AutoFieldDb.get(Utils.url());
        page.data.push({
            field: ConfigData(element, $('input[name="autofill-radio"]').val()),
            enabled: true
        });

        AutoFieldDb.save(Utils.url(), page);
        reset();
    });
}

function promptCheckboxSelection(element) {
    $('#autofield-active-selection-title').html('Configuration for "' + element + '"');
    $('input[name="' + element + '"]').each(function() {
        var container = $('<p>');
        container.append($(this).val());
        container.append($('<input>', {
            type: 'checkbox',
            name: 'autofill-checkbox',
            value: $(this).val()
        }));
        $('#autofield-selection').append(container);
    });
    $('#autofield-active-selection').show();
    $('#autofield-active-config').hide();
    $('#autofield-overlaycontainer').show();

    $('#autofield-button-save-selection').click(function() {

        var val = [];
        $('input[name="autofill-checkbox"]:checked').each(function() {
            val.push($(this).val());
        });

        var page = AutoFieldDb.get(Utils.url());
        page.data.push({
            field: ConfigData(element, val),
            enabled: true
        });

        AutoFieldDb.save(Utils.url(), page);
        reset();
    });
}

function promptDropdownSelection(element) {
    $('#autofield-active-selection-title').html('Configuration for "' + element + '"');
    var container = $('<select>', { name: 'autofill-selection' });
    $('select[name="' + element + '"]').children().each(function() {
        container.append($(this).val());
        container.append($('<option>', {
            text: $(this).text(),
            value: $(this).val()
        }));
        $('#autofield-selection').append(container);
    });
    $('#autofield-active-selection').show();
    $('#autofield-active-config').hide();
    $('#autofield-overlaycontainer').show();

    $('#autofield-button-save-selection').click(function() {
        var page = AutoFieldDb.get(Utils.url());
        page.data.push({
            field: ConfigData(element, $('select[name="autofill-selection"]').val()),
            enabled: true
        });

        AutoFieldDb.save(Utils.url(), page);
        reset();
    });
}

function promptGenericSelection(element) {
    $('#autofield-active-selection-title').html('Configuration for "' + element + '"');
    var container = $('<input>', { name: 'autofill-text' });

    $('#autofield-selection').append(container);
    
    $('#autofield-active-selection').show();
    $('#autofield-active-config').hide();
    $('#autofield-overlaycontainer').show();

    $('#autofield-button-save-selection').click(function() {
        var page = AutoFieldDb.get(Utils.url());
        page.data.push({
            field: ConfigData(element, $('input[name="autofill-text"]').val()),
            enabled: true
        });

        AutoFieldDb.save(Utils.url(), page);
        reset();
    });
}

function triggerPickElement() {
    $('#autofield-overlay').addClass('autofield-clickthrough');
    $('input[name], select[name], textarea[name]').addClass('autofield-highlight');
    $('input[name], select[name], textarea[name]').click(function() {

        $('body').click();

        $('#autofield-overlay').removeClass('autofield-clickthrough');
        var element = $(this);
        
        if(element.is('input[type="radio"]'))
            promptRadioSelection(element.attr('name'));
        else
        if(element.is('input[type="checkbox"]'))
            promptCheckboxSelection(element.attr('name'));
        else
        if(element.is('select'))
            promptDropdownSelection(element.attr('name'));
        else
            promptGenericSelection(element.attr('name'));

    });
    $('#autofield-overlaycontainer').hide();
}

$(document).ready(function() {

    // Setup UI
    GM_addStyle(AUTOFIELD_CSS);
    var body = $('body');
    var overlay = $('<div>', { id: 'autofield-overlay' });

    var container = $(AUTOFIELD_HTML);

    body.append(overlay);
    body.prepend(container);

    $('#autofield-button-add').click(triggerPickElement);
    $('#autofield-button-save').click(function() {
        // [TODO]
    });

    $('#autofield-button-clear').click(function() {
        if(window.confirm('Are you sure you want to clear all configuration(s) for this page?')) {
            var page = Page(Utils.url());
            AutoFieldDb.save(page.url, page);
            reloadData();
        }
    });

    $('#autofield-button-import').click(function() {
        // [TODO] Reuse the same div from Selecting/Entering value (Also to redo)
    });

    $('#autofield-button-export').click(function() {
        var tmp = $('<a>', {
            style:'position:absolute; display: block; z-index: 999999;',
            href: 'data:text/plain;charset=utf-8,' + encodeURIComponent(uneval(AutoFieldDb.get(Utils.url()))),
            download: 'AutoFillJS-Export-' + Generate.date() + '-' + Generate.time() + '.txt',
            text: 'You should not see this'
        });

        console.log(tmp);

        $('body').append(tmp);
        tmp[0].click();
    });

    var page = AutoFieldDb.get(Utils.url());
    console.log(uneval(page));

    reloadData();

    overlay.fadeToggle('fast', function() { container.toggle('fast'); });

    // // Logic
    document.addEventListener('keydown', (event) => 
    {
        switch(event.code) 
        {
            case "F1": // F1 does not work in Chrome :/
            if(!overlay.hasClass('autofield-clickthrough'))
                overlay.fadeToggle('fast', function() { container.toggle('fast'); });
            break;

            case "F2":
            if(!overlay.hasClass('autofield-clickthrough'))
                overlay.fadeToggle('fast', function() { container.toggle('fast'); });
            break;

            case "F9":
            AutoFieldDb.clearAll();
            break;
        }
    });
});