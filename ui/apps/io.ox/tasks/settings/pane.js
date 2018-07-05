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
    'io.ox/backbone/views/extensible',
    'settings!io.ox/tasks',
    'io.ox/core/extensions',
    'io.ox/core/settings/util',
    'gettext!io.ox/tasks'
], function (ExtensibleView, settings, ext, util, gt) {

    'use strict';

    settings.on('change', function () {
        settings.saveAndYell();
    });

    ext.point('io.ox/tasks/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/tasks/settings/detail/view', model: settings })
                .render().$el
            );
        }
    });

    ext.point('io.ox/tasks/settings/detail/view').extend(
        {
            id: 'header',
            index: 100,
            render: function () {
                this.$el.addClass('io-ox-tasks-settings').append(
                    util.header(gt.pgettext('app', 'Tasks'))
                );
            }
        },
        {
            id: 'notifications',
            index: 200,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Email notifications'),
                        util.checkbox('notifyNewModifiedDeleted', gt('Receive notifications when a task in which you participate is created, modified or deleted'), settings),
                        util.checkbox('notifyAcceptedDeclinedAsCreator', gt('Receive notifications when a participant accepted or declined a task created by you'), settings),
                        util.checkbox('notifyAcceptedDeclinedAsParticipant', gt('Receive notifications when a participant accepted or declined a task in which you participate'), settings)
                    )
                );
            }
        }
    );
});
