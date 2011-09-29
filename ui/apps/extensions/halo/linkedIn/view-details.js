define("extensions/halo/linkedIn/view-details", ["io.ox/core/extensions", "css!extensions/halo/linkedIn/style.css"], function (ext) {
    var actionPoint = ext.point("linkedIn/details/actions");
    var rendererPoint = ext.point("linkedIn/details/renderer");
    
    function todo() {
        alert("TODO");
    }
    // Mock Actions
    actionPoint.extend({
        label: "Connect",
        action: todo,
        index: 100
    });
    
    actionPoint.extend({
        label: "Write a message",
        action: todo,
        index: 200
    });
    
    // Detail renderers
    
    // Relations // TODO: Test this with varying distances and with people we are friends with or not
    rendererPoint.extend({
        draw: function (data) {
            var $myNode = $("<div/>").addClass("relations");
            if (data.relationToViewer && data.relationToViewer.connections && data.relationToViewer.connections.values && data.relationToViewer.connections.values !== 0) {
                _(data.relationToViewer.connections.values).each(function (relation) {
                    if (relation.fullProfile) {
                        $myNode.append($("<img/>").attr("src", relation.fullProfile.pictureUrl).attr("alt", relation.fullProfile.firstName + " " + relation.fullProfile.lastName));
                        $myNode.click(todo);
                    } else {
                        $myNode.append($("<span/>").text(relation.person.firstName + " " + relation.person.lastName));
                    }
                });
            }
            
            return $myNode;
        },
        index: 100
    });
    
    // Past Engagements
    rendererPoint.extend({
        draw: function (data) {
            var $myNode = $("<div/>").addClass("pastEngagements");
            if (data.positions && data.positions.values && data.positions.values.length !== 0) {
                _(data.positions.values).each(function (position) {
                    console.log("each", position);
                    var $posNode = $("<div/>").addClass("position").appendTo($myNode);
                    if (position.isCurrent) {
                        $posNode.addClass("current");
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
            }
            return $myNode;
        },
        index: 200
    });
    
    
    
    function show(data) {
        
        var app = ox.ui.createApp({
            title: data.firstName + " " + data.lastName + "(LinkedIn)"
        });
        
        app.setLauncher(function () {
            
            var win = ox.ui.createWindow({});
            
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
            $nameNode.append($("<div class='liHeadline' />").text(data.headline));
            
            var $actionsNode = $("<div/>").addClass("actions").appendTo($node);
            actionPoint.each(function (ext) {
                $actionsNode.append($("<a href='#'/>").text(ext.label).click(function () {
                    ext.action();
                    return false;
                }));
            });
            
            rendererPoint.each(function (ext) {
                $node.append(ext.draw(data));
            });
            
            win.show();
        });
        
        
        app.launch();
    }
    
    return {
        show: show
    };
});
