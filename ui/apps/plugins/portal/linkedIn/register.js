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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define("plugins/portal/linkedin/register",
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'io.ox/oauth/proxy',
     'less!plugins/portal/linkedIn/style.css'], function (ext, http, proxy) {

    "use strict";

    ext.point("portal/linkedin/updates/renderer").extend({
        id: "CONN",
        draw: function (activity) {

            var deferred = new $.Deferred();

            if (activity.updateType !== "CONN") {
                return deferred.resolve();
            }

            var $updateEntry = $("<div/>")
                    .addClass("io-ox-portal-linkedin-updates-entry")
                    .appendTo(this),

                $detailEntry = $("<div/>")
                    .addClass("io-ox-portal-linkedin-updates-details")
                    .hide().appendTo(this),

                self = $(this);

            function fnClick(e) {

                var person = e.data;
                e.preventDefault();

                require(["io.ox/linkedIn/view-detail", "io.ox/core/tk/dialogs"], function (viewer, dialogs) {

                    var busy = $("<div>")
                            .css("minHeight", "100px")
                            .busy(),
                        node = $("<div>")
                            .append(viewer.draw(person))
                            .append(busy);

                    new dialogs.SidePopup()
                        .show(e, function (popup) {
                            popup.append(node);
                        });

                    return http.GET({
                            module: "integrations/linkedin/portal",
                            params: {
                                action: "fullProfile",
                                id: person.id
                            }
                        })
                        .done(function (completeProfile) {
                            busy.idle();
                            node.empty()
                                .append(viewer.draw(completeProfile));
                        });
                });
            }

            function displayName(person) {
                var dname = person.firstName + " " + person.lastName;
                return $("<a href='#' />")
                    .text(dname)
                    .on("click", person, fnClick);
            }

            // Check presence of all variables
            if (activity.updateContent.person.connections) {
                $updateEntry.append(
                    displayName(activity.updateContent.person),
                    $("<span />").text(" is now connected with "),
                    displayName(activity.updateContent.person.connections.values[0])
                );
            }

            return deferred.resolve();
        }
    });

    var updatesPortal = {
        id: "linkedinUpdates",
        index: 200,
        load: function () {
            var activityFeed = $.Deferred(),
                messages = $.Deferred();

            http.GET({
                module: "integrations/linkedin/portal",
                params: {
                    action: "updates"
                }
            })
            .done(function (activities) {
                activityFeed.resolve(activities);
            })
            .fail(activityFeed.reject);
            
            proxy.request({
                api: 'linkedin',
                url: 'http://api.linkedin.com/v1/people/~/mailbox:(id,folder,from:(person:(id,first-name,last-name,picture-url,headline)),recipients:(person:(id,first-name,last-name,picture-url,headline)),subject,short-body,last-modified,timestamp,mailbox-item-actions,body)?message-type=message-connections,invitation-request,invitation-reply,inmail-direct-connection&format=json'
            })
            .done(function (msgs) {
                messages.resolve(msgs);
            })
            .fail(messages.reject);
            
            return $.when(activityFeed, messages);
                
        },
        loadTile: function () {
            return $.when();
        },
        drawTile: function () {
            $(this).append(
                $('<img>').attr({src: 'apps/plugins/portal/linkedIn/linkedin175.jpg', alt: 'LinkedIn', width: '175px', height: 'auto'})
            ).addClass('io-ox-portal-tile-linkedin');
        },
        draw: function (activityFeed, messages) {
            var drawing = new $.Deferred(),
                $node = this,
                $box = $("<div>");
                

            $node.append(
                    $("<div/>").addClass("clear-title")
                    .text("LinkedIn Network Updates")
                )
                .append(
                    $box.css("marginTop", "20px")
                );

            if (activityFeed.values && activityFeed.values !== 0) {
                _(activityFeed.values).each(function (activity) {
                    ext.point("portal/linkedin/updates/renderer")
                        .invoke("draw", $box, activity);
                });
            }

            return drawing.resolve();
        }
    };


    var inboxPortal = {
        id: "linkedinInbox",
        load: function () {
        },
        draw: function () {
        }
    };

    ext.point("io.ox/portal/widget").extend(updatesPortal);

});