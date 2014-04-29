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
     'settings!io.ox/mail',
     'io.ox/core/api/account',
     'fixture!io.ox/mail/write/email.json',
     'fixture!io.ox/mail/write/accounts.json',
     'fixture!io.ox/mail/write/signatures.json'], function (writer, mailAPI, settings, accountAPI, fixtureEmail, fixtureAccounts, fixtureSignatures) {

    'use strict';

    describe('Mail compose dialog', function () {

        var app, ed, form = $();

        beforeEach(function (done) {
            settings.set('messageFormat', 'html');
            this.server.respondWith('GET', /api\/snippet\?action=all/, function (xhr) {
                xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureSignatures.current));
            });
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

        describe('opens in HTML mode', function (done) {

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

            function add_recipient(type, str) {
                // enter email address and press <enter>
                form.find('input[data-type=' + type + ']').val(str)
                    .focus()
                    .trigger($.Event('keydown', { which: 13 }));
            }

            it('adds recipient', function () {
                add_recipient('to', 'otto.xentner@io.ox');
                // check for proper DOM node
                var to = form.find('.recipient-list input[type=hidden][name=to]');
                expect(to.val()).to.be.string('"otto.xentner" <otto.xentner@io.ox>');
            });

            it('does not add duplicates', function () {
                add_recipient('to', '"Otto" <otto.xentner@io.ox>');
                // check for proper DOM node
                var to = form.find('.recipient-list input[type=hidden][name=to]');
                expect(to).to.have.length(1);
            });

            it('adds recipient with display name', function () {
                add_recipient('to', '"Otto X." <otto.xentner.two@io.ox>');
                // check for proper DOM node
                var to = form.find('.recipient-list input[type=hidden][name=to]').last();
                expect(to.val()).to.be.string('"Otto X." <otto.xentner.two@io.ox>');
            });

            it('adds recipient by focussing another element', function () {
                // enter email address and blur
                add_recipient('to', '"Otto" <otto.xentner@io.ox>');
                add_recipient('to', '"Otto X." <otto.xentner.two@io.ox>');
                form.find('input[data-type=to]').val('"Otto;must escape,this" <otto.xentner.three@io.ox>')
                    .focus().blur(); // IE has delay when focusing another element
                // check for proper DOM node
                var to = form.find('.recipient-list input[type=hidden][name=to]').last();
                expect(to.val()).to.be.string('"Otto;must escape,this" <otto.xentner.three@io.ox>');
            });

            it('adds multiple recipients at once', function () {
                // enter email address and blur
                form.find('input[data-type=to]')
                    .val(' "Otto;must escape,this" <otto.xentner.four@io.ox>; "Hannes" <hannes@ox.io>, Horst <horst@ox.io>;, ')
                    .focus().blur();
                // check for proper DOM node
                var to = form.find('.recipient-list input[type=hidden][name=to]').slice(-3);
                expect(to.eq(0).val()).to.be.string('"Otto;must escape,this" <otto.xentner.four@io.ox>');
                expect(to.eq(1).val()).to.be.string('"Hannes" <hannes@ox.io>');
                expect(to.eq(2).val()).to.be.string('"Horst" <horst@ox.io>');
            });

            it('opens CC section', function () {
                // open section
                form.find('[data-section-link=cc]').trigger('click');
                var section = form.find('[data-section=cc]:visible');
                expect(section).to.have.length(1);
            });

            it('adds recipient to CC', function () {
                // enter email address and press <enter>
                form.find('input[data-type=cc]').val('otto.xentner.five@io.ox')
                    .focus()
                    .trigger($.Event('keydown', { which: 13 }));
                // check for proper DOM node
                var cc = form.find('.recipient-list input[type=hidden][name=cc]');
                expect(cc.val()).to.be.string('"otto.xentner.five" <otto.xentner.five@io.ox>');
            });

            it('opens BCC section', function () {
                // open section
                form.find('[data-section-link=bcc]').trigger('click');
                var section = form.find('[data-section=bcc]:visible');
                expect(section).to.have.length(1);
            });

            it('adds recipient to BCC', function () {
                form.find('[data-section-link=bcc]').trigger('click');
                add_recipient('bcc', 'hannes@io.ox');
                // check for proper DOM node
                var bcc = form.find('.recipient-list input[type=hidden][name=bcc]');
                expect(bcc.val()).to.be.string('"hannes" <hannes@io.ox>');
            });

            it('removes recipient from BCC', function () {
                form.find('[data-section-link=bcc]').trigger('click');
                add_recipient('bcc', 'hannes@io.ox');
                // get proper DOM node
                var a, b;
                a = form.find('.recipient-list input[type=hidden][name=bcc]');
                a.parent().find('a.remove').trigger('click');
                // get proper DOM node (again)
                b = form.find('.recipient-list input[type=hidden][name=bcc]');
                expect(a).to.have.length(1);
                expect(b).to.have.length(0);
            });

            it('closes BCC section', function () {
                // open section
                form.find('[data-section-link=bcc]').trigger('click');
                form.find('[data-section-label=bcc]').trigger('click');
                var section = form.find('[data-section=bcc]:visible');
                expect(section).to.have.length(0);
            });

            it('sets high priority', function () {
                // change radio button
                form.find('input[name=priority]').eq(0).focus().prop('checked', true).trigger('change').blur();
                // check priority overlay
                var overlay = form.find('.priority-overlay');
                expect(overlay.hasClass('high')).to.be.true;
            });

            it('sets subject', function () {
                // set subject via class
                form.find('input.subject').val('TEST: Hello World');
                // check via name attribute
                expect(form.find('input[name=subject]').val()).to.be.string('TEST: Hello World');
            });

            it('sets editor content', function () {
                ed.setContent(' <p>Lorem ipsum</p>\r\n ');
                expect(ed.getContent()).to.be.string('<p>Lorem ipsum</p>');
            });

            it('has correct mail body', function () {
                ed.setContent(' <p>Lorem ipsum</p>\r\n ');
                var data = app.getMail().data;
                expect(data.attachments).to.be.an('array');
                expect(data.attachments).to.have.length.above(0);
                expect(data.attachments[0].content_type).to.be.string('text/html');
                expect(data.attachments[0].content).to.be.string('<p>Lorem ipsum</p>');
            });

            it('has correct mail props (bcc)', function () {
                var data = app.getMail().data;
                expect(_.isArray(data.bcc)).to.be.true;
                expect(data.bcc).to.have.length(0);
            });

            it('has correct mail props (cc)', function () {
                add_recipient('cc', 'otto.xentner.five@io.ox');
                var data = app.getMail().data;
                expect(_.isArray(data.cc)).to.be.true;
                expect(data.cc).to.have.length(1);
                expect(data.cc[0][0]).to.be.string('"otto.xentner.five"');
                expect(data.cc[0][1]).to.be.string('otto.xentner.five@io.ox');
            });

            it('has correct mail props (from)', function () {
                var data = app.getMail().data;
                expect(_.isArray(data.from)).to.be.true;
                expect(data.from).to.have.length(1);
            });

            it('has correct mail props (priority)', function () {
                form.find('input[name=priority]').eq(0).focus().prop('checked', true).trigger('change').blur();
                var data = app.getMail().data;
                expect(data.priority).to.equal(1);
            });

            it('has correct mail props (subject)', function () {
                form.find('input.subject').val('TEST: Hello World');
                var data = app.getMail().data;
                expect(data.subject).to.be.string('TEST: Hello World');
            });

            it('has correct mail props (to)', function () {

                add_recipient('to', '<test@io.ox>; <test.two@io.ox>; <test.three@io.ox>; <test.four@io.ox>; "Hannes" <hannes@ox.io>; Horst <horst@ox.io>;');
                var data = app.getMail().data;
                expect(_.isArray(data.to)).to.be.true;
                expect(data.to).to.have.length(6);
                expect(data.to[4][0]).to.be.string('"Hannes"');
                expect(data.to[4][1]).to.be.string('hannes@ox.io');
            });

            it('has correct mail props (vcard)', function () {
                var data = app.getMail().data;
                expect(data.vcard).to.equal(0);
            });

            it('sends mail successfully', function (done) {

                var data = app.getMail().data;

                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/html;charset=UTF-8' }, '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd"><html><head><META http-equiv="Content-Type" content="text/html; charset=UTF-8"><script>(parent.callback_new || window.opener && window.opener.callback_new)({"data":"default0/INBOX/Sent/1337"})</script></head></html>');
                });

                this.server.respondWith('GET', /api\/account\?action=all/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureAccounts));
                });

                accountAPI.getPrimaryAddress().then(
                    function success(address) {
                        // just send to myself
                        data.to = [address];
                        data.cc = [];
                        data.bcc = [];
                        expect(address).to.deep.equal(['Otto Xentner', 'otto.xentner@open-xchange.com']);
                        mailAPI.send(data).always(function (result) {
                            expect(result.error).to.not.exist;
                            expect(result.data).to.be.string('default0/INBOX/Sent/1337');
                            done();
                        });
                    },
                    function fail() {
                        console.warn('accountAPI.getPrimaryAddress() > failed');
                    }
                );
            });

            it('verifies that sent mail is ok', function (done) {

                this.server.respondWith('GET', /api\/mail\?action=get.+id=1337/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify(fixtureEmail));
                });

                mailAPI.get({ folder: 'default0/INBOX/Sent', id: '1337' }).done(function (sent) {
                    expect(sent.subject).to.be.string('Test: Hello World');
                    expect(sent.to).to.deep.equal([['Otto Xentner', 'otto.xentner@open-xchange.com']]);
                    expect(sent.cc).to.be.empty;
                    expect(sent.bcc).to.be.empty;
                    expect(sent.priority).to.equal(3);
                    expect(sent.flags).to.equal(32);
                    done();
                });
            });
        });

        xdescribe('supports signatures', function () {
            var data = fixtureSignatures.current.data;
            function getCurrentSignature() {
                return app.getMail().signature;
            }
            function setCurrentSignature(index) {
                return app.setSignature({data: {index: index}});
            }
            function getCurrentContent() {
                return app.getEditor().getContent();
            }
            function occurrences() {
                //number of occurrences of signature class name (only relevant for html)
                return (getCurrentContent().match(/io-ox-signature/g) || [])
                        .length;
            }
            function reset() {
                //reset by using 'empty string' signature
                setCurrentSignature(0);
                app.getEditor().setContent('');
            }

            function addIndependentTests(format) {
                beforeEach(function () {
                    reset();
                });
                it('signatures are accessible', function () {
                    expect(app.getSignatures().length).not.to.equal(0);
                });
                it('a signature can be added', function () {
                    setCurrentSignature(6);
                    expect(getCurrentSignature().length > 0).to.be.true;
                });
                it('a signature can be replaced', function () {
                    var before;
                    //set signature 1 (long)
                    setCurrentSignature(1);
                    before = getCurrentSignature();
                    //set signature 2 (short)
                    setCurrentSignature(2);
                    expect(before).not.to.equal(getCurrentSignature());
                });
                it('an unmodified signature will be replaced', function () {
                    var before;
                    _.each(data, function (value, index) {
                        reset();
                        setCurrentSignature(index);
                        before = getCurrentContent();
                        setCurrentSignature(index);
                        expect(before).to.have.length(getCurrentContent().length);
                    });
                });
                it('an modified signature is kept', function () {
                    var before;
                    //set signature 2 and change a substring
                    setCurrentSignature(2);
                    app.getEditor()
                       .setContent(getCurrentContent().replace('xxx', 'yyy'));
                    before = getCurrentContent();
                    //set signature again
                    setCurrentSignature(2);
                    //check content length and number of nodes with signature class
                    expect(getCurrentContent()).to.have.length.below(before.length);
                    expect(occurrences()).to.be.below(2);
                });
                describe('a signature is normalized', function () {
                    it('by removing trailing and subsequent white-space', function () {
                        _.each(data, function (value, index) {
                            reset();
                            setCurrentSignature(index);
                            expect(/\s\s+/g.test(getCurrentSignature())).to.be.false;
                        });
                    });
                    it('by removing linebreaks', function () {
                        _.each(data, function (value, index) {
                            reset();
                            setCurrentSignature(index);
                            expect(/(\r)/g.test(getCurrentSignature())).to.be.false;
                        });
                    });
                });
            }

            it('signature previews are clean', function () {
                var previews = $(document)
                                .find('[data-section="signatures"]')
                                .find('.signature-preview'),
                    value;
                //process
                _.each(previews, function (node) {
                    value = $(node).html();
                    //do not contain html tags
                    expect(/(<([^>]+)>)/ig.test(value)).to.be.false;
                    //remove ASCII art (intended to remove separators like '________')
                    expect(/([\-=+*°._!?\/\^]{4,})/g.test(value)).to.be.false;
                    //remove subsequent white-space
                    expect(/\s\s+/g.test(value)).to.be.false;
                    //is trimmed (but a whitespace is added manually later: 5adae2b772e9d9fcc1110997dc30f1f71a4daeb6)
                    expect(value).to.equal(' ' + value.trim());
                });
            });

            describe('in html mode:', function () {
                beforeEach(function (done) {
                    app.setFormat('html').done(function () {
                        done();
                    });
                });

                //independent test with same expection for both modes
                addIndependentTests('html');

                describe('leading blank lines are added', function () {
                    function countLeadingBlanks() {
                        var lines = ($(app.getEditor().getContent(), 'p')).toArray(),
                            count = 0;
                        lines.every(function (node) {
                            var empty = $(node).html() === '<br>';
                            if (empty)
                                count++;
                            return empty;
                        });
                        return count;
                    }

                    afterEach(function () {
                        settings.set('defaultSignature', undefined);
                    });
                    it('for inline quoted replies/forwards', function () {
                        //above
                        settings.set('defaultSignature', '326');
                        app.setBody('this is quoted text');
                        expect(countLeadingBlanks()).to.equal(1);
                        //below
                        settings.set('defaultSignature', '294');
                        app.setBody('this is quoted text');
                        expect(countLeadingBlanks()).to.equal(1);
                        //none
                        settings.set('defaultSignature', undefined);
                        app.setBody('this is quoted text');
                        expect(countLeadingBlanks()).to.equal(1);
                    });
                    it('for mails from scratch', function () {
                        //above: scratch
                        settings.set('defaultSignature', '326');
                        app.setBody('');
                        expect(countLeadingBlanks()).to.equal(1);
                        //below: scratch
                        settings.set('defaultSignature', '294');
                        app.setBody('');
                        expect(countLeadingBlanks()).to.equal(1);
                        //none: scratch
                        settings.set('defaultSignature', undefined);
                        app.setBody('');
                        expect(countLeadingBlanks()).to.equal(0);
                    });
                });

                describe('a signature is normalized', function () {
                    it('by keeping html tags when html editor is used', function () {
                        app.setSignature({data: {index: 5}});
                        expect(/(<([^>]+)>)/ig.test(getCurrentSignature())).to.be.true;
                    });
                });
            });

            describe('in text mode:', function () {
                beforeEach(function (done) {
                    app.setFormat('text').done(function () {
                        done();
                    });
                });

                //independent test with same expection for both modes
                addIndependentTests('text');

                describe('leading blank lines are added', function () {
                    function countLeadingBlanks() {
                        var textarea = $($('.editor-inner-container').find('textarea')),
                            lines = ($.original.val.call(textarea)).split('\n'),
                            count = 0;
                        lines.every(function (line) {
                            var empty = line.trim() === '';
                            if (empty)
                                count++;
                            return empty;
                        });
                        return count;
                    }

                    afterEach(function () {
                        settings.set('defaultSignature', undefined);
                    });
                    it('for inline quoted replies/forwards', function () {
                        //above
                        settings.set('defaultSignature', '326');
                        app.setBody('this is quoted text');
                        expect(countLeadingBlanks()).to.equal(2);
                        //below
                        settings.set('defaultSignature', '294');
                        app.setBody('this is quoted text');
                        expect(countLeadingBlanks()).to.equal(2);
                        //none
                        settings.set('defaultSignature', undefined);
                        app.setBody('this is quoted text');
                        expect(countLeadingBlanks()).to.equal(2);
                    });
                    it('for mails from scratch', function () {
                        //above: scratch
                        settings.set('defaultSignature', '326');
                        app.setBody('');
                        expect(countLeadingBlanks()).to.equal(2);
                        //below: scratch
                        settings.set('defaultSignature', '294');
                        app.setBody('');
                        expect(countLeadingBlanks()).to.equal(2);
                        //none: scratch
                        settings.set('defaultSignature', undefined);
                        app.setBody('');
                        expect(countLeadingBlanks()).to.equal(1);
                    });
                });

                describe('a signature is normalized', function () {
                    it('by removing html tags when text editor is used', function () {
                        app.setSignature({data: {index: 5}});
                        expect(/(<([^>]+)>)/ig.test(getCurrentSignature())).to.be.false;
                    });
                });
            });
        });
    });
});
