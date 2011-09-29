define("extensions/halo/linkedIn/view-details", ["io.ox/core/extensions", "css!extensions/halo/linkedIn/style.css"], function (ext) {
    var actionPoint = ext.point("linkedIn/details/actions");
    var rendererPoint = ext.point("linkedIn/details/renderer");
    
    function todo() {
        alert("TODO");
    }

    
    function show(data) {
        
        var app = ox.ui.createApp({
            title: data.firstName + " " + data.lastName + "(LinkedIn)"
        });
        
        app.setLauncher(function () {
            
            var win = ox.ui.createWindow({});
            win.nodes.main.css("overflow", "auto");
            
            app.setWindow(win);
            win.setQuitOnClose(true);
            
            var $node = $("<div/>").addClass("linkedIn").appendTo(win.nodes.main);
            var $detailNode = $("<div/>").addClass("details").appendTo($node);
            var $table = $("<table><tr><td class='t10' /><td class='t11' /></td></tr><tr><td class='r2' colspan='2'/></tr><table>").appendTo($detailNode);
            var $pictureNode = $table.find(".t10");
            var $nameNode = $table.find(".t11");
            var $relationNode = $table.find(".r2");
            
            $pictureNode.append($("<img/>").attr("src", data.pictureUrl));
            
            $nameNode.append($("<div class='name' />").text(data.firstName + " " + data.lastName));
            $nameNode.append($("<div class='headline' />").text(data.headline));
            
            var $actionsNode = $("<div/>").addClass("actions").appendTo($node);
            actionPoint.each(function (ext) {
                $actionsNode.append($("<a href='#'/>").text(ext.label).click(function () {
                    ext.action();
                    return false;
                }));
            });
            
            rendererPoint.each(function (ext) {
                $node.append(ext.draw({data: data, win: win}));
            });
            
            win.show();
        });
        
        
        app.launch();
    }
    
    
    // Mock Actions
    actionPoint.extend({
        id: "linkedin/details/connect",
        label: "Connect",
        action: todo,
        index: 100
    });
    
    actionPoint.extend({
        id: "linkedin/details/compose",
        label: "Write a message",
        action: todo,
        index: 200
    });
    
    // Detail renderers
    
    // Past Engagements
    rendererPoint.extend({
        id: "linkein/details/renderer/experience",
        draw: function (options) {
            var data = options.data;
            var win = options.win;
            
            var $myNode = $("<div/>").addClass("pastEngagements extension");
            if (data.positions && data.positions.values && data.positions.values.length !== 0) {
                var pastEngagements = [];
                
                _(data.positions.values).each(function (position) {
                    var $posNode = $("<div/>").addClass("position").appendTo($myNode);
                    if (position.isCurrent) {
                        $posNode.addClass("current");
                    } else {
                        $posNode.hide();
                        pastEngagements.push($posNode);
                    }
                    if (position.title) {
                        $("<h1/>").appendTo($posNode).text(position.title).addClass("title");
                    }
                    if (position.company && position.company.name) {
                        $("<h2/>").text(position.company.name).appendTo($posNode).addClass("companyName");
                    }
                    if (position.company && position.company.industry) {
                        $("<h3/>").appendTo($posNode).text(position.company.industry).addClass("companyIndustry");
                    }
                    if (position.startDate && position.startDate.year) {
                        var timeSpentThere = position.startDate.year;
                        if (position.endDate && position.endDate.year) {
                            timeSpentThere += " - " + position.endDate.year;
                        } else if (position.isCurrent) {
                            timeSpentThere += " - Present";
                        }
                        $("<h4/>").text(timeSpentThere).appendTo($posNode).addClass("positionTimeSpent");
                    }
                });
                
                if (pastEngagements.length !== 0) {
                    var pastEngagementsVisible = false;
                    var $moreToggle = $("<a href='#'/>").text("More...").click(function () {
                        pastEngagementsVisible = !pastEngagementsVisible;
                        if (pastEngagementsVisible) {
                            $moreToggle.text("Show less");
                            _(pastEngagements).invoke("fadeIn", 500);
                            win.nodes.main.animate({scrollTop: _(pastEngagements).first().offset().top - 50}, 500);
                        } else {
                            $moreToggle.text("More...");
                            _(pastEngagements).invoke("fadeOut");
                        }
                    }).appendTo($myNode);
                }
            }
            return $myNode;
        },
        index: 100
    });
    
    rendererPoint.extend({
        id: "linkein/details/renderer/relations",
        draw: function (options) {
            var data = options.data;
            
            var $myNode = $("<div/>").addClass("relations extension");
            if (data.relationToViewer && data.relationToViewer.connections && data.relationToViewer.connections.values && data.relationToViewer.connections.values !== 0) {
                $myNode.append($("<h1/>").text("Connections you share with " + data.firstName + " " + data.lastName));
                _(data.relationToViewer.connections.values).each(function (relation) {
                    if (relation.fullProfile) {
                        $myNode.append($("<img/>").attr("src", relation.fullProfile.pictureUrl).attr("alt", relation.fullProfile.firstName + " " + relation.fullProfile.lastName));
                        $myNode.click(function () {
                            show(relation.fullProfile);
                        });
                    } else {
                        $myNode.append($("<span/>").text(relation.person.firstName + " " + relation.person.lastName));
                    }
                });
            }
            
            return $myNode;
        },
        index: 200
    });
    
    return {
        show: show
    };
});
