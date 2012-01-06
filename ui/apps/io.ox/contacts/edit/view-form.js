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
        var nameClearTitle = $('.name.clear-title'),
            jobClearTitle = $('.job.clear-title'),
            fieldValueFirstname = $('input[name="first_name"]').val(),
            fieldValueNachname = $('input[name="last_name"]').val(),
            fieldValueTitle = $('input[name="title"]').val(),
            fieldValueCompany = $('input[name="company"]').val(),
            fieldValuePosition = $('input[name="position"]').val(),
            fieldValueProfession = $('input[name="profession"]').val();
        nameClearTitle.text(fieldValueTitle + ' ' + fieldValueNachname + ', ' + fieldValueFirstname);
        jobClearTitle.text(join(", ", fieldValueCompany, fieldValuePosition, fieldValueProfession));
    }

    function addField(o) {
        var field = $('<input>', {name: o.name})
        .on('change', {name: o.name, node: o.node}, function (event) {
            var tr = $(event.data.node).find('tr.' + event.data.name);
            if (event.data.name === 'first_name' || 'last_name' || 'title' || 'company' || 'position' || 'profession') {
                renewHeader();
            }
            if (tr.find('input').val() === '') {
                tr.removeClass('filled');
            } else {
                tr.addClass('filled');
            }
        }),
            td = $("<td>").addClass("value").append(field),
            tr = $("<tr>").addClass(o.id + ' ' + o.name)
            .append(
                $("<td>").addClass("label").text(o.label)
            )
            .append(td);
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

    function addSwitch(node, id) {
        var button = $('<a>').addClass(id).text('+'),
            tr = $('<tr>').append($('<td>'), $('<td>').text(id + ' ').append(button));
        button.on('click', {id: id}, function (event) {
            if (button.text() === '+') {
                $(node).find('.' + event.data.id + '.hidden').removeClass('hidden').addClass('visible');
                button.text('-');
            } else {
                $(node).find('.' + event.data.id + '.visible').removeClass('visible').addClass('hidden');
                button.text('+');
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
                ).append($('<a>').attr({
                    'href': '#',
                    'class': 'change-pic-link'
                })
                .text('change picture'))
            ).on('click', function () {
                    $('tr.contact-image').removeClass('hidden');
                    $('.change-pic-link').remove();
                })
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
                    .text(
                        data.mark_as_distributionlist ?
                        gt("Distribution list") :
                        (data.company || data.position || data.profession) ?
                        join(", ", data.company, data.position, data.profession) + "\u00A0" :
                        (data.email1 || data.email2 || data.email3) + "\u00A0"
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
                form = $('<form/>',
                  {   'accept-charset': 'UTF-8',
                      'enctype': 'multipart/form-data',
                      'id': 'contactUploadImage',
                      'method': 'POST',
                      'name': 'contactUploadImage',
                      'target': 'blank.html'

                  })
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
                  );
            var td = $('<td>', { colspan: '2' }).append(form);
            this.append($('<tr>').addClass(id + ' hidden').append(td));

        }
    });

    ext.point("io.ox/contacts/edit/form/head/button").extend({
        index: 100,
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
                'class': 'button default-action savebutton'
            }).text('save').on('click', {app: app}, function (event) {
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
                formdata.folderId = data.folder_id;
                formdata.id = data.id;
                formdata.timestamp = timestamp;

                if (image.files && image.files[0]) {
                    api.editNewImage(JSON.stringify(formdata), image.files[0]);
                } else {
                    if (!_.isEmpty(formdata)) {
                        //console.log(formdata);
                        api.edit(formdata);
                    }
                }
                event.data.app.quit();
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
                id: id
            });
            addField({
                label: gt("first name"),
                name: 'first_name',
                value: data.first_name,
                node: this,
                id: id
            });
            addField({
                label: gt("last name"),
                name: 'last_name',
                value: data.last_name,
                node: this,
                id: id
            });
            addField({
                label: gt("display name"),
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
                label: gt("second name"),
                name: 'second_name',
                value: data.second_name,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("suffix"),
                name: 'suffix',
                value: data.suffix,
                node: this,
                id: id
            });
            addField({
                label: gt("nickname"),
                name: 'nickname',
                value: data.nickname,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id);
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-email',
        draw: function (data) {
            var id = 'contact-email';
            addField({
                label: gt("email1"),
                name: 'email1',
                value: data.email1,
                node: this,
                id: id
            });
            addField({
                label: gt("email2"),
                name: 'email2',
                value: data.email2,
                node:  this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("email3"),
                name: 'email3',
                value: data.email3,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id);
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-phone',
        draw: function (data) {
            var id = 'contact-phone';
            addField({
                label: gt("telephone business1"),
                name: 'telephone_business1',
                value: data.telephone_business1,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone business2"),
                name: 'telephone_business2',
                value: data.telephone_business2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("fax business"),
                name: 'fax_business',
                value: data.fax_business,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone callback"),
                name: 'telephone_callback',
                value: data.telephone_callback,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone car"),
                name: 'telephone_car',
                value: data.telephone_car,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone company"),
                name: 'telephone_company',
                value: data.telephone_company,
                node: this,
                id: id
            });
            addField({
                label: gt("telephone home1"),
                name: 'telephone_home1',
                value: data.telephone_home1,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone home2"),
                name: 'telephone_home2',
                value: data.telephone_home2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("fax home"),
                name: 'fax_home',
                value: data.fax_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("cellular telephone1"),
                name: 'cellular_telephone1',
                value: data.cellular_telephone1,
                node: this,
                id: id
            });
            addField({
                label: gt("cellular telephone2"),
                name: 'cellular_telephone2',
                value: data.cellular_telephone2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone other"),
                name: 'telephone_other',
                value: data.telephone_other,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("fax other"),
                name: 'fax_other',
                value: data.fax_other,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone isdn"),
                name: 'telephone_isdn',
                value: data.telephone_isdn,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone pager"),
                name: 'telephone_pager',
                value: data.telephone_pager,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone primary"),
                name: 'telephone_primary',
                value: data.telephone_primary,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone radio"),
                name: 'telephone_radio',
                value: data.telephone_radio,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone telex"),
                name: 'telephone_telex',
                value: data.telephone_telex,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone ttytdd"),
                name: 'telephone_ttytdd',
                value: data.telephone_ttytdd,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone ttytdd"),
                name: 'telephone_ttytdd',
                value: data.telephone_ttytdd,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("instant messenger1"),
                name: 'instant_messenger1',
                value: data.instant_messenger1,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("instant messenger2"),
                name: 'instant_messenger2',
                value: data.instant_messenger2,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone ip"),
                name: 'telephone_ip',
                value: data.telephone_ip,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("telephone_assistant"),
                name: 'telephone_assistant',
                value: data.telephone_assistant,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id);
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-home-address',
        draw: function (data) {
            var id = 'contact-home-address';
            addField({
                label: gt("street home"),
                name: 'street_home',
                value: data.street_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("postal code home"),
                name: 'postal_code_home',
                value: data.postal_code_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("city home"),
                name: 'city_home',
                value: data.city_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("state home"),
                name: 'state_home',
                value: data.state_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addField({
                label: gt("country home"),
                name: 'country_home',
                value: data.country_home,
                node: this,
                fn: 'hidden',
                id: id
            });
            addSwitch(this, id);
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
        id: 'contact-job',
        draw: function (data) {
            var id = 'contact-job';
            addField({
                label: gt("profession"),
                name: 'profession',
                value: data.profession,
                node: this,
                id: id
            });
            addField({
                label: gt("position"),
                name: 'position',
                value: data.position,
                node:  this,
                id: id
            });
            addField({
                label: gt("company"),
                name: 'company',
                value: data.company,
                node: this,
                id: id
            });
            addSwitch(this, id);
            addSpacer(this);
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 120,
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
                node = $("<table>", {border: 0, cellpadding: 0, cellspacing: 0})
                    .addClass("contact-detail")
                    .attr('data-obj-id', data.folder_id + '.' + data.id);
                ext.point("io.ox/contacts/edit/form").invoke("draw", node, data);
            }
            return node;
        }
    };
});