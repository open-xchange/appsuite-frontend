define("extensions/halo/linkedIn", ["io.ox/core/extensions"], function (ext) {
    
    ext.point("io.ox/halo/person:renderer").extend({
        handles: function (type) {return type === "linkedin:sharedContacts";},
        render: function (sharedContacts, $node) {
          var $list = $("<ul/>");
          _(sharedContacts).each(function (contact) {
              $list.append($("<li/>").text(contact.firstName));
          });
          $node.append($list);
        }
    });
});