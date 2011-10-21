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

define("io.ox/contacts/base", ["gettext!io.ox/contacts/contacts"], function (gt) {
    
    "use strict";
    
    // smart join
    var join = function () {
        return _(arguments)
            .select(function (obj, i) {
                return i > 0 && !!obj;
            })
            .join(arguments[0] || "");
    };
    
    return {
        
        getImage: function (obj) {
            return obj.image1_url ?
                obj.image1_url.replace(/^https?\:\/\/[^\/]+/i, "") :
                (ox.base + "/apps/themes/default/dummypicture.png");
        },
        
        getFullName: function (obj) {
            // vanity fix
            function fix(field) {
                return (/^(dr\.|prof\.|prof\. dr\.)$/i).test(field) ? field : "";
            }
            // combine title, last_name, and first_name
            return obj.last_name && obj.first_name ?
                $.trim(fix(obj.title) + " " + obj.last_name + ", " + obj.first_name) :
                (obj.display_name || "").replace(/"|'/g, "");
        },
        
        getDisplayName: function (obj) {
            // combine last_name, and first_name
            return obj.last_name && obj.first_name ?
                obj.last_name + ", " + obj.first_name :
                (obj.display_name || "").replace(/"|'/g, "");
        },
        
        getMail: function (obj) {
            // get the first mail address
            return obj.email1 || obj.email2 || obj.email3 || "";
        },
        
        getJob: function (obj) {
            // combine position and company
            return obj.position && obj.company ?
                obj.position + ", " + obj.company :
                obj.position || obj.company || "";
        },
        
        draw: function (obj) {
            
            var table, tbody;
            
            // is defined?
            function d(val) {
                return typeof val === "string" && val !== "";
            }
            
            table = $("<table>", { border: 0, cellpadding: 0, cellspacing: 0 })
                .addClass("contact-detail")
                .append(tbody = $("<tbody>"));
                
            tbody.append(
                $("<tr>")
                .append(
                    $("<td>")
                    .css({ paddingBottom: "2em", width: "150px" })
                    .append(
                        $("<div>").addClass("picture")
                        .css({ backgroundImage: "url(" + this.getImage(obj) + ")" })
                    )
                )
                .append(
                    $("<td>")
                    .css({ paddingTop: "2em", verticalAlign: "top" })
                    .append(
                        $("<div>").addClass("name clear-title").text(this.getFullName(obj))
                    )
                    .append(
                        $("<div>").addClass("job clear-title").text(
                            obj.mark_as_distributionlist ?
                                gt("Distribution list") :
                                (obj.company || obj.position || obj.profession) ?
                                        join(", ", obj.company, obj.position, obj.profession) + "\u00A0" :
                                        (obj.email1 || obj.email2 || obj.email3) + "\u00A0"
                        )
                    )
                )
            );
            
            function addField(label, value, fn) {
                if (value) {
                    var td = $("<td>").addClass("value");
                    tbody.append(
                        $("<tr>")
                        .append($("<td>").addClass("label").text(label))
                        .append(td)
                    );
                    if ($.isFunction(fn)) {
                        fn(td);
                    } else {
                        if (typeof fn === "string") {
                            td.addClass(fn);
                        }
                        td.text(value);
                    }
                    return 1;
                } else {
                    return 0;
                }
            }
            
            function addMail(label, value) {
                return addField(label, value, function (node) {
                    node
                    .addClass("blue")
                    .append(
                        $("<a>", { href: "mailto: " + value })
                        .addClass("blue").text(value)
                    );
                });
            }
            
            function addPhone(label, value) {
                return addField(label, value, function (node) {
                    node
                    .addClass("blue")
                    .append(
                        $("<a>", { href: "callto: " + value })
                        .addClass("blue").text(value)
                    );
                });
            }
            
            function addAddress(label, street, code, city, country) {
                return addField(label, true, function (node) {
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
            
            function mailSort(a, b) {
                return a.display_name < b.display_name ? -1 : 1;
            }
            
            // distribution list?
            if (obj.mark_as_distributionlist) {
                
                // sort and loop members
                var i = 0, list = _.deepClone(obj.distribution_list), $i = list.length;
                list.sort(mailSort);
                for (; i < $i; i++) {
                    addMail(list[i].display_name, list[i].mail);
                }
                
            } else {
                
                addField(gt("Department"), obj.department);
                addField(gt("Position"), obj.position);
                addField(gt("Profession"), obj.profession);
                
                var r = 0;
                
                if (obj.street_business || obj.city_business) {
                    r += addAddress(gt("Work"), obj.street_business, obj.postal_code_business, obj.city_business);
                }
                
                if (obj.street_home || obj.city_home) {
                    r += addAddress(gt("Home"), obj.street_home, obj.postal_code_home, obj.city_home);
                }
                
                if (r > 0) {
                    addField("", "\u00A0");
                    r = 0;
                }
                
                r += addPhone(gt("Phone (business)"), obj.telephone_business1);
                r += addPhone(gt("Phone (business)"), obj.telephone_business2);
                r += addPhone(gt("Phone (private)"), obj.telephone_home1);
                r += addPhone(gt("Phone (private)"), obj.telephone_home2);
                r += addPhone(gt("Mobile"), obj.cellular_telephone1);
                r += addPhone(gt("Mobile"), obj.cellular_telephone2);
                
                if (r > 0) {
                    addField("", "\u00A0");
                    r = 0;
                }
                
                var dupl = {};
                r += addMail(gt("E-Mail"), obj.email1);
                dupl[obj.email1] = true;
                if (dupl[obj.email2] !== true) {
                    r += addMail(gt("E-Mail"), obj.email2);
                    dupl[obj.email2] = true;
                }
                if (dupl[obj.email3] !== true) {
                    r += addMail(gt("E-Mail"), obj.email3);
                }
                
                if (r > 0) {
                    addField("", "\u00A0");
                    r = 0;
                }
                
                var date = new Date(obj.birthday);
                if (!isNaN(date.getDate())) {
                    r += addField(gt("Birthday"), date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear());
                }
                
                // QR code
                if (Modernizr.canvas) {
                    if (r > 0) {
                        addField("", "\u00A0");
                        r = 0;
                    }
                    addField("", true, function (td) {
                        td.append(
                            $("<span>").addClass("link")
                                .text(gt("Show QR-code"))
                                .bind("click", function () {
                                    require(["io.ox/contacts/view-qrcode"], function (qr) {
                                        var vc = qr.getVCard(obj);
                                        td.empty().qrcode(vc);
                                        vc = td = qr = null;
                                    });
                                })
                        );
                    });
                }
            }
            
            return table;
        }
    };
});
