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
     'gettext!plugins/portal'], function (ext, http, proxy, strings, keychain, gt) {

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
                    $("<span>").text(" is now connected with "),
                    displayName(activity.updateContent.person.connections.values[0])
                );
            }

            return deferred.resolve();
        }
    });

    ext.point("io.ox/portal/widget/linkedin").extend({

        title: 'LinkedIn',

        isEnabled: function () {
            return keychain.isEnabled('linkedin');
        },

        requiresSetUp: function () {
            return keychain.isEnabled('linkedin') && !keychain.hasStandardAccount('linkedin');
        },

        performSetUp: function () {
            var win = window.open(ox.base + "/busy.html", "_blank", "height=400, width=600");
            return keychain.createInteractively('linkedin', win);
        },

        load: function (baton) {
            return proxy.request({
                api: 'linkedin',
                url: 'http://api.linkedin.com/v1/people/~/mailbox:(id,folder,from:(person:(id,first-name,last-name,picture-url,headline)),recipients:(person:(id,first-name,last-name,picture-url,headline)),subject,short-body,last-modified,timestamp,mailbox-item-actions,body)?message-type=message-connections,invitation-request,invitation-reply,inmail-direct-connection&format=json'
            })
            .pipe(function (msgs) {
                return (baton.data = JSON.parse(msgs).values);
            })
            .fail(function (err) {
                console.log('Nope', err);
            });
        },

        preview: function (baton) {

            var message = baton.data ? baton.data[0] : null;

            var content = $('<div class="content pointer">');

            if (baton.data && baton.data.length) {
                _(baton.data).each(function (message) {
                    content.append(
                        $('<div class="paragraph">').append(
                            $('<span class="bold">').text(message.from.person.firstName + " " + message.from.person.lastName + ": "),
                            $('<span class="normal">').text(message.subject), $.txt(' '),
                            $('<span class="gray">').text(message.body)
                        )
                    );
                });
            } else {
                this.append(
                    $('<div class="content">').text(gt('You have no new messages'))
                );
            }

            this.append(content);
        },

        draw: function (baton) {

            var node = $('<div class="portal-feed linkedin-content">');

            node.append(
                $("<h1>").text(gt("LinkedIn Network Updates"))
            );

            if (baton.data) {
                node.append(
                    $('<h2 class="linkedin-messages-header">').text(gt("Your messages"))
                );
                _(baton.data).each(function (message, index) {
                    node.addClass(index % 2 ? 'odd' : 'even')
                    .append(
                        $('<div class="linkedin-message">').append(
                            $('<span class="linkedin-name">').append(displayName(message.from.person), ": "),
                            $('<span class="linkedin-subject">').html(_.escape(message.subject)),
                            $('<div class="linkedin-body">').html(_.escape(message.body).replace(/\n/g, '<br>'))
                        )
                    );
                });
            }

            http.GET({
                module: "integrations/linkedin/portal",
                params: { action: "updates" }
            })
            .done(function (activities) {
                if (activities.values && activities.values !== 0) {
                    node.append(
                        $('<h2 class="linkedin-activities-header">').text(gt("Recent activities"))
                    );
                    _(activities.values).each(function (activity) {
                        ext.point("portal/linkedIn/updates/renderer").invoke("draw", node, activity);
                    });
                }
            });

            this.append(node);
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
    });
});
