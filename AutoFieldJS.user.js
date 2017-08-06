// ==UserScript==
// @name        AutoFieldJS
// @namespace   devsfiq
// @description Configurable Automation
// @include     *
// @version     0.0.1
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
    this._data.push({
        field: fieldName,
        value: value
    });
}

Config.prototype.removeField = function(fieldName) {
    // var index = _.findIndex(this._data, function(o) { ;
    //     return o.field == fieldName;
    // });
    // this._data = 

    this._data = _.without(this._data, this.getField(fieldName));
}

var test = new Config('Test');
console.log(test.getField('Foo'));
console.log(test);
test.addField('Foo', 'Bar');

console.log(test);
console.log(test.getField('Foo'));
console.log(test.fieldExists('Foo'));

test.removeField('Foo');

console.log(test);
console.log(test.getField('Foo'));
console.log(test.fieldExists('Foo'));

var PageConfig = function(url, data = []) {
    this.url = url;
    this._data = data;
}