/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/contacts/actions/print', [
    'io.ox/core/extensions',
    'io.ox/backbone/mini-views',
    'gettext!io.ox/contacts',
    'io.ox/core/print',
    'settings!io.ox/contacts'
], function (ext, mini, gt, print, settings) {

    'use strict';

    var map = {
        'simple': 'io.ox/contacts/print',
        'details': 'io.ox/contacts/print-details'
    };

    ext.point('io.ox/contacts/actions/print/dialog').extend({
        id: 'preview',
        index: 100,
        render: function (baton) {
            var $preview, def = new $.Deferred();
            this.$body.append(
                $('<div class="col-xs-offset-1 col-xs-6">').append(
                    $preview = $('<iframe aria-hidden="true">')
                    .attr({
                        title: gt('Print preview'),
                        src: ox.base + '/print.html'
                    }).on('load', def.resolve)
                ),
                $('<div class="col-xs-5">').append(
                    $('<fieldset>').append(
                        $('<legend class="sr-only">').attr('aria-labelledby', this.$el.attr('aria-labelledby')),
                        new mini.CustomRadioView({
                            model: this.model,
                            name: 'list-type',
                            list: [{
                                value: 'simple',
                                label: gt('Phone list')
                            }, {
                                value: 'details',
                                //#. the user selects, whether to print a simple phonelist or a detailed contact list.
                                label: gt.pgettext('contact-print-dialog', 'Details')
                            }]
                        }).render().$el
                    )
                )
            );

            // add scaling info to body of iframe, as soon as iframe has been loaded
            def.done(function () {
                $preview.contents().find('body').addClass('scaled-preview');
            });

            this.listenTo(this.model, 'change:list-type', function () {
                var printFile = map[this.model.get('list-type')] || 'io.ox/contacts/print';
                $.when(require([printFile]), def).done(function (print) {
                    var options = print.getOptions(baton.view.options.list),
                        template = $preview.contents().find(options.selector).html(),
                        body = $preview.contents().find('body');
                    $.when.apply($,
                        _.chain(options.selection)
                        .map(function getCID(obj) {
                            return _.isString(obj) ? obj : _.cid(obj);
                        })
                        .uniq()
                        .map(function getData(cid, index) {
                            return options.get(_.cid(cid)).then(function (obj) {
                                return options.process ? options.process(obj, index, options) : obj;
                            });
                        })
                        .value()
                    )
                    .done(function () {
                        var args = _.chain(arguments).toArray(), all = args.value().length;
                        if (options.filter) args = args.filter(options.filter);
                        if (options.sortBy) args = args.sortBy(options.sortBy);
                        // stop chaining
                        args = args.value();

                        body.find('.print-wrapper').remove();
                        body.prepend($('<div class="print-wrapper">' + $.trim(_.template(template)({
                            data: args,
                            i18n: options.i18n,
                            length: args.length,
                            filtered: all - args.length
                        })) + '</div>'));
                        // remove notes in preview
                        body.find('.note').remove();
                    });
                });
            });
        }
    });

    return {
        multiple: function (list) {
            require(['io.ox/backbone/views/modal'], function (ModalDialogView) {
                new ModalDialogView({
                    model: new Backbone.Model({ 'list-type': settings.get('contactsPrintLayout') }),
                    title: gt('Select print layout'),
                    point: 'io.ox/contacts/actions/print/dialog',
                    list: _(list).first(40)
                })
                .build(function () {
                    this.$el.addClass('io-ox-contact-print-dialog');
                })
                .addCancelButton()
                .addButton({ label: gt('Print'), action: 'print' })
                .on('print', function () {
                    var printFile = map[this.model.get('list-type')] || 'io.ox/contacts/print';
                    print.request(printFile, list);
                    if (this.model.get('list-type') !== settings.get('contactsPrintLayout')) {
                        settings.set('contactsPrintLayout', this.model.get('list-type')).save();
                    }
                })
                .on('open', function () {
                    // trigger a change list on open to set the initial content of the iframe
                    // must be triggered, when the iframe is already in the dom
                    this.model.trigger('change:list-type');
                })
                .open();
            });
        }
    };

});
