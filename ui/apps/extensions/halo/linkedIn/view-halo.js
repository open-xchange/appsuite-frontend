define("extensions/halo/linkedIn/view-halo", ["io.ox/core/dialogs", "css!extensions/halo/linkedIn/style.css"], function (dialogs) {
    return {
        draw: function (liResponse) {
            var $node = $("<div/>").addClass("linkedIn");
            var $detailNode = $("<div/>").addClass("details").appendTo($node);
            var $table = $("<table><tr><td class='t10' /><td class='t11' /></td></tr><tr><td class='r2' colspan='2'/></tr><table>").appendTo($detailNode);
            var $pictureNode = $table.find(".t10");
            var $nameNode = $table.find(".t11");
            var $relationNode = $table.find(".r2");

            function openDetails() {
                require(["extensions/halo/linkedIn/view-details"], function (detailViewer) {
                    detailViewer.show(liResponse);
                });
                return false;
            }

            $pictureNode.append($("<img/>").attr("src", liResponse.pictureUrl));
            $nameNode.append($("<div class='name' />").text(liResponse.firstName + " " + liResponse.lastName));
            $nameNode.append($("<div class='headline' />").text(liResponse.headline));
            $nameNode.append($("<a href='#' />").text("Details").click(openDetails));

            $node.click(openDetails); // We don't care, where the user clicks in the LinkedIn area, we'll always open the details. The link is added only to entice the user to click
            return $node;
        }
    };
});