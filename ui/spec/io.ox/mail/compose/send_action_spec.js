/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define([
    'io.ox/core/extensions',
    'io.ox/mail/compose/actions/send'
], function (ext) {
    describe('Mail send action extension point', function () {
        //FIXME: move this function into a library
        function extensionCascade(point, baton) {
            return point.reduce(function (def, p) {
                if (!def || !def.then) def = $.when(def);
                return def.then(function (result, newData) {
                    if (result && result.data) baton.resultData = result.data;
                    if (newData) baton.newData = newData;
                    return $.when();
                }, function (result) {
                    //TODO: think about the naming, here
                    if (result) baton.result = result;
                    //handle errors/warnings in reject case
                    if (result && result.error) baton.error = result.error;
                    if (result && result.warnings) baton.warning = result.warnings;
                    return $.when();
                }).then(function () {
                    if (baton.isPropagationStopped()) return;
                    if (baton.isDisabled(point.id, p.id)) return;
                    return p.perform.apply(undefined, [baton]);
                });
            }, $.when());
        }
        describe('send extension', function () {
            var point = ext.point('io.ox/mail/compose/actions/send'),
                baton;

            beforeEach(function () {
                baton = new ext.Baton({
                    mail: {
                        subject: 'test',
                        to: [['Test', 'test@example.com']],
                        files: [],
                        attachments: [{}]
                    },
                    view: {
                        $el: $(),
                        blockReuse: sinon.spy(),
                        unblockReuse: sinon.spy()
                    },
                    stopPropagation: sinon.spy(),
                    model: {
                        dirty: sinon.spy(),
                        set: sinon.spy()
                    },
                    app: {
                        id: 'compose_test',
                        getWindow: sinon.spy(),
                        get: sinon.stub().returns($()),
                        launch: sinon.spy(),
                        quit: sinon.spy()
                    }
                });
                baton.disable('io.ox/mail/compose/actions/send', 'image-resize');

                // for 'disable-manual-close' extension
                sinon.stub(ox.ui.apps, 'get').withArgs('compose_test').returns(baton.app);
            });

            afterEach(function () {
                ox.ui.apps.get.restore();
                baton = null;
            });

            it('invoking all extensions and send fails should reject on error', function () {
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/html;charset=UTF-8' }, '<!DOCTYPE html><html><head><META http-equiv="Content-Type" content="text/html; charset=UTF-8"><script type="text/javascript">(parent["callback_new"] || window.opener && window.opener["callback_new"])({"error":"A Guard server error occurred with HTTP status code 500. Error message: Bad password.","error_params":[500,"Bad password."],"categories":"ERROR","category":8,"code":"GUARD-0003","error_id":"-1678404933-142539","error_desc":"A Guard server error occurred. Status code: 500. Error message: Bad password."})</script></head></html>');
                });

                return extensionCascade(point, baton).then(function () {
                    expect(baton.app.launch.calledOnce, 'app has been restarted').to.be.true;
                    expect(baton.model.dirty.called, 'model.dirty has been called').to.be.false;
                });
            });

            it('invoking all extensions and send succeeds should quit the mail compose app', function () {
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({ data: true }));
                });

                return extensionCascade(point, baton).then(function () {
                    expect(baton.app.quit.calledOnce, 'app has quit').to.be.true;
                    expect(baton.model.dirty.calledWith(false), 'model.dirty(false) has been called').to.be.true;
                });
            });
        });
    });
});
