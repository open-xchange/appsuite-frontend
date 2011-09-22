// TODO: Refactor this to make it usable by other OX upload scenarios (Mail Attachments, PIM Attachments)
define("io.ox/files/upload",  ["io.ox/core/event"], function (event) {
    
    // Let's define a DropZone class, where files can be dropped
    // We leave the eyecandy to calling code, but provide a few events
    // "dragover" if someone threatens to drop a file into $node
    // "dragend" when she released the file
    // "drop" when she released the file
    // Calling code can hand over  a node or a jquery expression, if no node is passed, we'll create an overlay for the entire
    // visible screen and handle all eye candy ourselves.
    function DropZone ($node) {
        var self = this;
        var globalMode = false;
        var appendOverlay = function () {
            $node.appendTo("body");
            return false;
        };
        
        if ($node) {
            $node = $($node);
        } else {
            globalMode = true;
            $node = $("<div/>").addClass("abs").css({
                    backgroundColor: "#000", color: "white",
                    textAlign: "center", paddingTop: "25%", fontSize: "42pt",
                    opacity: "0.75", zIndex: 65000
                })
                .text("Just drop the file anywhere...");
               
        }
        this.enabled = true;
        event.Dispatcher.extend(this);
        
        // Now let's add the regular event handlers to fulfill our promises
        $node.bind({
            dragenter: function () {
                // We'll just hand this over. A few layers of indirection are always fun
                self.trigger("dragenter");
                return false; // Prevent regular event handling
            },
            dragover: function () {
                // We'll just hand this over. A few layers of indirection are always fun
                self.trigger("dragover");
                return false; // Prevent regular event handling
            },
            dragend: function () {
                // We'll just hand this over. A few layers of indirection are always fun
                self.trigger("dragend");
                return false; // Prevent regular event handling
                
            },
            dragleave: function () {
                // We'll just hand this over. A few layers of indirection are always fun
                if (globalMode) {
                    $node.detach();
                }
                self.trigger("dragleave");
                return false; // Prevent regular event handling
                
            },
            drop: function (event) {
                if (globalMode) {
                    $node.detach();
                }
                // Finally something useful to do. Let's extract the file objects from the event
                // grab the original event
                event = event.originalEvent || event;
                var files = event.dataTransfer.files;
                // And the pass them on
                for(var i = 0, l = files.length; i < l; i++) {
                    self.trigger("drop", files[i]);
                }
                return false; // Prevent regular event handling
                
            }
        });
        
        if (globalMode) {
            var included = false;
            this.remove = function () {
                if (!included) {
                    return;
                }
                included = false;
                $("body").unbind("dragenter", appendOverlay);
            };
            this.include = function () {
                if (included) {
                    return;
                }
                included = true;
                $("body").bind("dragenter", appendOverlay);
            };
        } else {
            this.remove = $.noop;
            this.include = $.noop;
        }
        
        this.include();
    }
    
    // And this is the duck type compatible version for browsers which don't support
    // the File API. You can define this DropZone but will never hear back.
    function DisabledDropZone ($node) {
        this.enabled = false;
        this.bind = $.noop;
        this.unbind = $.noop;
        this.remove = $.noop;
        this.include = $.noop;
        // Maybe add some more
    }
    
    
    // Next we'll need a file upload queue
    // This will simply store files and drain the queue by uploading one file after another
    // Events:
    // "start" - When a file is being uploaded.
    // "stop" - When an upload is through.
    // If the delegate implements "start" and "stop" methods, those will be called as well
    // The delegate must implement a "processFile" method, that is called to really process the file. It is expected to return
    // a promise or deferred, to tell us when we are done with a file
    function FileProcessingQueue (delegate) {
        if (!delegate) {
            console.warn("No delegate supplied to file processing queue.");
            // the noop delegate
            delegate = {
                start: $.noop,
                stop: $.noop,
                processFile : function (file) {
                    return new $.Deferred().resolve();
                }
            };
        }
        
        if (!delegate.processFile) {
            console.warn("The delegate to a queue should implement a 'processFile' method!");
            delegate.processFile = $.noop;
        }
        
        event.Dispatcher.extend(this);
        
        var files = [];
        var currentFile = null;
        
        var processing = false;
        
        this.nextFile = function () {
            if (processing) {
                return;
            }
            processing = true;
            var self = this;
            if (files.length <= 0) {
                return;
            }
            currentFile = files.shift();
            this.start(currentFile);
            this.processFile(currentFile).done(function () {
                processing = false;
                self.stop();
                self.queueChanged();
            });
        };
        
        this.offer = function (file) {
            files.push(file);
            this.queueChanged();
        };
        
        this.length = 0;

        this.queueChanged = function () {
            this.length = files.length;
            this.trigger("changed", this);
            this.nextFile();
        };
        
        this.dump = function () {
            console.info("this", this, "files", files, "currentFile", currentFile);
        };
        
        this.start = function (currentFile) {
            if (delegate.start) {
                delegate.start(currentFile);
            }
            this.trigger("start", currentFile);
        };
        
        this.processFile = function () {
            return delegate.processFile(currentFile);
        };
        
        this.stop = function (currentFile) {
            if (delegate.stop) {
                delegate.stop(currentFile);
            }
            this.trigger("stop", currentFile);
        };
    }
     
    return {
        dnd : {
            enabled: Modernizr.draganddrop,
            createDropZone: function ($node) {
                if (!this.enabled) {
                    return new DisabledDropZone($node);
                }
                return new DropZone($node);
            }
        },
        createQueue: function (delegate) {
            return new FileProcessingQueue(delegate);
        }
    };
});