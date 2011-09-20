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

define("io.ox/core/gettext", [], function() {
    
    function gettext(text) { return gettext.dpgettext("", "", text); }
    
    var pluralForm, domains = {};
    
    gettext.init = function(data) {
        pluralForm = data.plural;
        domains = { "": data };
    };

    gettext.noI18n = function(text) { return text; };
    
    gettext.gettext = gettext;
    gettext.pgettext = function(context, text) {
        return gettext.dpgettext("", context, text);
    };
    gettext.dpgettext = function(domain, context, text) {
        var dictionary = domains[domain];
        if (!dictionary) throw new Error("Invalid i18n domain: " + domain);
        var key = context ? context + "\x00" + text : text;
        return dictionary[key] || text;
    };
    
    gettext.ngettext = function(singular, plural, n) {
        return gettext.dnpgettext("", "", singular, plural, n);
    };
    gettext.npgettext = function(context, singular, plural, n) {
        return gettext.dnpgettext("", context, singular, plural, n);
    };
    gettext.dnpgettext = function(domain, context, singular, plural, n) {
        var dictionary = domains[domain];
        if (!dictionary) throw new Error("Invalid i18n domain: " + domain);
        var key = singular + "\x01" + plural;
        key = context ? context + "\x00" + key : key;
        var translation = dictionary[key];
        return translation ? translation[Number(pluralForm(Number(n)))] :
               Number(n) !== 1 ? plural : singular;
    };
    
    return gettext;
});