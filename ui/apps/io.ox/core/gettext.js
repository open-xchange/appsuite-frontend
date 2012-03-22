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
        if (e.target.tagName in { SCRIPT: 1, STYLE: 1 }) return;
        debug(e.target);
        function debug(node) {
            if (node.nodeType === 3) {
                verify(node.data, node.parentNode);
            } else if (node.nodeType === 1) {
                _.each(node.childNodes, debug);
            }
        }
    }

    function verify(s, node) {
        if (s.charCodeAt(s.length - 1) !== 0x200b) {
            console.error("Untranslated string", s, node);
            $(node).css('backgroundColor', 'rgba(255, 192, 0, 0.5)');
        }
    }

    function gt(id, po) {
        var gettext;
        
        po.plural = new Function("n", "return " + po.plural + ";");

        if (_.url.hash('debug-i18n')) {
            gettext = function (text) {
                var args = new Array(arguments.length);
                args[0] = pgettext("", text);
                for (var i = 1; i < arguments.length; i++) {
                    var arg = String(arguments[i]);
                    if (arg.charCodeAt(arg.length - 1) === 0x200b) {
                        arg = arg.slice(-1);
                    } else {
                        console.error("Untranslated printf parameter", i, arg);
                        console.trace();
                    }
                    args[i] = arg;
                }
                return _.printf.apply(this, args) + '\u200b';
            };
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
            gettext = function (text) {
                text = pgettext("", text);
                return arguments.length > 1 ? _.printf.apply(this, arguments)
                                            : text;
            };
            gettext.noI18n = function (text) {
                return text;
            };
            gettext.pgettext = pgettext;
            gettext.npgettext = npgettext;
        }

        gettext.gettext = function (text) {
            return gettext.pgettext("", text);
        };

        gettext.ngettext = function (singular, plural, n) {
            return gettext.npgettext("", singular, plural, n);
        };

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
