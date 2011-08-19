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

define("io.ox/contacts/main",
    ["io.ox/contacts/base", "io.ox/contacts/api", "css!io.ox/contacts/style.css"], function (base, api) {
    
    var win = ox.ui.getWindow({
        title: "Address Book",
        search: true
    });
    
    // left side
    var left = $("<div/>").addClass("leftside border-right")
        .css({
            width: "309px",
            overflow: "auto"
        })
        .appendTo(win.nodes.content);

    var thumbs = $("<div/>").addClass("atb contact-grid-index border-left border-right")
        .css({
            left: "312px",
            width: "34px"
        })
        .appendTo(win.nodes.content);

    var right = $("<div/>")
        .css({ left: "347px", overflow: "auto" })
        .addClass("rightside")
        .appendTo(win.nodes.content);

    // Grid test
    var vg = window.vg = new ox.ui.tk.VGrid(left);
    // add template
    vg.addTemplate({
        build: function () {
            var name, email;
            this
                .addClass("contact")
                .append(name = $("<div/>").addClass("fullname"))
                .append(email = $("<div/>"))
                .append(job = $("<div/>").addClass("bright-text"));
            return { name: name, job: job, email: email };
        },
        set: function (data, fields, index) {
            if (data.mark_as_distributionlist === true) {
                fields.name.text(data.display_name || "");
                fields.email.text("");
                fields.job.text("Distribution list");
            } else {
                fields.name.text(base.getFullName(data));
                fields.email.text(base.getMail(data));
                fields.job.text(base.getJob(data));
            }
        }
    });
    // add label template
    vg.addLabelTemplate({
        build: function () {
        },
        set: function (data, fields, index) {
            this.text((data.last_name || data.display_name || "#").substr(0,1).toUpperCase());
        }
    });
    // requires new label?
    vg.requiresLabel = function (i, data, current) {
        var prefix = (data.last_name || data.display_name || "#").substr(0,1).toUpperCase();
        return (i === 0 || prefix !== current) ? prefix : false;
    };
    // get all IDs
    vg.setAllRequest(function (cont) {
        api.getAll().done(cont);
    });
    vg.setAllRequest("search", function (cont) {
        api.search(win.search.query).done(cont);
    });
    // get header data
    vg.setListRequest(function (ids, cont) {
        api.getList(ids).done(cont);
    });
    // go!
    vg.paint();
    
    /*
     * Search handling
     */
    win.bind("search", function (q) {
        vg.refresh("search");
    });
    
    win.bind("cancel-search", function () {
        vg.refresh("all");
    });
    
    // LFO callback
    function drawContact(data) {
        right.idle().append(base.draw(data));
    }
    
    /*
     * Selection handling
     */
    vg.selection.bind("change", function (selection) {
        if (selection.length === 1) {
            // get contact
            right.empty().busy();
            api.get({
                folder: selection[0].folder_id,
                id: selection[0].id
            })
            .done(ox.util.lfo(drawContact));
        } else {
            right.empty();
        }
    });

    /**
     * Thumb index
     */
    
    function drawThumb(char) {
        return $("<div/>").addClass("thumb-index border-bottom")
            .text(char)
            .bind("click", char, vg.scrollToLabelText);
    };
    
    // draw thumb index
    vg.bind("ids-loaded", function () {
        // get labels
        thumbs.empty();
        var textIndex = vg.getLabels().textIndex, char = "";
        for (char in textIndex) {
            // add thumb
            thumbs.append(drawThumb(char));
        }
    });
    
    return {};
});