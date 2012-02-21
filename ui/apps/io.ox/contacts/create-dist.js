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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 *
 */

define("io.ox/contacts/create-dist",
    ["io.ox/contacts/util", "io.ox/contacts/api",
     "io.ox/core/tk/dialogs", "io.ox/core/config",
     "io.ox/core/tk/forms",
     "io.ox/contacts/model",
     "io.ox/contacts/create-dist-view",
     "less!io.ox/contacts/style.css"
    ], function (util, api, dialogs, config, forms, ContactModel, ContactCreateDistView) {

    "use strict";


    //assemble create form
    var newCreatePane = function () {

        var pane = new dialogs.CreateDialog({'width': '400'}),
            content = pane.getContentNode().addClass("create-distributionlist"),
            controls = pane.getContentControls();

            // create model & view
        var myModel = new ContactModel({data: {}}),
            myView = new ContactCreateDistView({model: myModel});

        myModel.store = function (data, changes) {

            var fId = config.get("folder.contacts");
            // TODO: replace image upload with a field in formsjs method
            if (!_.isEmpty(data)) {
                data.folder_id = fId;
                data.display_name = util.createDisplayName(data);
                return api.create(data);
            }
        };
        content.append(myView.draw().node);
        content.append($('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({
            position: 'absolute',
            right: '-280px',
            top: '-10px'
        })); // TODO needs a better way for placing the notification

        pane.addButton("cancel", "Cancel", "cancel", true);
        controls.append(myView.drawButtons()).on('click', function () {
            pane.close();
        });

        //shutdown Growl

        controls.find('.button').on('click', function () {
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