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
     "io.ox/core/tk/dialogs",
     "io.ox/core/config",
     "css!io.ox/contacts/style.css"
    ], function (util, api, dialogs, config) {

    "use strict";

    function fieldHtml(label, id) {
        return $('<div>').addClass('field').append($('<label>').text(label))
        .append($('<input>', {'form-field': id, type: 'text'}));
    }

    //assemble create form
    var newCreatePane = function () {

        var pane = new dialogs.CreateDialog();
        pane.getContentNode().addClass("create-contact");
        pane.append(
            $('<div>').addClass('block new_contact name')
            .append(fieldHtml('first name', 'first_name'))
            .append(fieldHtml('last name', 'last_name'))
        );

        pane.append(
            $('<div>').addClass('block new_contact company')
            .append(fieldHtml('company', 'company'))
            .append(fieldHtml('department', 'department'))
            .append(fieldHtml('position', 'position'))
            .append(fieldHtml('profession', 'profession'))
        );

        pane.append(
            $('<div>').addClass('block new_contact address')
            .append(fieldHtml('street', 'street_business'))
            .append(fieldHtml('postal code', 'postal_code_business'))
            .append(fieldHtml('city', 'city_business'))
        );

        pane.append(
            $('<div>').addClass('block new_contact phone')
            .append(fieldHtml('tel.', 'telephone_business1'))
        );

        pane.append(
            $('<div>').addClass('block new_contact image')
            .append($('<form>').attr({
            'accept-charset': 'UTF-8',
            'enctype': 'multipart/form-data',
            'id': 'contactUploadImage',
            'method': 'POST',
            'name': 'contactUploadImage',
            'target': 'blank.html'
        })

            .append($('<label>').text('contact image'))
            .append($('<input>').attr({
            'id': 'image1',
            'name': 'file',
            'type': 'file'
        })
            .append($('<iframe>').attr({
            'name': 'hiddenframePicture',
            'src': 'blank.html'
        }).css('display', 'none')))

        ));

        pane.addButton("resolveNewContact", "Save");
        pane.addButton("cancelNewContact", "Cancel");

        $(".content .block .field:nth-child(even)").addClass('even');

        var actions = {

                resolveNewContact: function () {
                    var fId = config.get("folder.contacts"), // TODO workaround
                    formdata = {},
                    formdataString,
                    image = document.getElementById("image1");

//                  collect the data
                    $('.io-ox-dialog-popup .create-contact').find(".new_contact .field input")
                    .each(function (index) {
                        var value =  $(this).val();
                        var id = $(this).attr('form-field');
                        if (value !== "") {
                            formdata[id] = value;
                        }
                    });

                    if (image.files[0]) {
                        formdata.folder_id = fId;
                        formdata.display_name = util.createDisplayName(formdata);
                        formdataString = JSON.stringify(formdata);
                        api.createNewImage(formdataString, image.files[0]);
                    } else {
                        if (!_.isEmpty(formdata)) {
                            formdata.folder_id = fId;
                            formdata.display_name = util.createDisplayName(formdata);
                            api.create(formdata);
                        }
                    }
                },

                cancelNewContact: function () {
//                    console.log(pane);
//                    pane.close;// TODO needs to close the dialog
                }
            };

        pane.show().done(function (action) {
            actions[action]();
          // console.debug(actions);
        });
    };

    return {
        show: newCreatePane
    };

});