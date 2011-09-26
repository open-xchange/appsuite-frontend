define("extensions/halo/contacts/register", ["io.ox/core/extensions"], function (ext) {
    ext.point("io.ox/halo/contact:renderer").extend({
        handles: function (type) {
            return type === "com.openexchange.halo.contacts";
        },
        draw: function  ($node, providerName, contacts) {
            if (contacts.length === 0) {
                return;
            }
            require(["io.ox/contacts/base", "css!io.ox/contacts/style.css"], function (base) {
                $node.append(base.draw(contacts[0]));
            });
        }
    });
    
    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        enhances: function (type) {
            return type === "contact";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "com.openexchange.halo.contacts";
        }
    });
});