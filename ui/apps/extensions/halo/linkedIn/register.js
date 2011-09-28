define("extensions/halo/linkedIn/register", ["io.ox/core/extensions"], function (ext) {
    ext.point("io.ox/halo/contact:renderer").extend({
        handles: function (type) {
            return type === "com.openexchange.halo.linkedIn.fullProfile";
        },
        draw: function  ($node, providerName, liResponse) {
            require(["extensions/halo/linkedIn/view-halo", "css!extensions/halo/linkedIn/style.css"], function (base) {
                $node.append(base.draw(contacts[0]));
            });
        }
    });
});