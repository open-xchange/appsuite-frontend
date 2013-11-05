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
        splitExtensionsByRow: function (extensions, rows, ignoreTabs) {
            _(extensions).each(function (extension) {
                if (!(extension.tab && ignoreTabs)) {//ignoreTabs if parameter is set(handled separately)
                    if (extension.row) {//seperate extensions with rows
                        if (!rows[extension.row]) {
                            rows[extension.row] = [];
                        }
                        rows[extension.row].push(extension);
                    } else {//all the rest
                        if (!rows.rest) {//rest is used for extension points without row
                            rows.rest = [];
                        }
                        rows.rest.push(extension);
                    }
                }
            });
        },
        buildLabel: function (text, id) {
            return $('<label>').text(text).addClass('task-edit-label').attr('for', id);
        },
        //build progressField and buttongroup
        buildProgress: function (val) {
            var val = val || 0,
                progress = $('<input>').attr({type: 'text', id: 'task-edit-progress-field', tabindex: 1}).val(val)
                .addClass('span6 progress-field'),

                wrapper = $('<div>').addClass('input-append').append(progress,
                    $('<button type="button" tabindex="1">').attr('data-action', 'minus').addClass('span3 btn fluid-grid-fix').append($('<i>').addClass('icon-minus'))
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
                    $('<button type="button" tabindex="1">').attr('data-action', 'plus').addClass('span3 btn fluid-grid-fix').append($('<i>').addClass('icon-plus'))
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
                    );

            return {progress: progress, wrapper: wrapper};
        },
        buildExtensionRow: function (parent, extensions, baton) {
            var row = $('<div class="row-fluid task-edit-row">').appendTo(parent);
            for (var i = 0; i < extensions.length; i++) {
                extensions[i].invoke('draw', row, baton);
            }
            //find labels and make them focus the inputfield
            row.find('label').each(function () {
                if (this) {
                    $(this).attr('for', $(this).next().attr('id'));
                }
            });
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
                temp = parseInt(temp, 10); //we don't want floats
                widths = [];
                for (var i = 0; i < nodes.length; i++) {
                    widths.push(temp);
                }
            }

            var row = $('<div>').addClass('row-fluid task-edit-row').appendTo(parent);
            for (var i = 0; i < nodes.length; i++) {
                if (_.isArray(widths[i])) {
                    $('<div>').addClass('span' + widths[i][0] + ' offset' + widths[i][1]).append(nodes[i]).appendTo(row);
                } else {
                    $('<div>').addClass('span' + widths[i]).append(nodes[i]).appendTo(row);
                }
            }

            //fillout gridCells
            if (fillGrid || fillGrid === undefined) {
                row.children().children().not('label').addClass('span12');
            }
        },

        buildConfirmationPopup: function (model, dialogs, isArray) {
            //build popup
            var popup = new dialogs.ModalDialog({tabTrap: true})
                .addPrimaryButton('ChangeConfState', gt('Change state'), 'ChangeConfState', {tabIndex: '1'})
                .addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'}),
                body = popup.getBody(),
                title,
                note,
                message,
                state;

            if (isArray) {//if model is actually an array with attributes it should work too but needs parameter or script stops working without notice...strange
                title = model.title || '\u2014';
                note  = model.note || '\u2014';
            } else {
                title = model.get('title') || '\u2014';
                note  = model.get('note') || '\u2014';
            }

            body.append($('<h4>').text(_.noI18n(title)),
                        $('<div>').text(_.noI18n(note)).css({color: '#888', 'margin-bottom': '5px'}));
            util.buildRow(body, [[util.buildLabel(gt('Confirmation status', 'confStateInput')),
                        state = $('<select class="stateselect" data-action="selector">').attr('id', 'confStateInput').append(
                        $('<option>').text(gt('Confirm')),
                        $('<option>').text(gt('Decline')),
                        $('<option>').text(gt('Tentative')))],
                        [util.buildLabel(gt('Confirmation message', 'confMessageInput')), message = $('<input>')
                             .attr({type: 'text', id: 'confMessageInput'})]]);
            return {popup: popup, state: state, message: message};
        }
    };

    return util;
});
