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
    
    "use strict";
    
    function gt(id, po) {
        
        po.plural = new Function("n", "return " + po.plural + ";");
        
        function gettext(text) {
            return gettext.pgettext("", text);
        }
        
        gettext.noI18n = function (text) {
            return text;
        };
        
        gettext.gettext = gettext;
        gettext.pgettext = function (context, text) {
            var key = context ? context + "\x00" + text : text;
            return po.dictionary[key] || text;
        };
        
        gettext.ngettext = function (singular, plural, n) {
            return gettext.npgettext("", singular, plural, n);
        };
        gettext.npgettext = function (context, singular, plural, n) {
            var key = (context ? context + "\x00" : "") +
                    singular + "\x01" + plural,
                translation = po.dictionary[key];
            return translation ?
                translation[Number(po.plural(Number(n)))] :
                Number(n) !== 1 ? plural : singular;
        };
        
        return gettext;
    }
    
    var lang = new $.Deferred();
    
    gt.setLanguage = function (language) {
        gt.setLanguage = function (lang2) {
            if (lang2 !== language) {
                throw new Error("Multiple setLanguage calls");
            }
        };
        lang.resolve(language);
    };
    gt.getModule = function (name) {
        return lang.pipe(function (lang) {
            return name + "." + lang;
        });
    };
    
    return gt;
});
