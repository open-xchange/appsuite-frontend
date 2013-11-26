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

define(['io.ox/mail/write/main'], function (writer) {

    'use strict';

    // helpers
    function Done(f) {
        f = function () { return !!f.value; };
        f.yep = function () { f.value = true; };
        return f;
    }

    describe('Mail compose dialog', function () {

        var app = null, ed = null, form = null;

        it('opens in HTML mode', function () {

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
                        expect(ed.getMode()).toEqual('html');
                    });
                });
            });
        });

        it('adds recipient', function () {
            // enter email address and press <enter>
            form.find('input[data-type=to]').val('otto.xentner@io.ox')
                .focus()
                .trigger($.Event('keydown', { which: 13 }));
            // check for proper DOM node
            var to = form.find('.recipient-list input[type=hidden][name=to]');
            expect(to.val()).toBe('"otto.xentner" <otto.xentner@io.ox>');
        });

        it('does not add duplicates', function () {
            // enter email address and press <enter>
            form.find('input[data-type=to]').val('"Otto" <otto.xentner@io.ox>')
                .focus()
                .trigger($.Event('keydown', { which: 13 }));
            // check for proper DOM node
            var to = form.find('.recipient-list input[type=hidden][name=to]');
            expect(to.length).toBe(1);
        });

        it('adds recipient with display name', function () {
            // enter email address and press <enter>
            form.find('input[data-type=to]').val('"Otto X." <otto.xentner.two@io.ox>')
                .focus()
                .trigger($.Event('keydown', { which: 13 }));
            // check for proper DOM node
            var to = form.find('.recipient-list input[type=hidden][name=to]').last();
            expect(to.val()).toBe('"Otto X." <otto.xentner.two@io.ox>');
        });

        it('adds recipient by focussing another element', function () {
            // enter email address and blur
            form.find('input[data-type=to]').val('"Otto;must escape,this" <otto.xentner.three@io.ox>')
                .focus().blur(); // IE has delay when focusing another element
            // check for proper DOM node
            var to = form.find('.recipient-list input[type=hidden][name=to]').last();
            expect(to.val()).toBe('"Otto;must escape,this" <otto.xentner.three@io.ox>');
        });

        it('adds multiple recipients at once', function () {
            // enter email address and blur
            form.find('input[data-type=to]')
                .val(' "Otto;must escape,this" <otto.xentner.four@io.ox>; "Hannes" <hannes@ox.io>, Horst <horst@ox.io>;, ')
                .focus().blur();
            // check for proper DOM node
            var to = form.find('.recipient-list input[type=hidden][name=to]').slice(-3);
            expect(to.eq(0).val()).toBe('"Otto;must escape,this" <otto.xentner.four@io.ox>');
            expect(to.eq(1).val()).toBe('"Hannes" <hannes@ox.io>');
            expect(to.eq(2).val()).toBe('"Horst" <horst@ox.io>');
        });

        it('opens CC section', function () {
            // open section
            form.find('[data-section-link=cc]').trigger('click');
            var section = form.find('[data-section=cc]:visible');
            expect(section.length).toBe(1);
        });

        it('adds recipient to CC', function () {
            // enter email address and press <enter>
            form.find('input[data-type=cc]').val('otto.xentner.five@io.ox')
                .focus()
                .trigger($.Event('keydown', { which: 13 }));
            // check for proper DOM node
            var cc = form.find('.recipient-list input[type=hidden][name=cc]');
            expect(cc.val()).toBe('"otto.xentner.five" <otto.xentner.five@io.ox>');
        });

        it('opens BCC section', function () {
            // open section
            form.find('[data-section-link=bcc]').trigger('click');
            var section = form.find('[data-section=bcc]:visible');
            expect(section.length).toBe(1);
        });

        it('adds recipient to BCC', function () {
            // enter email address and press <enter>
            form.find('input[data-type=bcc]').val('hannes@io.ox')
                .focus()
                .trigger($.Event('keydown', { which: 13 }));
            // check for proper DOM node
            var bcc = form.find('.recipient-list input[type=hidden][name=bcc]');
            expect(bcc.val()).toBe('"hannes" <hannes@io.ox>');
        });

        it('removes recipient from BCC', function () {
            // get proper DOM node
            var a, b;
            a = form.find('.recipient-list input[type=hidden][name=bcc]');
            a.parent().find('a.remove').trigger('click');
            // get proper DOM node (again)
            b = form.find('.recipient-list input[type=hidden][name=bcc]');
            expect(a.length).toBe(1);
            expect(b.length).toBe(0);
        });

        it('closes BCC section', function () {
            // open section
            form.find('[data-section-label=bcc]').trigger('click');
            var section = form.find('[data-section=bcc]:visible');
            expect(section.length).toBe(0);
        });

        it('sets high priority', function () {
            // change radio button
            form.find('input[name=priority]').eq(0).focus().prop('checked', true).trigger('change').blur();
            // check priority overlay
            var overlay = form.find('.priority-overlay');
            expect(overlay.hasClass('high')).toBe(true);
        });

        it('sets subject', function () {
            // set subject via class
            form.find('input.subject').val('TEST: Hello World');
            // check via name attribute
            expect(form.find('input[name=subject]').val()).toBe('TEST: Hello World');
        });

        it('sets editor content', function () {
            ed.setContent(' <p>Lorem ipsum</p>\r\n ');
            expect(ed.getContent()).toBe('<p>Lorem ipsum</p>');
        });

        it('has correct mail body', function () {
            var data = app.getMail().data;
            expect(data.attachments).toBeDefined();
            expect(data.attachments.length).toBeGreaterThan(0);
            expect(data.attachments[0].content_type).toBe('text/html');
            expect(data.attachments[0].content).toBe('<p>Lorem ipsum</p>');
        });

        it('has correct mail props (bcc)', function () {
            var data = app.getMail().data;
            expect(_.isArray(data.bcc)).toBe(true);
            expect(data.bcc.length).toBe(0);
        });

        it('has correct mail props (cc)', function () {
            var data = app.getMail().data;
            expect(_.isArray(data.cc)).toBe(true);
            expect(data.cc.length).toBe(1);
            expect(data.cc[0][0]).toBe('"otto.xentner.five"');
            expect(data.cc[0][1]).toBe('otto.xentner.five@io.ox');
        });

        it('has correct mail props (from)', function () {
            var data = app.getMail().data;
            expect(_.isArray(data.from)).toBe(true);
            expect(data.from.length).toBe(1);
        });

        it('has correct mail props (priority)', function () {
            var data = app.getMail().data;
            expect(data.priority).toBe(1);
        });

        it('has correct mail props (subject)', function () {
            var data = app.getMail().data;
            expect(data.subject).toBe('TEST: Hello World');
        });

        it('has correct mail props (to)', function () {
            var data = app.getMail().data;
            expect(_.isArray(data.to)).toBe(true);
            expect(data.to.length).toBe(6);
            expect(data.to[4][0]).toBe('"Hannes"');
            expect(data.to[4][1]).toBe('hannes@ox.io');
        });

        it('has correct mail props (vcard)', function () {
            var data = app.getMail().data;
            expect(data.vcard).toBe(0);
        });

        // var sentMailId = {}, sentOriginalData;

        // it('sends mail successfully', function () {
        //     var data = app.getMail().data, done = new Done();
        //     waitsFor(done, 'mail being send');
        //     // get myself
        //     accountAPI.getPrimaryAddress().done(function (address) {
        //             // just send to myself
        //             data.to = [address];
        //             data.cc = [];
        //             data.bcc = [];
        //             sentOriginalData = data;
        //             mailAPI.send(data)
        //                 .always(function (result) {
        //                     done.yep();
        //                     sentMailId = String(result.data);
        //                     expect(result.error).toBeUndefined();
        //                 });
        //         });
        // });

        // it('verifies that sent mail is ok', function () {
        //     var done = new Done(),
        //         data = sentOriginalData,
        //         split = sentMailId.split(/\/(\d+$)/);
        //     waitsFor(done, 'mail being fetched');
        //     mailAPI.get({ folder: split[0], id: split[1] })
        //         .done(function (sent) {
        //             done.yep();
        //             expect(
        //                     _.isEqual(sent.subject, data.subject) &&
        //                     _.isEqual(sent.from, data.from) &&
        //                     _.isEqual(sent.to, data.to) &&
        //                     _.isEqual(sent.cc, data.cc) &&
        //                     _.isEqual(sent.bcc, data.bcc) &&
        //                     _.isEqual(sent.priority, data.priority) &&
        //                     _.isEqual(sent.vcard || undefined, data.vcard || undefined)
        //                 )
        //                 .toEqual(true);
        //         });
        // });

        it('closes compose dialog', function () {
            // mark app as clean so no save as draft question will pop up
            app.dirty(false).quit();
            expect(app.getEditor).toBeUndefined();
            app = ed = form = null;
        });
    });
});
