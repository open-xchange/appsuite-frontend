/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/pubsub/notifications/subscription', ['gettext!io.ox/core'], function (gt) {

    'use strict';

    return function draw(model) {

        var data = model.toJSON(),
            label = '',
            pub = {},
            pubtype = '';

        //exists publication header
        pub.url  = data.headers && data.headers['X-OX-PubURL'] || '';
        if (pub.url === '') {
            return false;
        }
        //qualify data
        pubtype = /^(\w+),(.*)$/.exec(data.headers['X-OX-PubType']) || ['', '', ''];
        pub.module  = pubtype[1];
        pub.type  = pubtype[2];
        pub.name = decodeURIComponent(_.first(_.last(pub.url.split('/')).split('?')));
        pub.parent = require('settings!io.ox/core').get('folder/' + pub.module);
        pub.folder = '';
        label = pub.module === 'infostore' ?
        /*#. folder publication of type 'files' (drive/infostore) */
        gt('files') :
        /*#, dynamic*/
        gt(pub.module);

        // published folder have much more data, single file just has a name and a URL.
        var isSingleFilePublication = !pub.type;

        this.append(
            $('<div class="notification-item subscription">').append(
                $('<div class="invitation">').text(
                    isSingleFilePublication ?
                    gt('Someone shared a file with you') :
                    /*#. %1$s is the (translated) type of the publication like "files", "contacts", …
                        */
                    gt('Someone shared a folder with you. Would you like to subscribe those %1$s?', label)
                ),
                $('<div class="actions">').append(
                    $('<button type="button" class="btn btn-default" data-action="show">').text(
                        isSingleFilePublication ? gt('Show file') : gt('Show original publication')
                    ),
                    $.txt(' '),
                    isSingleFilePublication ? '' :
                    $('<button type="button" class="btn btn-primary" data-action="subscribe">').text(gt('Subscribe'))
                )
            )
        );

        //actions
        this.on('click', '.subscription .btn', function (e) {
            var button = $(e.target),
                notifications = require('io.ox/core/notifications');
                //disble button
                if (button.data('action') === 'show') {
                    window.open(pub.url, '_blank');
                } else {
                    $(e.target).prop('disabled', true);
                    notifications.yell('info', gt('Adding subscription. This may take some seconds …'));
                    var opt = opt || {};
                    //create folder; create and refresh subscription
                    require(['io.ox/core/pubsub/util', 'io.ox/core/folder/api']).done(function (pubsubUtil, folder) {
                        pubsubUtil.autoSubscribe(pub.module, pub.name, pub.url).then(
                            function success() {
                                /*#. %1$s is the publication name
                                    * #. %2$s is the (translated) type of the publication like "files", "contacts", …
                                    */
                                notifications.yell('success', gt('Created private folder \'%1$s\' in %2$s and subscribed successfully to shared folder', pub.name, pub.module));
                                //refresh folder views
                                folder.trigger('update');
                            },
                            function fail(data) {
                                notifications.yell('error', data.error || gt('An unknown error occurred'));
                            }
                        );
                    });
                }
        });
    };
});
