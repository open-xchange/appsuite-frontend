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
     'io.ox/mail/api',
     'io.ox/core/api/account',
     'fixture!io.ox/mail/write/email.json',
     'fixture!io.ox/mail/write/accounts.json'], function (writer, mailAPI, accountAPI, fixtureEmail, fixtureAccounts) {

    'use strict';

    describe('Mail editor', function () {

        var app, ed, form = $();

        beforeEach(function (done) {
            writer.getApp().launch().then(function () {
                app = this;
                return app.compose();
            }).then(function () {
                done();
            });
        });

        afterEach(function () {
            app.dirty(false).quit();
            expect(app.getEditor).to.not.exist;
            app = ed = form = null;
        });

        describe('opens compose dialog in TEXT mode', function (done) {

            beforeEach(function (done) {
                app.setFormat('text').done(function () {
                    ed = app.getEditor();
                    form = app.getWindow().nodes.main.find('form');
                    expect(ed).to.exist;
                    expect(form).to.exist;
                    expect(ed.getMode()).to.be.string('text');
                    ed.clear();
                    done();
                });
            });

            it('sets TEXT content', function () {
                ed.setContent('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n');
                expect(ed.getContent()).to.be.string('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph');
            });

            it('appends TEXT content', function () {
                ed.setContent('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n');
                ed.appendContent('---\nCould be a signature');
                expect(ed.getContent()).to.be.string('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n---\nCould be a signature');
            });

            it('removes TEXT', function () {
                ed.setContent('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n---\nCould be a signature');
                ed.replaceParagraph('---\nCould be a signature', '');
                expect(ed.getContent()).to.be.string('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph');
            });

            it('clears all content', function () {
                ed.clear();
                expect(ed.getContent()).to.be.string('');
            });

            it('scrolls to bottom (TEXT)', function () {
                ed.setContent(new Array(500).join('All work and no play makes Bart a dull boy\n'));
                // limit height
                ed.getContainer().css('height', '100px');
                // now scrol to bottom
                ed.scrollTop('bottom');
                expect(ed.scrollTop()).to.be.above(0);
            });

            it('scrolls back to top (TEXT)', function () {
                ed.scrollTop('top');
                expect(ed.scrollTop()).to.equal(0);
            });

            it('replaces TEXT properly', function () {
                ed.setContent('All work and no play makes Bart a dull boy');
                ed.replaceParagraph('Bart', 'me');
                expect(ed.getContent()).to.be.string('All work and no play makes me a dull boy');
            });

            it('changes editor mode to HTML', function (done) {
                ed.setContent('All work and no play makes me a dull boy');
                expect(ed.getContent()).to.be.string('All work and no play makes me a dull boy');
                app.setFormat('html').done(function () {
                    ed = app.getEditor();
                    expect(ed.getContent()).to.be.string('<p>All work and no play makes me a dull boy</p>');
                    done();
                });
            });

        });


        describe('opens compose dialog in HTML mode', function (done) {

            beforeEach(function (done) {
                app.setFormat('html').done(function () {
                    ed = app.getEditor();
                    form = app.getWindow().nodes.main.find('form');
                    expect(ed).to.exist;
                    expect(form).to.exist;
                    expect(ed.getMode()).to.be.string('html');
                    ed.clear();
                    done();
                });
            });

            it('sets HTML content', function () {
                ed.setContent('<p>Hello World<br>Line #2</p><p></p><p><br><p>');
                expect(ed.getContent()).to.be.string('<p>Hello World<br>Line #2</p>');
            });

            it('appends TEXT content in HTML mode properly', function () {
                ed.setContent('<p>Hello World<br>Line #2</p>');
                ed.appendContent('Yeah\nI am just plain text');
                expect(ed.getContent()).to.be.string('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
            });

            it('removes a specific paragraph', function () {
                ed.setContent('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
                ed.replaceParagraph('<p>Yeah<br>I am just plain text</p>', '');
                expect(ed.getContent()).to.be.string('<p>Hello World<br>Line #2</p>');
            });

            it('appends HTML content in HTML mode properly', function () {
                ed.setContent('<p>Hello World<br>Line #2</p>');
                ed.appendContent('<p>Yeah<br>I am just plain text</p><p></p>');
                expect(ed.getContent()).to.be.string('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
            });

            it('clears all content', function () {
                ed.setContent('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
                ed.clear();
                expect(ed.getContent()).to.be.string('');
            });

            // does not work in phantomjs due to: https://github.com/ariya/phantomjs/issues/10581
            xit('scrolls to bottom (HTML)', function () {
                ed.setContent(new Array(500).join('All work and no play makes Bart a dull boy<br>'));
                ed.scrollTop('bottom');
                expect(ed.scrollTop()).to.be.above(0);
            });

            it('scrolls back to top (HTML)', function () {
                ed.scrollTop('top');
                expect(ed.scrollTop()).to.equal(0);
            });

            it('replaces a specific paragraph', function () {
                ed.setContent('<p>All work and no play makes me a dull boy</p>');
                ed.replaceParagraph('<p>All work and no play makes me a dull boy</p>', '<p>YEAH</p>');
                expect(ed.getContent()).to.be.string('<p>YEAH</p>');
            });

            it('switches back to TEXT mode', function (done) {

                ed.setContent('<p><b>Paragraph &lt;#1&gt;</b><br>Line #2</p><h1>Headline</h1><p>Paragraph #2</p>');

                app.setFormat('text').done(function () {
                    ed = app.getEditor();
                    expect(ed.getMode()).to.be.string('text');
                    expect(ed.getContent()).to.be.string('Paragraph <#1>\nLine #2\n\nHeadline\n\nParagraph #2');
                    done();
                });
            });

            it('switches back to HTML mode', function (done) {

                app.setFormat('text').done(function () {
                    ed = app.getEditor();
                    ed.setContent('Paragraph <#1>\nLine #2\n\nHeadline\n\nParagraph #2');

                    app.setFormat('html').done(function () {
                        ed = app.getEditor();
                        expect(ed.getContent()).to.be.string('<p>Paragraph &lt;#1&gt;<br>Line #2</p><p>Headline</p><p>Paragraph #2</p>');
                        done();
                    });
                });
            });

        });
    });
});
