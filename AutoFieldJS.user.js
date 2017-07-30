// ==UserScript==
// @name        AutoFieldJS
// @namespace   devsfiq
// @description Configurable Automation
// @include     *
// @version     1
// @grant       unsafeWindow
// @grant       GM_getValue 
// @grant       GM_setValue 
// @grant       GM_deleteValue
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// ==/UserScript==

//
//  HTML Field Configuration(s)
//
var tags = {};
tags["input[type='text']"] = function() { alert("TEST"); };

//
//  Greasemonkey/Tampermonkey Field(s) Data/Configuration
//
var config;
function Config() { };

Config.Load = function() 
{
    //alert(window.location.href);
};

Config.Save = function() 
{
    alert(url);
};

//
//  Script Logic
//
Config.Load();

document.addEventListener('keydown', (event) => 
{
    switch(event.code) 
    {
        case "F1":
        Config.Save();
        break;

        case "F2": 
        alert("AA");
        tags["input[type='text']"]();
        break;

        case "F3":
        break;
    }
});