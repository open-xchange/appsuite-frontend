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

    // helpers
    function Done(f) {
        f = function () { return !!f.value; };
        f.yep = function () { f.value = true; };
        return f;
    }

    describe('Mail editor', function () {

        var app = null, ed = null;

        it('opens compose dialog in TEXT mode', function () {

            var loaded = new Done();

            waitsFor(loaded, 'compose dialog');

            writer.getApp().launch().done(function () {
                app = this;
                app.compose().done(function () {
                    app.setFormat('text').done(function () {
                        ed = app.getEditor();
                        loaded.yep();
                        expect(ed).toBeDefined();
                        expect(ed.getMode()).toEqual('text');
                    });
                });
            });
        });

        it('sets TEXT content', function () {
            ed.setContent('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n');
            expect(ed.getContent()).toBe('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph');
        });

        it('appends TEXT content', function () {
            ed.appendContent('---\nCould be a signature');
            expect(ed.getContent()).toBe('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n---\nCould be a signature');
        });

        it('removes TEXT', function () {
            ed.replaceParagraph('---\nCould be a signature', '');
            expect(ed.getContent()).toBe('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph');
        });

        it('clears all content', function () {
            ed.clear();
            expect(ed.getContent()).toBe('');
        });

        it('scrolls to bottom (TEXT)', function () {
            ed.setContent(new Array(500).join('All work and no play makes Bart a dull boy\n'));
            // limit height
            ed.getContainer().css('height', '100px');
            // now scrol to bottom
            ed.scrollTop('bottom');
            expect(ed.scrollTop()).toBeGreaterThan(0);
        });

        it('scrolls back to top (TEXT)', function () {
            ed.scrollTop('top');
            expect(ed.scrollTop()).toBe(0);
        });

        it('replaces TEXT properly', function () {
            ed.setContent('All work and no play makes Bart a dull boy');
            ed.replaceParagraph('Bart', 'me');
            expect(ed.getContent()).toBe('All work and no play makes me a dull boy');
        });

        it('changes editor mode to HTML', function () {

            var changed = new Done();
            waitsFor(changed, 'HTML mode');

            app.setFormat('html').done(function () {
                ed = app.getEditor();
                changed.yep();
                expect(ed.getContent()).toBe('<p>All work and no play makes me a dull boy</p>');
            });
        });

        it('sets HTML content', function () {
            ed.setContent('<p>Hello World<br>Line #2</p><p></p><p><br><p>');
            expect(ed.getContent()).toBe('<p>Hello World<br>Line #2</p>');
        });

        it('appends TEXT content in HTML mode properly', function () {
            ed.appendContent('Yeah\nI am just plain text');
            expect(ed.getContent()).toBe('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
        });

        it('removes a specific paragraph', function () {
            ed.replaceParagraph('<p>Yeah<br>I am just plain text</p>', '');
            expect(ed.getContent()).toBe('<p>Hello World<br>Line #2</p>');
        });

        it('appends HTML content in HTML mode properly', function () {
            ed.appendContent('<p>Yeah<br>I am just plain text</p><p></p>');
            expect(ed.getContent()).toBe('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
        });

        it('clears all content', function () {
            ed.clear();
            expect(ed.getContent()).toEqual('');
        });

        // does not work in phantomjs due to: https://github.com/ariya/phantomjs/issues/10581
        xit('scrolls to bottom (HTML)', function () {
            ed.setContent(new Array(500).join('All work and no play makes Bart a dull boy<br>'));
            ed.scrollTop('bottom');
            expect(ed.scrollTop()).toBeGreaterThan(0);
        });

        it('scrolls back to top (HTML)', function () {
            ed.scrollTop('top');
            expect(ed.scrollTop()).toEqual(0);
        });

        it('replaces a specific paragraph', function () {
            ed.setContent('<p>All work and no play makes me a dull boy</p>');
            ed.replaceParagraph('<p>All work and no play makes me a dull boy</p>', '<p>YEAH</p>');
            expect(ed.getContent()).toBe('<p>YEAH</p>');
        });

        it('switches back to TEXT mode', function () {

            ed.setContent('<p><b>Paragraph &lt;#1&gt;</b><br>Line #2</p><h1>Headline</h1><p>Paragraph #2</p>');

            var changed = new Done();
            waitsFor(changed, 'TEXT mode');

            app.setFormat('text').done(function () {
                ed = app.getEditor();
                changed.yep();
                expect(ed.getMode()).toBe('text');
                expect(ed.getContent()).toBe('Paragraph <#1>\nLine #2\n\nHeadline\n\nParagraph #2');
            });
        });

        it('switches back to HTML mode', function () {

            var changed = new Done();
            waitsFor(changed, 'HTML mode');

            app.setFormat('html').done(function () {
                ed = app.getEditor();
                changed.yep();
                expect(ed.getContent()).toBe('<p>Paragraph &lt;#1&gt;<br>Line #2</p><p>Headline</p><p>Paragraph #2</p>');
            });
        });

        it('switches back and forth between TEXT and HTML mode (robustness test)', function () {

            app.setFormat('text');
            app.setFormat('html');
            app.setFormat('html');
            app.setFormat('text');
            app.setFormat('text');
            app.setFormat('html');

            var check1 = new Done();
            waitsFor(check1, 'checkpoint #1');

            app.setFormat('text').done(function () {
                ed = app.getEditor();
                check1.yep();
                expect(ed.getContent()).toBe('Paragraph <#1>\nLine #2\n\nHeadline\n\nParagraph #2');
            });

            var check2 = new Done();
            waitsFor(check2, 'checkpoint #2');

            app.setFormat('html').done(function () {
                ed = app.getEditor();
                check2.yep();
                expect(ed.getContent()).toBe('<p>Paragraph &lt;#1&gt;<br>Line #2</p><p>Headline</p><p>Paragraph #2</p>');
            });
        });

        it('closes compose dialog', function () {
            app.dirty(false).quit();
            expect(app.getEditor).toBeUndefined();
            app = ed = null;
        });
    });
});
