define("extensions/halo/contacts/register", ["io.ox/core/extensions"], function (ext) {
    ext.point("io.ox/halo/contact:renderer").extend({
        id: "contacts",
        handles: function (type) {
            return type === "com.openexchange.halo.contacts";
        },
        draw: function  ($node, providerName, contacts) {
            if (contacts.length === 0) {
                return;
            }
            var deferred = new $.Deferred();
            require(["io.ox/contacts/base", "css!io.ox/contacts/style.css"], function (base) {
                $node.append($("<div/>").addClass("clear-title").text("Address Book"));
                $node.append(base.draw(contacts[0]));
                deferred.resolve();
            });
            return deferred;
        }
    });
    
    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        id: "contacts-request",
        enhances: function (type) {
            return type === "com.openexchange.halo.contacts";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "contacts";
        }
    });
});