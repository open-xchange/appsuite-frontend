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

define("io.ox/contacts/core", function () {
    
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

    // Grid test
    var vg = window.vg = new ox.ui.tk.VGrid(lgn);
    // add template
    vg.addTemplate({
        build: function () {
            var name, email;
            this.css({
                padding: "2px 10px 2px 10px",
                borderBottom: "1px solid #ccc"
            })
            .append(name = $("<div/>"))
            .append(email = $("<div/>"));
            return { name: name, email: email };
        },
        set: function (data, fields, index) {
            fields.name.text(data.last_name + ", " + data.first_name);
            fields.email.text(data.email1 || data.email2 || data.email3);
            this.addClass(index % 2 ? "even" : "odd");
        }
    });
    // extend template
    vg.addTemplate({
        build: function () {
            return { yeah: $("<div/>").css("color", "#08c").appendTo(this) };
        },
        set: function (data, fields, index) {
            fields.yeah.text(index % 2 ? "odd" : "even" + " (via template extension)");
        }
    });
    // add label
    vg.addLabel({
        build: function () {
            this.css({
                backgroundColor: "#08c",
                color: "white",
                padding: "10px",
                borderTop: "2px solid #57a",
                borderBottom: "2px solid #057"
            });
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