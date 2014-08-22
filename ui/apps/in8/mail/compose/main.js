/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('in8/mail/compose/main',
    ['io.ox/mail/api',
     'io.ox/mail/compose/view',
     'io.ox/core/notifications',
     'less!io.ox/mail/style',
     'less!io.ox/mail/compose/style',
     'less!in8/mail/compose/style'
    ], function (mailAPI, MailComposeView, notifications) {

    'use strict';

    var blocked = {};

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
                name: 'in8/mail/compose'
            });

        function compose(type) {

            return function (obj) {

                var def = $.Deferred();
                _.url.hash('app', 'in8/mail/compose:' + type);

                obj = _.extend({mode: type}, obj);

                app.cid = 'in8/mail:' + type + '.' + _.cid(obj);

                app.view = new MailComposeView({ data: obj, app: app });

                $('.io-ox-mail-window .window-content').append(app.view.render().$el.addClass('abs scrollable').removeClass('container'));
                app.view.fetchMail(obj).done(function () {
                    app.view.setMail()
                    .done(function () {
                        def.resolve({app: app});
                    });
                })
                .fail(function (e) {
                    notifications.yell(e);
                    app.quit();
                    def.reject();
                });

                return def;
            };
        }

        // destroy
        app.setQuit(function () { return app.view.discard(); });

        app.compose  = compose('compose');
        app.forward  = compose('forward');
        app.reply    = compose('reply');
        app.replyall = compose('replyall');
        app.edit     = compose('edit');

        return app;
    }

    return {
        getApp: createInstance,

        reuse: function (type, data) {
            //disable reuse if at least one app is sending (depends on type)
            var unblocked = function (sendtype) {
                return blocked[sendtype] === undefined || blocked[sendtype] <= 0;
            };
            if (type === 'reply' && unblocked(mailAPI.SENDTYPE.REPLY)) {
                return ox.ui.App.reuse('in8/mail:reply.' + _.cid(data));
            }
            if (type === 'replyall' && unblocked(mailAPI.SENDTYPE.REPLY)) {
                return ox.ui.App.reuse('in8/mail:replyall.' + _.cid(data));
            }
            if (type === 'forward' && unblocked(mailAPI.SENDTYPE.FORWARD)) {
                return ox.ui.App.reuse('in8/mail:forward.' + _.cid(data));
            }
            if (type === 'edit' && unblocked(mailAPI.SENDTYPE.DRAFT)) {
                return ox.ui.App.reuse('in8/mail:edit.' + _.cid(data));
            }
        }
    };
});
