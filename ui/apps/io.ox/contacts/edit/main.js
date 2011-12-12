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
                toolbar: true,
                close: true
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

            win.show(function () {

                function fieldHtml(label, name) {
                    return $('<div>').addClass('field ')
                    .append($('<label>').text(label))
                    .append($('<input>', { name: name, type: 'text'}));
                }

    //              assemble create form

                var paneEdit = $('<div/>').addClass('edit1'),
                    paneEdit2 = $('<div/>').addClass('edit2');

                paneEdit.append(
                    $('<div>').addClass('block edit_contact name')
                    .append(fieldHtml('first name', 'first_name'))
                    .append(fieldHtml('last name', 'last_name'))
                )
                .append(
                    $('<divb>').addClass('block edit_contact company')
                    .append(fieldHtml('company', 'company'))
                    .append(fieldHtml('position', 'position'))
                    .append(fieldHtml('profession', 'profession'))
                    .append(fieldHtml('department', 'department'))
                )
                .append(
                    $('<div>').addClass('block edit_contact address')
                    .append(fieldHtml('street', 'street_business'))
                    .append(fieldHtml('postal code', 'postal_code_business'))
                    .append(fieldHtml('city', 'city_business'))
                )
                .append(
                    $('<div>').addClass('block edit_contact phone')
                    .append(fieldHtml('tel.', 'telephone_business1'))
                    .append(fieldHtml('sales volume', 'sales_volume'))
                );

                paneEdit2.append(
                    $('<div>').addClass('block edit_contact unsortedfields')
                    .append(fieldHtml('suffix', 'suffix'))
                    .append(fieldHtml('title', 'title'))
                    .append(fieldHtml('street_home', 'street_home'))
                    .append(fieldHtml('postal_code_home', 'postal_code_home'))
                    .append(fieldHtml('city_home', 'city_home'))
                    .append(fieldHtml('state_home', 'state_home'))
                    .append(fieldHtml('country_home', 'country_home'))
                    .append(fieldHtml('birthday', 'birthday'))
                    .append(fieldHtml('marital_status', 'marital_status'))
                    .append(fieldHtml('number_of_children', 'number_of_children'))
                    .append(fieldHtml('nickname', 'nickname'))
                    .append(fieldHtml('spouse_name', 'spouse_name'))
                    .append(fieldHtml('anniversary', 'anniversary'))
                    .append(fieldHtml('note', 'note'))
                    .append(fieldHtml('employee_type', 'employee_type'))
                    .append(fieldHtml('room_number', 'room_number'))
                    .append(fieldHtml('state_business', 'state_business'))
                    .append(fieldHtml('country_business', 'country_business'))
                    .append(fieldHtml('number_of_employees', 'number_of_employees'))
                    .append(fieldHtml('tax_id', 'tax_id'))
                    .append(fieldHtml('commercial_register', 'commercial_register'))
                    .append(fieldHtml('branches', 'branches'))
                    .append(fieldHtml('business_category', 'business_category'))
                    .append(fieldHtml('info', 'info'))
                    .append(fieldHtml('manager_name', 'manager_name'))
                    .append(fieldHtml('assistant_name', 'assistant_name'))
                    .append(fieldHtml('street_other', 'street_other'))
                    .append(fieldHtml('city_other', 'city_other'))
                    .append(fieldHtml('postal_code_other', 'postal_code_other'))
                    .append(fieldHtml('country_other', 'country_other'))
                    .append(fieldHtml('telephone_business2', 'telephone_business2'))
                    .append(fieldHtml('fax_business', 'fax_business'))
                    .append(fieldHtml('telephone_callback', 'telephone_callback'))
                    .append(fieldHtml('telephone_car', 'telephone_car'))
                    .append(fieldHtml('telephone_company', 'telephone_company'))
                    .append(fieldHtml('telephone_home1', 'telephone_home1'))
                    .append(fieldHtml('telephone_home2', 'telephone_home2'))
                    .append(fieldHtml('fax_home', 'fax_home'))
                    .append(fieldHtml('cellular_telephone1', 'cellular_telephone1'))
                    .append(fieldHtml('cellular_telephone2', 'cellular_telephone2'))
                    .append(fieldHtml('telephone_other', 'telephone_other'))
                    .append(fieldHtml('fax_other', 'fax_other'))
                    .append(fieldHtml('email1', 'email1'))
                    .append(fieldHtml('email2', 'email2'))
                    .append(fieldHtml('email3', 'email3'))
                    .append(fieldHtml('url', 'url'))
                    .append(fieldHtml('telephone_isdn', 'telephone_isdn'))
                    .append(fieldHtml('telephone_pager', 'telephone_pager'))
                    .append(fieldHtml('telephone_primary', 'telephone_primary'))
                    .append(fieldHtml('telephone_radio', 'telephone_radio'))
                    .append(fieldHtml('telephone_telex', 'telephone_telex'))
                    .append(fieldHtml('telephone_ttytdd', 'telephone_ttytdd'))
                    .append(fieldHtml('instant_messenger1', 'instant_messenger1'))
                    .append(fieldHtml('instant_messenger2', 'instant_messenger2'))
                    .append(fieldHtml('telephone_ip', 'telephone_ip'))
                    .append(fieldHtml('telephone_assistant', 'telephone_assistant'))
                    .append(fieldHtml('userfield01', 'userfield01'))
                    .append(fieldHtml('userfield02', 'userfield02'))
                    .append(fieldHtml('userfield03', 'userfield03'))
                    .append(fieldHtml('userfield04', 'userfield04'))
                    .append(fieldHtml('userfield05', 'userfield05'))
                    .append(fieldHtml('userfield06', 'userfield06'))
                    .append(fieldHtml('userfield07', 'userfield07'))
                    .append(fieldHtml('userfield08', 'userfield08'))
                    .append(fieldHtml('userfield09', 'userfield09'))
                    .append(fieldHtml('userfield10', 'userfield10'))
                    .append(fieldHtml('userfield11', 'userfield11'))
                    .append(fieldHtml('userfield12', 'userfield12'))
                    .append(fieldHtml('userfield13', 'userfield13'))
                    .append(fieldHtml('userfield14', 'userfield14'))
                    .append(fieldHtml('userfield15', 'userfield15'))
                    .append(fieldHtml('userfield16', 'userfield16'))
                    .append(fieldHtml('userfield17', 'userfield17'))
                    .append(fieldHtml('userfield18', 'userfield18'))
                    .append(fieldHtml('userfield19', 'userfield19'))
                    .append(fieldHtml('userfield20', 'userfield20'))
                   // .append(fieldHtml('distribution_list', 'distribution_list', 'array'))
                   // .append(fieldHtml('number_of_distribution_list', 'number_of_distribution_list', 'number'))
                  //  .append(fieldHtml('contains_image1', 'contains_image1fix', 'string'))
                   // .append(fieldHtml('image_last_modified', 'image_last_modified', 'timestamp'))
                    .append(fieldHtml('state_other', 'state_other'))
                   // .append(fieldHtml('file_as', 'file_as', 'string'))
                   // .append(fieldHtml('number_of_attachments', 'number_of_attachments', 'number'))
                   // .append(fieldHtml('image1_content_type', 'image1_content_type', 'string'))
                   // .append(fieldHtml('mark_as_distributionlist', 'mark_as_distributionlist', 'boolean'))
                   // .append(fieldHtml('default_address', 'default_address', 'number'))
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
                        formFrame.find('.field input')
                            .each(function (index) {
                                var value =  $(this).val(),
                                    id = $(this).attr('name');
                                if (value !== "") {
                                    formdata[id] = value;
                                }
                            });
                        // collect anniversary
                        formFrame.find('.field input[name="anniversary"]')
                        .each(function (index) {
                            var value =  $(this).val(),
                                id = $(this).attr('name'),
                                dateArray = value.split('.');
                            var date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                            if (value !== "") {
                                formdata[id] = date;
                            }
                        });

                        // collect birthday
                        formFrame.find('.field input[name="birthday"]')
                        .each(function (index) {
                            var value =  $(this).val(),
                                id = $(this).attr('name'),
                                dateArray = value.split('.');
                            var date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                            if (value !== "") {
                                formdata[id] = date;
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
                formFrame.find('.field input')//TODO business_category isnt submitted
                .each(function (index) {
                    var name = $(this).attr('name');
                    $(this).val(data[name]);
                });

                // need a better way to fill the dates
                // fill anniversary
                formFrame.find('.field input[name="anniversary"]')
                .each(function (index) {
                    var name = $(this).attr('name');
                    if (data[name]) {
                        var date = new Date(data[name]);
                        var dateFormated =  date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
                        $(this).val(dateFormated);
                    }
                });
             // fill birthday
                formFrame.find('.field input[name="birthday"]')
                .each(function (index) {
                    var name = $(this).attr('name');
                    if (data[name]) {
                        var date = new Date(data[name]);
                        var dateFormated =  date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear();
                        $(this).val(dateFormated);
                    }
                });
            });
        });

        return app;
    }

    return {
        getApp: createInstance
    };

});