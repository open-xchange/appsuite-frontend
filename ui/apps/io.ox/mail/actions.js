/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define("io.ox/mail/actions", ["io.ox/core/extensions"], function (ext) {
    
    "use strict";
    
    // actions
    
    ext.point("io.ox/mail/actions/delete").extend({
        index: 100,
        id: "delete",
        requires: function (context) {
            return context.collection.has("some", "delete");
        },
        action: function (data) {
            console.log("Action: delete");
            //api.remove(grid.selection.get());
            //grid.selection.selectNext();
        }
    });
    
    ext.point("io.ox/mail/actions/reply-all").extend({
        index: 100,
        id: "reply-all",
        requires: function (context) {
            return context.collection.has("some");
        },
        action: function (data) {
            console.log("Action: reply All");
        }
    });
    
    ext.point("io.ox/mail/actions/reply").extend({
        index: 100,
        id: "reply",
        requires: function (context) {
            return context.collection.has("some");
        },
        action: function (data) {
            console.log("Action: reply");
        }
    });
    
    ext.point("io.ox/mail/actions/forward").extend({
        index: 100,
        id: "forward",
        requires: function (context) {
            return context.collection.has("some");
        },
        action: function (data) {
            console.log("Action: forward");
        }
    });
    
    // links
    
    ext.point("io.ox/core/mail/links/inline").extend(new ext.Link({
        index: 100,
        id: "delete",
        label: "Delete",
        ref: "io.ox/mail/actions/delete"
    }));
    
    ext.point("io.ox/core/mail/links/inline").extend(new ext.Link({
        index: 200,
        id: "reply-all",
        label: "Reply All",
        ref: "io.ox/mail/actions/reply-all"
    }));
    
    ext.point("io.ox/core/mail/links/inline").extend(new ext.Link({
        index: 300,
        id: "reply",
        label: "Reply",
        ref: "io.ox/mail/actions/reply"
    }));
    
    ext.point("io.ox/core/mail/links/inline").extend(new ext.Link({
        index: 400,
        id: "forward",
        label: "Forward",
        ref: "io.ox/mail/actions/forward"
    }));
});