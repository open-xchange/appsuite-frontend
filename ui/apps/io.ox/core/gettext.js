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
        if (isTranslated(s) || $(node).closest('.noI18n').length) return;
        console.error(isDoubleTranslated(s) ? 'Double translated string' : 'Untranslated string', s, encodeURIComponent(s), node);
        $(node).css('backgroundColor', 'rgba(255, 192, 0, 0.5)');
    }

    function markTranslated(text) {
        return '\u200b' + text + '\u200c';
    }

    function isTranslated(text) {
        return (/^(\u200b[^\u200b\u200c]*\u200c|\s*)$/).test(text);
    }

    function isDoubleTranslated(text) {
        return (/^\u200b\u200b.+\u200c\u200c$/).test(text);
    }

    function gt(id, po) {
        po.plural = new Function("n", "return " + po.plural + ";");

        function gettext(text) {
            var args;
            text = gettext.pgettext("", text);
            if (arguments.length < 2) {
                return text;
            } else {
                args = Array.prototype.slice.call(arguments);
                args.splice(0, 1, text);
                return gettext.format.apply(gettext, args);
            }
        }

        if (_.url.hash('debug-i18n')) {
            gettext.format = function (text, params) {
                var args = _.isArray(params) ? [text].concat(params) :
                        Array.prototype.slice(arguments, 0);
                for (var i = 0; i < args.length; i++) {
                    var arg = String(args[i]);
                    if (isTranslated(arg)) {
                        arg = arg.slice(1, -1);
                    } else {
                        console.error("Untranslated printf parameter", i, arg);
                        console.trace();
                    }
                    args[i] = arg;
                }
                return markTranslated(_.printf.apply(this, args));
            };
            gettext.noI18n = markTranslated;
            gettext.pgettext = _.compose(markTranslated, pgettext);
            gettext.npgettext = _.compose(markTranslated, npgettext);
        } else {
            gettext.format = _.printf;
            gettext.noI18n = _.identity;
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

    // probably we can clean that up here since we now have "ox.language" right from the start
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
