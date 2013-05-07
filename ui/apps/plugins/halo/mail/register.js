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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define("plugins/halo/mail/register",
    ['io.ox/core/extensions',
     'io.ox/mail/api',
     'gettext!plugins/halo'], function (ext, api, gt) {

    "use strict";

    function trackUpdates(obj, node, baton) {

        function redraw() {
            require(['plugins/halo/view-detail'], function (view) {
                view.redraw(baton);
            });
        }

        var cid = encodeURIComponent(_.cid(obj));
        api.on('update:' + cid, redraw);
        node.on('dispose', function () {
            api.off('update:' + cid, redraw);
        });
    }

    ext.point("io.ox/halo/contact:renderer").extend({

        id: "mail",

        handles: function (type) {
            return type === "com.openexchange.halo.mail";
        },

        draw: function  (baton) {

            if (baton.data.length === 0) return $.when();

            var sent = [], received = [], deferred = $.Deferred(), node = this;

            _.each(baton.data, function (elem) {
                if (elem.folder_id.match(/INBOX$/i)) {
                    received.push(elem);
                } else {
                    sent.push(elem);
                }
                // register for all update events
                trackUpdates(elem, node, baton);
            });

            this.append(
                $('<div class="widget-title clear-title">').text(gt("Recent conversations"))
            );

            require(["io.ox/core/tk/dialogs", "io.ox/mail/view-grid-template"], function (dialogs, viewGrid) {

                node.append(
                    // left column
                    $('<div class="io-ox-left-column">').append(
                        $('<p class="io-ox-subheader">').text(gt('Received mails')),
                        received.length === 0 ?
                            $("<div>").text(gt("Cannot find any messages this contact sent to you.")) :
                            viewGrid.drawSimpleGrid(received)
                    ),
                    // right column
                    $('<div class="io-ox-right-column">').append(
                        $('<p class="io-ox-subheader">').text(gt("Sent mails")),
                        sent.length === 0 ?
                            $("<div>").text(gt("Cannot find any messages you sent to this contact.")) :
                            viewGrid.drawSimpleGrid(sent)
                    ),
                    // clear float
                    $('<div>').css("clear", "both")
                );

                new dialogs.SidePopup().delegate(node, ".vgrid-cell", function (pane, e, target) {
                    var msg = target.data("objectData");
                    api.get({ folder: msg.folder_id, id: msg.id }).done(function (data) {
                        require(["io.ox/mail/view-detail"], function (view) {
                            pane.append(view.draw(data));
                            data = null;
                        });
                    });
                });

                deferred.resolve();
            });

            return deferred;
        }
    });

    ext.point("io.ox/halo/contact:requestEnhancement").extend({
        id: "request-mail",
        enhances: function (type) {
            return type === "com.openexchange.halo.mail";
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = "mail";
            request.params.limit = 10;
            request.params.columns = "102,600,601,602,603,604,605,606,607,608,609,610,611,612,614,652";
        }
    });
});
