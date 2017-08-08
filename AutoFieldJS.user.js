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
        z-index: 999999;                    /* Specify a stack order in case you're using a different order for other */
    }

    #autofield-overlay-container {
        position: fixed;
        width: 80%;
        padding: 10px;
        top: 50%;
        left: 50%;
        border-radius: 20px;
        transform: translateX(-50%) translateY(-50%);
        background: white;
    }

    #autofield-header {
        width: 100%;
        height: 100px;
    }

    #autofield-title {
        position: absolute;
        top: 20px;
        left: 50px;

        font-weight: bold;
    }

    #autofield-page-url {
        width: 100%;
        height: 100px;
        line-height: 100px;
        text-align: center;
        vertical-align: middle;

        font-size: 24px;
    }

    #autofield-subcontainer {
        display:flex;
        padding: 10px;
        height: 400px;
        border: 1px dotted black;
    }

    #autofield-aside {
        width: 250px;
        height: 100%;
        background: #D1DBBD;
    }

    #autofield-subcontainer-content {
        width: 100%;
        height: 100%;
        overflow-y: scroll;
        background: #FCFFF5;
    }

    .test {
        height: 100px;
        color: white;
    }
`;

const PAGE    = 'Page';
const CONFIG  = 'Config';

var Utils = {
    url: function() {
        var query = (window.location.href).indexOf("?");
        if (query >= 0)
            return (window.location.href.substring(0, query)).toLowerCase();
        else
            return window.location.href.toLowerCase();
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
        data: data, //<ConfigName, Enabled>
    };
};

function PageData(name, enabled) {
    return {
        name: name,
        enabled: enabled
    };
}

function Config(name, data = []) {
    return {
        name: name,
        data: data, //<Field, Value>
    };
};

// Wrapping utils class, wrap much?
var AutoFieldDb = {
    get: function(key) {
        var config = Utils.deserialize(key);
        if(_.isEmpty(config))
            return [];  //No config(s) exists, returning empty array instead
        else
            return config;
    },

    save: function(key, obj) {
        if(_.isArray(obj)) {
            Utils.serialize(key, obj);
        }
    },

    clear: function(key) { if(window.confirm('Are you sure you want to delete data for \'' + key + '\'')) _.each(GM_listValues(), GM_deleteValue); },
    clearAll: function() { if(window.confirm('Are you sure you want to delete everything?')) GM_deleteValue(key); },
}

function ConfigData(field, value) {
    return {
        field: field,
        value: value
    };
}

$(document).ready(function() {

    // Setup UI
    GM_addStyle(AUTOFIELD_CSS);
    var body = $('body');
    var overlay = $('<div>', { id: 'autofield-overlay' });
    // var container = $('<div>', { id: 'autofield-overlay-container' });
    var container = $(`
        <div id="autofield-overlay-container">
            <div id="autofield-header">
                <div id="autofield-title">
                    AutoFieldJS
                </div>
                <div id="autofield-page-url">[INSERT URL HERE]</div>
            </div>
            <div id='autofield-subcontainer'>
                <div id='autofield-aside'>
                    <div class="autofield-sidebar">Home</div>
                    <div class="autofield-sidebar">All Configs</div>
                </div>
                <div id="autofield-subcontainer-content">
                </div>
            </div>
        </div>
    `);

    body.append(overlay);
    overlay.append(container);

    $('#autofield-page-url').html(Utils.url());

    var page = AutoFieldDb.get(PAGE);

    // // Logic
    document.addEventListener('keydown', (event) => 
    {
        switch(event.code) 
        {
            case "F1": // F1 does not work in Chrome :/
            overlay.fadeToggle('fast');
            break;

            case "F2":
            overlay.fadeToggle('fast');
            break;

            case "F9":
            AutoFieldDb.clearAll();
            break;
        }
    });
});