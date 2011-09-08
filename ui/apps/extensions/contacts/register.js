define("extensions/contacts/register", ["io.ox/core/extensions"], function (ext) {
    ext.point("io.ox/halo/person:renderer").extend({
        handles: function (type) {return type === "contact"; },
        render: function  (contact, $node) {
            require(["io.ox/contacts/base", "css!io.ox/contacts/style.css"], function (base) {
                $node.append(base.draw(contact));
            });
        }
    });
});