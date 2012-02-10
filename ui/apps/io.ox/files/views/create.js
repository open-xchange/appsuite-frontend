define("io.ox/files/views/create", ["io.ox/core/tk/dialogs", "text!io.ox/files/views/snippets.html"], function (dialogs, snippetsHTML) {
    
    "use strict";
    
    var $snippets = $(snippetsHTML);
    
    //assemble create form
    var newCreatePane = function (delegate) {
        var pane = new dialogs.CreateDialog(),
        $content = pane.getContentNode().addClass("create-file"),
        nodes = {};
        
        $content.append($snippets.find(".fileForm").clone());
        
        nodes.moreButton = $content.find(".more");
        nodes.titleField = $content.find(".title");
        nodes.urlField = $content.find(".url");
        nodes.fileField = $content.find(".file");
        nodes.commentField = $content.find(".comments");
        
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
            return false; // Prevent Default
        });
        
        function save() {
            alert("TODO");
        }
        
        
        pane.addButton("save", "Save", "save");
        pane.addButton("cancel", "Cancel", "cancel");
        
        // And display it all
        pane.show().done(function (action) {
            if (action === 'save') {
                save();
            }
            // clean up
            $content.empty();
            $content = pane = null;
        });
        
    };
    
    return {
        show: newCreatePane
    };
    
});