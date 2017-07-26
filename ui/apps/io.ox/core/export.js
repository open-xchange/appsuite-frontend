/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/core/export', [
    'io.ox/backbone/views/modal',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/download',
    'gettext!io.ox/core'
], function (ModalDialog, miniViews, download, gt) {

    'use strict';

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
                title: params.folder ? gt('Export folder') : gt('Export selected'),
                model: new Backbone.Model(),
                // custom
                module: module,
                params: params

            }).inject({
                getFormats: function () {
                    var list = [];
                    switch (this.options.module) {
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
            }).extend({
                default: function () {
                    this.$el.addClass('export-dialog')
                            .find('.modal-content').css('height', 'initial');
                },
                format: function () {
                    var list = this.getFormats();

                    if (!list.length) return this.$body.append(gt('No export format available'));

                    // preselect
                    this.model.set('format', _.first(list).value);

                    this.$body.append(
                        $('<label>').append(
                            $.txt(gt('Format')),
                            new miniViews.RadioView({
                                model: this.model,
                                name: 'format',
                                list: list
                            }).render().$el
                        )
                    );
                },
                'distribution-lists': function () {
                    if (this.options.module !== 'contacts') return;

                    // preselect
                    this.model.set('include', true);

                    this.$body.append(
                        new miniViews.CustomCheckboxView({ name: 'include', model: this.model, label: gt('Include distribution lists') }).render().$el
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
