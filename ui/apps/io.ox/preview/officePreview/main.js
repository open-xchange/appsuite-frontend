define("io.ox/preview/officePreview/main", ["io.ox/core/tk/keys", "gettext!io.ox/preview/officePreview/officePreview", "less!io.ox/preview/officePreview/style.css"], function (KeyListener, gt) {
    "use strict";
    
    var BATCH_SIZE = 5;
    
    function turnFixedPositioningIntoAbsolutePositioning($node) {
        $node.find("*").each(function (index, $childNode) {
            $childNode = $($childNode);
            var position;
            // TODO: Respect nestings (if they are even used)
            position = $childNode.css("position");
            if (position && position.toLowerCase() === 'fixed') {
                $childNode.css({position: "absolute"});
            }
        });
    }
    
    
    function createInstance(file) {
        if (!file) {
            //TODO: Store and load app state instead of this hack
            return {
                launch: function () {
                    return {
                        done: function (cb) {
                            cb();
                        }
                    };
                }
            };
        }
        var app, win, container;
        
        app = ox.ui.createApp({
            name: 'io.ox/preview/officePreview',
            title: 'Preview'
        });
        
        app.document = [];
        app.index = 0;
        app.maxPages = -1; // Unknown
        
        var $pageIndicator = $("<span>").addClass("io-ox-office-preview-page-indicator").text("1");
        var $nextButton = $("<button>").addClass("btn disabled").text(gt("Next")).on("click", function (e) {
            e.preventDefault();
            app.nextPage();
        });
        
        
        var $previousButton = $("<button>").addClass("btn disabled").text(gt("Previous")).on("click", function (e) {
            e.preventDefault();
            app.previousPage();
        });

        var $contentBlock = $("<div>").addClass("span12");
        
        var $loadingIndicator = $("<span>").addClass("io-ox-office-preview-loading").text(gt("Loading...")).hide();
        
        function loading() {
            win.busy();
        }
        
        function stoppedLoading() {
            win.idle();
        }
        
        function fetchPages(numberOfPages) {
            if (app.maxPages !== -1) {
                return new $.Deferred().resolve(app.document);
            }
            if (app.document.length >= numberOfPages) {
                return new $.Deferred().resolve(app.document);
            }
            loading();
            return $.ajax({
                url: file.dataURL + "&format=preview_filtered&pages=" + numberOfPages + "&previewForceDiv=true&view=html",
                dataType: 'json'
            }).pipe(function (response) {
                stoppedLoading();
                app.document = response.data.document.map(function ($page) {
                    $page = $($page);
                    turnFixedPositioningIntoAbsolutePositioning($page);
                    return $page;
                });
                if (!response.data.moreAvailable) {
                    app.maxPages = app.document.length - 1;
                }
                return app.document;
            });
        }
        
        app.nextPage = function () {
            app.showPage(app.index + 1);
        };
        
        app.previousPage = function () {
            app.showPage(app.index - 1);
        };
        
        app.showPage = function (pageNumber) {
            if (pageNumber < 0) {
                pageNumber = 0;
            }
            
            if (app.maxPages !== -1 && pageNumber > app.maxPages) {
                pageNumber = app.maxPages;
            }
            
            
            fetchPages(pageNumber + BATCH_SIZE - (pageNumber % BATCH_SIZE)).done(function (doc) {
                var $shownContent = doc[pageNumber].clone();
                
                $contentBlock.empty();
                $contentBlock.append($shownContent);
                
                $shownContent.css({position: "relative"});
                app.index = pageNumber;
                
                $pageIndicator.text(pageNumber + 1);
                if (pageNumber === 0) {
                    if (!$previousButton.hasClass("disabled")) {
                        $previousButton.addClass("disabled");
                    }
                } else {
                    $previousButton.removeClass("disabled");
                }
                
                if (pageNumber === app.maxPages) {
                    if (!$nextButton.hasClass("disabled")) {
                        $nextButton.addClass("disabled");
                    }
                } else {
                    $nextButton.removeClass("disabled");
                }
            });
        };
        
        app.setLauncher(function () {
            var keys = new KeyListener();
            win = ox.ui.createWindow({
                name: 'io.ox/mail/write',
                title: file.name,
                titleWidth: "90%",
                toolbar: true,
                close: true
            });
            
            app.setWindow(win);
            
            container = win.nodes.main;
            
            container.css({overflow: "auto"});
            
            win.show(function () {
                container.append($("<div>").addClass("row-fluid")
                    .append($("<div>").addClass("span4").html("&nbsp;"))
                    .append($("<div>").addClass("span4 io-ox-office-preview-controls").append($previousButton).append($pageIndicator).append($nextButton).append($loadingIndicator))
                    .append($("<div>").addClass("span4").html("&nbsp;"))
                ).append($("<div>").addClass("row-fluid").append($contentBlock));
                
                app.showPage(0);
            });
            
            win.on("idle show", function () {
                keys.include();
            });
            
            win.on("hide busy", function () {
                keys.remove();
            });
            
            keys.on("leftarrow", function () {
                app.previousPage();
            });
            
            keys.on("uparrow", function () {
                app.previousPage();
            });

            keys.on("rightarrow", function () {
                app.nextPage();
            });
            
            keys.on("downarrow", function () {
                app.nextPage();
            });

            keys.on("space", function () {
                app.nextPage();
            });
            
            keys.on("esc", function () {
                app.quit();
            });
            
            
        });
        
        return app;
    }
    
    return {
        getApp: createInstance
    };
});