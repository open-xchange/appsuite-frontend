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

    if (_.url.hash('debug-i18n')) {
        try {
            $(document).on('DOMAttrModified', debugAttr)
                .on('DOMCharacterDataModified', debugData)
                .on('DOMNodeInserted', debugNode);
        } catch (e) {
            console.error(e);
        }
    }

    function debugAttr(e) {
        if (e.originalEvent.attrName in { title: 1, value: 1 })
            verify(e.originalEvent.newValue, e.target);
    }

    function debugData(e) {
        verify(e.originalEvent.newValue, e.target);
    }

    function debugNode(e) {
        if (e.target.tagName in { TITLE: 1, SCRIPT: 1, STYLE: 1 }) return;
        debug(e.target);
        function debug(node) {
            if (node.nodeType === 3) {
                verify(node.data, node);
            } else if (node.nodeType === 1) {
                _.each(node.childNodes, debug);
            }
        }
    }

    function verify(s, node) {
        if (s.charCodeAt(s.length - 1) !== 0x200b) {
            console.error("Untranslated string", s, node.parentNode);
            $(node.parentNode).css('backgroundColor', 'rgba(255, 192, 0, 0.5)');
        }
    }

    function gt(id, po) {

        po.plural = new Function("n", "return " + po.plural + ";");

        function gettext(text) {
            return gettext.pgettext("", text);
        }

        gettext.gettext = gettext;

        gettext.ngettext = function (singular, plural, n) {
            return gettext.npgettext("", singular, plural, n);
        };

        if (_.url.hash('debug-i18n')) {
            gettext.noI18n = function (text) {
                return text + '\u200b';
            };
            gettext.pgettext = function () {
                return pgettext.apply(this, arguments) + '\u200b';
            };
            gettext.npgettext = function () {
                return npgettext.apply(this, arguments) + '\u200b';
            };
        } else {
            gettext.noI18n = function (text) {
                return text;
            };
            gettext.pgettext = pgettext;
            gettext.npgettext = npgettext;
        }

        function pgettext(context, text) {
            var key = context ? context + "\x00" + text : text;
            return po.dictionary[key] || text;
        }

        function npgettext(context, singular, plural, n) {
            var key = (context ? context + "\x00" : "") +
                    singular + "\x01" + plural,
                translation = po.dictionary[key];
            return translation ?
                translation[Number(po.plural(Number(n)))] :
                Number(n) !== 1 ? plural : singular;
        }

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

    gt.language = lang.promise();

    return gt;
});
