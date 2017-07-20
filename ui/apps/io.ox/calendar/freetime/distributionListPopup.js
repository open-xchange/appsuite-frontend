/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/calendar/freetime/distributionListPopup', [
    'gettext!io.ox/calendar',
    'io.ox/backbone/views/modal',
    'io.ox/core/yell',
    'less!io.ox/calendar/freetime/style',
    'less!io.ox/calendar/style'
], function (gt, dialog, yell) {

    'use strict';

    var showDialog = function (options) {
        options = options || {};
        if (!options.attendees || options.attendees.length < 1) {
            yell('info', gt('Please select at least one participant'));
            return;
        }
        var popup = new dialog({
                title: gt('Create distribution list'),
                async: true
            }),
            guid = _.uniqueId('form-control-label-'),
            input = $('<input type="text" class="form-control">').attr('id', guid);

        popup.$body.append($('<label class="control-label scheduling-distribution-name-label">').attr('for', guid).text(gt('Name')).append(input),
            $('<div class="help-block">').text(gt('Please note that distribution lists cannot contain ressources.')));
        popup.addCancelButton();
        popup.addButton({ label: options.label || gt('Create distibution list'), action: 'save' });
        popup.on('save', function () {
            if (input.val()) {
                require(['io.ox/contacts/api', 'io.ox/core/folder/util'], function (api, folderUtil) {
                    var attendees = options.attendees.map(function (item) {
                        // distribution lists may not contain resources
                        if (item.get('cuType') === 'RESOURCE') {
                            return;
                        }
                        if (item.get('contactInformation')) {
                            return {
                                id: item.get('contactInformation').contact_id,
                                folder_id: item.get('contactInformation').folder,
                                display_name: item.get('cn'),
                                mail: item.get('email'),
                                mail_field: 1
                            };
                        }
                        return {
                            display_name: item.get('cn'),
                            mail: item.get('email'),
                            mail_field: 0
                        };
                    });
                    api.create({
                        display_name: input.val(),
                        folder_id: folderUtil.getDefaultFolder('contacts'),
                        mark_as_distributionlist: true,
                        distribution_list: _.compact(attendees)
                    }).done(function () {
                        yell('success', gt('Distribution list has been saved'));
                    }).fail(function (error) {
                        yell(error);
                    });
                    // don't wait for the save
                    popup.close();
                });
            } else {
                yell('info', gt('Please enter a name for the distribution list'));
                popup.idle();
            }
        });
        popup.open();
        input.focus();
    };

    return {
        showDialog: showDialog
    };
});
