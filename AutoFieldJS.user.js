// ==UserScript==
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

    deserialize: function(name, def) { return eval(GM_getValue(name, (def || '({})'))); },
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

// UI Functions (To make life easier)

function createOverlay(html = null) {
    if($('#autofield-overlay').length == 0) { 
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

// Logic

var currentConfig = '';

// createOverlay(`
//     <div style="background:cyan">
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//         <h1 class="autofield">asa</h1>
//     </div>
// `);

$(document).keypress(function(e) {
    if(e.altKey && e.shiftKey) {
        switch(e.key) {
            case '!':
            // if(currentConfig != '') {
                var overlay = createOverlay(`
                    <div>
                        <h1 class="autofield" style="text-align: center;">` + Utils.url() + '#' + currentConfig + `</h1>
                        <hr>
                        <button class="autofield">Run Config</button>
                        <button class="autofield">Edit Config</button>
                        <button class="autofield">Delete Config</button>
                        <hr>
                        <button class="autofield">Add Field</button>
                        <div id="autofield-field-list">
                            <p class="autofield">No field exists</p>
                        </div>
                    </div>
                `);
            // }
            break;

            case '@':
            break;

            case '#':
            break;

            case '$':
            break;

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

var page = Page('google.com.sg', 'Test', [new Map()]);
page.data[0].set('Foo', 'Bar');

console.log(page);
console.log(uneval(page));

page = Page('google.com.sg', 'Test', [PageData('Foo', 'Bar')]);

console.log(page);
console.log(uneval(page));