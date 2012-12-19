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
     'io.ox/mail/api',
     'io.ox/core/api/account',
     'io.ox/core/extensions',
     'io.ox/mail/write/test/html_send',
     'io.ox/mail/write/test/text_send',
     'io.ox/mail/write/test/html_reply'], function (writer, mailAPI, accountAPI, ext) {

    'use strict';

    var base = ox.base + '/apps/io.ox/mail/write/test',
        TIMEOUT = ox.testTimeout;

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

    function trim(str) {
        return $.trim((str + '').replace(/[\r\n]+/g, ''));
    }

    /*
     * Suite: Compose mail
     */
    ext.point('test/suite').extend({
        id: 'mail-compose',
        index: 100,
        test: function (j) {

            j.describe('Compose email', function () {

                var app = null, ed = null, form = null;

                j.it('opens compose dialog in HTML mode', function () {

                    var loaded = new Done();

                    j.waitsFor(loaded, 'compose dialog', TIMEOUT);

                    writer.getApp().launch().done(function () {
                        app = this;
                        app.compose().done(function () {
                            app.setFormat('html').done(function () {
                                ed = app.getEditor();
                                form = app.getWindow().nodes.main.find('form');
                                loaded.yep();
                                j.expect(ed).toBeDefined();
                                j.expect(form).toBeDefined();
                                j.expect(ed.getMode()).toEqual('html');
                            });
                        });
                    });
                });

                j.it('adds recipient', function () {
                    // enter email address and press <enter>
                    form.find('input[data-type=to]').val('otto.xentner@io.ox')
                        .focus()
                        .trigger($.Event('keyup', { which: 13 }));
                    // check for proper DOM node
                    var to = form.find('.recipient-list input[type=hidden][name=to]');
                    j.expect(to.val())
                        .toEqual('"otto.xentner" <otto.xentner@io.ox>');
                });

                j.it('adds recipient with display name', function () {
                    // enter email address and press <enter>
                    form.find('input[data-type=to]').val('"Otto X." <otto.xentner@io.ox>')
                        .focus()
                        .trigger($.Event('keyup', { which: 13 }));
                    // check for proper DOM node
                    var to = form.find('.recipient-list input[type=hidden][name=to]').last();
                    j.expect(to.val())
                        .toEqual('"Otto X." <otto.xentner@io.ox>');
                });

                j.it('adds recipient by focussing another element', function () {
                    // enter email address and blur
                    form.find('input[data-type=to]').val('"Otto;must escape,this" <otto.xentner@io.ox>')
                        .focus().blur(); // IE has delay when focusing another element
                    // check for proper DOM node
                    var to = form.find('.recipient-list input[type=hidden][name=to]').last();
                    j.expect(to.val())
                        .toEqual('"Otto;must escape,this" <otto.xentner@io.ox>');
                });

                j.it('adds multiple recipients at once', function () {
                    // enter email address and blur
                    form.find('input[data-type=to]')
                        .val(' "Otto;must escape,this" <otto.xentner@io.ox>; "Hannes" <hannes@ox.io>, ' +
                                'Horst <horst@ox.io>;, ')
                        .focus().blur();
                    // check for proper DOM node
                    var to = form.find('.recipient-list input[type=hidden][name=to]').slice(-3);
                    j.expect(true)
                        .toEqual(
                            to.eq(0).val() === '"Otto;must escape,this" <otto.xentner@io.ox>' &&
                            to.eq(1).val() === '"Hannes" <hannes@ox.io>' &&
                            to.eq(2).val() === '"Horst" <horst@ox.io>'
                        );
                });

                j.it('opens CC section', function () {
                    // open section
                    form.find('[data-section-link=cc]').trigger('click');
                    var section = form.find('[data-section=cc]:visible');
                    j.expect(section.length)
                        .toEqual(1);
                });

                j.it('adds recipient to CC', function () {
                    // enter email address and press <enter>
                    form.find('input[data-type=cc]').val('otto.xentner@io.ox')
                        .focus()
                        .trigger($.Event('keyup', { which: 13 }));
                    // check for proper DOM node
                    var cc = form.find('.recipient-list input[type=hidden][name=cc]');
                    j.expect(cc.val())
                        .toEqual('"otto.xentner" <otto.xentner@io.ox>');
                });

                j.it('opens BCC section', function () {
                    // open section
                    form.find('[data-section-link=bcc]').trigger('click');
                    var section = form.find('[data-section=bcc]:visible');
                    j.expect(section.length)
                        .toEqual(1);
                });

                j.it('adds recipient to BCC', function () {
                    // enter email address and press <enter>
                    form.find('input[data-type=bcc]').val('hannes@io.ox')
                        .focus()
                        .trigger($.Event('keyup', { which: 13 }));
                    // check for proper DOM node
                    var bcc = form.find('.recipient-list input[type=hidden][name=bcc]');
                    j.expect(bcc.val())
                        .toEqual('"hannes" <hannes@io.ox>');
                });

                j.it('removes recipient from BCC', function () {
                    // get proper DOM node
                    var a, b;
                    a = form.find('.recipient-list input[type=hidden][name=bcc]');
                    a.parent().find('a.remove').trigger('click');
                    // get proper DOM node (again)
                    b = form.find('.recipient-list input[type=hidden][name=bcc]');
                    j.expect(true)
                        .toEqual(a.length === 1 && b.length === 0);
                });

                j.it('closes BCC section', function () {
                    // open section
                    form.find('[data-section-label=bcc]').trigger('click');
                    var section = form.find('[data-section=bcc]:visible');
                    j.expect(section.length)
                        .toEqual(0);
                });

                j.it('sets high priority', function () {
                    // change radio button
                    form.find('input[name=priority]').eq(0).focus().prop('checked', true).trigger('change').blur();
                    // check priority overlay
                    var overlay = form.find('.priority-overlay');
                    j.expect(overlay.hasClass('high'))
                        .toEqual(true);
                });

                j.it('sets subject', function () {
                    // set subject via class
                    form.find('input.subject').val('TEST: Hello World');
                    // check via name attribute
                    j.expect(form.find('input[name=subject]').val())
                        .toEqual('TEST: Hello World');
                });

                j.it('sets editor content', function () {
                    ed.setContent(' <p>Lorem ipsum</p>\r\n ');
                    j.expect(ed.getContent())
                        .toEqual('<p>Lorem ipsum</p>');
                });

                j.it('has correct mail body', function () {
                    var data = app.getMail().data;
                    j.expect(
                            data.attachments &&
                            data.attachments.length &&
                            data.attachments[0].content_type === 'text/html'
                        ).toEqual(true);
                    j.expect(data.attachments[0].content)
                        .toEqual('<p>Lorem ipsum</p>');
                });

                j.it('has correct mail props (bcc)', function () {
                    var data = app.getMail().data;
                    j.expect(_.isArray(data.bcc) && data.bcc.length === 0)
                        .toEqual(true);
                });

                j.it('has correct mail props (cc)', function () {
                    var data = app.getMail().data;
                    j.expect(
                            _.isArray(data.cc) && data.cc.length === 1 &&
                            data.cc[0][0] === '"otto.xentner"' && data.cc[0][1] === 'otto.xentner@io.ox'
                        )
                        .toEqual(true);
                });

                j.it('has correct mail props (from)', function () {
                    var data = app.getMail().data;
                    j.expect(_.isArray(data.from) && data.from.length === 1)
                        .toEqual(true);
                });

                j.it('has correct mail props (priority)', function () {
                    var data = app.getMail().data;
                    j.expect(data.priority === 1)
                        .toEqual(true);
                });

                j.it('has correct mail props (subject)', function () {
                    var data = app.getMail().data;
                    j.expect(data.subject === 'TEST: Hello World')
                        .toEqual(true);
                });

                j.it('has correct mail props (to)', function () {
                    var data = app.getMail().data;
                    j.expect(
                            _.isArray(data.to) && data.to.length === 6 &&
                            data.to[4][0] === '"Hannes"' && data.to[4][1] === 'hannes@ox.io'
                        )
                        .toEqual(true);
                });

                j.it('has correct mail props (vcard)', function () {
                    var data = app.getMail().data;
                    j.expect(data.vcard === 0)
                        .toEqual(true);
                });

                var sentMailId = {}, sentOriginalData;

                if (!_.browser.IE) {

                    j.it('sends mail successfully', function () {
                        var data = app.getMail().data, done = new Done(), myself = ox.user_id;
                        j.waitsFor(done, 'mail being send', TIMEOUT);
                        // get myself
                        accountAPI.getPrimaryAddress().done(function (address) {
                                // just send to myself
                                data.to = [address];
                                data.cc = [];
                                data.bcc = [];
                                sentOriginalData = data;
                                mailAPI.send(data)
                                    .always(function (result) {
                                        done.yep();
                                        sentMailId = String(result.data);
                                        j.expect(result.error).toBeUndefined();
                                    });
                            });
                    });

                    j.it('verifies that sent mail is ok', function () {
                        var done = new Done(),
                            data = sentOriginalData,
                            split = sentMailId.split(/\/(\d+$)/);
                        j.waitsFor(done, 'mail being fetched', TIMEOUT);
                        mailAPI.get({ folder: split[0], id: split[1] })
                            .done(function (sent) {
                                done.yep();
                                j.expect(
                                        _.isEqual(sent.subject, data.subject) &&
                                        _.isEqual(sent.from, data.from) &&
                                        _.isEqual(sent.to, data.to) &&
                                        _.isEqual(sent.cc, data.cc) &&
                                        _.isEqual(sent.bcc, data.bcc) &&
                                        _.isEqual(sent.priority, data.priority) &&
                                        _.isEqual(sent.vcard || undefined, data.vcard || undefined)
                                    )
                                    .toEqual(true);
                            });
                    });
                }

                j.it('closes compose dialog', function () {
                    // mark app as clean so no save as draft question will pop up
                    app.dirty(false).quit();
                    j.expect(app.getEditor).toBeUndefined();
                    app = ed = form = null;
                });
            });
        }
    });

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


    /*
     * Suite: Paste HTML content
     */
    ext.point('test/suite').extend({
        id: 'mail-paste',
        index: 300,
        test: function (j) {

            j.describe('Paste HTML contents', function () {

                var app = null, ed = null;

                j.it('opens compose dialog', function () {

                    var loaded = new Done();
                    j.waitsFor(loaded, 'compose dialog', TIMEOUT);

                    writer.getApp().launch().done(function () {
                        app = this;
                        app.compose().done(function () {
                            app.setFormat('html').done(function () {
                                ed = app.getEditor();
                                loaded.yep();
                                j.expect(ed).toBeDefined();
                                j.expect(ed.getMode()).toEqual('html');
                            });
                        });
                    });
                });

                j.it('inserts simple example', function () {
                    j.runs(function () {
                        // basic test
                        ed.clear();
                        ed.paste('<p>Hello World</p>');
                        j.expect(ed.getContent())
                            .toEqual('<p>Hello World</p>');
                    });
                });

                j.it('removes text color', function () {
                    j.runs(function () {
                        // remove color
                        ed.clear();
                        ed.paste('<p style="color: red">Hello World</p>');
                        j.expect(ed.getContent())
                            .toEqual('<p>Hello World</p>');
                    });
                });

                j.it('does not mess up paragraphs and line-breaks', function () {
                    // mixed p/br
                    ed.clear();
                    ed.paste('<p>Hello<br />World</p><p>one empty line, then this one</p>');
                    j.expect(ed.getContent())
                        .toEqual('<p>Hello<br>World</p><p>one empty line, then this one</p>');
                });

                j.it('handles complex HTML right #1', function () {
                    // complex test cases
                    var loaded = new Done();
                    j.waitsFor(loaded, 'external test data', TIMEOUT);
                    $.when(
                        $.get(base + '/test_1a.html'),
                        $.get(base + '/test_1b.html')
                    )
                    .done(function (a, b) {
                        loaded.yep();
                        ed.clear();
                        ed.paste(a[0]);
                        j.expect(ed.getContent())
                            .toEqual(trim(b[0]));
                    });
                });

                j.it('handles complex HTML right #2', function () {
                    // complex test cases
                    var loaded = new Done();
                    j.waitsFor(loaded, 'external test data', TIMEOUT);
                    $.when(
                        $.get(base + '/test_2a.html'),
                        $.get(base + '/test_2b.html')
                    )
                    .done(function (a, b) {
                        loaded.yep();
                        ed.clear();
                        ed.paste(a[0]);
                        j.expect(ed.getContent())
                            .toEqual(trim(b[0]));
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
