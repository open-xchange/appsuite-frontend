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

define('io.ox/mail/write/test',
    ['io.ox/mail/write/main',
     'io.ox/core/extensions'], function (writer, ext) {

    'use strict';

    var paste;

    ext.point('test/suite').extend({
        id: 'mail-paste',
        test: function (j) {
            paste(j);
        }
    });

    paste = function (j) {

        var app, ed,
            base = ox.base + '/apps/io.ox/mail/write/test';

        function clear() {
            ed.setContent('');
            ed.execCommand('SelectAll');
        }

        function trim(str) {
            return $.trim((str + '').replace(/[\r\n]+/g, ''));
        }

        function get() {
            // get editor content (trim white-space and clean up pseudo XHTML)
            return trim(ed.getContent()).replace(/<(\w+)[ ]?\/>/g, '<$1>');
        }

        j.describe('Paste content into TinyMCE', function () {

            j.it('opens compose dialog', function () {

                var loaded = false;

                j.waitsFor(function () {
                    return loaded;
                }, 'Could not load compose dialog', 5000);

                writer.getApp().launch().done(function () {
                    app = this;
                    app.compose().done(function () {
                        ed = app.getTinyMCE();
                        loaded = true;
                        j.expect(ed).toBeDefined();
                    });
                });
            });

            j.it('inserts simple example', function () {
                j.runs(function () {
                    // basic test
                    clear();
                    ed.execCommand('mceInsertClipboardContent', false, {
                        content: '<p>Hello World</p>'
                    });
                    j.expect(get()).toEqual('<p>Hello World</p>');
                });
            });

            j.it('removes text color', function () {
                j.runs(function () {
                    // remove color
                    clear();
                    ed.execCommand('mceInsertClipboardContent', false, {
                        content: '<p style="color: red">Hello World</p>'
                    });
                    j.expect(get()).toEqual('<p>Hello World</p>');
                });
            });

            j.it('does not mess up paragraphs and line-breaks', function () {
                // mixed p/br
                clear();
                ed.execCommand('mceInsertClipboardContent', false, {
                    content: '<p>Hello<br />World</p><p>one empty line, then this one</p>'
                });
                j.expect(get()).toEqual('<p>Hello<br>World</p><p>one empty line, then this one</p>');
            });

            j.it('handles complex HTML right #1', function () {
                // complex test cases
                var loaded = false;
                j.waitsFor(function () {
                    return loaded;
                }, 'Could not load paste content', 5000);

                $.when(
                    $.get(base + '/test_1a.html'),
                    $.get(base + '/test_1b.html')
                )
                .done(function (a, b) {
                    clear();
                    ed.execCommand('mceInsertClipboardContent', false, { content: a[0] });
                    loaded = true;
                    j.expect(get()).toEqual(trim(b[0]));
                });
            });

            j.it('handles complex HTML right #2', function () {
                // complex test cases
                var loaded = false;
                j.waitsFor(function () {
                    return loaded;
                }, 'Could not load paste content', 5000);

                $.when(
                    $.get(base + '/test_2a.html'),
                    $.get(base + '/test_2b.html')
                )
                .done(function (a, b) {
                    clear();
                    ed.execCommand('mceInsertClipboardContent', false, { content: a[0] });
                    loaded = true;
                    j.expect(get()).toEqual(trim(b[0]));
                });
            });

            j.it('closes compose dialog', function () {
                app.quit();
                j.expect(app.getTinyMCE).toBeUndefined();
            });
        });
    };
});