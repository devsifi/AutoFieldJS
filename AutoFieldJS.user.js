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
// @grant       GM_listValues
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.18.1/moment.min.js
// ==/UserScript==

// Value Generation
function Generate() { }

Generate.Char = function()
{
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz";
    return chars.charAt(Math.floor(Math.random() * chars.length));
}

Generate.String = function(length)
{
    var str = "";

    for(var i = 0; i < length; i++)
    {
        str += Generate.Char();
    }

    return str;
}

Generate.Date = function(days = 0, months = 0, years = 0, format = 'DD-MM-YYYY')
{
    var date = moment();
    date = date.add(days, "d").add(months, "M").add(years, "y");

    return date.format(format);
}

Generate.Time = function(seconds = 0, minutes = 0, hours = 0, format = 'h:mm:ssa')
{
    var date = moment();
    date = date.add(hours, "s").add(minutes, "m").add(hours, "h");

    return date.format(format);
}

// Data Structures
var Page = function(url)
{
    this.url = url;
    this.config = new Map(); // <Config(Key), Boolean>
}

var Config = function(name)
{
    this.name = name;
    this.fields = new Map(); // <Field(String), Value(String)>
}

// Utilities
function deserialize(name, def)
{
    return eval(GM_getValue(name, (def || '({})')));
}

function serialize(name, val)
{
    GM_setValue(name, uneval(val));
}

var input = {};
input["text"] = function(field) 
{ 

};

input["password"] = function(field) // This is such a bad idea :c
{ 
    
};

input["number"] = function(field) 
{ 
    
};

input["radio"] = function(field) 
{ 
    
};

input["checkbox"] = function(field) 
{ 
    
};

input["select"] = function(field) 
{ 
    
};

input["textarea"] = function(field) 
{ 
    
};

// document.addEventListener('keydown', (event) => 
// {
//     switch(event.code) 
//     {
//         case "F1":
//         $(".autofield-overlay").toggleClass("autofield-overlay-enabled");
//         break;

//         case "F2": 
//         break;

//         case "F3":
//         break;
//     }
// });

// //
// //  AutoFieldJS Initialization
// //
// function AutoFieldJS() { };

// AutoFieldJS.Setup = function()
// {
//     var configs = {};
// }

// AutoFieldJS.Init = function()
// {
//     AutoFieldJS.Setup();
//     AutoFieldJS.InitUI();
// }

// AutoFieldJS.InitUI = function()
// {
//     // TIL about Template Literals
//     var autofieldCSS = `

//         body 
//         {
//             position: relative;
//         }

//         .autofield-header
//         {
//             text-align: center;
//             margin: 20px 0px;
//         }

//         .autofield-circle
//         {
//             position:fixed;
//             left: 20px;
//             bottom: 20px;
            
//             width:50px;
//             height:50px;

//             z-index:1000000;
//             border-radius: 50%;
//             background-color: black;
//         }

//         .autofield-circle:hover
//         {
//             background-color: grey;
//         }

//         .autofield-label
//         {
//             margin-right: 5px;
//         }

//         .autofield-select
//         {
//             width: 200px;
//         }

//         .autofield-btn
//         {
//             width: 80px;
//         }

//         .autofield-overlay 
//         {
//             display: none;
//             position:absolute;
//             z-index: 999999;
//             overflow:auto;

//             width:100%;
//             height:100%;

//             top: 0px;
//             left: 0px;

//             background: rgba(0, 0, 0, 0.33);
//         }

//         .autofield-container 
//         {
//             position:fixed;
//             padding: 50px;
//             top: 50%;
//             left: 50%;

//             width: 600px;

//             transform: translateX(-50%) translateY(-50%);

//             border-radius: 20px;
//             background: white;
//         }

//         .autofield-overlay-enabled
//         {
//             display: block;
//         }
//     `;

//     GM_addStyle(autofieldCSS);

//     var $autoFieldOverlay = $("<div>", {class:"autofield-overlay"});
//     var $autoFieldContainer = $("<div>", {class:"autofield-container"});
//     var $autoFieldPageConfig = $(`
//         <h1 class="autofield-header">AutoField.js</h1>
//         <p>
//             <label class="autofield-label">Select configuration to use: </label>
//             <select class="autofield-select">
//                 <option>Default</option>
//                 <option>Test2</option>
//                 <option>Test3</option>
//             </select>
//             <button class="autofield-btn">New</button>
//             <div style="border: 1px solid black; padding: 30px;">
//                 <p>Field 'Test': <input type="text" disabled readonly value="CONFIG"></input></p>
//                 <p>Field 'Test': <input type="text" disabled readonly value="CONFIG"></input></p>
//             </div>
//         </p>
//     `);
//     var $autoFieldEditCircle = $("<div>", {class:"autofield-circle"});
//     var $autoFieldContextMenu = $(`
//         <menu type="context" id="autofield-menu">
//             <menuitem label="AutoFieldJS: Add configuration for selected field">
//         </menu>
//     `);
//     $autoFieldEditCircle.click(function() 
//     {
//         $(".autofield-overlay").toggleClass("autofield-overlay-enabled")
//     });

//     if ($(document).height() <= $(window).height())
//     {
//         $(window).on("resize", function(){
//             var win = $(this);
//             $autoFieldOverlay.height(win.height());
//         });

//         $(window).trigger("resize");
//     }
    
//     $autoFieldOverlay.append($autoFieldContainer);
//     $autoFieldContainer.append($autoFieldPageConfig);
//     $("body").append($autoFieldContextMenu);
//     $("body").append($autoFieldOverlay);
//     $("body").append($autoFieldEditCircle);

//     $("input, select, textarea").attr("contextmenu", "autofield-menu");
// };

// AutoFieldJS.ClearAll = function()
// {
// }

// //
// //  Greasemonkey/Tampermonkey Field(s) Data/Configuration
// //
// var config;
// function Config() { };

// Config.Load = function(name) 
// {
//     // alert("URL: " + window.location.href + ", Hash: " + window.location.href.hashCode());

// };

// Config.Save = function() 
// {
//     alert(url);
// };

//
//  Script Logic
//
// AutoFieldJS.Init(); //Initiaizes UI/Overlay etc.
// Config.Load();