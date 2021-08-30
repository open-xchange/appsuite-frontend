/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('plugins/portal/xing/register', [
    'io.ox/core/extensions',
    'plugins/portal/xing/actions',
    'plugins/portal/xing/activities',
    'io.ox/xing/api',
    'io.ox/core/api/user',
    'io.ox/core/notifications',
    'io.ox/backbone/views/modal',
    'io.ox/core/settings/util',
    'io.ox/keychain/api',
    'gettext!plugins/portal',
    'less!plugins/portal/xing/xing'
], function (ext, eventActions, activityParsers, api, userApi, notifications, ModalDialog, util, keychain, gt) {

    'use strict';

    var // addXingAccount,
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

    var getLanguages = function () {
        return [
            { label: 'de', value: 'de' },
            { label: 'en', value: 'en' },
            { label: 'es', value: 'es' },
            { label: 'fr', value: 'fr' },
            { label: 'it', value: 'it' },
            { label: 'nl', value: 'nl' },
            { label: 'pl', value: 'pl' },
            { label: 'pt', value: 'pt' },
            { label: 'ru', value: 'ru' },
            { label: 'tr', value: 'tr' },
            { label: 'zh', value: 'zh' }
        ];
    };

    createXingAccount = function (e) {
        e.preventDefault();

        //#. 'Create a XING Account' as a header of a modal dialog to create a XING account.
        new ModalDialog({ title: gt('Create a XING Account') })
            .build(function () {
                var self = this, guid,
                    language = 'language',
                    model = new Backbone.Model();
                model.isConfigurable = true;
                model.isConfigurable = function () { return true; };
                model.set(language, getLanguages()[0].value);

                this.$body.append(
                    $('<p>').text(
                        gt('Please select which of the following data we may use to create your %s account:', XING_NAME)
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="mail_address">').text(gt('Mail address')),
                            this.$email = $('<input id="mail_address" type="text" name="email" class="form-control">').attr('id', guid)
                        )
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="first_name">').text(gt('First name')),
                            this.$firstname = $('<input id="first_name" type="text" class="form-control" placeholder="">')
                        )
                    ),
                    $('<div class="row">').append(
                        $('<div class="col-sm-12">').append(
                            $('<label for="last_name">').text(gt('Last name')),
                            this.$lastname = $('<input id="last_name" type="text" class="form-control" placeholder="">')
                        )
                    ),
                    util.compactSelect(language, gt('Language'), model, getLanguages())
                );

                userApi.getCurrentUser().done(function (userData) {
                    var locale = userData.attributes.locale;
                    self.$email.val(userData.attributes.email1 || userData.attributes.email2 || userData.attributes.email3);
                    self.$firstname.val(userData.attributes.first_name);
                    self.$lastname.val(userData.attributes.last_name);
                    self.$language.val(locale.indexOf('_') > -1 ? locale.split('_')[0] : locale);
                });
            })
            .addCancelButton()
            //#. 'Create' as button text of a modal dialog to confirm to create a new XING-Account
            .addButton({ label: gt('Create'), action: 'accepted' })
            .on('accepted', function () {
                api.createProfile({
                    tandc_check: true,
                    email: this.$email.val(),
                    first_name: this.$firstname.val(),
                    last_name: this.$lastname.val(),
                    language: this.$language.val()
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
            })
            .open();
    };

    // addXingAccount = function (event) {
    //     var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600'),
    //         baton = event.data.baton;
    //     return keychain.createInteractively('xing', win).done(function () {
    //         var model = baton.model;
    //         $(model.node).find('.setup-questions').remove();
    //         //hack to provoke loadAndPreview()
    //         model.changed.props = baton.model.drawn = true;
    //         ox.trigger('refresh^');
    //     });
    // };

    statusUpdateForm = function () {
        var form = $('<div class="xing comment">').append(
            $('<textarea rows="3" cols "40">'),
            $('<button type="button" class="btn btn-primary">').text(gt('Post a status update'))
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
        var node = $('<div class="networkActivities">'),
            newsItemCount = 0;

        if (networkActivities.length === 0) {
            node.text(gt('There is no recent activity in your Xing network.'));
        }

        _(networkActivities).each(function (activity) {
            if (activity.type !== 'activity' || (maxCount && newsItemCount >= maxCount)) return;

            var activityNode = $('<div class="activity">').appendTo(node),
                reactionNode = $('<div class="reactions">'),
                dateNode = $('<div class="date">'),
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
            if (this.hasClass('widget-color-custom')) return;
            this.find('h2:first').prepend($('<i class="fa fa-xing" aria-hidden="true">'));
            this.find('h2 .title').removeClass('title').addClass('sr-only');
            this.addClass('widget-color-custom color-xing');
            content.find('.paragraph').empty().text(gt('Get news from your XING network delivered to you. Stay in touch and find out about new business opportunities.'));
            content.append(
                $('<a href="#" class="action" role="button">').text(
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
                if (error.params && error.error_params[0] === 'Invalid OAuth token') {
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
