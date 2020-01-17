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

            describe('should show confirm dialog', function () {
                it('for dirty new mails', function () {
                    var spy = sinon.spy(ModalDialog.prototype, 'open'),
                        view = new View({
                            model: new ComposeModel(),
                            config: new ConfigModel(),
                            app: fakeApp
                        });
                    sinon.stub(view, 'dirty').returns(true);
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
                        model: new ComposeModel(),
                        config: new ConfigModel(),
                        app: fakeApp
                    });
                    //set model to be dirty, so normally discard confirm dialog would kick in
                    sinon.stub(view, 'dirty').returns(true);
                    view.config.set('autoDismiss', true);

                    return view.discard();
                });
            });
        });
    });
});
