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

define("io.ox/mail/write",
    ["io.ox/mail/api", "io.ox/mail/textile", "css!io.ox/mail/style.css", "css!io.ox/mail/write.css"], function (api, textile) {

    // multi instance pattern
    function createInstance () {
        
        var app, win,
            container, editor, editorContainer;
        
        app = ox.ui.createApp({
            title: "New E-Mail"
        });
        
        app.setLauncher(function (cont) {
            
            win = ox.ui.createWindow({
                title: "New E-Mail",
                toolbar: true
            });
            
            // add view
            win.addView("preview").css("overflow", "auto");
            
            // toolbar: preview / edit
            var inPreview = false;
            win.addButton({
                label: "Preview",
                action: function () {
                    if (inPreview) {
                        $(this).text("Preview");
                        win.setView("main");
                        editor.focus();
                    } else {
                        $(this).text("Edit");
                        win.setView("preview");
                        win.nodes.preview.empty().append(
                            textile.parse(editor.val())
                        );
                    }
                    inPreview = !inPreview;
                }
            })
            .css("minWidth", "10em");
            
            // toolbar: send
            win.addButton({
                label: "Send"
            })
            .css("minWidth", "10em");
            
            editorContainer = $("<div/>").addClass("abs")
                .css({
                    top: "10px",
                    right: "10px",
                    bottom: "10px",
                    left: "10px"
                });
            
            editor = $("<textarea/>").addClass("io-ox-editor")
                .appendTo(editorContainer);
                
            win.nodes.main
                .css({ backgroundColor: "#f0f0f0" })
                .append(editorContainer);
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            // load example text
            $.ajax({
                url: "apps/io.ox/mail/example.txt",
                dataType: "text"
            })
            .done(function (txt) {
                editor.val(txt).focus();
                win.show();
                editor.focus();
            });
        });
        
        return app;
    }
    
    return {
        getApp: createInstance
    };
    
});