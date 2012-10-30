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

define("plugins/portal/linkedIn/register",
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'io.ox/oauth/proxy',
     'io.ox/core/strings',
     'io.ox/keychain/api',
     'gettext!plugins/portal',
     'less!plugins/portal/linkedIn/style.css'], function (ext, http, proxy, strings, keychain, gt) {

    "use strict";
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

            new dialogs.SidePopup(({ modal: true }))
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

    ext.point("portal/linkedIn/updates/renderer").extend({
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
        isEnabled: function () {
            return keychain.isEnabled('linkedin');
        },
        requiresSetUp: function () {
            return keychain.isEnabled('linkedin') && ! keychain.hasStandardAccount('linkedin');
        },
        performSetUp: function () {
            var win = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");
            return keychain.createInteractively('linkedin', win);
        },
        loadTile: function () {
            return proxy.request({
                api: 'linkedin',
                url: 'http://api.linkedin.com/v1/people/~/mailbox:(id,folder,from:(person:(id,first-name,last-name,picture-url,headline)),recipients:(person:(id,first-name,last-name,picture-url,headline)),subject,short-body,last-modified,timestamp,mailbox-item-actions,body)?message-type=message-connections,invitation-request,invitation-reply,inmail-direct-connection&format=json'
            }).pipe(function (msgs) { return JSON.parse(msgs).values; });
        },
        drawTile: function (values) {
            var message = values ? values[0] : null;

            $(this).append(
                $('<div class="io-ox-portal-title">').append(
                    $('<img class="tile-image">').attr({src: 'apps/plugins/portal/linkedIn/glyphicons_377_linked_in.png'}),
                    $('<h1 class="tile-heading">').text('LinkedIn')
                )
            ).addClass('io-ox-portal-tile-linkedin');

            if (values) {
                var $content = $('<div class="io-ox-portal-content">').appendTo(this);
                _(values).each(function (message) {
                    $('<div class="io-ox-portal-item">').append(
                        $('<span class="io-ox-portal-preview-firstline">').text(message.from.person.firstName + " " + message.from.person.lastName + ": "),
                        $('<span class="io-ox-portal-preview-secondline">').text(message.subject),
                        $('<span class="">').text(' '),
                        $('<span class="io-ox-portal-preview-thirdline">').text(message.body)
                    );
                });
            }
        },
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
                messages.resolve(JSON.parse(msgs).values);
            })
            .fail(messages.reject);

            return $.when(activityFeed, messages);

        },
        draw: function (activityFeed, messages) {
            var drawing = new $.Deferred(),
                $node = this;

            $node.addClass("linkedin-content");

            $node.append(
                    $("<h1>").addClass("clear-title")
                    .text(gt("LinkedIn Network Updates"))
                );

            if (messages) {
                $('<h2 class="linkedin-messages-header">').text(gt("Your messages:")).appendTo($node);
                var  thisIsOn =  false;
                _(messages).each(function (message) {
                    thisIsOn = !thisIsOn;
                    $node.append($('<div class="linkedin-message">').append(
                        $('<span class="linkedin-name">').append(displayName(message.from.person), ": "),
                        $('<span class="linkedin-subject">').html(_.escape(message.subject)),
                        $('<div class="linkedin-body">').html(_.escape(message.body).replace(/\n/g, '<br/>'))
                    ).addClass(thisIsOn ? 'odd' : 'even'));
                });
            }

            if (activityFeed.values && activityFeed.values !== 0) {
                $('<h2 class="linkedin-activities-header">').text(gt("Recent activities:")).appendTo($node);
                _(activityFeed.values).each(function (activity) {
                    ext.point("portal/linkedIn/updates/renderer")
                        .invoke("draw", $node, activity);
                });
            }

            return drawing.resolve();
        },
        drawCreationDialog: function () {
            var $node = $(this);
            $node.append(
                $('<h1>').text('LinkedIn'),
                $('<div class="io-ox-portal-preview centered">').append(
                    $('<div>').text(gt('Add your account'))
                )
            );
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
