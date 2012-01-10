/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define("io.ox/contacts/edit/view-form",
    ["io.ox/core/extensions",
     "gettext!io.ox/contacts/contacts",
     "io.ox/contacts/util",
     "io.ox/contacts/api"
    ], function (ext, gt, util, api) {

    "use strict";

    var app = null;
    // smart join
    var join = function () {
        return _(arguments)
        .select(function (obj, i) {
            return i > 0 && !!obj;
        })
        .join(arguments[0] || "");
    };

    function renewHeader() {
        var newObj = {
            title: $('input[name="title"]').val(),
            last_name: $('input[name="last_name"]').val(),
            first_name: $('input[name="first_name"]').val(),
            position: $('input[name="position"]').val(),
            company: $('input[name="company"]').val(),
            profession: $('input[name="profession"]').val()
        },
            nameClearTitle = $('.name.clear-title'),
            jobClearTitle = $('.job.clear-title');

        nameClearTitle.text(util.getFullName(newObj));
        jobClearTitle.text(util.getJob(newObj));
    }

    function addField(o) {
        var field = $('<input>', { name: o.name, type: 'text' })
            .addClass('nice-input')
            // TODO: add proper CSS class
            .css({ fontSize: '14px', width: '300px', paddingTop: '0.25em', paddingBottom: '0.25em' })
            .on('change', {name: o.name, node: o.node}, function (e) {
                    var tr = $(e.data.node).find('tr.' + e.data.name);
                    if (tr.find('input').val() === '') {
                        tr.removeClass('filled');
                    } else {
                        tr.addClass('filled');
                    }
                }),
            td = $("<td>").addClass("value").css('paddingBottom', '0.5em').append(field),
            tr = $("<tr>").addClass(o.id + ' ' + o.name)
                .append(
                    $("<td>").addClass("label")
                    .css({ paddingTop: '7px', width: '150px' })
                    .text(o.label)
                )
                .append(td);
        // auto-update header?
        if (/^(first_name|last_name|title|company|position|profession)$/.test(o.name)) {
            field.on('change keyup', { name: o.name }, function (e) {
                _.defer(renewHeader);
            });
        }
        if (!o.value) {
            if (_.isFunction(o.fn)) {
                o.fn(td);
            } else {
                if (typeof o.fn === "string") {
                    tr.addClass(o.fn);
                }
            }
            tr.appendTo(o.node);
        } else {
            field.val(o.value);
            tr.appendTo(o.node);
        }
    }


    function addSwitch(node, id, title) {
        var button = $('<a>').addClass(id).text('+ ' + title),
            tr = $('<tr>').append($('<td>'), $('<td>').append(button));
        button.on('click', {id: id}, function (event) {
            if (button.text() === '+ ' + title) {
                $(node).find('.' + event.data.id + '.hidden').removeClass('hidden').addClass('visible');
                button.text('- ' + title);
            } else {
                $(node).find('.' + event.data.id + '.visible').removeClass('visible').addClass('hidden');
                button.text('+ ' + title);
            }
        });
        tr.appendTo(node);
    }


    function addSpacer(node) {
        var tr = $('<tr>').append(
            $('<td>', { colspan: '2' }).text('\u00A0')
        );
        tr.appendTo(node);
    }


    // head
    ext.point("io.ox/contacts/edit/form").extend({
        index: 100,
        id: "contact-head",
        draw: function (data) {
            var node = $("<tr>").appendTo(this);
            ext.point("io.ox/contacts/edit/form/head").invoke("draw", node, data);
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form/head").extend({
        index: 100,
        id: 'contact-picture',
        draw: function (data) {
            var node = $('<td>');
            ext.point("io.ox/contacts/edit/form/head/button").invoke("draw", node, data);
            this.append(
                $('<td>')
                .css({ verticalAlign: "top", paddingBottom: "0" })
                .append(
                    api.getPicture(data).addClass("picture")

                )
                .append(
                    $('<a>', { href: '#' }).addClass('change-pic-link')
                    .text('change picture')
                )
                .on('click', function (e) {
                    e.preventDefault();
                    $('tr.contact-image').removeClass('hidden');
                    $('.change-pic-link').remove();
                })
            )
            .append(
                $(node)
                .css({ verticalAlign: "top" })
                .append(
                    $("<div>")
                    .addClass("name clear-title")
                    .text(util.getFullName(data))
                )
                .append(
                    $("<div>")
                    .addClass("job clear-title")
                    .text(util.getJob(data)
                    )
                )
            );
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-image',
        draw: function (data) {
            var id = 'contact-image',
                form = $('<form>',
                    {   'accept-charset': 'UTF-8',
                        'enctype': 'multipart/form-data',
                        'id': 'contactUploadImage',
                        'method': 'POST',
                        'name': 'contactUploadImage',
                        'target': 'blank.html'
                    })
                    .append(
                        $('<input>',
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
                    );
            var td = $('<td>').append(form);
            this.append($('<tr>').addClass(id + ' hidden').append($('<td>'), td));
        }
    });

    function updateContact(data, form) {

        var changes = {}, id, value;
        for (id in form) {
            value = $.trim(form[id]);
            if (value !== '' && value !== data[id]) {
                changes[id] = value;
            } else if (value === '' && data[id] !== undefined && data[id] !== '') {
                changes[id] = /^email[123]$/.test(id) ? null : '';
            }
        }

        //console.warn('changes', changes);

        return api.edit({
            id: data.id,
            folder: data.folder_id,
            timestamp: _.now(),
            data: changes
        });
    }

    ext.point("io.ox/contacts/edit/form/head/button").extend({
        index: 200,
        id: "inline-actions",
        draw: function (data) {
//            var buttonCancel = $('<a>').attr({
//                'href': '#',
//                'class': 'button default-action cancelbutton'
//            }).text('cancel').on('click', {app: app}, function (event) {
//                event.data.app.quit();
//            });
            var buttonSave = $('<a>').attr({
                'href': '#',
                'class': 'button default-action savebutton',
                'data-action': 'save'
            }).text('Save').on('click', {app: app}, function (event) {
                event.preventDefault();
                var formdata = {},
                    formFrame = $('.abs'),
                    image = formFrame.find("#image1").get(0);

                formFrame.find('.value input').each(function (index) {
                    var value =  $(this).val(),
                       id = $(this).attr('name');
                    formdata[id] = value;
                });

                   // collect anniversary
                formFrame.find('.value input[name="anniversary"]')
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
                formFrame.find('.value input[name="birthday"]')
                .each(function (index) {
                    var value =  $(this).val(),
                        id = $(this).attr('name'),
                        dateArray = value.split('.'),
                        date =  Date.UTC(dateArray[2], (--dateArray[1]), (dateArray[0]));
                    if (value !== "") {
                        formdata[id] = date;
                    }
                });

                var timestamp = new Date().getTime();

                if (image.files && image.files[0]) {
                    formdata.folderId = data.folder_id;
                    formdata.id = data.id;
                    formdata.timestamp = timestamp;
                    api.editNewImage(JSON.stringify(formdata), image.files[0]);
                    event.data.app.quit();
                } else {
                    updateContact(data, formdata).done(function () {
                        event.data.app.quit();
                    });
                }
            });
            this.append($('<div>').append(buttonSave));
//            var td = $('<td>', { colspan: '2' }).append(buttonCancel, buttonSave);
//            this.append($('<tr>').append(td));
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-personal',
        draw: function (data) {
            var id = 'contact-personal';
            addField({
                label: gt("Title"),
                name: 'title',
                value: data.title,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("First name"),
                name: 'first_name',
                value: data.first_name,
                node: this,
                id: id
            });
            addField({
                label: gt("Last name"),
                name: 'last_name',
                value: data.last_name,
                node: this,
                id: id
            });
            addField({
                label: gt("Display name"),
                name: 'display_name',
                value: data.display_name,
                node: this,
                id: id
            });

            var date = new Date(data.birthday);
            if (!isNaN(date.getDate())) {
                addField({
                    label: gt("Birthday"),
                    name: 'birthday',
                    value: date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear(),
                    node: this,
                    id: id
                });
            }

            addField({
                label: gt("Second name"),
                name: 'second_name',
                value: data.second_name,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Suffix"),
                name: 'suffix',
                value: data.suffix,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Nickname"),
                name: 'nickname',
                value: data.nickname,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id, 'Personal information');
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-email',
        draw: function (data) {
            var id = 'contact-email';
            addField({
                label: gt("E-mail 1"),
                name: 'email1',
                value: data.email1,
                node: this,
                id: id
            });
            addField({
                label: gt("E-mail 2"),
                name: 'email2',
                value: data.email2,
                node:  this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("E-mail 3"),
                name: 'email3',
                value: data.email3,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id, 'E-Mail addresses');
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-phone',
        draw: function (data) {
            var id = 'contact-phone';
            addField({
                label: gt("Telephone business 1"),
                name: 'telephone_business1',
                value: data.telephone_business1,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone business 2"),
                name: 'telephone_business2',
                value: data.telephone_business2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Fax business"),
                name: 'fax_business',
                value: data.fax_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone callback"),
                name: 'telephone_callback',
                value: data.telephone_callback,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone car"),
                name: 'telephone_car',
                value: data.telephone_car,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Phone (Company)"),
                name: 'telephone_company',
                value: data.telephone_company,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Phone (home)"),
                name: 'telephone_home1',
                value: data.telephone_home1,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Phone (home)"),
                name: 'telephone_home2',
                value: data.telephone_home2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Fax home"),
                name: 'fax_home',
                value: data.fax_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Cellphone"),
                name: 'cellular_telephone1',
                value: data.cellular_telephone1,
                node: this,
                id: id
            });
            addField({
                label: gt("Cellphone (2nd)"),
                name: 'cellular_telephone2',
                value: data.cellular_telephone2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Phone (other)"),
                name: 'telephone_other',
                value: data.telephone_other,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Fax other"),
                name: 'fax_other',
                value: data.fax_other,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone isdn"),
                name: 'telephone_isdn',
                value: data.telephone_isdn,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone pager"),
                name: 'telephone_pager',
                value: data.telephone_pager,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone primary"),
                name: 'telephone_primary',
                value: data.telephone_primary,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone radio"),
                name: 'telephone_radio',
                value: data.telephone_radio,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone telex"),
                name: 'telephone_telex',
                value: data.telephone_telex,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone ttytdd"),
                name: 'telephone_ttytdd',
                value: data.telephone_ttytdd,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Instant messenger 1"),
                name: 'instant_messenger1',
                value: data.instant_messenger1,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Instant messenger 2"),
                name: 'instant_messenger2',
                value: data.instant_messenger2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone ip"),
                name: 'telephone_ip',
                value: data.telephone_ip,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Telephone_assistant"),
                name: 'telephone_assistant',
                value: data.telephone_assistant,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id, 'Phone numbers');
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-home-address',
        draw: function (data) {
            var id = 'contact-home-address';
            addField({
                label: gt("Street home"),
                name: 'street_home',
                value: data.street_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Postal code home"),
                name: 'postal_code_home',
                value: data.postal_code_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("City home"),
                name: 'city_home',
                value: data.city_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("State home"),
                name: 'state_home',
                value: data.state_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Country home"),
                name: 'country_home',
                value: data.country_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id, 'Home address');
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-work-address',
        draw: function (data) {
            var id = 'contact-work-address';

            addField({
                label: gt("Room number"),
                name: 'room_number',
                value: data.room_number,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Street business"),
                name: 'street_business',
                value: data.street_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Postal code business"),
                name: 'postal_code_business',
                value: data.postal_code_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("City business"),
                name: 'city_business',
                value: data.city_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("State business"),
                name: 'state_business',
                value: data.state_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("Country business"),
                name: 'country_business',
                value: data.country_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id, 'Work address');
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-job-descriptions',
        draw: function (data) {
            var id = 'contact-job-descriptions';
            addField({
                label: gt("Profession"),
                name: 'profession',
                value: data.profession,
                node: this,
                id: id
            });
            addField({
                label: gt("Position"),
                name: 'position',
                value: data.position,
                node:  this,
                id: id
            });
            addField({
                label: gt("Company"),
                name: 'company',
                value: data.company,
                node: this,
                id: id
            });
            addField({
                label: gt("Department"),
                name: 'department',
                value: data.department,
                node: this,
                id: id
            });
            addField({
                label: gt("Employee type"),
                name: 'employee_type',
                value: data.employee_type,
                node: this,
                id: id
            });
            addField({
                label: gt("Employee type"),
                name: 'employee_type',
                value: data.employee_type,
                node: this,
                id: id
            });
            addField({
                label: gt("Number of employees"),
                name: 'number_of_employees',
                value: data.number_of_employees,
                node: this,
                id: id
            });
            addField({
                label: gt("Sales volume"),
                name: 'sales_volume',
                value: data.sales_volume,
                node: this,
                id: id
            });
            addField({
                label: gt("Tax id"),
                name: 'tax_id',
                value: data.tax_id,
                node: this,
                id: id
            });
            addField({
                label: gt("Commercial register"),
                name: 'commercial_register',
                value: data.commercial_register,
                node: this,
                id: id
            });
            addField({
                label: gt("Branches"),
                name: 'branches',
                value: data.branches,
                node: this,
                id: id
            });
            addField({
                label: gt("Business category"),
                name: 'business_category',
                value: data.business_category,
                node: this,
                id: id
            });
            addField({
                label: gt("Info"),
                name: 'info',
                value: data.info,
                node: this,
                id: id
            });
            addField({
                label: gt("Manager name"),
                name: 'manager_name',
                value: data.manager_name,
                node: this,
                id: id
            });
            addField({
                label: gt("Assistant name"),
                name: 'assistant_name',
                value: data.assistant_name,
                node: this,
                id: id
            });
            addField({
                label: gt("Assistant name"),
                name: 'assistant_name',
                value: data.assistant_name,
                node: this,
                id: id
            });


            addSwitch(this, id, 'Job information');
            addSpacer(this);
        }
    });

//    ext.point("io.ox/contacts/edit/form").extend({
//        index: 120,
//        id: 'connect',
//        draw: function (data) {
//            var id = 'connect';
//
//
//            addSwitch(this, id);
//            addSpacer(this);
//        }
//    });


    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'special-information',
        draw: function (data) {
            var id = 'special-information';
            addField({
                label: gt("Street other"),
                name: 'street_other',
                value: data.street_other,
                node: this,
                id: id
            });
            addField({
                label: gt("City other"),
                name: 'city_other',
                value: data.city_other,
                node: this,
                id: id
            });
            addField({
                label: gt("Postal code other"),
                name: 'postal_code_other',
                value: data.postal_code_other,
                node: this,
                id: id
            });
            addField({
                label: gt("Country other"),
                name: 'country_other',
                value: data.country_other,
                node: this,
                id: id
            });
            addField({
                label: gt("State other"),
                name: 'state_other',
                value: data.state_other,
                node: this,
                id: id
            });

            addField({
                label: gt("Marital status"),
                name: 'marital_status',
                value: data.marital_status,
                node: this,
                id: id
            });
            addField({
                label: gt("Number of children"),
                name: 'number_of_children',
                value: data.number_of_children,
                node: this,
                id: id
            });

            addField({
                label: gt("Spouse name"),
                name: 'spouse_name',
                value: data.spouse_name,
                node: this,
                id: id
            });
            addField({
                label: gt("Note"),
                name: 'note',
                value: data.note,
                node: this,
                id: id
            });
            addField({
                label: gt("Url"),
                name: 'url',
                value: data.url,
                node: this,
                id: id
            });

            addField({
                label: gt("Birthday"),
                name: 'birthday',
                value: data.birthday,
                node: this,
                id: id
            });
            addField({
                label: gt("Anniversary"),
                name: 'anniversary',
                value: data.anniversary,
                node: this,
                id: id
            });

            addField({
                label: gt("Userfield 01"),
                name: 'userfield01',
                value: data.userfield01,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 02"),
                name: 'userfield02',
                value: data.userfield02,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 03"),
                name: 'userfield03',
                value: data.userfield03,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 04"),
                name: 'userfield04',
                value: data.userfield04,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 05"),
                name: 'userfield05',
                value: data.userfield05,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 06"),
                name: 'userfield06',
                value: data.userfield06,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 07"),
                name: 'userfield07',
                value: data.userfield07,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 08"),
                name: 'userfield08',
                value: data.userfield08,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 09"),
                name: 'userfield09',
                value: data.userfield09,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 10"),
                name: 'userfield10',
                value: data.userfield10,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 11"),
                name: 'userfield11',
                value: data.userfield11,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 12"),
                name: 'userfield12',
                value: data.userfield12,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 13"),
                name: 'userfield13',
                value: data.userfield13,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 14"),
                name: 'userfield14',
                value: data.userfield14,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 15"),
                name: 'userfield15',
                value: data.userfield15,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 16"),
                name: 'userfield16',
                value: data.userfield16,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 17"),
                name: 'userfield17',
                value: data.userfield17,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 18"),
                name: 'userfield18',
                value: data.userfield18,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 19"),
                name: 'userfield19',
                value: data.userfield19,
                node: this,
                id: id
            });
            addField({
                label: gt("Userfield 20"),
                name: 'userfield20',
                value: data.userfield20,
                node: this,
                id: id
            });

            addSwitch(this, id, 'Special information');
            addSpacer(this);
        }
    });





    ext.point("io.ox/contacts/edit/form").extend({
        index: 200,
        id: 'bottom-line',
        draw: function (data) {
            var node = $('<td>', { colspan: '2' });
            ext.point("io.ox/contacts/edit/form/head/button").invoke("draw", node, data);
            this.append($('<tr>').append(node));
        }
    });

    return {
        draw: function (data, appdata) {
            app = appdata;
            var node;
            if (!data) {
                node = $();
            } else {
                node = $("<table>", { border: 0, cellpadding: 0, cellspacing: 0 })
                    .addClass("contact-detail")
                    .attr('data-obj-id', data.folder_id + '.' + data.id);
                ext.point("io.ox/contacts/edit/form").invoke("draw", node, data);
            }
            return node;
        }
    };
});