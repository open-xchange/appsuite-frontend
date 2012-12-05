define("io.ox/files/views/create", ["io.ox/core/tk/dialogs", "io.ox/core/extensions", "io.ox/files/api", "text!io.ox/files/views/snippets.html", "gettext!io.ox/files/files"], function (dialogs, ext, filesApi, snippetsHTML, gt) {

    "use strict";

    var $snippets = $(snippetsHTML),
        controlsPoint = ext.point("io.ox/files/create/form"),
        buttonsPoint = ext.point("io.ox/files/create/action");

    //assemble create form
    var show = function (app, delegate) {

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

        nodes.moreButton.text(
            //#. Show more fields in the file creation dialog
            gt("Show more..."));

        pane.header(
            $('<h3>').text(gt("Add new file"))
        );

        // Hide all extendedFormFields

        $content.find(".extendedForm").hide();

        nodes.moreButton.on("click", function (e) {
            e.preventDefault();
            $content.find(".extendedForm").fadeIn();
            nodes.moreButton.remove();
            $content.find("input:first").focus();
        });

        buttonsPoint.each(function (buttonExtension) {
            pane.addButton(buttonExtension.id, buttonExtension.label, buttonExtension.id, {type: buttonExtension.type});
            buttonHandlers[buttonExtension.id] = buttonExtension;
        });

        pane.addButton("cancel", "Cancel", "cancel");

        // And display it all
        pane.show().done(function (action) {
            var handler = buttonHandlers[action], fileEntry;
            if (handler) {
                fileEntry = { folder: app.folder.get() };
                controlsPoint.each(function (controlExtension) {
                    if (controlExtension.process) {
                        controlExtension.process(fileEntry, controlStates[controlExtension.id]);
                    }
                });
                if (delegate.modifyFile) {
                    delegate.modifyFile(fileEntry);
                }
                app.getWindow().busy();
                handler.perform(fileEntry, controlStates, function (data) {
                    app.getWindow().idle();
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
        label: gt("Title"),
        draw: function (element, state) {
            state.node = $("<input type='text' name='title'>");
            element.append(state.node);
        },
        process: function (file, state) {
            var val = state.node.val();
            if (val) {
                file.title = state.node.val();
            }
        }
    });

    // File
    controlsPoint.extend({
        id: "file",
        index: 30,
        draw: function (element, state) {
            state.node = $("<input type='file' name='file'>");
            element.append(state.node);
        }
    });

    // Comment
    controlsPoint.extend({
        id: "comment",
        extendedForm: true,
        index: 40,
        label: gt("Comment"),
        draw: function (element, state) {
            state.node = $('<textarea rows="5" name="comment" class="input-xlarge">');
            element.append(state.node);
        },
        process: function (file, state) {
            var val = state.node.val();
            if (val) {
                file.description = state.node.val();
            }
        }
    });

    // Save
    buttonsPoint.extend({
        id: "save",
        label: gt("Save"),
        type: "primary",
        perform: function (fileEntry, states, cb) {
            // since I have no clue what this all does I get the form this way;
            var form = $(states.file.node[0]).closest('form');
            filesApi.uploadFile({
                file: _(states.file.node[0].files).first(),
                json: fileEntry,
                folder: fileEntry.folder,
                form: form
            })
            .done(cb);
        }
    });

    return {
        show: show
    };

});
