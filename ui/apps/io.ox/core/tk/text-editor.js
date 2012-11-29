/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/text-editor', [], function () {

    'use strict';

    // save jQuery val() - since tinyMCE is a bit too aggressive
    var val = $.original.val;

    function Editor(textarea) {

        textarea = $(textarea);

        var def = $.when(),

            trim = function (str) {
                return String(str || '').replace(/^[^\S\n]+/, '').replace(/^\n{3,}/, '').replace(/\s+$/, '');
            },

            set = function (str) {
                val.call(textarea, String(str ||  ''));
            },

            clear = function () {
                val.call(textarea, '');
            },

            get = function () {
                return trim(val.call(textarea));
            };

        this.getMode = function () {
            return 'text';
        };

        // publish internal 'done'
        this.done = function (fn) {
            def.done(fn);
            return def;
        };

        this.focus = function () {
            textarea.focus();
        };

        this.clear = clear;

        this.getContent = get;
        this.getPlainText = get;

        this.setContent = set;
        this.setPlainText = set;

        this.paste = $.noop;

        this.scrollTop = function (pos) {
            if (pos === undefined) {
                return textarea.scrollTop();
            } else if (pos === 'top') {
                textarea.scrollTop(0);
            } else if (pos === 'bottom') {
                textarea.scrollTop(textarea.get(0).scrollHeight);
            }
        };

        this.appendContent = function (str) {
            var content = this.getContent();
            this.setContent(content + '\n\n' + str);
        };

        this.replaceParagraph = function (str, rep) {
            var content = this.getContent(), pos, top;
            // exists?
            if ((pos = content.indexOf(str)) > -1) {
                // replace content
                top = this.scrollTop();
                this.setContent(content.substr(0, pos) + (rep || '') + content.substr(pos + str.length));
                this.scrollTop(top);
                return true;
            } else {
                return false;
            }
        };

        var resizeEditorMargin = (function () {
            // trick to force document reflow
            var alt = false;
            return _.debounce(function () {
                var w = Math.max(10, textarea.outerWidth() - 12 - 750);
                textarea.css('paddingRight', w + 'px');
                textarea.parents('.window-content').find('.editor-print-margin')
                    .css('right', Math.max(0, w - 10) + 'px').show();
                // force reflow
                textarea.css('display', (alt = !alt) ? 'block' : '');
            }, 100);
        }());

        this.handleShow = function () {
            textarea.removeAttr('disabled').idle().show()
                .next().hide();
            resizeEditorMargin();
            $(window).on('resize', resizeEditorMargin);

        };

        this.handleHide = function () {
            $(window).off('resize', resizeEditorMargin);
        };

        this.destroy = function () {
            this.handleHide();
            this.setContent('');
            textarea = def = null;
        };
    }

    return Editor;

});
