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

define("io.ox/contacts/view-detail",
    ["io.ox/core/extensions",
     "gettext!io.ox/contacts",
     "io.ox/contacts/util",
     "io.ox/contacts/api",
     "io.ox/contacts/actions",
     "io.ox/core/api/folder"
    ], function (ext, gt, util, api, actions, folderAPI) {

    "use strict";

    // smart join
    var join = function () {
        return _(arguments)
            .select(function (obj, i) {
                return i > 0 && !!obj;
            })
            .join(arguments[0] || "");
    };

    function addField(label, value, node, fn) {
        var node;
        if (value) {
            node.append(
                $('<div class="row-fluid">').append(
                     // label
                    $('<div class="span4 field-label">').text(label),
                    // value
                    node = $('<div class="span8 field-value">')
                )
            );
            if (_.isFunction(fn)) {
                fn(node);
            } else {
                if (typeof fn === "string") {
                    node.addClass(fn);
                }
                node.text(value);
            }
            return 1;
        } else {
            return 0;
        }
    }

    function addDistribMail(label, name, mail, node) {
        node.append(
            $('<div class="row-fluid">').append(
                // label
                $('<div class="span4 field-label">').text(label),
                // value
                $('<div class="span8 field-value">').append(
                    $('<span class="blue">').text(_.noI18n(name)), $.txt(_.noI18n(' ')),
                    $('<span>').text(_.noI18n(mail))
                )
            )
        );
        return 1;
    }

    function clickMail(e) {
        e.preventDefault();
        // set recipient
        var data = { to: [[e.data.display_name, e.data.email]] };
        // open compose
        require(['io.ox/mail/write/main'], function (m) {
            m.getApp().launch().done(function () {
                this.compose(data);
            });
        });
    }

    function addMail(label, value, data) {
        return addField(label, value, this, function (node) {
            node
            .addClass('blue')
            .append(
                $('<a>', { href: 'mailto:' + value })
                .addClass("blue").text(value)
                .on('click', { email: value, display_name: data.display_name }, clickMail)
            );
        });
    }

    function addPhone(label, value, node) {
        return addField(label, value, node, function (node) {
            node
            .addClass("blue")
            .append(
                $('<a>', { href: 'callto:' + value })
                .addClass("blue").text(value)
            );
        });
    }

    function addAddress(label, street, code, city, country, node) {
        return addField(label, true, node, function (node) {
            var a = $("<a>", {
                    href: "http://www.google.de/maps?q=" + encodeURIComponent(join(", ", street, join(" ", code, city))),
                    target: "_blank"
                }).addClass("nolink");
            if (street) {
                a.append($("<span>").text(street));
                if (city) {
                    a.append($("<br>"));
                }
            }
            if (code) {
                a.append($("<span>").text(code + " "));
            }
            if (city) {
                a.append($("<span>").text(city));
            }
            if (country) {
                a.append($("<br>"));
                a.append($("<span>").text(country));
            }
            a.append($("<br><small class='blue'>(Google Maps&trade;)</small>"));
            node.append(a);
        });
    }

    ext.point("io.ox/contacts/detail").extend({
        index: 100,
        id: "contact-details",
        draw: function (data) {
            var node = $('<div class="row-fluid">').appendTo(this);
            ext.point('io.ox/contacts/detail/head').invoke('draw', node, data);
        }
    });

    function getDescription(data) {
        return data.mark_as_distributionlist ? gt('Distribution list') :
            (data.company || data.position || data.profession) ?
            join(", ", data.company, data.position, data.profession) + "\u00A0" : util.getMail(data) + "\u00A0";
    }

    ext.point("io.ox/contacts/detail/head").extend({
        index: 100,
        id: 'contact-picture',
        draw: function (data) {
            this.append(
                // left side / picture
                $('<div class="span4 field-label">').append(
                    api.getPicture(data).addClass('picture')
                )
            );
        }
    });

    ext.point("io.ox/contacts/detail/head").extend({
        index: 200,
        id: 'contact-title',
        draw: function (data) {
            this.append(
                // right side
                $('<div class="span8 field-value">').append(
                    $('<div class="name clear-title user-select-text">')
                        .text(util.getFullName(data)),
                    $('<div class="job clear-title user-select-text">')
                        .text(getDescription(data))
                )
            );
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 150,
        id: "inline-actions",
        draw: function (data) {
            var node;
            this.append(
                $('<div class="row-fluid">').append(
                    node = $('<div class="span12">')
                )
            );
            ext.point("io.ox/contacts/detail/actions").invoke("draw", node, data);
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 160,
        id: "address",
        draw: function (data) {
            ext.point("io.ox/contacts/detail/address").invoke("draw", this, data);
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 200,
        id: "phones",
        draw: function (data) {
            ext.point("io.ox/contacts/detail/phones").invoke("draw", this, data);
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 200,
        id: "mails",
        draw: function (data) {
            ext.point("io.ox/contacts/detail/mails").invoke("draw", this, data);
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 200,
        id: "birthday",
        draw: function (data) {
            ext.point("io.ox/contacts/detail/birthday").invoke("draw", this, data);
        }
    });

    ext.point("io.ox/contacts/detail").extend({
        index: 200,
        id: "qr",
        draw: function (data) {
            ext.point("io.ox/contacts/detail/qr").invoke("draw", this, data);
        }
    });

    ext.point("io.ox/contacts/detail/address").extend({
        index: 100,
        id: 'contact-address',
        draw: function (data) {
            addField(gt("Department"), data.department, this);
            addField(gt("Position"), data.position, this);
            addField(gt("Profession"), data.profession, this);
            var r = 0;
            if (data.street_business || data.city_business) {
                r += addAddress(gt.pgettext("address", "Work"), data.street_business, data.postal_code_business, data.city_business, null, this);
            }
            if (data.street_home || data.city_home) {
                r += addAddress(gt.pgettext("address", "Home"), data.street_home, data.postal_code_home, data.city_home, null, this);
            }
            if (r > 0) {
                addField("", "\u00A0", this);
            }
        }
    });

    ext.point("io.ox/contacts/detail/phones").extend({
        index: 100,
        id: 'contact-phone',
        draw: function (data) {
            var r = 0;
            r += addPhone(gt("Phone (business)"), data.telephone_business1, this);
            r += addPhone(gt("Phone (business)"), data.telephone_business2, this);
            r += addPhone(gt("Phone (private)"), data.telephone_home1, this);
            r += addPhone(gt("Phone (private)"), data.telephone_home2, this);
            r += addPhone(gt("Mobile"), data.cellular_telephone1, this);
            r += addPhone(gt("Mobile"), data.cellular_telephone2, this);
            if (r > 0) {
                addField("", "\u00A0", this);
            }
        }
    });

    ext.point("io.ox/contacts/detail/mails").extend({
        index: 100,
        id: 'contact-mails',
        draw: function (data) {
            if (data.mark_as_distributionlist === true) {
                var list = _.copy(data.distribution_list || [], true);
                // if there are no members in the list
                if (list.length === 0) {
                    addDistribMail(gt('Members'), gt('This list has no members yet'), "\u00A0", this);
                }
                _.each(list, function (val, key) {
                    if (key === 0) {
                        addDistribMail(gt('Members'), val.display_name, val.mail, this);
                    } else {
                        addDistribMail('', val.display_name, val.mail, this);
                    }
                }, this);
            } else {
                var dupl = {},
                r = 0;
                r += addMail.call(this, gt("Email"), data.email1, data);
                dupl[data.email1] = true;
                if (dupl[data.email2] !== true) {
                    r += addMail.call(this, gt("Email"), data.email2, data);
                    dupl[data.email2] = true;
                }
                if (dupl[data.email3] !== true) {
                    r += addMail.call(this, gt("Email"), data.email3, data);
                }
                if (r > 0) {
                    addField("", "\u00A0", this);
                }
            }
        }
    });

    ext.point("io.ox/contacts/detail/birthday").extend({
        index: 100,
        id: 'contact-birthdays',
        draw: function (data) {
            var r = 0,
                date = new Date(data.birthday);
            if (data.birthday !== null && !isNaN(date.getDate())) {
                r += addField(gt("Birthday"), date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear(), this);
            }
        }
    });

    ext.point("io.ox/contacts/detail/qr").extend({
        index: 100,
        id: 'qr',
        draw: function (data) {
            var r = 0;
            if (Modernizr.canvas && !data.mark_as_distributionlist) {
                if (r > 0) {
                    addField("\u00A0", "\u00A0", this);
                    r = 0;
                }
                addField("\u00A0", true, this, function (td) {
                    td.append(
                        $('<i class="icon-qrcode">'), $.txt(' '),
                        $("<a>", { href: '#' })
                        .text("Show QR code")
                        .on("click", function (e) {
                            e.preventDefault();
                            td.empty().busy();
                            require(["io.ox/contacts/view-qrcode"], function (qr) {
                                var vc = qr.getVCard(data);
                                td.idle().qrcode(vc);
                                vc = td = qr = null;
                            });
                        })
                    );
                });
            }
        }
    });

    function redraw(e, data) {
        $(this).replaceWith(e.data.view.draw(data));
    }

    return {

        draw: function (data) {

            if (!data) return $();

            var node = $.createViewContainer(data, api).on('redraw', { view: this }, redraw);
            node.addClass('contact-detail view user-select-text');
            ext.point('io.ox/contacts/detail').invoke('draw', node, data);

            return node;
        }
    };
});
