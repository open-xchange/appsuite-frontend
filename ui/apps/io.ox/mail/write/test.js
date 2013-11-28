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

define('io.ox/mail/write/test',
    ['io.ox/mail/write/main',
     'io.ox/mail/api',
     'io.ox/mail/util',
     'io.ox/core/api/account',
     'io.ox/core/extensions',
     'io.ox/mail/sender',
     'io.ox/mail/write/test/html_send',
     'io.ox/mail/write/test/text_send',
     'io.ox/mail/write/test/html_reply'
    ], function (writer, mailAPI, mailUtil, accountAPI, ext) {

    'use strict';

    var TIMEOUT = ox.testTimeout;

    // helpers
    function Done() {
        var f = function () {
            return f.value;
        };
        f.value = false;
        f.yep = function () {
            f.value = true;
        };
        return f;
    }

    /*
     * Suite: Mail editor
     */
    ext.point('test/suite').extend({
        id: 'mail-editor',
        index: 200,
        test: function (j) {

            j.describe('Mail editor', function () {

                var app = null, ed = null;

                j.it('opens compose dialog in TEXT mode', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'compose dialog', TIMEOUT);

                    writer.getApp().launch().done(function () {
                        app = this;
                        app.compose().done(function () {
                            app.setFormat('text').done(function () {
                                ed = app.getEditor();
                                loaded.yep();
                                j.expect(ed).toBeDefined();
                                j.expect(ed.getMode()).toEqual('text');
                            });
                        });
                    });
                });

                j.it('sets TEXT content', function () {
                    ed.setContent('  Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n');
                    j.expect(ed.getContent())
                        .toEqual('Hallo Welt\nLine #1\nLine #3\n\nNext paragraph');
                });

                j.it('appends TEXT content', function () {
                    ed.appendContent('---\nCould be a signature');
                    j.expect(ed.getContent())
                        .toEqual('Hallo Welt\nLine #1\nLine #3\n\nNext paragraph\n\n---\nCould be a signature');
                });

                j.it('removes TEXT', function () {
                    ed.replaceParagraph('---\nCould be a signature', '');
                    j.expect(ed.getContent())
                        .toEqual('Hallo Welt\nLine #1\nLine #3\n\nNext paragraph');
                });

                j.it('clears all content', function () {
                    ed.clear();
                    j.expect(ed.getContent()).toEqual('');
                });

                j.it('scrolls to bottom', function () {
                    ed.setContent(new Array(500).join('All work and no play makes Bart a dull boy\n'));
                    ed.scrollTop('bottom');
                    j.expect(ed.scrollTop()).toBeGreaterThan(0);
                });

                j.it('scrolls back to top', function () {
                    ed.scrollTop('top');
                    j.expect(ed.scrollTop()).toEqual(0);
                });

                j.it('replaces TEXT properly', function () {
                    ed.setContent('All work and no play makes Bart a dull boy');
                    ed.replaceParagraph('Bart', 'me');
                    j.expect(ed.getContent())
                        .toEqual('All work and no play makes me a dull boy');
                });

                j.it('changes editor mode to HTML', function () {

                    var changed = new Done();
                    j.waitsFor(changed, 'HTML mode', TIMEOUT);

                    app.setFormat('html').done(function () {
                        ed = app.getEditor();
                        changed.yep();
                        j.expect(ed.getContent())
                            .toEqual('<p>All work and no play makes me a dull boy</p>');
                    });
                });

                j.it('sets HTML content', function () {
                    ed.setContent('<p>Hello World<br>Line #2</p><p></p><p><br><p>');
                    j.expect(ed.getContent())
                        .toEqual('<p>Hello World<br>Line #2</p>');
                });

                j.it('appends TEXT content in HTML mode properly', function () {
                    ed.appendContent('Yeah\nI am just plain text');
                    j.expect(ed.getContent())
                        .toEqual('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
                });

                j.it('removes a specific paragraph', function () {
                    ed.replaceParagraph('<p>Yeah<br>I am just plain text</p>', '');
                    j.expect(ed.getContent())
                        .toEqual('<p>Hello World<br>Line #2</p>');
                });

                j.it('appends HTML content in HTML mode properly', function () {
                    ed.appendContent('<p>Yeah<br>I am just plain text</p><p></p>');
                    j.expect(ed.getContent())
                        .toEqual('<p>Hello World<br>Line #2</p><p>Yeah<br>I am just plain text</p>');
                });

                j.it('clears all content', function () {
                    ed.clear();
                    j.expect(ed.getContent()).toEqual('');
                });

                j.it('scrolls to bottom', function () {
                    ed.setContent(new Array(500).join('All work and no play makes Bart a dull boy<br>'));
                    ed.scrollTop('bottom');
                    j.expect(ed.scrollTop()).toBeGreaterThan(0);
                });

                j.it('scrolls back to top', function () {
                    ed.scrollTop('top');
                    j.expect(ed.scrollTop()).toEqual(0);
                });

                j.it('replaces a specific paragraph', function () {
                    ed.setContent('<p>All work and no play makes me a dull boy</p>');
                    ed.replaceParagraph('<p>All work and no play makes me a dull boy</p>', '<p>YEAH</p>');
                    j.expect(ed.getContent()).toEqual('<p>YEAH</p>');
                });

                j.it('switches back to TEXT mode', function () {

                    ed.setContent('<p><b>Paragraph &lt;#1&gt;</b><br>Line #2</p><h1>Headline</h1><p>Paragraph #2</p>');

                    var changed = new Done();
                    j.waitsFor(changed, 'TEXT mode', TIMEOUT);

                    app.setFormat('text').done(function () {
                        ed = app.getEditor();
                        changed.yep();
                        j.expect(ed.getMode()).toEqual('text');
                        j.expect(ed.getContent())
                            .toEqual('Paragraph <#1>\nLine #2\n\nHeadline\n\nParagraph #2');
                    });
                });

                j.it('switches back to HTML mode', function () {

                    var changed = new Done();
                    j.waitsFor(changed, 'HTML mode', TIMEOUT);

                    app.setFormat('html').done(function () {
                        ed = app.getEditor();
                        changed.yep();
                        j.expect(ed.getContent())
                            .toEqual('<p>Paragraph &lt;#1&gt;<br>Line #2</p><p>Headline</p><p>Paragraph #2</p>');
                    });
                });

                j.it('switches back and forth between TEXT and HTML mode (robustness test)', function () {

                    app.setFormat('text');
                    app.setFormat('html');
                    app.setFormat('html');
                    app.setFormat('text');
                    app.setFormat('text');
                    app.setFormat('html');

                    var check1 = new Done();
                    j.waitsFor(check1, 'checkpoint #1', TIMEOUT);

                    app.setFormat('text').done(function () {
                        ed = app.getEditor();
                        check1.yep();
                        j.expect(ed.getContent())
                            .toEqual('Paragraph <#1>\nLine #2\n\nHeadline\n\nParagraph #2');
                    });

                    var check2 = new Done();
                    j.waitsFor(check2, 'checkpoint #2', TIMEOUT);

                    app.setFormat('html').done(function () {
                        ed = app.getEditor();
                        check2.yep();
                        j.expect(ed.getContent())
                            .toEqual('<p>Paragraph &lt;#1&gt;<br>Line #2</p><p>Headline</p><p>Paragraph #2</p>');
                    });
                });

                j.it('closes compose dialog', function () {
                    app.dirty(false).quit();
                    j.expect(app.getEditor).toBeUndefined();
                    app = ed = null;
                });
            });
        }
    });
});
