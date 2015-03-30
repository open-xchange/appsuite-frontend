/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/calendar/conflicts/conflictList', ['gettext!io.ox/calendar/conflicts/conflicts'], function (gt) {

    'use strict';

    return {

        drawHeader: function () {
            return $('<h4 class="text-error">').text(gt('Conflicts detected'));
        },

        drawList: function (conflicts, dialog) {
            var conflictList = $('<ul class="list-unstyled">');
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-grid-template', 'io.ox/calendar/api']).done(
                function (dialogs, viewGrid, calAPI) {
                    _.map(conflicts, function (c) { c.conflict = true; });
                    conflictList.append(viewGrid.drawSimpleGrid(conflicts).children());
                    if (dialog) {
                        dialog.resizeBody();
                    }
                    $('.vgrid-cell', conflictList).on('click', function (e) {
                        if ($(this).data('appointment').folder_id) {
                            //conflicts with appointments, where you aren't a participant don't have a folder_id.
                            calAPI.get($(this).data('appointment')).done(function (data) {
                                // check if private
                                if (!data.private_flag || ox.user_id === data.created_by) {
                                    require(['io.ox/calendar/view-detail'], function (view) {
                                        var sidePopup = new dialogs.SidePopup({ modal: true, tabTrap: true }).show(e, function (popup) {
                                            popup.append(view.draw(data));
                                            data = null;
                                        });
                                        sidePopup.on('show', function () {
                                            this.nodes.target.find('.io-ox-sidepopup').find('[data-action="edit"]').first().focus();
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            );
            return conflictList;
        }
    };
});
