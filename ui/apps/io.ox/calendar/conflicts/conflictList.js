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
		drawConflicts: function (options) {
            if (!(options && options.$el && options.conflicts && options.model)) {
                throw "Please supply a '$el', 'conflicts' and 'model' option";
            }
            var def = $.Deferred();
            var conflicts = options.conflicts;
            var conflictList = $('<div>');
            require(["io.ox/core/tk/dialogs", "io.ox/calendar/view-grid-template"],
                function (dialogs, viewGrid) {
                    conflictList = viewGrid.drawSimpleGrid(conflicts);
                    new dialogs.SidePopup()
                        .delegate($(conflictList), ".vgrid-cell", function (popup, e, target) {
                            var data = target.data("appointment");
                            require(["io.ox/calendar/view-detail"], function (view) {
                                popup.append(view.draw(data));
                                data = null;
                            });
                        });

                    options.$el.append(
                        $('<h4 class="text-error">').text(gt('Conflicts detected')),
                        conflictList,
                        $('<div class="row">')
                            .css('margin-top', '10px').append(
                                $('<span class="span12">')
                                    .css('text-align', 'right').append(
                                        $('<a class="btn">')
                                            .text(gt('Cancel'))
                                            .on('click', function (e) {
                                                e.preventDefault();
                                                options.$el.empty();
                                                def.reject('cancel');
                                            }),
                                        '&nbsp;',
                                        $('<a class="btn btn-danger">')
                                            .addClass('btn')
                                            .text(gt('Ignore conflicts'))
                                            .on('click', function (e) {
                                                e.preventDefault();
                                                options.model.set('ignore_conflicts', true);
                                                options.model.save();
                                                def.resolve('ignore');
                                            })
                                        )
                                )
                        );
                }
                );

            return def;
        }
	};
});
