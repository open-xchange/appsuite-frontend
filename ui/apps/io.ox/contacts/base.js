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

define("io.ox/contacts/base", function () {
    
    // smart join
    var join = function () {
        var tmp = [], i = 1, $i = arguments.length, delimiter = arguments[0] || "";
        for (; i < $i; i++) {
            if (arguments[i]) {
                tmp.push(arguments[i]);
            }
        }
        return tmp.join(delimiter);
    };
    
    return {
        
        getImage: function (obj) {
            return obj.image1_url || "themes/login/dummypicture.png";
        },
        
        getFullName: function (obj) {
            // vanity fix
            function fix(field) {
                return /^(dr\.|prof\.|prof\. dr\.)$/i.test(field) ? field : "";
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
            
            var table, tbody, img;
            
            table = $("<table/>", { border: 0, cellpadding: 0, cellspacing: 0 })
                .addClass("contact-detail")
                .append(tbody = $("<tbody/>"));
                
            tbody.append(
                $("<tr/>")
                .append(
                    $("<td/>")
                    .css({ paddingBottom: "2em", width: "150px" })
                    .append(
                        $("<div/>").addClass("picture")
                        .css({ backgroundImage: "url(" + this.getImage(obj) + ")" })
                    )
                )
                .append(
                    $("<td/>")
                    .css({ paddingTop: "2em", verticalAlign: "top" })
                    .append(
                        $("<div/>").addClass("name").text(this.getFullName(obj))
                    )
                    .append(
                        $("<div/>").addClass("job").text(
                            join(", ", obj.company, obj.position, obj.profession) +
                            "\u00a0"
                        )
                    )
                )
            );
            
            function addField(label, value, fn) {
                if (value) {
                    var td = $("<td/>").addClass("value");
                    tbody.append(
                        $("<tr/>")
                        .append($("<td/>").addClass("label").text(label))
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
                        $("<a/>", { href: "mailto: " + value })
                        .addClass("blue").text(value)
                    );
                });
            }
            
            function addPhone(label, value) {
                return addField(label, value, function (node) {
                    node
                    .addClass("blue")
                    .append(
                        $("<a/>", { href: "callto: " + value })
                        .addClass("blue").text(value)
                    );
                });
            }
            
            function addAddress(label, street, code, city, country) {
                return addField(label, true, function (node) {
                    var a = $("<a/>", { 
                            href: "http://www.google.de/maps?q=" + encodeURIComponent(join(", ", street, join(" ", code, city))),
                            target: "_blank"
                        }).addClass("nolink");
                    if (street !== "") {
                        a.append($("<span/>").text(street));
                        if (city) {
                            a.append($("<br/>"));
                        }
                    }
                    if (code !== "") {
                        a.append($("<span/>").text(code + " "));
                    }
                    if (city !== "") {
                        a.append($("<span/>").text(city));
                    }
                    if (country !== "") {
                        a.append($("<br/>"));
                        a.append($("<span/>").text(country));
                    }
                    a.append($(" <small class='blue'>(Google Maps&trade;)</small>"));
                    node.append(a);
                });
            }
            
            addField("Department", obj.department);
            addField("Position", obj.position);
            addField("Profession", obj.profession);

            var r = 0;
            
            if (obj.street_business || obj.city_business) {
                r += addAddress("Work", obj.street_business, obj.postal_code_business, obj.city_business);
            }

            if (obj.street_home || obj.city_home) {
                r += addAddress("Home", obj.street_home, obj.postal_code_home, obj.city_home);
            }
            
            if (r > 0) {
                addField("", "\u0020");
                r = 0;
            }

            r += addPhone("Phone (business)", obj.telephone_business1);
            r += addPhone("Phone (business)", obj.telephone_business2);
            r += addPhone("Phone (private)", obj.telephone_home1);
            r += addPhone("Phone (private)", obj.telephone_home2);
            r += addPhone("Mobile", obj.cellular_telephone1);
            r += addPhone("Mobile", obj.cellular_telephone2);
            
            if (r > 0) {
                addField("", "\u0020");
                r = 0;
            }

            var dupl = {};
            r += addMail("E-Mail", obj.email1);
            dupl[obj.email1] = true;
            if (dupl[obj.email2] !== true) {
                r += addMail("E-Mail", obj.email2);
                dupl[obj.email2] = true;
            }
            if (dupl[obj.email3] !== true) {
                r += addMail("E-Mail", obj.email3);
            }
            
            if (r > 0) {
                addField("", "\u0020");
                r = 0;
            }

            var d = new Date(obj.birthday);
            if (!isNaN(d.getDate())) {
                addField("Birthday", d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear());
            }
            
            return table;
        }
    };
});
