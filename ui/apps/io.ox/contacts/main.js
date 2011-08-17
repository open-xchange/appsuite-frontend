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

define("io.ox/contacts/main", ["io.ox/contacts/base", "io.ox/contacts/api"], function (base, api) {
    
    var win = ox.ui.getWindow();
    
    // left side
    var left = $("<div/>").addClass("leftside").css({
        width: "339px",
        borderRight: "1px solid #ccc",
        overflow: "auto"
    }).appendTo(win);
    
    var right = $("<div/>")
        .css({ left: "340px" })
        .addClass("rightside")
        .appendTo(win);
    
    // Grid test
    var vg = window.vg = new ox.ui.tk.VGrid(left);
    // get ID
    vg.getID = function (data) {
        return data.folder_id + "." + data.id;
    };
    // add template
    vg.addTemplate({
        build: function () {
            var name, email;
            this
                .addClass("contact")
                .append(image = $("<div/>").addClass("contact-image"))
                .append(name = $("<div/>").addClass("fullname"))
                .append(job = $("<div/>").css("color", "#888"))
                .append(email = $("<div/>").addClass("email-address"));
            return { image: image, name: name, job: job, email: email };
        },
        set: function (data, fields, index) {
            fields.image.css("backgroundImage", "url(" + base.getImage(data) + ")");
            fields.name.text(base.getFullName(data));
            fields.job.text(base.getJob(data));
            fields.email.text(base.getMail(data));
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
        api.getAll()
            .done(cont);
    };
    // fetch list of items
    vg.fetch = function (ids, cont) {
        api.getList(ids)
            .done(cont);
    };
    // go!
    vg.paint();
    
    vg.selection.onChange(function (selection) {
        if (selection.length) {
            // get id
            var key = selection[0].id.split(/\./);
            // get contact
            api.get({
                folder: key[0],
                id: key[1]
            })
            .done(function (data) {
                // draw contact
                right.empty().append(base.draw(data));
            });
        }
    });


    
    return {};
});