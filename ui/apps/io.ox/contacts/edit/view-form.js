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

    // smart join
    var join = function () {
        return _(arguments)
        .select(function (obj, i) {
            return i > 0 && !!obj;
        })
        .join(arguments[0] || "");
    };


    function addField(o) {
        var field = $('<input>', {name: o.name}),
            td = $("<td>").addClass("value").append(field),
            tr = $("<tr>").addClass(o.id)
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
            tr = $('<tr>').append(
                $('<td>').append(button)
            );
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




    // head
    ext.point("io.ox/contacts/edit/form").extend({
        index: 100,
        id: "contact-head",
        draw: function (data) {
            var node = $("<tr>").appendTo(this);
            ext.point("io.ox/contacts/edit/form/head").invoke("draw", node, data);
        }
    });


    ext.point("io.ox/contacts/edit/form/head").extend({
        index: 100,
        id: 'contact-picture',
        draw: function (data) {
            this.append(
                $("<td>")
                .css({ verticalAlign: "top", paddingBottom: "0" })
                .append(
                    api.getPicture(data).addClass("picture")
                )
            )
            .append(
                $("<td>")
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
        index: 100,
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

        }
    });


    ext.point("io.ox/contacts/edit/form").extend({
        index: 100,
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
        }
    });

    ext.point("io.ox/contacts/edit/form").extend({
        index: 100,
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
        }
    });

    return {
        draw: function (data) {
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