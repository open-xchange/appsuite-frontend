/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
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
        MAIL_WITH_THUMBNAILS = settings.get('demo/message-with-thumbnails', { folder_id: 'default0/INBOX/Test', id: 221 }),
        STORE_FOLDER = settings.get('demo/store-folder', 73407),
        TRASH = settings.get('demo/trash-folder', 'default0/INBOX/Trash');
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
                    if (this.app.listView.collection.length === 0) {
                        return console.error('No message to reply to');
                    }
                    this.app.listView.selection.select(0);
                    this.waitFor(function () {
                        return !$('.io-ox-action-link[data-ref="io.ox/mail/actions/reply"]').hasClass('disabled');
                    })
                    .done(done);
                });

                this.step('Click on reply', function () {
                    $('.io-ox-action-link[data-ref="io.ox/mail/actions/reply"]').click();
                });

                this.step('Wait for editor and write 100 words', function (done) {
                    ox.once('mail:reply:ready', function (data, app) {
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
                    this.app.getWindow().nodes.outer.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.once('mail:send:stop', done);
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

                    var cid = _.cid(this.message);
                    this.app.listView.selection.set([cid]);
                    this.app.listView.selection.triggerChange();
                });

                this.step('Delete message', function (done) {
                    $('.io-ox-action-link[data-ref="io.ox/mail/actions/delete"]').click();
                    this.waitForEvent(api, 'delete', done);
                });

                this.step('Empty trash', function (done) {
                    var self = this;
                    this.waitForFolder(TRASH, function () {
                        var c0, c1;
                        self.waitFor(function () {
                            var item0 = $('a.folder-options.contextmenu-control');
                            if (item0.length && !c0) {
                                item0.focus().click();
                                c0 = true;
                            }
                            var item1 = $('[data-action="clearfolder"]');
                            if (item1.length && !c1) {
                                item1.focus().click();
                                item0.click();

                                c1 = true;
                            }
                            var item2 = $('div.modal-footer [data-action="delete"]');
                            // dangerous!! use with care
                            //item2.focus().click();
                            return item2.length;

                        }).done(done);
                    });
                });
            });

            //
            // Test 3
            //

            this.test('Write and send mail', function () {

                this.step('Open compose dialog', function (done) {

                    ox.once('mail:compose:ready', function (data, app) {
                        this.app = app;
                        setTimeout(done, 500);
                    }.bind(this));

                    ox.registry.call('mail-compose', 'open');
                });

                this.step('Enter subject and first 3 letters of recipient', function (done) {
                    this.app.view.model.set('subject', SUBJECT);
                    this.app.view.$('.tokenfield.to .token-input.tt-input').focus().val(FIRST_LETTERS)
                        .trigger('input').trigger($.Event('keydown.tt', { keyCode: 13, which: 13 }));
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.tt-suggestion').filter(function () {
                            return $(this).find('.participant-email').text().indexOf(RECIPIENT) === 0;
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
                    this.app.getWindow().nodes.outer.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.once('mail:send:stop', done);
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

                    ox.once('mail:compose:ready', function (data, app) {
                        this.app = app;
                        done();
                    }.bind(this));

                    ox.registry.call('mail-compose', 'open');
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
                    this.app.view.$('.tokenfield.to .token-input.tt-input').focus().val(FIRST_LETTERS)
                        .trigger('input').trigger($.Event('keydown.tt', { keyCode: 13, which: 13 }));
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.tt-suggestion').filter(function () {
                            return $(this).find('.participant-email').text().indexOf(RECIPIENT) === 0;
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
                    this.app.getWindow().nodes.outer.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.once('mail:send:stop', done);
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

                    ox.once('mail:compose:ready', function (data, app) {
                        this.app = app;
                        setTimeout(done, 500);
                    }.bind(this));

                    ox.registry.call('mail-compose', 'open', {
                        attachments: [{
                            origin: 'drive',
                            id: FILE.id,
                            folder_id: FILE.folder_id
                        }]
                    });
                });

                this.step('Enter subject and first 3 letters of recipient', function (done) {
                    this.app.view.model.set('subject', SUBJECT + ' (cloud attachment)');
                    this.app.view.$('.tokenfield.to .token-input.tt-input').focus().val(FIRST_LETTERS)
                        .trigger('input').trigger($.Event('keydown.tt', { keyCode: 13, which: 13 }));
                    done();
                });

                this.step('Wait for auto-complete', function (done) {
                    this.waitFor(function () {
                        var item = $('.tt-suggestion').filter(function () {
                            return $(this).find('.participant-email').text().indexOf(RECIPIENT) === 0;
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
                    this.app.getWindow().nodes.outer.find('.btn-primary[data-action="send"]').click();
                    // wait for proper event
                    ox.once('mail:send:stop', done);
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
                    $('.tokenfield-placeholder').trigger('focusin');
                });

                this.step('Search for particular keyword', function () {
                    // this needs exactly this order: focusin -> val -> input -> enter
                    $('.token-input.tt-input').trigger('focusin').val(KEYWORD).trigger('input').trigger($.Event('keydown', { keyCode: 13, which: 13 }));
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
                    var cid = _.cid(MAIL_WITH_THUMBNAILS);
                    this.app.listView.selection.set([cid]);
                    this.app.listView.selection.triggerChange();
                });

                this.step('Wait for attachment list', function (done) {
                    this.waitForSelector('.mail-attachment-list .toggle-details', done);
                });

                this.step('Open details and toggle mode', function () {
                    var list = $('.mail-attachment-list');
                    list.find('.toggle-details').click();
                    if (!list.hasClass('show-preview')) list.find('.toggle-mode').click();
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
