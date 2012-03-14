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
     "gettext!io.ox/contacts/contacts",
     "io.ox/contacts/util",
     "io.ox/contacts/api",
     "io.ox/contacts/actions"
    ], function (ext, gt, util, api, actions) {

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
        if (value) {
            var td = $("<td>").addClass("value"),
                tr = $("<tr>")
                    .append(
                        $("<td>").addClass("io-ox-label").text(label)
                    )
                    .append(td);
            if (_.isFunction(fn)) {
                fn(td);
            } else {
                if (typeof fn === "string") {
                    td.addClass(fn);
                }
                td.text(value);
            }
            tr.appendTo(node);
            return 1;
        } else {
            return 0;
        }
    }

    function addDistribMail(label, name, mail, node) {
//        if (name) {
        var td = $("<td>").addClass("value"),
            tr = $("<tr>")
                .append(
                    $("<td>").addClass("io-ox-label").text(label), td
                ),
            blueName = $('<span>').addClass('blue').text(name);
        td.append(blueName, ' ', mail);
        tr.appendTo(node);
        return 1;
//        } else {
//            return 0;
//        }
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
            .addClass("blue")
            .append(
                $("<a>", { href: "mailto: " + value })
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
                $("<a>", { href: "callto: " + value })
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
            var node = $("<tr>").appendTo(this);
            ext.point("io.ox/contacts/detail/head").invoke("draw", node, data);
        }
    });

    ext.point("io.ox/contacts/detail/head").extend({
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


    ext.point("io.ox/contacts/detail").extend({
        index: 150,
        id: "inline-actions",
        draw: function (data) {
            var td = $('<td>', { colspan: '2' });
            ext.point("io.ox/contacts/detail/actions").invoke("draw", td, data);
            this.append($('<tr>').append(td));
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
            /*$("<td>").addClass("io-ox-label").text("MEIN LABLE").appendTo(this);
            $("<td>").addClass("value").text(data.telephone_business1).appendTo(this);*/
            addField(gt("Department"), data.department, this);
            addField(gt("Position"), data.position, this);
            addField(gt("Profession"), data.profession, this);

            var r = 0;

            if (data.street_business || data.city_business) {
                r += addAddress(gt("Work"), data.street_business, data.postal_code_business, data.city_business, null, this);
            }
            if (data.street_home || data.city_home) {
                r += addAddress(gt("Home"), data.street_home, data.postal_code_home, data.city_home, null, this);
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
            // TMP backend bug fix
            if (data.distribution_list && data.distribution_list.length) {
                data.mark_as_distributionlist = true;
            }
            if (data.mark_as_distributionlist === true) {
                var i = 0, list = _.deepClone(data.distribution_list), $i = list.length,
                    that = this;
                list = list.sort(util.nameSort);

                _.each(list, function (val, key) {
                    if (key === 0) {
                        addDistribMail('Members', val.display_name, val.mail, that);
                    } else {
                        addDistribMail('', val.display_name, val.mail, that);
                    }
                });

            } else {
                var dupl = {},
                r = 0;
                r += addMail.call(this, gt("E-Mail"), data.email1, data);
                dupl[data.email1] = true;
                if (dupl[data.email2] !== true) {
                    r += addMail.call(this, gt("E-Mail"), data.email2, data);
                    dupl[data.email2] = true;
                }
                if (dupl[data.email3] !== true) {
                    r += addMail.call(this, gt("E-Mail"), data.email3, data);
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
            if (!isNaN(date.getDate())) {
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
                        $("<a>").addClass("action-link")
                        .text("Show QR-code")
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


    return {
        draw: function (data) {
            var node;
            if (!data) {
                node = $();
            } else {
                node = $("<table>", {border: 0, cellpadding: 0, cellspacing: 0})
                    .addClass("contact-detail view")
                    .attr('data-obj-id', data.folder_id + '.' + data.id);
                ext.point("io.ox/contacts/detail").invoke("draw", node, data);
            }
            return node;
        }
    };
});
