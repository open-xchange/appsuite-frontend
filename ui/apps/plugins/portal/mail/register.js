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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/mail/register',
    ['io.ox/core/extensions'], function (ext, api) {

    'use strict';

    // actions
    ext.point('io.ox/portal/widget/mail/actions/compose').extend({
        id: 'compose',
        action: function (data) {
            require(['io.ox/mail/write/main'], function (m) {
                m.getApp().launch().done(function () {
                    this.compose();
                });
            });
        }
    });

    // link
    ext.point('io.ox/portal/widget/mail/links/inline').extend(new ext.Link({
        index: 100,
        id: 'compose',
        label: 'Compose new email',
        ref: 'io.ox/portal/widget/mail/actions/compose'
    }));

    // inline links
    ext.point('io.ox/portal/widget/mail').extend(new ext.InlineLinks({
        index: 200,
        id: 'inline-links',
        ref: 'io.ox/portal/widget/mail/links/inline'
    }));


    ext.point('io.ox/portal/widget').extend({
        id: 'mail',
        index: 300,
        load: function () {
            var loading = new $.Deferred();
            require(['io.ox/mail/api'], function (api) {
                api.getAll()
                    .done(function (ids) {
                        api.getList(ids.slice(0, 5))
                            .done(loading.resolve)
                            .fail(loading.reject);
                    })
                    .fail(loading.reject);
            });
            return loading;
        },
        draw: function (list) {

            var node = this;

            node.addClass('io-ox-portal-mail')
                .append(
                    $('<div>').addClass('clear-title')
                        .text('New E-Mails')
                );

            ext.point('io.ox/portal/widget/mail').invoke('draw', node);

            if (list.length === 0) {

                node.append('<div><b>No mails at all!</b></div>');
                return $.when();

            } else {

                return require(
                    ['io.ox/core/tk/dialogs', 'io.ox/mail/view-grid-template'],
                    function (dialogs, viewGrid) {

                        viewGrid.drawSimpleGrid(list).appendTo(node);

                        new dialogs.SidePopup(600)
                        .delegate(node, '.vgrid-cell', function (popup) {
                            var data = $(this).data('object-data');
                            require(['io.ox/mail/view-detail', 'io.ox/mail/api'], function (view, api) {
                                api.get(data).done(function (data) {
                                    popup.append(
                                        view.draw(data).removeClass('page')
                                    );
                                });
                            });
                        });
                    }
                );
            }
        }
    });
});