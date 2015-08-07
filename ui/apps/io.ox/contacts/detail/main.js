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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/contacts/detail/main', [
    'io.ox/contacts/api',
    'io.ox/core/yell',
    'io.ox/contacts/view-detail',
    'gettext!io.ox/contacts',
    'io.ox/core/extensions',
    'io.ox/contacts/util'
], function (api, yell, detailView, gt, ext, util) {

    'use strict';

    var NAME = 'io.ox/contacts/detail';

    ox.ui.App.mediator(NAME, {
        'show-contact': function (app) {
            app.showContact = function (contact) {
                api.get(contact).done(function (data) {

                    var baton = ext.Baton({ data: data }),
                        title = util.getFullName(data),
                        label = data.mark_as_distributionlist ? gt('Distribution List Details') : gt('Contact Details');

                    app.setTitle(title);
                    api.on('delete:' + _.ecid(data), function () {
                        app.quit();
                    });
                    app.on('quit', function () {
                        api.off('delete:' + _.ecid(data), function () {
                            app.quit();
                        });
                    });

                    app.getWindowNode().addClass('detail-view-app').append($('<div class="f6-target detail-view-container">').attr({
                        'tabindex': 1,
                        'role': 'complementary',
                        'aria-label': label
                    }).append(detailView.draw(baton)));
                }).fail(yell);
            };
        }
    });

    // multi instance pattern
    function createInstance() {

        // application object
        var app = ox.ui.createApp({
            closable: true,
            name: NAME,
            title: ''
        });

        // launcher
        return app.setLauncher(function (options) {

            var win = ox.ui.createWindow({
                chromeless: true,
                name: NAME,
                toolbar: false
            });

            app.setWindow(win);
            app.mediate();
            win.show();

            var cid = options.cid, obj;
            if (cid !== undefined) {
                // called from contacts app
                obj = _.cid(cid);
                app.setState({ folder: obj.folder_id, id: obj.id });
                app.showContact(obj);
                return;
            }

            // deep-link
            obj = app.getState();

            if (obj.folder && obj.id) {
                app.showContact(obj);
            }
        });
    }

    return {
        getApp: createInstance
    };
});
