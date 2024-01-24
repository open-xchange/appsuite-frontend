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

define(['io.ox/mail/compose/main', 'waitsFor'], function (compose, waitsFor) {
    'use strict';

    describe('Mail Compose', function () {

        var app, pictureHalo, snippetsGetAll, getValidAddress;

        var editors = {
                text: 'io.ox/core/tk/text-editor',
                html: 'io.ox/core/tk/contenteditable-editor'
            },
            pluginStub;

        beforeEach(function () {
            pluginStub = sinon.stub(ox.manifests, 'loadPluginsFor', function (namespace) {
                namespace = namespace.replace(/^io.ox\/mail\/compose\/editor\//, '');
                return require([editors[namespace]]);
            });
        });
        afterEach(function () {
            pluginStub.restore();
        });

        beforeEach(function () {
            return require([
                'io.ox/core/api/snippets',
                'io.ox/contacts/api',
                'io.ox/core/api/account',
                'settings!io.ox/mail'
            ], function (snippetAPI, contactsAPI, accountAPI, settings) {
                snippetsGetAll = sinon.stub(snippetAPI, 'getAll', function () { return $.when([]); });
                pictureHalo = sinon.stub(contactsAPI, 'pictureHalo', _.noop);
                getValidAddress = sinon.stub(accountAPI, 'getValidAddress', function (d) { return $.when(d); });
                //load plaintext editor, much faster than spinning up tinymce all the time
                settings.set('messageFormat', 'html');
            }).then(function () {
                app = compose.getApp();
                return app.launch();
            });
        });
        afterEach(function () {
            if (app.view && app.view.model) {
                app.view.model.dirty(false);
            }
            snippetsGetAll.restore();
            pictureHalo.restore();
            getValidAddress.restore();
            return app.quit();
        });

        //TODO: broken in phantomjs, somehow; tinyMCE does not load
        describe.skip('inline images', function () {
            beforeEach(function () {
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, 'content-type:text/javascript;', JSON.stringify({
                        data: 'default0/INBOX/Drafts/666'
                    }));
                });
                return app.compose({ folder: 'default0/INBOX' });
            });

            it('should switch to src attribute provided by backend response for img elements', function () {
                var api = require('io.ox/mail/api');
                var spy = sinon.stub(api, 'get');
                var def = waitsFor(function () {
                    return app.view.$el.find('.editable.mce-content-body img').length > 0;
                });

                app.view.setBody('<div>some<img src="test.png" />text</div>');

                spy.withArgs({ id: '666', folder_id: 'default0/INBOX/Drafts' }).returns($.when({
                    attachments: [{
                        content: '<div>some<img src="test_changed_by_backend.png" />text</div>'
                    }]
                }));

                return $.when(def, app.view.saveDraft()).then(function () {
                    expect(spy.calledOnce, 'mailAPI.get called once').to.be.true;
                    var img = app.view.$el.find('.editable.mce-content-body img');
                    expect(img.attr('src')).to.equal('test_changed_by_backend.png');
                }).always(function () {
                    spy.restore();
                });
            });

            it('should not switch src attribute of emoji icons', function () {
                var api = require('io.ox/mail/api');
                var spy = sinon.stub(api, 'get');
                var def = waitsFor(function () {
                    return app.view.$el.find('.editable.mce-content-body img').length > 0;
                });

                app.view.setBody('<div>some<img src="test.png" />text and emoji<img src="1x1.gif" class="emoji" /></div>');

                spy.withArgs({ id: '666', folder_id: 'default0/INBOX/Drafts' }).returns($.when({
                    attachments: [{
                        content: '<div>some<img src="test_changed_by_backend.png" />text and emoji<img src="random change!should not happen.gif" class="emoji" /></div>'
                    }]
                }));

                return $.when(def, app.view.saveDraft()).then(function () {
                    expect(spy.calledOnce, 'mailAPI.get called once').to.be.true;
                    var imgs = $('.editable.mce-content-body img', app.view.$el);
                    expect($(imgs[0]).attr('src')).to.equal('test_changed_by_backend.png');
                    expect($(imgs[1]).attr('src')).to.equal('1x1.gif');
                }).always(function () {
                    spy.restore();
                });
            });
        });
    });
});
