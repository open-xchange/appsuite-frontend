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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/tasks/settings/pane', [
    'settings!io.ox/tasks',
    'io.ox/core/extensions',
    'io.ox/core/settings/util',
    'gettext!io.ox/tasks'
], function (settings, ext, util, gt) {

    'use strict';

    var POINT = 'io.ox/tasks/settings/detail';

    settings.on('change', function () {
        settings.saveAndYell();
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'taskssettings',
        draw: function () {
            var holder = $('<div class="io-ox-tasks-settings">');
            this.append(holder);
            ext.point(POINT + '/pane').invoke('draw', holder);
        }

    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(util.header(gt.pgettext('app', 'Tasks')));
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'notifications',
        draw: function () {
            this.append(
                util.fieldset(gt('Email notifications'),
                    util.checkbox('notifyNewModifiedDeleted', gt('Receive notifications when a task in which you participate is created, modified or deleted'), settings),
                    util.checkbox('notifyAcceptedDeclinedAsCreator', gt('Receive notifications when a participant accepted or declined a task created by you'), settings),
                    util.checkbox('notifyAcceptedDeclinedAsParticipant', gt('Receive notifications when a participant accepted or declined a task in which you participate'), settings)
                )
            );
        }
    });

});
