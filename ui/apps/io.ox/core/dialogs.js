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

define("io.ox/core/dialogs", function () {

    // scaffolds
    var underlay = $("<div/>").addClass("abs io-ox-dialog-underlay"),
        popup = $("<div/>").addClass("io-ox-dialog-popup")
            .append(
                $("<div/>").addClass("content")
            )
            .append(
                $("<div/>").addClass("controls")
            );
    
    var Dialog = function () {
        
        var nodes = {
                underlay: underlay.clone().hide().appendTo("body"),
                popup: popup.clone().hide().appendTo("body")
            },
            
            deferred = $.Deferred(),
            
            close = function () {
                nodes.popup.remove();
                nodes.underlay.remove();
                nodes = deferred = null;
            },
            
            process = function (e) {
                deferred.resolve(e.data);
                close();
            };
            
        this.text = function (str) {
            nodes.popup.find(".content").text(str || "");
            return this;
        };
        
        this.append = function (node) {
            nodes.popup.find(".content").append(node);
            return this;
        };
        
        this.addButton = function (action, label) {
            nodes.popup.find(".controls").append(
                $.button({
                    label: label,
                    data: action,
                    click: process
                })
            );
            return this;
        };
        
        this.show = function () {
            // center popup element first
            var height = nodes.popup.height();
            nodes.popup.css({
                height: height + "px",
                marginTop: 0 - (height / 2 >> 0) + "px"
            });
            nodes.underlay.show();
            nodes.popup.show();
            return deferred;
        };
    };
    
    return {
        ModalDialog: Dialog
    };
});

/* Test

require(["io.ox/core/dialogs"], function (dialogs) {
    new dialogs.ModalDialog()
        .text("Are you really sure about your decision? Are you aware of all consequences you have to live with?")
        .addButton("cancel", "No, rather not")
        .addButton("delete", "Shut up and delete it!")
        .show()
        .done(function (action) {
            console.debug("Action", action);
        });
});

*/