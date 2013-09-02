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

define('io.ox/calendar/conflicts/conflictList',
    ['gettext!io.ox/calendar/conflicts/conflicts'], function (gt) {

    'use strict';

    return {
        drawList: function (conflicts) {
            var conflictList = $('<div>').append(
                $('<h4 class="text-error">').text(gt('Conflicts detected'))
            );
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-grid-template', 'io.ox/calendar/api']).done(
                function (dialogs, viewGrid, calAPI) {
                    _.map(conflicts, function (c) { c.conflict = true; });
                    conflictList.append(viewGrid.drawSimpleGrid(conflicts));
                    $(".vgrid-cell", conflictList).on('click', function (e) {
                        calAPI.get($(this).data("appointment")).done(function (data) {
                            // check if private
                            if (!data.private_flag || ox.user_id === data.created_by) {
                                require(["io.ox/calendar/view-detail"], function (view) {
                                    new dialogs.SidePopup().show(e, function (popup) {
                                        popup.append(view.draw(data));
                                        data = null;
                                    });
                                });
                            }
                        });
                    });
                }
            );
            return conflictList;
        }
    };
});
