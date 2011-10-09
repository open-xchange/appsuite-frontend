define("extensions/halo/linkedIn/register", ["io.ox/core/extensions"], function (ext) {
    ext.point("io.ox/halo/contact:renderer").extend({
        id: "linkedin",
        handles: function (type) {
            return type === "com.openexchange.halo.linkedIn.fullProfile";
        },
        draw: function ($node, providerName, liResponse) {
            var deferred = new $.Deferred();
            require(["extensions/halo/linkedIn/view-halo", "css!io.ox/linkedIn/style.css"], function (base) {
                $node.append(base.draw(liResponse));
                deferred.resolve();
            });
            return deferred;
        }
    });
});
