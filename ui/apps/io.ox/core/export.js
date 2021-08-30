/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/export', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/download',
    'gettext!io.ox/core'
], function (ModalDialog, miniViews, download, gt) {

    'use strict';

    function getFormats(module) {
        var list = [];
        switch (module) {
            case 'calendar':
            case 'tasks':
                list.push({ value: 'ical', label: gt('iCalendar') });
                break;
            case 'contacts':
                list.push({ value: 'vcard', label: gt('vCard') });
                list.push({ value: 'csv', label: gt('CSV') });
                break;
            default:
                break;
        }
        return list;
    }

    var references = {
        'calendar': 'ox.appsuite.user.sect.calendar.manage.export.html',
        'contacts': 'ox.appsuite.user.sect.contacts.manage.export.html',
        'tasks':    'ox.appsuite.user.sect.tasks.manage.export.html'
    };

    return {

        /**
        * params:
        * - folder OR
        * - list of { id, folder_id }
        */

        open: function (module, params) {

            return new ModalDialog({
                enter: false,
                maximize: 500,
                point: 'io.ox/core/export',
                title: params.folder ? gt('Export folder') : /*#. export selected items (folders), title of a dialog */gt('Export selected'),
                model: new Backbone.Model(),
                // custom
                module: module,
                params: params,
                help: references[module]
            }).extend({
                'setup': function (baton) {
                    // apply default value
                    baton.formats = getFormats(this.options.module);
                    this.model.set('format', (_.first(baton.formats) || {}).value);
                    // apply visuals
                    this.$el.addClass('export-dialog')
                            .find('.modal-content').css('height', 'auto');
                },
                'single-format': function (baton) {
                    if (baton.formats.length !== 1) return;

                    // informative
                    this.$body.append(
                        $('<p>').append(
                            //#. Warning dialog
                            //#. %1$s is file format for data export
                            gt('Format: %1$s', _.first(baton.formats).label)
                        )
                    );
                },
                'multi-format': function (baton) {
                    if (baton.formats.length < 2) return;
                    // options
                    this.$body.append(
                        $('<fieldset>').append(
                            $('<legend class="simple">').append(
                                //#. file format for data export
                                $.txt(gt('Format')),
                                new miniViews.CustomRadioView({
                                    model: this.model,
                                    name: 'format',
                                    list: baton.formats
                                }).render().$el
                            )
                        )
                    );
                },
                'missing-format': function (baton) {
                    if (baton.formats.length) return;
                    this.$body.append(gt('No export format available'));
                    this.$footer.find('button[data-action="export"]')
                        .attr('disabled', true)
                        .addClass('disabled');
                },
                'distribution-lists': function () {
                    if (this.options.module !== 'contacts') return;

                    // preselect
                    this.model.set('include', true);

                    // hide option in case exclusively distributions lists are selected
                    var singleContacts = _(this.options.params.list).filter(function (obj) { return !obj.mark_as_distributionlist; });
                    if (!this.options.params.folder && !singleContacts.length) return;

                    this.$body.append(
                        new miniViews.CustomCheckboxView({
                            name: 'include',
                            model: this.model,
                            label: gt('Include distribution lists')
                        }).render().$el
                    );

                },
                'inital-focus': function () {
                    this.options.focus = this.$body.find('input').length > 1 ? 'input:first' : '.btn-primary';
                }
            }).on({
                'export': function () {
                    var params = _.extend({}, this.options.params, this.model.toJSON());
                    download.exported(params);
                }
            })
            .addCancelButton()
            .addButton({ label: gt('Export'), action: 'export' })
            .open();
        }
    };
});
