/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2011
 * Mail: info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/tasks/edit/util', ['gettext!io.ox/tasks',
                                'io.ox/core/strings'], function (gt, strings) {
    'use strict';

    var util = {
        buildLabel: function (text, id) {
            return $('<label>').text(text).addClass('task-edit-label').attr('for', id);
        },
        //build progressField and buttongroup
        buildProgress: function () {
            var progress = $('<input>').attr({type: 'text', id: 'task-edit-progress-field', tabindex: 1}).val('0')
                .addClass('span6 progress-field');

            $('<div>').addClass('input-append').append(progress,
                    $('<button tabindex="1">').attr('data-action', 'minus').addClass('span3 btn fluid-grid-fix').append($('<i>').addClass('icon-minus'))
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
                    $('<button tabindex="1">').attr('data-action', 'plus').addClass('span3 btn fluid-grid-fix').append($('<i>').addClass('icon-plus'))
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

            return progress;
        },
        buildExtensionRow: function (parent, extensions, baton) {
            var row = $('<div>').addClass('row-fluid task-edit-row').appendTo(parent);
            for (var i = 0; i < extensions.length; i++) {
                if (!(_.isArray(extensions[i]))) { //check for true extensionpoint
                    extensions[i].invoke('draw', row, baton);
                } else { //its a normal node
                    $('<div>').addClass('span' + extensions[i][1]).append(extensions[i][0]).appendTo(row);
                }
            }
            //find labels and make them focus the inputfield
            row.find('label').each(function (label) {
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

        //Tabs
        buildTabs: function (tabs, uid) {//uid is important so tabs dont change tabs in other apps
            var table = $('<ul>').addClass('nav nav-tabs'),
                content = $('<div>').addClass('tab-content');
            for (var i = 0; i < tabs.length; i++) {
                $('<li>').css('width', '33%')
                    .append($('<a>').addClass('tab-link').css('text-align', 'center')
                        .attr({tabindex: 1, href: '#edit-task-tab' + [i] + uid, 'data-toggle': 'tab'}).text(tabs[i])).appendTo(table);
            }
            for (var i = 0; i < tabs.length; i++) {
                $('<div>').attr('id', 'edit-task-tab' + [i] + uid).addClass('tab-pane').appendTo(content);
            }
            table.find('li :first').addClass('active');
            content.find('div :first').addClass('active');
            return {table: table, content: content};
        },

        buildAttachmentNode: function (node, attachments) {
            var tempNodes = [];
            node.empty();
            for (var i = 0; i < attachments.length; i++) {
                tempNodes.push([$('<i>').addClass('icon-remove task-remove-attachment').attr('lnr', i),
                                $('<i>').addClass('icon-paper-clip'),
                                $('<div>').text(_.noI18n(attachments[i].name)).addClass('task-attachment-name'),
                                $('<div>').text(_.noI18n(strings.fileSize(attachments[i].size))).addClass('task-attachment-filesize')]);
            }
            //check if we have an odd number of attachments
            if (tempNodes.length !== 0 && tempNodes.length % 2 !== 0) {
                tempNodes.push({});
            }

            for (var i = 0; i < tempNodes.length; i += 2) {
                this.buildRow(node, [tempNodes[i], tempNodes[i + 1]], [6, 6], false);
            }
        },

        buildConfirmationPopup: function (model, dialogs, isArray) {
            //build popup
            var popup = new dialogs.ModalDialog()
                .addPrimaryButton('ChangeConfState', gt('Change state'))
                .addButton('cancel', gt('Cancel')),
                body = popup.getBody(),
                title,
                note,
                message,
                state;

            if (isArray) {//if model is actually an array with attributes it should work too but needs parameter or script stops working without notice...strange
                title = model.title || '\u2014';
                note  = model.note || '\u2014';
            } else {
                title = model.get("title") || '\u2014';
                note  = model.get("note") || '\u2014';
            }

            body.append($("<h4>").text(_.noI18n(title)),
                        $('<div>').text(_.noI18n(note)).css({color: '#888', 'margin-bottom': '5px'}));
            util.buildRow(body, [[util.buildLabel(gt("Confirmation status", "confStateInput")),
                        state = $('<select class="stateselect" data-action="selector">').attr("id", "confStateInput").append(
                        $('<option>').text(gt('Confirm')),
                        $('<option>').text(gt('Decline')),
                        $('<option>').text(gt('Tentative')))],
                        [util.buildLabel(gt("Confirmation message", "confMessageInput")), message = $('<input>')
                             .attr({type: 'text', id: "confMessageInput"})]]);
            return {popup: popup, state: state, message: message};
        }
    };

    return util;
});
