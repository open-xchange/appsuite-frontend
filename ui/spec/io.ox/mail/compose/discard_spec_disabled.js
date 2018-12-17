define([
    'io.ox/mail/compose/view',
    'io.ox/mail/compose/model',
    'io.ox/core/tk/dialogs'
], function (View, Model, dialogs) {
    'use strict';

    describe('Mail Compose', function () {
        var fakeApp = {
            id: 'test'
        };
        describe('discard action', function () {
            it('should discard clean mails', function () {
                var view = new View({
                    model: new Model(),
                    app: fakeApp
                });
                return view.discard();
            });

            describe('should show confirm dialog', function () {
                it('for dirty new mails', function () {
                    var spy = sinon.spy(dialogs, 'ModalDialog'),
                        view = new View({
                            model: new Model(),
                            app: fakeApp
                        });
                    sinon.stub(view.model, 'dirty').returns(true);
                    var def = view.discard();
                    expect(spy.calledOnce).to.be.true;

                    //close dialog, again
                    $('button[data-action="delete"]').click();
                    spy.restore();
                    return def;
                });

                it('for dirty draft mails', function () {
                    var spy = sinon.spy(dialogs, 'ModalDialog'),
                        view = new View({
                            model: new Model({
                                mode: 'edit'
                            }),
                            app: fakeApp
                        });
                    sinon.stub(view.model, 'dirty').returns(true);
                    var def = view.discard();
                    expect(spy.calledOnce).to.be.true;

                    //close dialog, again
                    $('button[data-action="delete"]').click();
                    spy.restore();
                    return def;
                });

                // TODO rewrite for new save mechanism
                it.skip('for autosaved draft mails', function () {
                    var spy = sinon.spy(dialogs, 'ModalDialog'),
                        view = new View({
                            model: new Model(),
                            app: fakeApp
                        });
                    sinon.stub(view.model, 'dirty').returns(false);
                    view.model.set('autosavedAsDraft', true);
                    var def = view.discard();
                    expect(spy.calledOnce).to.be.true;

                    //close dialog, again
                    $('button[data-action="delete"]').click();
                    spy.restore();
                    return def;
                });
            });
            describe('should *not* show confirm dialog', function () {
                it('in case autoDismiss mode is set', function () {
                    var view = new View({
                        model: new Model(),
                        app: fakeApp
                    });
                    //set model to be dirty, so normally discard confirm dialog would kick in
                    sinon.stub(view.model, 'dirty').returns(true);
                    view.model.set('autoDismiss', true);

                    return view.discard();
                });
            });
        });
    });
});
