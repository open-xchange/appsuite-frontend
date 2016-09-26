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
        if (!options.participants || options.participants.length < 1) {
            yell('info', gt('Please select at least one participant'));
            return;
        }
        var popup = new dialog({
                title: gt('Create distribution list'),
                async: true
            }),
            input = $('<input type="text" class="form-control">');

        popup.$body.append($('<label class="control-label scheduling-distribution-name-label">').text(gt('Name')).append(input), $('<label>').text(gt('Please note, that distribution lists cannot not contain ressources.')));
        popup.addCancelButton();
        popup.addButton({ label: options.label || gt('Create distibution list'), action: 'save' });
        popup.on('save', function () {
            if (input.val()) {
                require(['io.ox/contacts/api', 'io.ox/core/folder/util'], function (api, folderUtil) {
                    var participants = options.participants.map(function (model) {
                        // distribution lists may not contain ressources
                        if (model.get('type') === 3) {
                            return;
                        }
                        if (_.isNumber(model.getContactID())) {
                            return {
                                id: model.getContactID(),
                                folder_id: model.get('folder_id'),
                                display_name: model.getDisplayName(),
                                mail: model.getTarget(),
                                mail_field: model.getFieldNumber()
                            };
                        }
                        return {
                            display_name: model.getDisplayName(),
                            mail: model.getTarget(),
                            mail_field: 0
                        };
                    });
                    api.create({
                        display_name: input.val(),
                        folder_id: folderUtil.getDefaultFolder('contacts'),
                        mark_as_distributionlist: true,
                        distribution_list: _.compact(participants),
                        last_name: ''
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
