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
 */

define('plugins/portal/xing/register',
    ['io.ox/core/extensions',
     'plugins/portal/xing/actions',
     'plugins/portal/xing/activities',
     'io.ox/xing/api',
     'io.ox/core/api/user',
     'io.ox/core/notifications',
     'io.ox/core/tk/dialogs',
     'io.ox/core/extPatterns/links',
     'io.ox/keychain/api',
     'io.ox/backbone/forms',
     'io.ox/core/date',
     'gettext!plugins/portal',
     'less!plugins/portal/xing/xing'
    ], function (ext, eventActions, activityParsers, api, userApi,
        notifications, dialogs, links, keychain, forms, date, gt) {

    'use strict';

    var addXingAccount,
        createXingAccount,
        isAlreadyOnXing,
        makeNewsfeed,
        statusUpdateForm,
        title = gt('XING'),
        reauthorizeAccount,
        MAX_ITEMS_PREVIEW = 3,
        XING_NAME = gt('XING'),
        point = ext.point('io.ox/portal/widget/xing');

    isAlreadyOnXing = function (emailArray) {
        return api.findByMail(emailArray).then(function (data) {

            return _(data.results.items).some(function (inquiry) {

                return !!inquiry.user;
            });
        });
    };

    reauthorizeAccount = function () {
        var account = keychain.getStandardAccount('xing');

        keychain.submodules.xing.reauthorize(account).done(function () {
            notifications.yell('success', gt('Successfully reauthorized your %s account', XING_NAME));
            ox.trigger('refresh^');
        }).fail(function (response) {
            notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
        });
    };

    createXingAccount = function (event) {
        var email, firstname, lastname, language;

        new dialogs.ModalDialog()

            .build(function () {
                var menu, availableLangs;

                availableLangs = 'de en es fr it nl pl pt ru tr zh'.split(' ');


                this.append(
                    menu = $('<div>').addClass('io-ox-xing submitted-data').append(
                        $('<p>').text(gt('Please select which of the following data we may use to create your %s account:', XING_NAME)),
                        $('<label>').append(
                            $.txt(gt('Mail address')),
                            email = $('<input>').attr({type: 'text', name: 'email'})
                        ),
                        $('<label>').append(
                            $.txt(gt('First name')),
                            firstname = $('<input>').attr({type: 'text', name: 'firstname'})
                        ),
                        $('<label>').append(
                            $.txt(gt('Last name')),
                            lastname = $('<input>').attr({type: 'text', name: 'lastname'})
                        ),
                        $('<label>').append(
                            $.txt(gt('Language')),
                            language = $('<select>').attr({name: 'language'}).append(
                                _.map(availableLangs, function (elem) { return $('<option>').val(elem).text(elem); })
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

            .addAlternativeButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
            .addSuccessButton('accepted', gt('Accept'), 'accepted', {tabIndex: '1'})

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
                    notifications.yell('success', gt('Your %s account has been created. Expect a confirmation mail from %s soon.', XING_NAME, XING_NAME));
                    notifications.yell('success', gt('The next step is allowing this system to access your %s account for you.', XING_NAME));
                    addXingAccount(event);
                });
            }
        );

    };

    addXingAccount = function (event) {
        var win = window.open(ox.base + '/busy.html', '_blank', 'height=400, width=600'),
            baton = event.data.baton;
        return $.when(
            keychain.createInteractively('xing', win))
        .then(function () {
            var model = baton.model;
            $(model.node).find('.setup-questions').remove();
            model.changed.props = baton.model.drawn = true; //hack to provoke loadAndPreview()
            ox.trigger('refresh^');
        });
    };

    statusUpdateForm = function () {
        var form = $('<div>').addClass('xing comment').append(
            $('<textarea>').attr({rows: 3, cols: 40}),
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

    makeNewsfeed = function (networkActivities, maxCount) {
        var node = $('<div>').addClass('networkActivities'),
            newsItemCount = 0;

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

            newsItemCount++;

            ext.point('io.ox/portal/widget/xing/activityhandler').each(function (handler) {
                if (handler.accepts(activity)) {
                    foundHandler = true;
                    handler.handle(activity).appendTo(activityNode);
                }
            });

            if (foundHandler) {
                // Date
                if (activity.created_at) {
                    var creationDate = new date.Local(activity.created_at);
                    dateNode.text(creationDate.format(date.DATE_TIME)).appendTo(activityNode);
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


            } else {
                console.log('Could not find a handler for the following activity: ' + activity.verb + '. Please let us know about this. Here is some data that would help us: ', JSON.stringify(activity));
            }

        });
        return node;
    };


    /*
     * Portal extension points: Here's where it all starts
     */
    point.extend({
        title: title,

        isEnabled: function () {
            return keychain.isEnabled('xing');
        },

        requiresCustomSetUp: function () {
            return keychain.isEnabled('xing') && !keychain.hasStandardAccount('xing');
        },

        performCustomSetUp: function (baton) {
            var node = baton.model.node,
                choiceMenu = $('<div>').addClass('setup-questions');

            choiceMenu.append(
                $('<div>').text(gt('Do you already have a %s account?', XING_NAME)),
                $('<a>').addClass('setup-action')
                    .text(gt('Allow us to use your %s account here', XING_NAME))
                    .on('click', {baton: baton}, addXingAccount),
                $('<div>').text(gt('Do you want to create a %s account?', XING_NAME)),
                $('<a>').addClass('setup-action').text(gt('Create a %s account using the data stored here', XING_NAME))
                    .on('click', {baton: baton}, createXingAccount)
            );
            $(node).addClass('content io-ox-xing').children('.decoration').append(choiceMenu);
        },

        load: function (baton) {
            return api.getUserfeed({
                    user_fields: '0,1,2,3,4,8,23' //name variations, page_name and picture
                }).then(function (xingResponse) {
//                    console.log('LOAD', JSON.stringify(xingResponse));
                    baton.data = xingResponse;
                });
        },

        preview: function (baton) {
            this.append(
                $('<div class="content preview io-ox-xing pointer">').append(
                    makeNewsfeed(baton.data.network_activities, MAX_ITEMS_PREVIEW)
                ).on('click', 'a.external.xing', function (e) { e.stopPropagation(); })
            );
        },

        draw: function (baton) {
            this.append(
                $('<div class="content io-ox-xing fullview">').append(
                    statusUpdateForm(),
                    $('<h2>').text(gt('Your %s newsfeed', XING_NAME)),
                    makeNewsfeed(baton.data.network_activities)
                )
            );
        },

        error: function (error, baton) {
            if (!point.invoke('requiresCustomSetUp')) {
                return;
            }
            var node = baton.model.node,
                title = node.find('.title').parent(),
                decoration = $('<div>').addClass('decoration').append(title);

            node.empty().append(decoration);
            point.invoke('performCustomSetUp', node, baton);
        }
    });

    ext.point('io.ox/portal/widget/xing/settings').extend({
        title: title,
        type: 'xing',
        editable: false,
        unique: true
    });

    new links.Action('io.ox/xing/actions/invite', {
        id: 'invite-xing',
        capabilities: 'xing',
        requires: function (e) {
            var contact = e.baton.data,
                arr = _.compact([contact.email1, contact.email2, contact.email3]),
                def = isAlreadyOnXing(arr).then(function (isPresent) {
                    return $.Deferred().resolve(!isPresent);
                });
            return def;
        },
        action: function (baton) {
            var contact = baton.data;
            api.invite({
                email: contact.email1 || contact.email2 || contact.email3
            })
            .fail(function (response) {
                notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
            })
            .done(function () {
                notifications.yell('success', gt('Invitation sent'));
            });
        }
    });

    new links.Action('io.ox/xing/actions/add', {
        id: 'add-on-xing',
        capabilities: 'xing',
        requires: function (e) {
            var contact = e.baton.data,
                arr = _.compact([contact.email1, contact.email2, contact.email3]),
                def = isAlreadyOnXing(arr);
            return def;
        },
        action: function (baton) {
            var contact = baton.data;
            api.initiateContactRequest({
                email: contact.email1 || contact.email2 || contact.email3
            })
            .fail(function (response) {
                notifications.yell('error', gt('There was a problem with %s. The error message was: "%s"', XING_NAME, response.error));
            })
            .done(function () {
                notifications.yell('success', gt('Contact request sent'));
            });
        }
    });

    /* invite to xing actions in toolbars */
    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'invite-contact-to-xing',
        index: 610,
        label: gt('Invite to %s', XING_NAME),
        ref: 'io.ox/xing/actions/invite'
    }));

    ext.point('io.ox/mail/all/actions').extend(new links.Link({
        id: 'invite-email-to-xing',
        index: 310, /* Preferably closely following 300, "invite to appointment" */
        label: gt('Invite to %s', XING_NAME),
        ref: 'io.ox/xing/actions/invite'
    }));

    ext.point('io.ox/contacts/classic-toolbar/links').extend(new links.Link({
        id: 'invite-contact-to-xing-classic',
        prio: 'lo',
        mobile: 'lo',
        label: gt('Invite to %s', XING_NAME),
        ref: 'io.ox/xing/actions/invite'
    }));

    /* add on xing actions in toolbars */
    ext.point('io.ox/contacts/links/inline').extend(new links.Link({
        id: 'add-on-xing-by-contact',
        index: 610, /* same index as 'invite to XING', because it is mutually exclusive */
        label: gt('Add on %s', XING_NAME),
        ref: 'io.ox/xing/actions/add'
    }));

    ext.point('io.ox/mail/all/actions').extend(new links.Link({
        id: 'add-on-xing-by-e-mail',
        index: 310, /* same index as 'invite to XING', because it is mutually exclusive */
        label: gt('Add on %s', XING_NAME),
        ref: 'io.ox/xing/actions/add'
    }));

    ext.point('io.ox/contacts/classic-toolbar/links').extend(new links.Link({
        id: 'add-on-xing-by-contact-classic',
        prio: 'lo',
        mobile: 'lo',
        label: gt('Add on %s', XING_NAME),
        ref: 'io.ox/xing/actions/add'
    }));


});
