/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/export/export',
    ['io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/core/api/export',
     'io.ox/core/api/folder',
     'io.ox/core/notifications',
     'io.ox/formats/vcard',
     'gettext!io.ox/core'
    ], function (ext, dialogs, api, folderAPI, notifications, vcard, gt) {

    'use strict';

    /**
     * @description header: title
     */
    ext.point('io.ox/core/export/export/title').extend({
        id: 'default',
        draw: function () {
            this.append(
                $('<h4>').text(gt('Export folder'))
            );
        }
    });

    /**
     * @description body: select
     */
    ext.point('io.ox/core/export/export/select').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {

            this.append(
                $('<label>').append(
                    $.txt(gt('Format')),
                    $('<br>'),
                    baton.$.select = $('<select tabindex="1" aria-label="' + gt('select format') + '">')
                )
            );

            // add options
            ext.point('io.ox/core/export/export/format').invoke('draw', baton.$.select, baton);
        }
    });

    function toggle(type) {
        var note = this.find('.alert'), label = this.find('.include_distribution_lists');
        if (type === 'csv') {
            note.hide();
            label.show();
        } else {
            note.show();
            label.hide();
        }
    }

    ext.point('io.ox/core/export/export/select').extend({
        id: 'checkbox',
        index: 200,
        draw: function (baton) {

            if (baton.module !== 'contacts') return;

            this.append(
                $('<div class="alert alert-info">').hide().text(
                    gt('Note: The vCard format cannot contain distribution lists')
                ),
                // checkbox
                $('<label class="checkbox include_distribution_lists">').append(
                    baton.$.include = $('<input type="checkbox" name="include_distribution_lists" checked="checked">'),
                    $.txt(gt('Include distribution lists'))
                )
            );

            this.find('select').on('change', function () {
                toggle.call($(this).closest('.modal-body'), $(this).val());
            });

            toggle.call(this, this.find('select').val());
        }
    });

    /**
     * @description footer: buttons
     */
    ext.point('io.ox/core/export/export/buttons').extend({
        id: 'default',
        draw: function () {
            this
                .addPrimaryButton('export', gt('Export'), 'export', { 'tabIndex': '1' })
                .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' });
        }
    });

    /**
     * @description format: csv
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'csv',
        index: 100,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.csv = { getDeferred: function () { return api.getCSV(baton.id, baton.simulate); } };
                this.append(
                    $('<option value="csv">CSV</option>')
                );
            }
        }
    });

    /**
     * @description format: vcard
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'vcard',
        index: 200,
        draw: function (baton) {
            if (baton.module === 'contacts') {
                baton.format.vcard = { getDeferred: function () { return api.getVCARD(baton.id, baton.simulate); } };
                this.append(
                    $('<option value="vcard">vCard</option>')
                );
            }
        }
    });

    /**
     * @description format: ical
     */
    ext.point('io.ox/core/export/export/format').extend({
        id: 'ical',
        index: 400,
        draw: function (baton) {
            if (baton.module === 'calendar' || baton.module === 'tasks') {
                baton.format.ical = { getDeferred: function () { return api.getICAL(baton.id, baton.simulate); } };
                this.append(
                    $('<option value="ical">iCalendar</option>')
                );
            }
        }
    });

    return {
        show: function (module, id) {
            var id = String(id),
                dialog = new dialogs.ModalDialog({ width: 500 }),
                baton = new ext.Baton({id: id, module: module, simulate: true, format: {} });
            // get folder and build dialog
            folderAPI.get({ folder: id}).done(function () {
                dialog
                    .build(function () {
                        //header
                        ext.point('io.ox/core/export/export/title').invoke('draw', this.getHeader(), id, 'Export');
                        //body
                        ext.point('io.ox/core/export/export/select').invoke('draw', this.getContentNode(), baton);
                        //buttons
                        ext.point('io.ox/core/export/export/buttons').invoke('draw', this);
                        //apply style
                        this.getPopup().addClass('export-dialog');
                    })
                    .show(function () {
                        //focus
                        this.find('select').focus();
                    })
                    .done(function (action) {
                        if (action === 'export') {
                            var id = baton.$.select.val() || '',
                                include = F.include.prop('checked') || false,
                                def = baton.format[id].getDeferred() || $.when();
                            def.done(function (data) {
                                if (data) {
                                    window.location.href = data + '&export_dlists=' + include + '&content_disposition=attachment';
                                }
                            })
                            .fail(function (obj) {
                                notifications.yell('error', obj && obj.error || gt('An unknown error occurred'));
                            });
                        } else {
                            dialog = null;
                        }
                    });
            });
        }
    };

});
