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
        
        buttonHandlers = {},
        
        $form;
        
        
        $content.append($snippets.find(".fileForm").clone());

        $form = $content.find("fieldset");
        controlsPoint.each(function (controlExtension) {
            var $formLine, state = {};
            
            if (controlExtension.label) {
                $formLine = $snippets.find(".field").clone();
                $formLine.find("label").attr({"for": controlExtension.id}).text(controlExtension.label);
            } else {
                $formLine = $snippets.find(".noLabelField").clone();
            }
            
            if (controlExtension.draw) {
                controlExtension.draw($formLine.find(".controls"), state);
            }

            if (controlExtension.extendedForm) {
                $formLine.addClass("extendedForm");
            }

            controlStates[controlExtension.id] = state;

            $formLine.appendTo($form);
            
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
            $extendedElements.fadeIn();
            nodes.moreButton.remove();
            $content.find("input:first").focus();
            return false; // Prevent Default
        });
        

        buttonsPoint.each(function (buttonExtension) {
            pane.addButton(buttonExtension.id, buttonExtension.label, buttonExtension.id, {type: buttonExtension.type});
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

                handler.perform(fileEntry, controlStates, function (data) {
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
    
    // Title
    controlsPoint.extend({
        id: "title",
        extendedForm: true,
        index: 10,
        label: "Title",
        draw: function (element, state) {
            state.node = $("<input type='text' name='title'></input>");
            element.append(state.node);
        },
        process: function (file, state) {
            var val = state.node.val();
            if (val) {
                file.title = state.node.val();
            }
        }
    });
    
    // URL
    controlsPoint.extend({
        id: "url",
        extendedForm: true,
        index: 20,
        label: "Link / URL",
        draw: function (element, state) {
            state.node = $("<input type='text' name='title'></input>");
            element.append(state.node);
        },
        process: function (file, state) {
            var val = state.node.val();
            if (val) {
                file.url = state.node.val();
            }
        }
    });

    // File
    controlsPoint.extend({
        id: "file",
        index: 30,
        draw: function (element, state) {
            state.node = $("<input type='file' name='title'></input>");
            element.append(state.node);
        }
    });
    
    // Comment
    controlsPoint.extend({
        id: "comment",
        extendedForm: true,
        index: 40,
        label: "Comment",
        draw: function (element, state) {
            state.node = $("<textarea rows='10'></textarea>").addClass("input-xlarge");
            element.append(state.node);
        },
        process: function (file, state) {
            var val = state.node.val();
            if (val) {
                file.comment = state.node.val();
            }
        }
    });
    
    // Save
    buttonsPoint.extend({
        id: "save",
        label: "Save",
        type: "primary",
        perform: function (fileEntry, states, cb) {
            var savedOnce = false;
            _(states.file.node[0].files).each(function (file) {
                savedOnce = true;
                filesApi.uploadFile({
                    file: file,
                    json: fileEntry
                }).done(function (data) {
                    cb(data);
                });
            });
            if (!savedOnce && ! $.isEmptyObject(fileEntry)) {
                filesApi.create({json: fileEntry}).done(function (data) {
                    console.log("Tadaa", data);
                    cb(data);
                }).fail(function (r) {
                    console.log("FAIL", r);
                });
            }
        }
    });
    
    return {
        show: newCreatePane
    };
    
});