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
 * @author Tobias Prinz <tobias.prinz@open-xchange.com>
 */

define('plugins/halo/mail/register', [
    'io.ox/core/extensions',
    'io.ox/mail/api',
    'gettext!plugins/halo'
], function (ext, api, gt) {

    'use strict';

    ext.point('io.ox/halo/contact:renderer').extend({

        id: 'mail',

        handles: function (type) {
            return type === 'com.openexchange.halo.mail';
        },

        draw: function  (baton) {

            if (baton.data.length === 0) return $.when();

            var sent = [], received = [], deferred = $.Deferred(), node = this;

            _(baton.data).each(function (item) {
                if (/INBOX$/i.test(item.folder_id)) received.push(item); else sent.push(item);
            });

            this.append(
                $('<div class="widget-title clear-title">').text(gt('Recent conversations'))
            );

            require(['io.ox/core/tk/dialogs', 'io.ox/mail/listview'], function (dialogs, ListView) {

                function createListView(type, data) {
                    var cid = 'halo:' + type + ':' + baton.contact.email1;
                    return new ListView({
                        collection: api.pool.add(cid, data),
                        pagination: false,
                        selection:  false,
                        scrollable: false,
                        threaded:   false
                    }).render().$el.addClass('compact');
                }

                node.append(
                    // left column
                    $('<div class="io-ox-left-column">').append(
                        $('<p class="io-ox-subheader">').text(gt('Received mails')),
                        received.length === 0 ?
                            $('<div>').text(gt('Cannot find any messages this contact sent to you.')) :
                            createListView('received', received)

                    ),
                    // right column
                    $('<div class="io-ox-right-column">').append(
                        $('<p class="io-ox-subheader">').text(gt('Sent mails')),
                        sent.length === 0 ?
                            $('<div>').text(gt('Cannot find any messages you sent to this contact.')) :
                            createListView('sent', sent)
                    ),
                    // clear float
                    $('<div>').css('clear', 'both')
                );

                new dialogs.SidePopup().delegate(node, '.list-item', function (pane, e, target) {
                    var cid = String(target.attr('data-cid')).replace(/^thread\./, '');
                    api.get(_.cid(cid)).done(function (data) {
                        require(['io.ox/mail/detail/view'], function (detail) {
                            var view = new detail.View({ data: data });
                            pane.append(view.render().expand().$el.addClass('no-padding'));
                            data = null;
                        });
                    });
                });

                deferred.resolve();
            });

            return deferred;
        }
    });

    ext.point('io.ox/halo/contact:requestEnhancement').extend({
        id: 'request-mail',
        enhances: function (type) {
            return type === 'com.openexchange.halo.mail';
        },
        enhance: function (request) {
            request.appendColumns = true;
            request.columnModule = 'mail';
            request.params.limit = 10;
            request.params.columns = '102,600,601,602,603,604,605,606,607,608,609,610,611,612,614,652';
        }
    });
});
