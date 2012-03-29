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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 *
 */

define('io.ox/contacts/create/main',
    ['io.ox/contacts/api',
     'io.ox/contacts/model',
     'io.ox/contacts/create/view'
    ], function (api, ContactModel, create) {

    'use strict';

    function getImage(set) {
        return set && set.files && set.files[0] ? set.files[0] : void(0);
    }

    var show = function (app) {

        var // create model & view
            model = new ContactModel(),
            view = new create.View({ model: model }),
            // popup
            pane = create.getPopup(view),
            // return value
            def = $.Deferred();

        model.store = function (data) {
            // add folder id
            data.folder_id = app.folder.get();
            // has file?
            var image = view.node.find('input[name="picture-upload-file"][type="file"]').get(0);
            return api.create(data, getImage(image));
        };

        model.on('save:done', function (e, data) {
            def.resolve(data);
        });

        pane.on('save', { model: model }, function (e) {
                e.data.model.save()
                    .done(this.close)
                    .fail(this.idle);
            })
            .show();

        return def;
    };

    return {
        show: show
    };

});