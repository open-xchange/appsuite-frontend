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
     "css!io.ox/contacts/style.css"
    ], function (util, api, dialogs, config) {

    "use strict";

    function fieldHtml(label, name) {
        return $('<div>').addClass('field')
            .append($('<label>').text(label))
            .append($('<input>', { name: name, type: 'text'}));
    }

    //assemble create form
    var newCreatePane = function () {

        var pane = new dialogs.CreateDialog(),
            content = pane.getContentNode().addClass("create-contact");

        content.append(
                $('<div>').addClass('block new_contact name')
                .append(fieldHtml('first name', 'first_name'))
                .append(fieldHtml('last name', 'last_name'))
            )
            .append(
                $('<div>').addClass('block new_contact company')
                .append(fieldHtml('company', 'company'))
                .append(fieldHtml('department', 'department'))
                .append(fieldHtml('position', 'position'))
                .append(fieldHtml('profession', 'profession'))
            )
            .append(
                $('<div>').addClass('block new_contact address')
                .append(fieldHtml('street', 'street_business'))
                .append(fieldHtml('postal code', 'postal_code_business'))
                .append(fieldHtml('city', 'city_business'))
            )
            .append(
                $('<div>').addClass('block new_contact phone')
                .append(fieldHtml('tel.', 'telephone_business1'))
            )
            .append(
                $('<div>').addClass('block new_contact image')
                .append(
                    $('<form>',
                    {   'accept-charset': 'UTF-8',
                        'enctype': 'multipart/form-data',
                        'id': 'contactUploadImage',
                        'method': 'POST',
                        'name': 'contactUploadImage',
                        'target': 'blank.html'
                    })
                    .append(
                        $('<label>').text('contact image')
                    )
                    .append(
                        $('<input>',
                        {   'id': 'image1',
                            'name': 'file',
                            'type': 'file'
                        })
                    )
                    .append(
                        $('<iframe>',
                        {   'name': 'hiddenframePicture',
                            'src': 'blank.html'
                        })
                        .css('display', 'none')
                    )
                )
            );

        pane.addButton("save", "Save");
        pane.addButton("cancel", "Cancel");

        content.find(".block .field:nth-child(even)").addClass('even');

        var save = function () {

            var fId = config.get("folder.contacts"), // TODO workaround
                formdata = {},
                image = content.find('#image1').get(0);

            // collect the data
            content.find(".new_contact .field input")
                .each(function (index) {
                    var value = $(this).val(),
                        id = $(this).attr('name');
                    if (value !== "") {
                        formdata[id] = value;
                    }
                });

            if (image.files && image.files[0]) {
                formdata.folder_id = fId;
                formdata.display_name = util.createDisplayName(formdata);
                api.createNewImage(JSON.stringify(formdata), image.files[0]);
            } else {
                if (!_.isEmpty(formdata)) {
                    formdata.folder_id = fId;
                    formdata.display_name = util.createDisplayName(formdata);
                    api.create(formdata);
                }
            }
        };

        pane.show().done(function (action) {
            if (action === 'save') {
                save();
            }
            // clean up
            content = pane = null;
        });
    };

    return {
        show: newCreatePane
    };

});