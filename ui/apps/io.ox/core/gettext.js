/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Viktor Pracht <viktor.pracht@open-xchange.com>
 */

define("io.ox/core/gettext", [], function () {
    
    var modules = {};
    
    function gt(id, po) {
        if (po) {
            po.plural = Function("n", "return " + po.plural + ";");
        }
        modules[id] = po;
        
        function gettext(text) {
            return gettext.pgettext("", text);
        }
        
        gettext.enable = function () {
            modules[id] = po;
        };
        
        gettext.noI18n = function (text) {
            return text;
        };
        
        gettext.gettext = gettext;
        gettext.pgettext = function (context, text) {
            var key = context ? context + "\x00" + text : text;
            return modules[id].dictionary[key] || text;
        };
        
        gettext.ngettext = function (singular, plural, n) {
            return gettext.npgettext("", singular, plural, n);
        };
        gettext.npgettext = function (context, singular, plural, n) {
            var key = singular + "\x01" + plural;
            key = context ? context + "\x00" + key : key;
            var translation = modules[id].dictionary[key];
            return translation ?
                translation[Number(modules[id].plural(Number(n)))] :
                Number(n) !== 1 ? plural : singular;
        };
        
        return gettext;
    }
    
    var lang;
    gt.setLanguage = function (language) {
        function enableModule(module) {
            module.enable();
        }
        var deferreds = [];
        if (language !== lang) {
            lang = language;
            for (var i in modules) {
                deferreds.push(require([gt.getModule(i)], enableModule));
            }
        }
        return $.when.apply($, deferreds);
    };
    gt.getModule = function (name) {
        return lang ? name + "." + lang : undefined;
    };
    
    return gt;
});