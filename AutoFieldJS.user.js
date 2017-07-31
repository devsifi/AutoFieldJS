// ==UserScript==
// @name        AutoFieldJS
// @namespace   devsfiq
// @description Configurable Automation
// @include     *
// @version     1
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_getValue 
// @grant       GM_setValue 
// @grant       GM_deleteValue
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==

//
// Utilities
//

String.prototype.hashCode = function() 
{
    var hash = 0, i, chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

//
//  AutoFieldJS Initialization
//
function AutoFieldJS() { };

AutoFieldJS.Init = function()
{
    // TIL about Template Literals
    var autofieldCSS = `

        body 
        {
            position: relative;
        }

        .autofield-header
        {
            text-align: center;
            margin: 20px 0px;
        }

        .autofield-label
        {
            margin-right: 5px;
        }

        .autofield-select
        {
            width: 200px;
        }

        .autofield-btn
        {
            width: 80px;
        }

        .autofield-overlay 
        {
            display: none;
            position:absolute;
            z-index: 999999;
            overflow:auto;

            top: 0px;
            left: 0px;

            background: rgba(0, 0, 0, 0.33);
        }

        .autofield-container 
        {
            position:relative;
            padding: 50px;
            top: 50px;
            left: 50%;

            width: 600px;
            /*height: 600px;*/

            transform: translateX(-50%);

            border-radius: 20px;
            background: white;
        }

        .autofield-overlay-enabled
        {
            display: block;
        }
    `;

    GM_addStyle(autofieldCSS);

    var $autoFieldOverlay = $("<div>", {class:"autofield-overlay"});
    var $autoFieldContainer = $("<div>", {class:"autofield-container"});
    var $autoFieldPageConfig = $(`
        <h1 class="autofield-header">AutoField.js</h1>
        <p>
            <label class="autofield-label">Select configuration to use: </label>
            <select class="autofield-select">
                <option>Default</option>
                <option>Test2</option>
                <option>Test3</option>
            </select>
            <button class="autofield-btn">New</button>
            <div style="border: 1px solid black; padding: 30px;">
                <p>Field 'Test': <input type="text" disabled readonly value="CONFIG"></input></p>
                <p>Field 'Test': <input type="text" disabled readonly value="CONFIG"></input></p>
            </div>
        </p>
    `);
    $autoFieldOverlay.append($autoFieldContainer);
    $autoFieldContainer.append($autoFieldPageConfig);
    $("body").append($autoFieldOverlay);

    if (!($("body").height() > $(window).height())) 
    {
        $(window).resize(function() 
        {
            $autoFieldOverlay.css("width", window.innerWidth + "px");
            $autoFieldOverlay.css("height", window.innerHeight + "px");
        });

        $(window).trigger('resize');
    } else 
    {
        $autoFieldOverlay.css("width", "100%");
        $autoFieldOverlay.css("height", "100%");
    }
}

//
//  HTML Field Configuration(s)
//
var input = {};
input["text"] = function() 
{ 

};

input["number"] = function() 
{ 
    
};

//
//  Greasemonkey/Tampermonkey Field(s) Data/Configuration
//
var config;
function Config() { };

Config.Load = function() 
{
    alert("URL: " + window.location.href + ", Hash: " + window.location.href.hashCode());
};

Config.Save = function() 
{
    alert(url);
};

//
//  Script Logic
//
AutoFieldJS.Init(); //Initiaizes UI/Overlay etc.
Config.Load();

document.addEventListener('keydown', (event) => 
{
    switch(event.code) 
    {
        case "F1":
        $(".autofield-overlay").toggleClass("autofield-overlay-enabled");
        break;

        case "F2": 
        break;

        case "F3":
        break;
    }
});