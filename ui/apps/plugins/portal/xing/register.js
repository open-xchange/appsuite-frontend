/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 * TODO:
 * - Error handling - reauthorize / create xing account
 * - post status
 * - add message to xing invite
 * - add message to xing contact request
 * - assumption: the "share link" function (currently experimental) will be different from normal activity sharing (see actions.js)
 * - "ignore" action not implemented by server yet.
 * - "liking" does not toggle to un/disliking
 * - revoke xing invitations
 * - pre-select the correct language in createXingAccount by matching the first part of locale
 * - error handling when looking up e-mails for add/invite-to
 */

define('plugins/portal/xing/register', [
    'io.ox/core/extensions',
    'plugins/portal/xing/actions',
    'plugins/portal/xing/activities',
    'io.ox/xing/api',
    'io.ox/core/api/user',
    'io.ox/core/notifications',
    'io.ox/core/tk/dialogs',
    'io.ox/keychain/api',
    'gettext!plugins/portal',
    'less!plugins/portal/xing/xing'
], function (ext, eventActions, activityParsers, api, userApi, notifications, dialogs, keychain, gt) {

    'use strict';

    var addXingAccount,
        createXingAccount,
        makeNewsfeed,
        statusUpdateForm,
        title = gt('XING'),
        reauthorizeAccount,
        MAX_ITEMS_PREVIEW = 6,
        XING_NAME = gt('XING'),
        point = ext.point('io.ox/portal/widget/xing');

    reauthorizeAccount = function () {
        var account = keychain.getStandardAccount('xing');

        keychain.submodules.xing.reauthorize(account).done(function () {
            notifications.yell('success', gt('Successfully reauthorized your %s account', XING_NAME));
            ox.trigger('refresh^');
        }).fail(function (response) {
            notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
        });
    };

    createXingAccount = function (e) {

        e.preventDefault();

        var email, firstname, lastname, language;

        new dialogs.ModalDialog()

            .build(function () {
                var menu, availableLangs;

                availableLangs = 'de en es fr it nl pl pt ru tr zh'.split(' ');

                this.append(
                    menu = $('<div class="io-ox-xing submitted-data">').append(
                        $('<p>').text(
                            gt('Please select which of the following data we may use to create your %s account:', XING_NAME)
                        ),
                        $('<label>').append(
                            $.txt(gt('Mail address')),
                            email = $('<input type="text" name="email">')
                        ),
                        $('<label>').append(
                            $.txt(gt('First name')),
                            firstname = $('<input type="text" name="firstname">')
                        ),
                        $('<label>').append(
                            $.txt(gt('Last name')),
                            lastname = $('<input type="text" name="lastname">')
                        ),
                        $('<label>').append(
                            $.txt(gt('Language')),
                            language = $('<select name="language">').append(
                                _(availableLangs).map(function (elem) { return $('<option>').val(elem).text(elem); })
                            )
                        )
                    )
                );

                userApi.getCurrentUser().done(function (userData) {
                    var locale = userData.attributes.locale,
                        lang = locale.indexOf('_') > -1 ? locale.split('_')[0] : locale;

                    email.val(userData.attributes.email1 || userData.attributes.email2 || userData.attributes.email3);
                    firstname.val(userData.attributes.first_name);
                    lastname.val(userData.attributes.last_name);
                    language.val(lang);
                });
            })

            .addAlternativeButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
            .addSuccessButton('accepted', gt('Accept'), 'accepted', { tabIndex: 1 })

            .show()

            .done(function (action) {
                if (action === 'cancel') return;
                api.createProfile({
                    tandc_check: true,
                    email: email.val(),
                    first_name: firstname.val(),
                    last_name: lastname.val(),
                    language: language.val()
                })
                .fail(function (response) {
                    notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
                })
                .done(function () {
                    notifications.yell({
                        type: 'success',
                        duration: 60000,
                        message: gt('Please check your inbox for a confirmation email.\n\nFollow the instructions in the email and then return to the widget to complete account setup.')
                    });
                });
            }
        );

    };

    addXingAccount = function (event) {
        var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600'),
            baton = event.data.baton;
        return keychain.createInteractively('xing', win).done(function () {
            var model = baton.model;
            $(model.node).find('.setup-questions').remove();
            //hack to provoke loadAndPreview()
            model.changed.props = baton.model.drawn = true;
            ox.trigger('refresh^');
        });
    };

    statusUpdateForm = function () {
        var form = $('<div>').addClass('xing comment').append(
            $('<textarea>').attr({ rows: 3, cols: 40 }),
            $('<button>').addClass('btn btn-primary').text(gt('Post a status update'))
        );

        form.on('click', '.btn', function (clickEvent) {
            var container = $(clickEvent.target).parent(),
                input = container.children('textarea');

            api.changeStatus({
                message: input.val()

            }).fail(function (response) {
                notifications.yell('error', gt('Your status update could not be posted on %s. The error message was: "%s"', XING_NAME, response.error));

            }).done(function () {
                container.remove();
                notifications.yell('success', gt('Your status update has been successfully posted on %s', XING_NAME));

            });
        });

        return form;
    };

    makeNewsfeed = function (networkActivities, options) {
        options = options || {};

        var maxCount = options.maxCount;
        var node = $('<div>').addClass('networkActivities'),
            newsItemCount = 0;

        if (networkActivities.length === 0) {
            node.text(gt('There is no recent activity in your Xing network.'));
        }

        _(networkActivities).each(function (activity) {
            if (activity.type !== 'activity') {
                return;
            }

            if (maxCount && newsItemCount >= maxCount) {
                return;
            }

            var activityNode = $('<div>').addClass('activity').appendTo(node),
                reactionNode = $('<div>').addClass('reactions'),
                dateNode = $('<div>').addClass('date'),
                foundHandler = false,
                id;

            if (id = activity.ids[0]) {
                activityNode.attr('data-activity-id', id);
            }

            ext.point('io.ox/portal/widget/xing/activityhandler').each(function (handler) {
                if (handler.accepts(activity, options)) {
                    foundHandler = true;
                    handler.handle(activity, options).appendTo(activityNode);
                }
            });

            if (foundHandler) {
                // Date
                if (activity.created_at) {
                    var creationDate = moment(activity.created_at);
                    dateNode.text(creationDate.format('l LT')).appendTo(activityNode);
                }

                //reactions like comment, share, like
                _(activity.possible_actions).each(function (reaction) {
                    ext.point('io.ox/portal/widget/xing/reaction').each(function (handler) {
                        if (handler.accepts(reaction)) {
                            reactionNode.append(
                                handler.handle(activity)
                            );
                        }
                    });
                });
                reactionNode.appendTo(activityNode);
                newsItemCount++;

            } else {
                console.log('Could not find a handler for the following activity: ' + activity.verb + '. Please let us know about this. Here is some data that would help us: ', JSON.stringify(activity));
            }
        });

        if (newsItemCount.length === 0) {
            node.text(gt('There is no recent activity in your Xing network.'));
        }
        return node;
    };

    var refreshWidget = function () {
        require(['io.ox/portal/main'], function (portal) {
            var portalApp = portal.getApp(),
                portalModels = portalApp.getWidgetCollection().filter(function (model) { return /^xing_\d*/.test(model.id); });

            if (portalModels.length > 0) {
                portalApp.refreshWidget(portalModels[0], 0);
            }
        });
    };

    /*
     * Portal extension points: Here's where it all starts
     */
    point.extend({

        title: title,
        // prevent loading on refresh when error occurs to not bloat logs (see Bug 41740)
        stopLoadingOnError: true,

        isEnabled: function () {
            return keychain.isEnabled('xing');
        },

        requiresSetUp: function () {
            return keychain.isEnabled('xing') && !keychain.hasStandardAccount('xing');
        },

        drawDefaultSetup: function (baton) {
            keychain.submodules.xing.off('create', null, this);
            keychain.submodules.xing.on('create', function () {
                api.createSubscription();
                baton.model.node.find('h2 .fa-xing').replaceWith($('<span class="title">').text(title));
                baton.model.node.removeClass('requires-setup widget-color-custom color-xing');
                refreshWidget();
            }, this);

            var content = this.find('.content');

            this.find('h2 .title').replaceWith('<i class="fa fa-xing">');
            this.addClass('widget-color-custom color-xing');
            content.find('.paragraph').empty().text(gt('Get news from your XING network delivered to you. Stay in touch and find out about new business opportunities.'));
            content.append(
                $('<a href="#" class="action" tabindex="1" role="button">').text(
                    //#. %1$s is social media name, e.g. Facebook
                    gt('Create new %1$s account', XING_NAME)
                )
                .on('click', { baton: baton }, createXingAccount)
            );
        },

        performSetUp: function () {
            var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600');
            return keychain.createInteractively('xing', win);
        },

        load: function (baton) {
            var def = $.Deferred();
            api.getUserfeed({
                //name variations, page_name and picture
                user_fields: '0,1,2,3,4,8,23'
            }).then(function (xingResponse) {
                baton.data = xingResponse;
                def.resolve(xingResponse);
            }).fail(function (error) {
                if (error.error_params[0] === 'Invalid OAuth token') {
                    if (keychain.getStandardAccount('xing')) {
                        baton.reauthorize = true;
                        def.resolve();
                        return;
                    }
                }
                def.reject(error);
            });
            return def;
        },

        preview: function (baton) {
            //remove setup that may not have been cleared correctly (may happen if an account was created successfully but callback function wasn't called)
            this.find('.setup-questions').remove();
            if (baton.reauthorize) {
                this.append($('<div class="content">').append(
                    $('<a href="#">').text(gt('Click here to reconnect to your xing account to see activities.')).on('click', function () {
                        reauthorizeAccount();
                        return false;
                    })
                ));
            } else {
                this.append(
                    $('<div class="content preview io-ox-xing pointer">').append(
                        makeNewsfeed(baton.data.network_activities, { maxCount: MAX_ITEMS_PREVIEW, limitLength: true })
                    ).on('click', 'a.external.xing', function (e) { e.stopPropagation(); })
                );
            }
        },

        draw: function (baton) {
            this.append(
                $('<div class="content io-ox-xing fullview">').append(
                    statusUpdateForm(),
                    $('<h2>').text(gt('Your %s newsfeed', XING_NAME)),
                    makeNewsfeed(baton.data.network_activities)
                )
            );
        }
    });

    ext.point('io.ox/portal/widget/xing/settings').extend({
        title: title,
        type: 'xing',
        editable: false,
        unique: true
    });
});
