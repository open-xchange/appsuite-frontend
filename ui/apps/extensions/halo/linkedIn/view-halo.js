define("extensions/halo/linkedIn/view-halo", ["io.ox/linkedIn/view-detail", "css!io.ox/linkedIn/style.css"], function (viewer) {
    return {
        draw: function (liResponse) {
            var $node = $("<div/>").addClass("linkedIn");
            $node.append($("<div/>").addClass("clear-title").text("LinkedIn"));
            $node.append(viewer.draw(liResponse));
            return $node;
        }
    };
});