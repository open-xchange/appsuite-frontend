define("extensions/halo/linkedIn/view-halo", ["io.ox/core/dialogs"], function (dialogs) {
    return {
        draw: function (liResponse) {
            // TODO: Use Extension Points here, once we figured out how that's supposed to work
            var $node = $("<div/>").addClass("linkedIn");
            var $table = $("<table><tr><td class='t10' /><td class='t11' /></td></tr><tr><td class='r2' colspan='2'/></tr><table>").appendTo($node);
            var $pictureNode = $table.find(".t10");
            var $nameNode = $table.find(".t11");
            var $relationNode = $table.find(".r2");
            
            $pictureNode.append($("<img/>").attr("src", liResponse.pictureUrl));
            
            function openDetails() {
                require(["extensions/halo/linkedIn/view-details"], function (detailViewer) {
                    detailViewer.show(liResponse);
                });
                return false;
            }
            
            $nameNode.append($("<div class='name' />").text(liResponse.firstName + " " + liResponse.lastName));
            $nameNode.append($("<div class='liHeadline' />").text(liResponse.headline));
            $nameNode.append($("<a href='#' />").text("Details").click(openDetails));
            
            $node.click(openDetails); // We don't care, where the user clicks in the LinkedIn area, we'll always open the details. The link is added only to entice the user to click
            return $node;
        }
    };
});