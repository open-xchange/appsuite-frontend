define("extensions/halo/linkedIn/view-halo", ["io.ox/core/lightbox", "css!extensions/halo/linkedIn/style.css"], function (lightbox) {
    return {
        draw: function (liResponse) {
            var $node = $("<div/>").addClass("linkedIn");
            $node.append("<h1>LinkedIn</h1>");
            var $detailNode = $("<div/>").addClass("details").appendTo($node);
            var $table = $("<table><tr><td class='t10' /><td class='t11' /></td></tr><tr><td class='r2' colspan='2'/></tr><table>").appendTo($detailNode);
            var $pictureNode = $table.find(".t10");
            var $nameNode = $table.find(".t11");
            var $relationNode = $table.find(".r2");

            function openDetails() {
                require(["extensions/halo/linkedIn/view-detail"], function (detailViewer) {
                    new lightbox.Lightbox({
                        getGhost: function () {
                            return $node;
                        },
                        buildPage: function () {
                            return detailViewer.draw(liResponse);
                        }
                    }).show();
                });
                return false;
            }
            function todo() {
                alert("todo");
                return false;
            }

            $pictureNode.append($("<img/>").attr("src", liResponse.pictureUrl));
            $nameNode.append($("<div class='name' />").text(liResponse.firstName + " " + liResponse.lastName));
            $nameNode.append($("<div class='headline' />").text(liResponse.headline));
            $nameNode.append($("<a href='#' />").text("Connect").click(todo)).addClass("actions");
            $nameNode.append($("<a href='#' />").text("Write Message").click(todo)).addClass("actions");
            
            
            if (liResponse.positions && liResponse.positions.values && liResponse.positions.values.length !== 0) {
                _(liResponse.positions.values).each(function (position) {
                    var $posNode = $("<ul/>").appendTo($relationNode);
                    if (position.isCurrent) {
                        var $item = $("<li/>").appendTo($posNode);
                        if (position.title) {
                            $("<span/>").appendTo($item).text(position.title);
                            $("<span/>").text(" at ").appendTo($item);
                        }
                        if (position.company && position.company.name) {
                            $("<span/>").text(position.company.name).appendTo($item);
                        }
                    }
                });
            }

            $node.click(openDetails); // We don't care, where the user clicks in the LinkedIn area, we'll always open the details. The link is added only to entice the user to click
            return $node;
        }
    };
});