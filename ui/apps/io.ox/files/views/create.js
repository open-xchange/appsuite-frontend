define("io.ox/files/views/create", ["io.ox/core/tk/dialogs", "io.ox/core/extensions", "io.ox/files/api", "text!io.ox/files/views/snippets.html"], function (dialogs, ext, filesApi, snippetsHTML) {
    
    "use strict";
    
    var $snippets = $(snippetsHTML),
    controlsPoint = ext.point("io.ox/files/create/form"),
    buttonsPoint = ext.point("io.ox/files/create/action");
    
    
    //assemble create form
    var newCreatePane = function (delegate) {
        delegate = delegate || {};
        var pane = new dialogs.CreateDialog({
            easyOut: true
        }),
        $content = pane.getContentNode().addClass("create-file"),
        
        nodes = {},
        
        controlStates = {},
        
        buttonHandlers = {};
        
        
        $content.append($snippets.find(".fileForm").clone());
        
        controlsPoint.each(function (controlExtension) {
            var $formLine, state = {};
            
            if (controlExtension.label) {
                if (controlExtension.style === "large") {
                    $formLine = $snippets.find(".largeLabelField").clone();
                } else {
                    $formLine = $snippets.find(".regularLabelField").clone();
                }
                $formLine.find(".labelCol label").attr({"for": controlExtension.id}).text(controlExtension.label);
            } else {
                $formLine = $snippets.find(".noLabelField").clone();
            }
            
            if (controlExtension.draw) {
                controlExtension.draw($formLine.find(".inputCol"), state);
            }
            
            if (controlExtension.extendedForm) {
                $formLine.addClass("extendedForm");
            }
            
            controlStates[controlExtension.id] = state;
            
        });
        
        nodes.moreButton = $content.find(".more");
        
        // Hide all extendedFormFields
        
        $content.find(".extendedForm").hide();
        
        nodes.moreButton.on("click", function () {
            var $extendedElements = $content.find(".extendedForm");
            $extendedElements.css({
                opacity: "0.01"
            });
            $extendedElements.show();
            pane.resize();
            $extendedElements.hide();
            $extendedElements.css({
                opacity: ""
            });
            $content.find(".extendedForm").fadeIn();
            nodes.moreButton.remove();
            $content.find("input:first").focus();
            return false; // Prevent Default
        });
        
        /*function save() {
            // Firstly let's assemble the object
            
            _(nodes.fileField[0].files).each(function (file) {
                
            });
            
            if (delegate.done) {
                delegate.done();
            }
        } */
        
        buttonsPoint.each(function (buttonExtension) {
            pane.addButton(buttonExtension.id, buttonExtension.label, buttonExtension.id);
            buttonHandlers[buttonExtension.id] = buttonExtension;
        });
        
        pane.addButton("cancel", "Cancel", "cancel");
        
        // And display it all
        pane.show().done(function (action) {
            var handler = buttonHandlers[action];
            if (handler) {
                var fileEntry = {};
                controlsPoint.each(function (controlExtension) {
                    if (controlExtension.process) {
                        controlExtension.process(fileEntry, controlStates[controlExtension.id]);
                    }
                });
                if (delegate.modifyFile) {
                    delegate.modifyFile(fileEntry);
                }
                
                /*filesApi.uploadFile(fileEntry).done(function (data) {
                   
                });*/
                handler.perform(fileEntry).done(function (data) {
                    if (delegate.uploadedFile) {
                        delegate.uploadedFile(data);
                    }
                });
            }
            // clean up
            $content.empty();
            $content = pane = null;
            if (delegate.done) {
                delegate.done();
            }
        });
        
    };
    
    return {
        show: newCreatePane
    };
    
});