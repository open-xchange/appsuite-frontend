/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/tk/text-editor', function () {

    'use strict';

    // save jQuery val() - since tinyMCE is a bit too aggressive
    var val = $.original.val;

    function Editor(textarea) {

        textarea = $(textarea);

        if (_.device('tablet && iOS >= 6')) {
            textarea.on('click', function () {
                if (textarea.get(0).selectionStart < 100) {
                    _.defer(function () {
                        window.scrollTo(0, 0);
                        document.body.scrollTop = 0;
                    });
                }
            });
        }

        var def = $.when(),

            trimEnd = function (str) {
                // ensure we have a string
                str = String(str || '');
                // remove white-space at end
                return str.replace(/[\s\xA0]+$/, '');
            },

            trim = function (str) {
                str = trimEnd(str);
                // reduce leading line-feeds
                str = str.replace(/^\n{2,}/, '\n\n');
                // ignore valid white-space pattern at beginning (see Bug 26316)
                if (/^\n{0,2}[ \t\xA0]*\S/.test(str)) return str;
                // remove white-space
                str = str.replace(/^[\s\xA0]*\n([\s\xA0]*\S)/, '$1');

                // remove trailing white-space, line-breaks, and empty paragraphs
                str = str.replace(
                    /(\s|&nbsp;|\0x20|<br\/?>|<p( class="io-ox-signature")>(&nbsp;|\s|<br\/?>)*<\/p>)*$/g, ''
                );

                return str;
            },

            set = function (str) {
                val.call(textarea, trimEnd(str));
                this.setCaretPosition();
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
            // no autofocus on smartphone and for iOS in special (see bug #36921)
            if (_.device('!smartphone && !iOS')) textarea.focus();
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

        this.setCaretPosition = function () {
            if (!textarea) return;
            var el = textarea.get(0);
            function fnSetCaretPosition() {
                // Prevent NS_ERROR_FAILURE in Firefox
                if (document.activeElement && document.activeElement.nodeName.toLowerCase() !== 'textarea') return;
                if (el.setSelectionRange) {
                    el.setSelectionRange(0, 0);
                } else if (el.createTextRange) {
                    var range = el.createTextRange();
                    range.moveStart('character', 0);
                    range.select();
                }
            }
            fnSetCaretPosition();
            // Defer is needed on Chrome, but causes Error in Firefox
            if (_.browser.Chrome) _.defer(fnSetCaretPosition);
            textarea.scrollTop(0);
        };

        this.appendContent = function (str) {
            var content = this.getContent();
            this.setContent(content + '\n\n' + str);
        };

        this.prependContent = function (str) {
            var content = this.getContent();
            this.setContent(str + '\n\n' + content);
        };

        this.replaceParagraph = function (str, rep) {
            var content = this.getContent(), pos, top;
            // exists?
            if ((pos = content.indexOf(str.trim())) > -1) {
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
            return _.debounce(function () {
                //textarea might be destroyed already
                if (!textarea) return;
                var h = $(window).height(),
                    top = textarea.offset().top;
                textarea.css('minHeight', (h - top - 40));
            }, 100);
        }());

        this.handleShow = function (compose) {
            textarea.prop('disabled', false).idle().show();
            if (!compose) {
                textarea.next().hide();
                textarea.parents('.window-content').find('.mce-tinymce').hide();
                resizeEditorMargin();
                $(window).on('resize.text-editor', resizeEditorMargin);
            } else {
                textarea.parents('.window-content').find('.editable-toolbar').hide().next().hide();
                resizeEditorMargin();
                $(window).on('resize.text-editor', resizeEditorMargin);
            }

        };

        this.handleHide = function () {
            $(window).off('resize.text-editor');
        };

        this.getContainer = function () {
            return textarea;
        };

        this.destroy = function () {
            this.handleHide();
            this.setContent('');
            textarea = def = null;
        };
    }

    return Editor;

});
