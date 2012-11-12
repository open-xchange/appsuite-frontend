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

define('io.ox/calendar/conflicts/conflictList', ['io.ox/core/extensions', 'gettext!io.ox/calendar/conflicts/conflicts'], function (ext, gt) {
	'use strict';

	return {
        drawList: function (conflicts) {
            var conflictList = $('<div>');
            conflictList.append($('<h4 class="text-error">').text(gt('Conflicts detected')));

            require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-grid-template"],
                function (dialogs, viewGrid) {
                    conflictList.append(viewGrid.drawSimpleGrid(conflicts));
                    new dialogs.SidePopup()
                        .delegate(conflictList, ".vgrid-cell", function (popup, e, target) {
                            var data = target.data("appointment");
                            require(["io.ox/calendar/view-detail"], function (view) {
                                popup.append(view.draw(data));
                                data = null;
                            });
                        });
                }
            );
            return conflictList;
        }
	};
});
