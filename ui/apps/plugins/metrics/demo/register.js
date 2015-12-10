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

define('plugins/metrics/demo/register', [
    'io.ox/core/metrics/metrics',
    'io.ox/core/metrics/bot/main',
    'settings!io.ox/core/metrics',
    'settings!io.ox/core',
    'settings!io.ox/mail',
    'io.ox/mail/api'
], function (metrics, bot, settings, coreSettings, mailSettings, api) {

    'use strict';

    // settings
    var INBOX = settings.get('demo/inbox', 'default0/INBOX'),
        TEST = settings.get('demo/test-folder', 'default0/INBOX/Test'),
        SUBJECT = settings.get('demo/subject', 'Automatic performance test'),
        FIRST_LETTERS = settings.get('demo/first-letters', 'bigge'),
        RECIPIENT = settings.get('demo/recipient', 'matthias.biggeleben@open-xchange.com'),
        FILE = settings.get('demo/cloud-attachment', { folder_id: '13894', id: '63605' }),
        KEYWORD = settings.get('demo/search-keyword', 'automatic'),
        MAIL_WITH_THUMBNAILS = settings.get('demo/message-with-thumbnails', { folder_id: 'default0/INBOX/Test', id: 85 }),
        STORE_FOLDER = settings.get('demo/store-folder', 73407);

    // ensure normal selection mode
    coreSettings.set('selectionMode', 'normal');

    bot.ready(function () {

        // ensure new mail compose
        ox.registry.set('mail-compose', 'io.ox/mail/compose/main');

        var suite = this.suite(function () {

            //
            // Test 1
            //

            this.test('Open and answer mail', function () {

                this.step('Switch to mail app', function (done) {
                    this.waitForApp('io.ox/mail', done);
                    ox.launch('io.ox/mail/main');
                });

                this.step('Switch to INBOX', function (done) {
                    this.waitForFolder(INBOX, done);
                });

                this.step('Wait for list view to update', function (done) {
                    this.waitForListView(this.app.listView, 'folder=' + INBOX, done);
                });

                this.step('Select first message', function (done) {
                    if (window.list.collection.length === 0) {
                        return console.error('No message to reply to');
                    }
                    window.list.selection.select(0);
                    this.waitFor(function () {
                        return !$('.io-ox-action-link[data-ref="io.ox/mail/actions/reply"]').hasClass('disabled');
                    })
                    .done(done);
                });

                this.step('Click on reply', function () {
                    $('.io-ox-action-link[data-ref="io.ox/mail/actions/reply"]').click();
                });

                this.step('Wait for editor and write 100 words', function (done) {
                    ox.one('mail:reply:ready', function (e, data, app) {
                        app.view.getEditor().done(function (editor) {
                            editor.prependContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                        });
                        this.app = app;
                        done();
                    }.bind(this));
                });

                this.step('Send to myself', function (done) {
                    // clear recipient lists
                    this.app.view.model.set({ cc: [], bcc: [] });
                    // add myself as recipient
                    var to = [['Myself', mailSettings.get('defaultSendAddress')]];
                    this.app.view.model.set('to', to);
                    // send
                    this.app.getWindow().nodes.header.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.one('mail:send:stop', done);
                });

                this.step('Switch back to mail app', function (done) {
                    this.waitForSelector('.io-ox-mail-window:visible', done);
                });
            });

            //
            // Test 2
            //

            this.test('Copy and delete mail', function () {

                this.step('Switch to mail app', function (done) {
                    this.waitForApp('io.ox/mail', done);
                    ox.launch('io.ox/mail/main');
                });

                this.step('Switch to INBOX', function (done) {
                    this.waitForFolder(INBOX, done);
                });

                this.step('Wait for list view to update', function (done) {
                    this.waitForListView(this.app.listView, 'folder=' + INBOX, done);
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
                    this.waitForListView(this.app.listView, 'folder=' + TEST, done);
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

            this.test('Write and send mail', function () {

                this.step('Open compose dialog', function (done) {

                    ox.one('mail:compose:ready', function (e, data, app) {
                        this.app = app;
                        done();
                    }.bind(this));

                    ox.registry.call('mail-compose', 'compose');
                });

                this.step('Enter subject and first 3 letters of recipient', function (done) {
                    this.app.view.model.set('subject', SUBJECT);
                    this.app.view.$('.tokenfield.to .token-input.tt-input').focus().val(FIRST_LETTERS).trigger('input').trigger('keydown');
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.tt-suggestion').filter(function () {
                            return $(this).find('.email').text().indexOf(RECIPIENT) === 0;
                        });
                        item.click();
                        return item.length;
                    })
                    .done(done);
                });

                this.step('Write 100 words', function (done) {
                    this.app.view.getEditor().done(function (editor) {
                        editor.setContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                        done();
                    });
                });

                this.step('Send message', function (done) {
                    // send
                    this.app.getWindow().nodes.header.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.one('mail:send:stop', done);
                });

                this.step('Switch back to mail app', function (done) {
                    this.waitForSelector('.io-ox-mail-window:visible', done);
                });
            });

            //
            // Test 4
            //

            this.test('Write mail and send with attachment (local)', function () {

                this.step('Open compose dialog', function (done) {

                    ox.one('mail:compose:ready', function (e, data, app) {
                        this.app = app;
                        done();
                    }.bind(this));

                    ox.registry.call('mail-compose', 'compose');
                });

                this.step('Add attachment', function (done) {
                    this.waitForImage('apps/plugins/metrics/demo/test.jpg', function (blob) {
                        var collection = this.app.view.model.get('attachments');
                        collection.add(_.extend(blob, { group: 'localFile', filename: 'test.jpg', lastModified: _.now(), webkitRelativePath: '' }));
                        done();
                    }.bind(this));
                });

                this.step('Enter subject and first 3 letters of recipient', function (done) {
                    this.app.view.model.set('subject', SUBJECT + ' (local attachment)');
                    this.app.view.$('.tokenfield.to .token-input.tt-input').focus().val(FIRST_LETTERS).trigger('input').trigger('keydown');
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.tt-suggestion').filter(function () {
                            return $(this).find('.email').text().indexOf(RECIPIENT) === 0;
                        });
                        item.click();
                        return item.length;
                    })
                    .done(done);
                });

                this.step('Write 100 words', function (done) {
                    this.app.view.getEditor().done(function (editor) {
                        editor.setContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                        done();
                    });
                });

                this.step('Send message', function (done) {
                    // send
                    this.app.getWindow().nodes.header.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.one('mail:send:stop', done);
                });

                this.step('Switch back to mail app', function (done) {
                    this.waitForSelector('.io-ox-mail-window:visible', done);
                });
            });

            //
            // Test 5
            //

            this.test('Write mail and send with attachment (cloud)', function () {

                this.step('Open compose dialog with attachment from cloud', function (done) {

                    ox.one('mail:compose:ready', function (e, data, app) {
                        this.app = app;
                        done();
                    }.bind(this));

                    var file = _.extend({ group: 'infostore', filename: 'test.jpg' }, FILE);
                    ox.registry.call('mail-compose', 'compose', { infostore_ids: [file] });
                });

                this.step('Enter subject and first 3 letters of recipient', function (done) {
                    this.app.view.model.set('subject', SUBJECT + ' (cloud attachment)');
                    this.app.view.$('.tokenfield.to .token-input.tt-input').focus().val(FIRST_LETTERS).trigger('input').trigger('keydown');
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.tt-suggestion').filter(function () {
                            return $(this).find('.email').text().indexOf(RECIPIENT) === 0;
                        });
                        item.click();
                        return item.length;
                    })
                    .done(done);
                });

                this.step('Write 100 words', function (done) {
                    this.app.view.getEditor().done(function (editor) {
                        editor.setContent('Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.');
                        done();
                    });
                });

                this.step('Send message', function (done) {
                    // send
                    this.app.getWindow().nodes.header.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.one('mail:send:stop', done);
                });

                this.step('Switch back to mail app', function (done) {
                    this.waitForSelector('.io-ox-mail-window:visible', done);
                });
            });

            //
            // Test 6
            //

            this.test('Search and display mail listing', function () {

                this.step('Switch to mail app', function (done) {
                    this.waitForApp('io.ox/mail', done);
                    ox.launch('io.ox/mail/main');
                });

                this.step('Switch to INBOX', function (done) {
                    this.waitForFolder(INBOX, done);
                });

                this.step('Wait for list view to update', function (done) {
                    this.waitForListView(this.app.listView, 'folder=' + INBOX, done);
                });

                this.step('Focus search field to load related code', function (done) {
                    this.waitForEvent('search:load', done);
                    $('.search-field').trigger('load');
                });

                this.step('Search for particular keyword', function () {
                    $('.search-field').val(KEYWORD).trigger('search');
                });

                this.step('Wait for auto-complete', function (done) {

                    this.waitFor(function () {
                        return $('.autocomplete-item').eq(1).click().length;
                    })
                    .done(done);
                });

                this.step('Wait for list view to display results', function (done) {
                    this.waitForListView(this.app.listView, 'search/', done);
                });
            });

            //
            // Test 7
            //

            this.test('Open a mail with thumbnails', function () {

                this.step('Switch to mail app', function (done) {
                    this.waitForApp('io.ox/mail', done);
                    ox.launch('io.ox/mail/main');
                });

                this.step('Switch to folder', function (done) {
                    this.waitForFolder(MAIL_WITH_THUMBNAILS.folder_id, done);
                });

                this.step('Wait for list view to update', function (done) {
                    this.waitForListView(this.app.listView, 'folder=' + MAIL_WITH_THUMBNAILS.folder_id, done);
                });

                this.step('Select message', function () {
                    var cid = 'thread.' + _.cid(MAIL_WITH_THUMBNAILS);
                    this.app.listView.selection.set([cid]);
                    this.app.listView.selection.triggerChange();
                });

                this.step('Wait for attachment list', function (done) {
                    this.waitForSelector('.mail-attachment-list .toggle-details', done);
                });

                this.step('Open details and toggle mode', function () {
                    var list = $('.mail-attachment-list');
                    list.find('.toggle-details').click();
                    list.find('.toggle-mode').click();
                });

                this.step('Wait for first thumbnail to load', function (done) {
                    this.waitFor(function () {
                        var image = $('.mail-attachment-list .item.lazy').css('background-image');
                        return image !== undefined && image !== 'none';
                    })
                    .done(done);
                });
            });
        });

        suite.done(function () {
            metrics.store.toFile(STORE_FOLDER, 'performance', this.toCSV());
        });
    });
});
