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

    function trim(str) {
        return $.trim((String(str)).replace(/[\r\n]+/g, ''));
    }

    describe.skip('Paste HTML contents', function () {

        var app, ed, form = $();

        beforeEach(function (done) {
            writer.getApp().launch().then(function () {
                app = this;
                return app.compose();
            }).then(function () {
                return app.setFormat('html');
            }).then(function () {
                ed = app.getEditor();
                form = app.getWindow().nodes.main.find('form');
                expect(ed).to.exist;
                expect(form).to.exist;
                expect(ed.getMode()).to.be.string('html');
                ed.clear();
                done();
            });
        });

        afterEach(function () {
            app.dirty(false).quit();
            expect(app.getEditor).to.not.exist;
            app = ed = form = null;
        });

        it('inserts simple example', function () {
            ed.paste('<p>Hello World</p>');
            expect(ed.getContent()).to.be.string('<p>Hello World</p>');
        });

        it('removes text color', function () {
            // remove color
            ed.paste('<p style="color: red">Hello World</p>');
            expect(ed.getContent()).to.be.string('<p>Hello World</p>');
        });

        it('does not mess up paragraphs and line-breaks', function () {
            // mixed p/br
            ed.paste('<p>Hello<br />World</p><p>one empty line, then this one</p>');
            expect(ed.getContent()).to.be.string('<p>Hello<br>World</p><p>one empty line, then this one</p>');
        });

        it('handles complex HTML right #1', function () {
            ed.paste(test1a);
            expect(ed.getContent()).to.be.string(trim(test1b));
        });

        it('handles complex HTML right #2', function () {
            ed.paste(test2a);
            expect(ed.getContent()).to.be.string(trim(test2b));
        });
    });
});
