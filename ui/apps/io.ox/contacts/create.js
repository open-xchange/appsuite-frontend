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

define("io.ox/contacts/create",
    ["io.ox/contacts/util", "io.ox/contacts/api",
     "io.ox/core/tk/dialogs", "io.ox/core/config",
     "io.ox/core/tk/forms",
     "io.ox/contacts/model",
     "io.ox/contacts/create-view", 'gettext!io.ox/contacts/contacts',
     "less!io.ox/contacts/style.css"
    ], function (util, api, dialogs, config, forms, ContactModel, ContactCreateView, gt) {

    "use strict";

    function fieldHtml(label, name) {
        return $('<div>').addClass('field')
            .append($('<label>').text(label))
            .append($('<input>', { name: name, type: 'text'}));
    }

    //assemble create form
    var newCreatePane = function () {

        var pane = new dialogs.CreateDialog({'width': '400'}),
            content = pane.getContentNode().addClass("create-contact"),
            controls = pane.getContentControls();

            // create model & view
        var myModel = new ContactModel({data: {}}),
            myView = new ContactCreateView({model: myModel});

        myModel.store = function (data, changes) {
            var fId = config.get("folder.contacts");
            // TODO: replace image upload with a field in formsjs method
            var image = $('#contactUploadImage').find("input[type=file]").get(0);
            if (image.files && image.files[0]) {
                data.folder_id = fId;
//                    console.log(data);
                return api.createNewImage(JSON.stringify(data), image.files[0])
                .done(function () {
                        controls.find('.btn').trigger('clicksave');
                    });
            } else {
                if (!_.isEmpty(data)) {
                    data.folder_id = fId;
                    data.display_name = util.createDisplayName(data);
                    return api.create(data).done(function () {
                        controls.find('.btn').trigger('clicksave');
                    });
                }
            }
        };
        content.append(myView.draw().node);
        content.append($('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({
            position: 'absolute',
            right: '-280px',
            top: '-10px'
        })); // TODO needs a better way for placing the notification

        pane.addButton("cancel", gt('Cancel'), "cancel", {inverse: true});
        controls.append(myView.drawButtons()).on('clicksave', function () {
            pane.close();
        });

        //shutdown Growl

        controls.find('.btn-primary').on('click', function () {
            content.find('#myGrowl').jGrowl('shutdown');
        });
//        window.model = myModel;
//        window.view = myView;

        pane.show();
//        pane.addButton("save", "Save", "save");
//        pane.addButton("cancel", "Cancel", "cancel");
    };

    return {
        show: newCreatePane
    };

});