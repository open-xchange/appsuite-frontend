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

define([
    'io.ox/core/extensions',
    'io.ox/mail/compose/model',
    'io.ox/mail/compose/actions/send'
], function (ext, ComposeModel) {
    describe('Mail send action extension point', function () {

        describe('send extension', function () {
            var baton;

            beforeEach(function () {
                baton = new ext.Baton({
                    view: {
                        $el: $(),
                        dirty: sinon.spy()
                    },
                    stopPropagation: sinon.spy(),
                    model: new ComposeModel({
                        subject: 'test',
                        to: [['Test', 'test@example.com']],
                        attachments: new Backbone.Collection()
                    }),
                    app: {
                        id: 'compose_test',
                        getWindow: sinon.stub().returns({ busy: sinon.spy(), idle: function () { return this; }, show: sinon.spy(), preQuit: sinon.spy() }),
                        get: sinon.stub().returns($()),
                        launch: sinon.spy(),
                        quit: sinon.spy()
                    },
                    config: new Backbone.Model(),
                    catchErrors: true
                });

                baton.disable('io.ox/mail/compose/actions/send', 'wait-for-pending-uploads');
                baton.disable('io.ox/mail/compose/actions/send', 'remove-unused-inline-images');
                baton.disable('io.ox/mail/compose/actions/send', 'check:attachment-missing');

                // for 'disable-manual-close' extension
                sinon.stub(ox.ui.apps, 'get').withArgs('compose_test').returns(baton.app);
            });

            afterEach(function () {
                ox.ui.apps.get.restore();
                baton = null;
            });

            it('invoking all extensions and send fails should reject on error', function () {
                this.server.respondWith('POST', /api\/mail\/compose\/.*\/send/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"error":"An error occurred inside the server which prevented it from fulfilling the request.","error_params":["6ec491b26e92422c8f39ad97aebb9c9b"],"categories":"ERROR","category":8,"code":"MSGCS-0007","error_id":"912934592-1849","error_desc":"Found no such composition space for identifier: 6ec491b26e92422c8f39ad97aebb9c9b"}');
                });

                return ext.point('io.ox/mail/compose/actions/send').cascade(baton.view, baton).then(function () {
                    expect(baton.app.getWindow().show.calledOnce, 'app has been restarted').to.be.true;
                    expect(baton.view.dirty.called, 'model.dirty has been called').to.be.false;
                });
            });

            it('invoking all extensions and send succeeds should quit the mail compose app', function () {
                this.server.respondWith('POST', /api\/mail\/compose\/.*\/send/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, '{"data":{"success":true}}');
                });

                return ext.point('io.ox/mail/compose/actions/send').cascade(baton.view, baton).then(function () {
                    expect(baton.app.quit.calledOnce, 'app has quit').to.be.true;
                    expect(baton.view.dirty.calledWith(false), 'model.dirty(false) has been called').to.be.true;
                });
            });
        });
    });
});
