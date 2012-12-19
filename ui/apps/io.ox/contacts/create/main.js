/**
 *
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 *
 */

define('io.ox/contacts/create/main',
    ['io.ox/contacts/model',
     'io.ox/contacts/create/view',
     'io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/extensions'
    ], function (model, view, util, api, ext) {

    'use strict';

    var show = function (app) {

        var pane,
            def = $.Deferred(),
            contact = model.factory.create({
                folder_id: app.folder.get()
            });

        pane = view.getPopup(contact);
        pane.on('save', function (action) {
            contact.save().done(function (result) {
                pane.close();
                def.resolve(result);
            }).fail(function (result) {
                pane.idle();
            });
        });
        pane.on('cancel', function () {
            def.resolve();
        });

        ext.point('io.ox/contacts/create/main/model').invoke('customizeModel', contact, contact);

        pane.show();

        return def;
    };

    ext.point('io.ox/contacts/create/main/model').extend({
        id: 'io.ox/contacts/create/main/model/auto_display_name',
        customizeModel: function (contact) {
            contact.on('change:first_name change:last_name', function () {
                contact.set('display_name', util.getFullName(contact.toJSON()));
            });
        }
    });

    return {
        show: show
    };

});
