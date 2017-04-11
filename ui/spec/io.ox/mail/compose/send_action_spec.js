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
            var point = ext.point('io.ox/mail/compose/actions/send');

            it('invoking all extensions and send fails should reject on error', function () {
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/html;charset=UTF-8' }, '<!DOCTYPE html><html><head><META http-equiv="Content-Type" content="text/html; charset=UTF-8"><script type="text/javascript">(parent["callback_new"] || window.opener && window.opener["callback_new"])({"error":"A Guard server error occurred with HTTP status code 500. Error message: Bad password.","error_params":[500,"Bad password."],"categories":"ERROR","category":8,"code":"GUARD-0003","error_id":"-1678404933-142539","error_desc":"A Guard server error occurred. Status code: 500. Error message: Bad password."})</script></head></html>');
                });
                var result = $.Deferred(),
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
                        app: {
                            getWindow: sinon.spy(),
                            get: sinon.spy(),
                            launch: function () {
                                return result.resolve('app launched again');
                            }
                        }
                    });

                point.disable('disable-manual-close');
                extensionCascade(point, baton);

                return result.then(function (result) {
                    expect(result).to.be.equal('app launched again');
                }).always(function () {
                    point.enable('disable-manual-close');
                });
            });

            it('invoking all extensions and send succeeds should quit the mail compose app', function () {
                this.server.respondWith('POST', /api\/mail\?action=new/, function (xhr) {
                    xhr.respond(200, { 'Content-Type': 'text/javascript;charset=UTF-8' }, JSON.stringify({ data: true }));
                });
                var result = $.Deferred(),
                    baton = new ext.Baton({
                        mail: {
                            subject: 'test',
                            to: [['Test', 'test@example.com']],
                            files: [],
                            attachments: [{}]
                        },
                        model: {
                            dirty: sinon.spy()
                        },
                        view: {
                            $el: $(),
                            blockReuse: sinon.spy(),
                            unblockReuse: sinon.spy()
                        },
                        stopPropagation: sinon.spy(),
                        app: {
                            getWindow: sinon.spy(),
                            quit: function () {
                                result.resolve('app quit');
                            }

                        }
                    });

                point.disable('disable-manual-close');
                extensionCascade(point, baton);

                return result.then(function (result) {
                    expect(result).to.be.equal('app quit');
                }).always(function () {
                    point.enable('disable-manual-close');
                });
            });
        });
    });
});
