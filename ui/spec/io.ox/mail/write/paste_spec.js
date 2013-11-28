/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(
    ['io.ox/mail/write/main',
     'fixture!io.ox/mail/write/test_1a.txt',
     'fixture!io.ox/mail/write/test_1b.txt',
     'fixture!io.ox/mail/write/test_2a.txt',
     'fixture!io.ox/mail/write/test_2b.txt'
    ], function (writer, test1a, test1b, test2a, test2b) {

    'use strict';

    // helpers
    function Done(f) {
        f = function () { return !!f.value; };
        f.yep = function () { f.value = true; };
        return f;
    }

    function trim(str) {
        return $.trim((str + '').replace(/[\r\n]+/g, ''));
    }

    describe('Paste HTML contents', function () {

        var app = null, ed = null, form = $(),
            base = ox.base + '/apps/io.ox/mail/write/test';

        it('opens compose dialog', function () {

            var loaded = new Done();

            waitsFor(loaded, 'compose dialog');

            writer.getApp().launch().done(function () {
                app = this;
                app.compose().done(function () {
                    app.setFormat('html').done(function () {
                        ed = app.getEditor();
                        form = app.getWindow().nodes.main.find('form');
                        loaded.yep();
                        expect(ed).toBeDefined();
                        expect(form).toBeDefined();
                        expect(ed.getMode()).toBe('html');
                    });
                });
            });
        });

        it('inserts simple example', function () {
            runs(function () {
                // basic test
                ed.clear();
                ed.paste('<p>Hello World</p>');
                expect(ed.getContent()).toBe('<p>Hello World</p>');
            });
        });

        it('removes text color', function () {
            runs(function () {
                // remove color
                ed.clear();
                ed.paste('<p style="color: red">Hello World</p>');
                expect(ed.getContent()).toBe('<p>Hello World</p>');
            });
        });

        it('does not mess up paragraphs and line-breaks', function () {
            // mixed p/br
            ed.clear();
            ed.paste('<p>Hello<br />World</p><p>one empty line, then this one</p>');
            expect(ed.getContent()).toBe('<p>Hello<br>World</p><p>one empty line, then this one</p>');
        });

        it('handles complex HTML right #1', function () {
            ed.clear();
            ed.paste(test1a);
            expect(ed.getContent()).toBe(trim(test1b));
        });

        it('handles complex HTML right #2', function () {
            ed.clear();
            ed.paste(test2a);
            expect(ed.getContent()).toBe(trim(test2b));
        });

        it('closes compose dialog', function () {
            app.dirty(false).quit();
            expect(app.getEditor).toBeUndefined();
            app = ed = null;
        });
    });
});
