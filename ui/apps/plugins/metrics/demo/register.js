/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/metrics/demo/register', ['io.ox/core/metrics/bot/main', 'settings!io.ox/mail', 'io.ox/mail/api'], function (bot, settings, api) {

    'use strict';

    // settings
    var INBOX = 'default0/INBOX',
        TEST = 'default0/INBOX/Test',
        FIRST_LETTERS = 'bigge',
        RECIPIENT = 'matthias.biggeleben@open-xchange.com';

    bot.ready(function () {

        this.suite(function () {

            //
            // Test 1
            //

            this.xtest('Open and answer mail', function () {

                this.step('Switch to mail app', function (done) {
                    this.waitForApp('io.ox/mail', done);
                    ox.launch('io.ox/mail/main');
                });

                this.step('Select first mail', function () {
                    window.list.selection.select(0);
                });

                this.step('Click on reply', function () {
                    $('.io-ox-action-link[data-ref="io.ox/mail/actions/reply"]').click();
                });

                this.step('Wait for editor and write 100 words', function (done) {
                    ox.on('mail:reply:ready', function (e, data, app) {
                        app.getEditor().prependContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                        this.app = app;
                        done();
                    }.bind(this));
                });

                this.step('Send to myself', function (done) {
                    // clear recipient lists
                    this.app.getWindowNode().find('.recipient-list').empty();
                    // add myself as recipient
                    var to = [['Myself', settings.get('defaultSendAddress')]];
                    this.app.setTo(to);
                    // send
                    this.app.getWindowNode().find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.on('mail:send:stop', done);
                });

                this.step('Switch back to mail app', function (done) {
                    this.waitForSelector('.io-ox-mail-window:visible', done);
                });
            });

            //
            // Test 2
            //

            this.xtest('Copy and delete mail', function () {

                this.step('Switch to mail app', function (done) {
                    this.waitForApp('io.ox/mail', done);
                    ox.launch('io.ox/mail/main');
                });

                this.step('Switch to INBOX', function (done) {
                    this.waitForFolder(INBOX, done);
                });

                this.step('Wait for list view to update', function (done) {
                    this.waitForListView(this.app.listView, INBOX, done);
                });

                this.step('Select first message', function () {
                    this.app.listView.selection.select(0);
                    // remember cid to copy via API directly
                    this.message = _.cid(this.app.listView.selection.get()[0].replace(/^thread\./, ''));
                });

                this.step('Copy selected message to test folder', function (done) {

                    var self = this;

                    api.copy(this.message, TEST).done(function (list) {
                        self.message = list[0];
                        done();
                    });
                });

                this.step('Switch to test folder', function (done) {
                    this.waitForFolder(TEST, done);
                });

                this.step('Wait for list view to update', function (done) {
                    this.waitForListView(this.app.listView, TEST, done);
                });

                this.step('Select copied message', function (done) {

                    this.waitFor(function () {
                        return !$('.io-ox-action-link[data-ref="io.ox/mail/actions/delete"]').hasClass('disabled');
                    })
                    .done(done);

                    var cid = 'thread.' + _.cid(this.message);
                    this.app.listView.selection.set([cid]);
                    this.app.listView.selection.triggerChange();
                });

                this.step('Delete message', function (done) {
                    $('.io-ox-action-link[data-ref="io.ox/mail/actions/delete"]').click();
                    this.waitForEvent(api, 'delete', done);
                });

                this.step('Empty trash', function () {
                    // TODO!
                });
            });

            //
            // Test 3
            //

            this.xtest('Write and send mail', function () {

                this.step('Open compose dialog', function (done) {

                    ox.on('mail:compose:ready', function (e, data, app) {
                        this.app = app;
                        done();
                    }.bind(this));

                    ox.registry.call('mail-compose', 'compose');
                });

                this.step('Enter subject and first 3 letters of recipient', function (done) {
                    this.app.setSubject('Test 3');
                    $('#writer_field_to').focus().val(FIRST_LETTERS).trigger('keyup');
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.autocomplete-item').filter(function () {
                            return $.trim($(this).find('.email').text()) === RECIPIENT;
                        });
                        item.click();
                        return item.length;
                    })
                    .done(done);
                });

                this.step('Write 100 words', function () {
                    this.app.getEditor().setContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                });

                this.step('Send message', function (done) {
                    // send
                    this.app.getWindowNode().find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.on('mail:send:stop', done);
                });

                this.step('Switch back to mail app', function (done) {
                    this.waitForSelector('.io-ox-mail-window:visible', done);
                });
            });

            //
            // Test 4
            //

            this.xtest('Write mail and send with attachment', function () {
                // TODO!
            });
        });
    });
});
