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
    'io.ox/mail/compose/view',
    'io.ox/mail/compose/model',
    'io.ox/mail/compose/config',
    'io.ox/backbone/views/modal'
], function (View, ComposeModel, ConfigModel, ModalDialog) {
    'use strict';

    describe('Mail Compose', function () {
        var fakeApp = {
            id: 'test'
        };
        describe('discard action', function () {
            it('should discard clean mails', function () {
                var view = new View({
                    model: new ComposeModel(),
                    config: new ConfigModel(),
                    app: fakeApp
                });
                return view.discard();
            });

            describe('should save-as-draft automatically', function () {
                it('for unchanged edited draft mails', function () {
                    var view = new View({
                            model: new ComposeModel(),
                            config: new ConfigModel(),
                            app: fakeApp
                        }),
                        spy = sinon.stub(view, 'saveDraft').returns($.when());

                    sinon.stub(view, 'isDirty').returns(false);
                    sinon.stub(view.model, 'isEmpty').returns(false);
                    // duck check: edit existing draft
                    view.model.attributes.meta = { editFor: {} };

                    var def = view.discard();
                    expect(spy.calledOnce).to.be.true;
                    return def;
                });
            });

            describe('should show confirm dialog', function () {
                it('for non-empty dirty new mails', function () {
                    var spy = sinon.spy(ModalDialog.prototype, 'open'),
                        view = new View({
                            model: new ComposeModel(),
                            config: new ConfigModel(),
                            app: fakeApp
                        });
                    sinon.stub(view, 'isDirty').returns(true);
                    sinon.stub(view.model, 'isEmpty').returns(false);
                    var def = view.discard();
                    expect(spy.calledOnce).to.be.true;

                    //close dialog, again
                    $('button[data-action="delete"]').click();
                    spy.restore();
                    return def;
                });
            });

            describe('should *not* show confirm dialog', function () {

                it('for empty new mails', function () {
                    var view = new View({
                        model: new ComposeModel(),
                        config: new ConfigModel(),
                        app: fakeApp
                    });
                    sinon.stub(view.model, 'isEmpty').returns(true);

                    return view.discard();
                });

                it('for unchanged new mails', function () {
                    var view = new View({
                        model: new ComposeModel(),
                        config: new ConfigModel(),
                        app: fakeApp
                    });
                    sinon.stub(view, 'isDirty').returns(false);

                    return view.discard();
                });

                it('in case autoDismiss mode is set', function () {
                    var view = new View({
                        model: new ComposeModel(),
                        config: new ConfigModel(),
                        app: fakeApp
                    });
                    // set model to be dirty and not empty, so normally discard confirm dialog would kick in
                    sinon.stub(view, 'isDirty').returns(true);
                    sinon.stub(view.model, 'isEmpty').returns(false);
                    view.config.set('autoDismiss', true);

                    return view.discard();
                });
            });
        });
    });
});
