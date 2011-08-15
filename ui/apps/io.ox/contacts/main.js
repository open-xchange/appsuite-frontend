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

define("io.ox/contacts/main", function () {
    
    var win = ox.ui.getWindow();
    
    win.css({
        textAlign: "right",
        color: "white",
        fontSize: "24pt",
        padding: "1em"
    })
    .text("Hello World!");

    var lgn = $("<div/>").css({
        position: "absolute",
        zIndex: 1000,
        width: "400px",
        backgroundColor: "white",
        border: "3px solid #fc0",
        top: "20px",
        left: "120px",
        bottom: "20px",
        overflow: "auto"
    }).appendTo("body");
    
    // get full name
    var getFullName = function (data) {
        return $.trim((data.title || "") + " " + [data.last_name, data.first_name].join(", "));
    };

    // Grid test
    var vg = window.vg = new ox.ui.tk.VGrid(lgn);
    // get ID
    vg.getID = function (data) {
        return data.folder_id + "." + data.id;
    };
    // add template
    vg.addTemplate({
        build: function () {
            var name, email;
            this
                .append(name = $("<div/>"))
                .append(email = $("<div/>"));
            return { name: name, email: email };
        },
        set: function (data, fields, index) {
            fields.name.text(getFullName(data));
            fields.email.text(data.email1 || data.email2 || data.email3);
            this.addClass(index % 2 ? "even" : "odd");
        }
    });
    // extend template
    vg.addTemplate({
        build: function () {
            return { yeah: $("<div/>").addClass("email-address").appendTo(this) };
        },
        set: function (data, fields, index) {
            fields.yeah.text(index % 2 ? "odd" : "even" + " (via template extension)");
        }
    });
    // add label
    vg.addLabel({
        build: function () {
        },
        set: function (data, fields, index) {
            this.text(data.last_name.substr(0,1));
        }
    });
    // find labels
    var current = undefined;
    vg.grepLabel = function (i, data) {
        var prefix = data.last_name.substr(0,1);
        if (i === 0 || prefix !== current) {
            current = prefix;
            return true;
        }
    };
    // get all IDs
    vg.all = function (cont) {
        ox.api.contacts.getAll()
            .done(cont);
    };
    // fetch list of items
    vg.fetch = function (ids, cont) {
        ox.api.contacts.getList(ids)
            .done(cont);
    };
    // go!
    vg.paint();
});