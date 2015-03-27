/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/invite', [
    'settings!io.ox/core',
    'io.ox/mail/util',
    'io.ox/contacts/api'
], function (coreConfig, util, contactAPI) {

    'use strict';

    return function (baton) {
        var data = baton.data,
            collectedRecipients = [],
            participantsArray = [],
            currentId = ox.user_id,
            currentFolder = coreConfig.get('folder/calendar'),
            collectedRecipientsArray = data.to.concat(data.cc).concat(data.from),
            dev = $.Deferred(),
            lengthValue,
            createCalendarApp = function (participants, notetext) {
                require(['io.ox/calendar/edit/main'], function (m) {
                    m.getApp().launch().done(function () {
                        //remove participants received mail via msisdn
                        participants = _.filter(participants, function (participant) {
                            if (participant.mail)
                                return util.getChannel(participant.mail, false) !== 'phone';
                            return true;
                        });
                        var initData = { participants: participants, title: notetext, folder_id: currentFolder };
                        this.create(initData);
                        // to set Dirty
                        this.model.toSync = initData;
                    });
                });
            };

        _(collectedRecipientsArray).each(function (single) {
            collectedRecipients.push(single[1]);
        });

        lengthValue = collectedRecipients.length;

        _(collectedRecipients).each(function (mail) {
            contactAPI.search(mail).done(function (obj) {
                var currentObj = (obj[0]) ? obj[0] : { email1: mail, display_name: mail },
                    internalUser = { id: currentObj.internal_userid, type: 1 },
                    externalUser = { type: 5, display_name: currentObj.display_name, mail: currentObj.email1 };

                if (currentObj.internal_userid !== currentId) {
                    if (currentObj.internal_userid !== undefined && currentObj.internal_userid !== 0) {
                        participantsArray.push(internalUser);
                    } else if (currentObj.internal_userid === 0) {
                        participantsArray.push(externalUser);
                    } else {
                        participantsArray.push(externalUser);
                    }
                } else {
                    lengthValue = lengthValue - 1;
                }

                if (participantsArray.length === lengthValue) {
                    dev.resolve();
                }
            });
        });

        dev.done(function () {
            createCalendarApp(participantsArray, data.subject);
        });
    };
});
