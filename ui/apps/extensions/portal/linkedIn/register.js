/*
* http://creativecommons.org/licenses/by-nc-sa/2.5/
*
* Copyright (C) Open-Xchange Inc., 2006-2011
* Mail: info@open-xchange.com
*
* @author Francisco Laguna <francisco.laguna@open-xchange.com>
*
*/

define("extensions/portal/linkedin/register", ["io.ox/core/extensions", "io.ox/core/http"], function (ext, http) {
    ext.point("portal/linkedin/updates/renderer").extend({
        id: "CONN",
        draw: function (activity) {
            var deferred = new $.Deferred();
            if (activity.updateType !== "CONN") {
                deferred.resolve();
                return deferred;
            }
            
            var $updateEntry = $("<div/>").addClass("io-ox-portal-linkedin-updates-entry").appendTo(this);
            var $detailEntry = $("<div/>").addClass("io-ox-portal-linkedin-updates-details").hide().appendTo(this);
            
            function displayName(person) {
                var dname = person.firstName + " " + person.lastName,
                link = $("<a href='#' />").text(dname).click(function () {
                    if (link.prop("personId") === person.id) {
                        link.prop("personId", null);
                        $detailEntry.hide();
                        return;
                    }
                    link.prop("personId", person.id);
                    require(["io.ox/linkedIn/view-detail", "io.ox/core/lightbox"], function (viewer, lightbox) {
                        var loading = http.GET({
                            module: "integrations/linkedin/portal",
                            params: {
                                action: "fullProfile",
                                id: person.id
                            }
                        });
                        $detailEntry.empty()
                            .append(viewer.draw(person))
                            .show();
                        var $busyIndicator = $("<div/>").css({"min-height": "100px"}).appendTo($detailEntry);
                        $busyIndicator.busy();
                        loading.done(function (completeProfile) {
                            $busyIndicator.idle().remove();
                            $detailEntry.empty().append(viewer.draw(completeProfile));
                        });
                    });
                });
                
                return link;
            }
            // Check presence of all variables
            $updateEntry.append(displayName(activity.updateContent.person)).append($("<span />").text(" is now connected with ")).append(displayName(activity.updateContent.person.connections.values[0]));
            
            deferred.resolve();
            return deferred;
        }
    });
    
    var updatesPortal = {
        id: "linkedinUpdates",
        index: 1000,
        load: function () {
            return http.GET({
                module: "integrations/linkedin/portal",
                params: {
                    action: "updates"
                }
            });
        },
        
        draw: function (activityFeed) {
            var drawing = new $.Deferred(),
            $node = this;
            $node.append($("<div/>").addClass("clear-title").text("LinkedIn Network Updates"));
            if (activityFeed.values && activityFeed.values !== 0) {
                _(activityFeed.values).each(function (activity) {
                    ext.point("portal/linkedin/updates/renderer").invoke("draw", $node, activity);
                });
            }
            drawing.resolve();
            return drawing;
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