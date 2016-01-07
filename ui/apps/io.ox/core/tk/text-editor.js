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

define('io.ox/core/tk/text-editor', [], function () {

    'use strict';

    // save jQuery val() - since tinyMCE is a bit too aggressive
    var val = $.original.val;

    function Editor(textarea, opt) {

        opt = _.extend({
            useFixedWithFont: false
        }, opt);

        $(textarea).append(
            textarea = $('<textarea>').attr('tabindex', 1).addClass('plain-text')
        );
        textarea.toggleClass('monospace', opt.useFixedWidthFont);

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

        var def = $.when(this),

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

        this.content_type = 'text/plain';

        this.getMode = function () {
            return 'text';
        };

        // publish internal 'done'
        this.done = function (fn) {
            return def.done(fn);
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
            // Remove whitespace above and below content and add newline before appended string
            content = this.getContent().replace(/\n+$/, '').replace(/^\n+/, '');
            this.setContent(content + '\n\n' + str);
        };

        this.prependContent = function (str) {
            // Remove whitespace above and below content and add newline before prepended string
            var content = this.getContent().replace(/^\n+/, '').replace(/\n+$/, '');
            this.setContent('\n' + str + '\n\n' + content);
        };

        this.setContentParts = function (data, type) {
            var content = '';
            // normalise
            data = _.isString(data) ? { content: data } : data;
            // concat content parts
            if (data.content) content += data.content;
            if (type === 'above' && data.cite) content += ('\n\n' + data.cite);
            if (data.quote) content += ('\n\n' + data.quote || '');
            if (type === 'below' && data.cite) content += ('\n\n' + data.cite);
            this.setContent(content);
        };

        // hint: does not detects the cite block
        this.getContentParts = function () {
            var content = this.getContent(),
                index = content.indexOf('\n> ');
            // special case: initial reply/forward
            if (content.substring(0, 2) === '> ') index = 0;
            if (index < 0) return { content: content };
            return {
                // content without trailing whitespace
                content: content.substring(0, index).replace(/\s+$/g, ''),
                quote: content.substring(index),
                cite: undefined
            };
        };

        this.insertPrevCite = function (str) {
            var data = this.getContentParts();
            // add cite
            data.cite = str;
            this.setContentParts(data, 'above');
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
            }
            return false;
        };

        this.show = function () {
            textarea.prop('disabled', false).show();

            _.defer(function () {
                textarea.css('minHeight', Math.max(300, ($(window).height() - textarea.offset().top - $('#io-ox-topbar').height())));
            });

            function resizeEditor() {
                textarea.css('minHeight', Math.max(300, ($(window).height() - textarea.offset().top - $('#io-ox-topbar').height())));
            }

            $(window).on('resize.text-editor', resizeEditor);
        };

        this.hide = function () {
            textarea.prop('disabled', true).hide();
            $(window).off('resize.text-editor');
        };

        this.getContainer = function () {
            return textarea;
        };

        this.destroy = function () {
            this.hide();
            this.setContent('');
            textarea = def = null;
        };
    }

    return Editor;

});
