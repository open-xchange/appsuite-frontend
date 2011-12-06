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

define("io.ox/contacts/edit/main",
    ["io.ox/contacts/api", "io.ox/core/cache",
     "css!io.ox/contacts/style.css"
     ], function (api, cache) {

    "use strict";

    function extendDeep(parent, child) {
        var i,
        toStr = Object.prototype.toString, astr = "[object Array]";
        child = child || {};
        for (i in parent) {
            if (parent.hasOwnProperty(i)) {
                if (typeof parent[i] === "object") {
                    child[i] = (toStr.call(parent[i]) === astr) ? [] : {};
                    extendDeep(parent[i], child[i]);
                } else {
                    child[i] = parent[i];
                }
            }
        }
        return child;
    }

    // multi instance pattern
    function createInstance(data) {

        var app, win, container,
        formFrame, formContainer;

        app = ox.ui.createApp({
            title: "Edit Contact"
        });

        app.setLauncher(function () {

            win = ox.ui.createWindow({
                title: "Edit Contact",
                toolbar: true
            });

            formContainer = $("<div/>").addClass("abs")
                .css({
                    top: "10px",
                    right: "10px",
                    bottom: "10px",
                    left: "10px"
                });

            formFrame = $("<div/>").addClass("contact_edit_frame")
                .appendTo(formContainer);

            win.nodes.main
                .css({ backgroundColor: "#f0f0f0" })
                .append(formContainer);

            app.setWindow(win);
            win.setQuitOnClose(true);

            win.show(function () {

                function fieldHtml(label, name, datatype) {
                    return $('<div>').addClass('field ' + datatype)
                    .append($('<label>').text(label))
                    .append($('<input>', { name: name, type: 'text'}));
                }

    //              assemble create form

                var paneEdit = $('<div/>').addClass('edit1'),
                    paneEdit2 = $('<div/>').addClass('edit2');

                paneEdit.append(
                    $('<div>').addClass('block edit_contact name')
                    .append(fieldHtml('first name', 'first_name', 'string'))
                    .append(fieldHtml('last name', 'last_name', 'string'))
                )
                .append(
                    $('<divb>').addClass('block edit_contact company')
                    .append(fieldHtml('company', 'company', 'string'))
                    .append(fieldHtml('position', 'position', 'string'))
                    .append(fieldHtml('profession', 'profession', 'string'))
                    .append(fieldHtml('department', 'department', 'string'))
                )
                .append(
                    $('<div>').addClass('block edit_contact address')
                    .append(fieldHtml('street', 'street_business', 'string'))
                    .append(fieldHtml('postal code', 'postal_code_business', 'string'))
                    .append(fieldHtml('city', 'city_business', 'string'))
                )
                .append(
                    $('<div>').addClass('block edit_contact phone')
                    .append(fieldHtml('tel.', 'telephone_business1', 'string'))
                    .append(fieldHtml('sales volume', 'sales_volume', 'string'))
                );

                paneEdit2.append(
                    $('<div>').addClass('block edit_contact unsortedfields')
                    .append(fieldHtml('suffix', 'suffix', 'string'))
                    .append(fieldHtml('title', 'title', 'string'))
                    .append(fieldHtml('street_home', 'street_home', 'string'))
                    .append(fieldHtml('postal_code_home', 'postal_code_home', 'string'))
                    .append(fieldHtml('city_home', 'city_home', 'string'))
                    .append(fieldHtml('state_home', 'state_home', 'string'))
                    .append(fieldHtml('country_home', 'country_home', 'string'))
                    .append(fieldHtml('birthday', 'birthday', 'date'))
                    .append(fieldHtml('marital_status', 'marital_status', 'string'))
                    .append(fieldHtml('number_of_children', 'number_of_children', 'string'))
                    .append(fieldHtml('nickname', 'nickname', 'string'))
                    .append(fieldHtml('spouse_name', 'spouse_name', 'string'))
                    .append(fieldHtml('anniversary', 'anniversary', 'date'))
                    .append(fieldHtml('note', 'note', 'string'))
                    .append(fieldHtml('employee_type', 'employee_type', 'string'))
                    .append(fieldHtml('room_number', 'room_number', 'string'))
                    .append(fieldHtml('state_business', 'state_business', 'string'))
                    .append(fieldHtml('country_business', 'country_business', 'string'))
                    .append(fieldHtml('number_of_employees', 'number_of_employees', 'string'))
                    .append(fieldHtml('tax_id', 'tax_id', 'string'))
                    .append(fieldHtml('commercial_register', 'commercial_register', 'string'))
                    .append(fieldHtml('branches', 'branches', 'string'))
                    .append(fieldHtml('business_category', 'business_category', 'string'))
                    .append(fieldHtml('info', 'info', 'string'))
                    .append(fieldHtml('manager_name', 'manager_name', 'string'))
                    .append(fieldHtml('assistant_name', 'assistant_name', 'string'))
                    .append(fieldHtml('street_other', 'street_other', 'string'))
                    .append(fieldHtml('city_other', 'city_other', 'string'))
                    .append(fieldHtml('postal_code_other', 'postal_code_other', 'string'))
                    .append(fieldHtml('country_other', 'country_other', 'string'))
                    .append(fieldHtml('telephone_business2', 'telephone_business2', 'string'))
                    .append(fieldHtml('fax_business', 'fax_business', 'string'))
                    .append(fieldHtml('telephone_callback', 'telephone_callback', 'string'))
                    .append(fieldHtml('telephone_car', 'telephone_car', 'string'))
                    .append(fieldHtml('telephone_company', 'telephone_company', 'string'))
                    .append(fieldHtml('telephone_home1', 'telephone_home1', 'string'))
                    .append(fieldHtml('telephone_home2', 'telephone_home2', 'string'))
                    .append(fieldHtml('fax_home', 'fax_home', 'string'))
                    .append(fieldHtml('cellular_telephone1', 'cellular_telephone1', 'string'))
                    .append(fieldHtml('cellular_telephone2', 'cellular_telephone2', 'string'))
                    .append(fieldHtml('telephone_other', 'telephone_other', 'string'))
                    .append(fieldHtml('fax_other', 'fax_other', 'string'))
                    .append(fieldHtml('email1', 'email1', 'mail'))
                    .append(fieldHtml('email2', 'email2', 'mail'))
                    .append(fieldHtml('email3', 'email3', 'mail'))
                    .append(fieldHtml('url', 'url', 'string'))
                    .append(fieldHtml('telephone_isdn', 'telephone_isdn', 'string'))
                    .append(fieldHtml('telephone_pager', 'telephone_pager', 'string'))
                    .append(fieldHtml('telephone_primary', 'telephone_primary', 'string'))
                    .append(fieldHtml('telephone_radio', 'telephone_radio', 'string'))
                    .append(fieldHtml('telephone_telex', 'telephone_telex', 'string'))
                    .append(fieldHtml('telephone_ttytdd', 'telephone_ttytdd', 'string'))
                    .append(fieldHtml('instant_messenger1', 'instant_messenger1', 'string'))
                    .append(fieldHtml('instant_messenger2', 'instant_messenger2', 'string'))
                    .append(fieldHtml('telephone_ip', 'telephone_ip', 'string'))
                    .append(fieldHtml('telephone_assistant', 'telephone_assistant', 'string'))
                    .append(fieldHtml('userfield01', 'userfield01', 'string'))
                    .append(fieldHtml('userfield02', 'userfield02', 'string'))
                    .append(fieldHtml('userfield03', 'userfield03', 'string'))
                    .append(fieldHtml('userfield04', 'userfield04', 'string'))
                    .append(fieldHtml('userfield05', 'userfield05', 'string'))
                    .append(fieldHtml('userfield06', 'userfield06', 'string'))
                    .append(fieldHtml('userfield07', 'userfield07', 'string'))
                    .append(fieldHtml('userfield08', 'userfield08', 'string'))
                    .append(fieldHtml('userfield09', 'userfield09', 'string'))
                    .append(fieldHtml('userfield10', 'userfield10', 'string'))
                    .append(fieldHtml('userfield11', 'userfield11', 'string'))
                    .append(fieldHtml('userfield12', 'userfield12', 'string'))
                    .append(fieldHtml('userfield13', 'userfield13', 'string'))
                    .append(fieldHtml('userfield14', 'userfield14', 'string'))
                    .append(fieldHtml('userfield15', 'userfield15', 'string'))
                    .append(fieldHtml('userfield16', 'userfield16', 'string'))
                    .append(fieldHtml('userfield17', 'userfield17', 'string'))
                    .append(fieldHtml('userfield18', 'userfield18', 'string'))
                    .append(fieldHtml('userfield19', 'userfield19', 'string'))
                    .append(fieldHtml('userfield20', 'userfield20', 'string'))
                    .append(fieldHtml('distribution_list', 'distribution_list', 'array'))
                    .append(fieldHtml('number_of_distribution_list', 'number_of_distribution_list', 'number'))
                    .append(fieldHtml('contains_image1', 'contains_image1fix', 'string'))
                    .append(fieldHtml('image_last_modified', 'image_last_modified', 'timestamp'))
                    .append(fieldHtml('state_other', 'state_other', 'string'))
                    .append(fieldHtml('file_as', 'file_as', 'string'))
                    .append(fieldHtml('number_of_attachments', 'number_of_attachments', 'number'))
                    .append(fieldHtml('image1_content_type', 'image1_content_type', 'string'))
                    .append(fieldHtml('mark_as_distributionlist', 'mark_as_distributionlist', 'boolean'))
                    .append(fieldHtml('default_address', 'default_address', 'number'))
//                    .append(fieldHtml('internal_userid', 'internal_userid', 'number'))
//                    .append(fieldHtml('image1_url', 'image1_url', 'string'))

                    .append(
                        $('<form/>',
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
                            $('<input/>',
                            {   'id': 'image1',
                                'name': 'file',
                                'type': 'file'
                            })
                        )
                        .append(
                            $('<iframe/>',
                            {   'name': 'hiddenframePicture',
                                'src': 'blank.html'
                            })
                            .css('display', 'none')
                        )
                    )
                );

                var actions = {
                    save: function () {
                        var formdata = {},
                        image = paneEdit2.find("#image1").get(0);

                        // select the data
                        // collect all strings
                        formFrame.find('.field.string input')
                            .each(function (index) {
                                var value =  $(this).val(),
                                    id = $(this).attr('name');
                                if (value !== "") {
                                    formdata[id] = value;
                                }
                            });
                        // collect all dates
                        formFrame.find('.field.date input')
                        .each(function (index) {
                            var value =  $(this).val(),
                                id = $(this).attr('name'),
                                dateArray = value.split('.');
                            var date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                            if (value !== "") {
                                formdata[id] = date;
                            }
                        });
                        // collect all mails
                        formFrame.find('.field.mail input')
                        .each(function (index) {
                            var value =  $(this).val(),
                                id = $(this).attr('name');
                            if (value !== "") {
                                formdata[id] = value;
                            }
                        });
                     // collect all arrays
//                        formFrame.find(".edit_contact input[data-type|='array']")
//                        .each(function (index) {
//                            var value =  $(this).val(),
//                                id = $(this).attr('name');
//                            if (value !== "") {
//                                formdata[id] = value;
//                            }
//                        });
                        // collect all numbers
                        formFrame.find(".edit_contact input[data-type|='number']")
                        .each(function (index) {
                            var value =  $(this).val(),
                                id = $(this).attr('name');
                            if (value !== "") {
                                formdata[id] = value;
                            }
                        });
                        var timestamp = new Date().getTime();
                        formdata.folderId = data.folder_id;
                        formdata.id = data.id;
                        formdata.timestamp = timestamp;

                        if (image.files && image.files[0]) {
                            api.editNewImage(JSON.stringify(formdata), image.files[0]);
                        } else {
                            if (!_.isEmpty(formdata)) {
                                api.edit(formdata);
                            }
                        }
                        app.quit();
                    },

//                  cancel and quit the update app
                    cancel: function () {
                        app.quit();
                    }
                };

                $('<button>').text('save').addClass('io-ox-button')
                .appendTo(paneEdit2).on('click', function () {
                    actions.save();
                });
                $('<button>').text('cancel').addClass('io-ox-button')
                .appendTo(paneEdit2).on('click', function () {
                    actions.cancel();
                });

                paneEdit.appendTo(formFrame);
                paneEdit2.appendTo(formFrame);

                formFrame.find(".block .field:nth-child(even)")
                .addClass('even');

                // fill strings
                formFrame.find('.field.string input')//TODO business_category isnt submitted
                .each(function (index) {
                    var name = $(this).attr('name');
                    $(this).val(data[name]);
                });
                // fill dates
                formFrame.find('.field.date input')
                .each(function (index) {
                    var name = $(this).attr('name');
                    if (data[name]) {
                        var date = new Date(data[name]);
                        var dateFormated =  date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
                        $(this).val(dateFormated);
                    }
                });
                // fill mails
                formFrame.find('.field.mail input')
                .each(function (index) {
                    var name = $(this).attr('name');
                    $(this).val(data[name]);
                });

            });
        });

        return app;
    }

    return {
        getApp: createInstance
    };

});