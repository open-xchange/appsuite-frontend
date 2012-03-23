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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 *
 */

define('io.ox/contacts/create',
    ['io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/dialogs',
     'io.ox/core/config',
     'io.ox/contacts/model',
     'io.ox/contacts/create-view',
     'gettext!io.ox/contacts/contacts',
     'less!io.ox/contacts/style.css'
    ], function (util, api, dialogs, config, ContactModel, ContactCreateView, gt) {

    'use strict';

    var show = function (app) {

        var pane = new dialogs.CreateDialog({ easyOut: true, width: '500' }),
            body = pane.getBody().addClass('create-contact'),
            footer = pane.getFooter(),
            // create model & view
            model = new ContactModel(),
            view = new ContactCreateView({ model: model }),
            // return value
            def = $.Deferred();

        pane.header(
            $('<h4>').text(gt('Add new contact'))
        );

        model.store = function (data, changes) {
            // add folder id
            data.folder_id = app.folder.get();
            // TODO: replace image upload with a field in forms.js method
            var image = view.node.find('input[name="picture-upload-file"][type="file"]').get(0);
            if (image && image.files && image.files[0]) {
                return api.createNewImage(JSON.stringify(data), image.files[0]);
            } else {
                return api.create(data);
            }
        };

        model.on('save:done', function (e, data) {
            def.resolve(data);
            pane.close();
        });

        body.append(
            view.draw().node,
            $('<div>', {id: 'myGrowl'}).addClass('jGrowl')
                .css({
                    position: 'absolute',
                    right: '-280px',
                    top: '-10px'
                }) // TODO needs a better way for placing the notification
        );

        pane.addButton('cancel', gt('Cancel'), 'cancel', { inverse: true });
        footer.prepend(view.drawButtons(pane));

        pane.show(function () {
            this.find('input[type=text]').first().focus();
        });

        return def;
    };

    return {
        show: show
    };

});