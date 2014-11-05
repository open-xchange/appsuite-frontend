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
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/util', ['gettext!io.ox/tasks'], function (gt) {

    'use strict';

    var util = {
        splitExtensionsByRow: function (extensions, rows) {
            _(extensions).each(function (extension) {
                //seperate extensions with rows
                if (extension.row) {
                    if (!rows[extension.row]) {
                        rows[extension.row] = [];
                    }
                    rows[extension.row].push(extension);
                } else {
                    //rest is used for extension points without row
                    if (!rows.rest) {
                        rows.rest = [];
                    }
                    rows.rest.push(extension);
                }
            });
        },
        //build progressField and buttongroup
        buildProgress: function (val) {
            var val = val || 0,
                progress = $('<input class="form-control progress-field">').attr({type: 'text', id: 'task-edit-progress-field', tabindex: 1}).val(val),
                wrapper = $('<div class="input-group">').append(
                    progress,
                    $('<div class="input-group-btn">').append(
                        $('<button type="button" tabindex="1" class="btn btn-default" data-action="minus">').append(
                            $('<i class="fa fa-minus" aria-hidden="true">'),
                            $('<span class="sr-only">').text(gt('Minus'))
                        )
                        .on('click', function () {
                            var temp = parseInt(progress.val(), 10);
                            temp -= 25;
                            if (temp < 0) {
                                temp = 0;
                            }
                            if (temp !== parseInt(progress.val(), 10)) {
                                progress.val(temp);
                                progress.trigger('change');
                            }
                        }),
                        $('<button type="button" tabindex="1" class="btn btn-default" data-action="plus">').append(
                            $('<i class="fa fa-plus" aria-hidden="true">'),
                            $('<span class="sr-only">').text(gt('Plus'))
                        )
                        .on('click', function () {
                            var temp = parseInt(progress.val(), 10);
                            temp += 25;
                            if (temp > 100) {
                                temp = 100;
                            }
                            if (temp !== parseInt(progress.val(), 10)) {
                                progress.val(temp);
                                progress.trigger('change');
                            }
                        })
                    )
                );

            return {progress: progress, wrapper: wrapper};
        },
        buildExtensionRow: function (parent, extensions, baton) {
            var row = $('<div class="row">').appendTo(parent);
            for (var i = 0; i < extensions.length; i++) {
                extensions[i].invoke('draw', row, baton);
            }
            //find labels and make them focus the inputfield
            /*row.find('label').each(function () {
                if (this) {
                    $(this).attr('for', $(this).next().attr('id'));
                }
            });*/
            return row;
        },
        buildRow: function (parent, nodes, widths, fillGrid) {

            //check for impossible number of rows to avoid dividing by 0 or overflowing rows
            if (!nodes || nodes.length === 0 || nodes.length > 12) {
                return;
            }

            //check for valid widths
            if (!widths || nodes.length !== widths.length) {
                var temp = 12 / nodes.length;
                //we don't want floats
                temp = parseInt(temp, 10);
                widths = [];
                for (var i = 0; i < nodes.length; i++) {
                    widths.push(temp);
                }
            }

            var row = $('<div class="row">').appendTo(parent);
            for (var i = 0; i < nodes.length; i++) {
                if (_.isArray(widths[i])) {
                    $('<div>').addClass('span' + widths[i][0] + ' offset' + widths[i][1]).append(nodes[i]).appendTo(row);
                } else {
                    $('<div>').addClass('span' + widths[i]).append(nodes[i]).appendTo(row);
                }
            }

            //fillout gridCells
            if (fillGrid || fillGrid === undefined) {
                row.children().children().not('label').addClass('col-md-12');
            }
        }
    };

    return util;
});
