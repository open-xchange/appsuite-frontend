/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/upsell/simple-wizard/register',
    ['io.ox/core/extensions',
     'io.ox/core/upsell',
     'settings!upsell/simple-wizard',
     'gettext!upsell/simple-wizard'], function (ext, upsell, settings, gt) {

    'use strict';

    /*
     * Used settings:
     * - url
     * - overlayOpacity
     * - overlayColor
     * - zeroPadding
     * - height
     *
     * URL variables:
     * - $user
     * - $user_id
     * - $context_id
     * - $session
     * - $language
     * - $missing, $type, $id
     * - $hostname
     */

    var WIDTH = 750,
        HEIGHT = 390,
        defaultURL = 'blank.html?user=$user,user_id=$user_id,context_id=$context_id,' +
            'language=$language,type=$type,id=$id,missing=$missing,hostname=$hostname#session=$session';

    function getURL(options) {

        var url,
            hash = {
                context_id: ox.context_id,
                hostname: location.hostname,
                id: options.id || '',
                language: ox.language,
                missing: options.missing || '',
                session: ox.session,
                type: options.type || '',
                user: ox.user,
                user_id: ox.user_id
            };

        url = settings.get('url', defaultURL).replace(/\$(\w+)/g, function (all, key) {
            return key in hash ? encodeURIComponent(hash[key]) : '$' + key;
        });
        return url;
    }

    function showUpgradeDialog(e, options) {

        var zeroPadding = settings.get('zeroPadding', true),
            width = settings.get('width', WIDTH),
            height = settings.get('height', HEIGHT),
            overlayOpacity = settings.get('overlayOpacity', '0.5'),
            overlayColor = settings.get('overlayColor', '#000');

        require(['io.ox/core/tk/dialogs'], function (dialogs) {
            new dialogs.ModalDialog({ easyOut: false, width: width })
                .build(function () {
                    if (zeroPadding) {
                        this.getPopup().addClass('zero-padding');
                    }
                    this.getContentNode()
                    .busy()
                    .css({
                        maxHeight: height + 'px',
                        overflow: 'hidden'
                    })
                    .append(
                        // add iframe but with blank file (to avoid delay)
                        $('<iframe src="blank.html" allowtransparency="true" border="0" frameborder="0" framespacing="0">')
                        .css({
                            width: '100%',
                            height: height + 'px'
                        })
                    );
                    this.addButton('cancel', gt('Cancel'));
                })
                .setUnderlayStyle({
                    opacity: 0,
                    backgroundColor: overlayColor
                })
                .on('show', function () {
                    ox.off('upsell:requires-upgrade', showUpgradeDialog);
                    this.setUnderlayStyle({ opacity: overlayOpacity });
                    var self = this;
                    setTimeout(function () {
                        self.getContentNode().idle().find('iframe').attr('src', getURL(options));
                    }, 250);
                })
                .on('close', function () {
                    ox.on('upsell:requires-upgrade', showUpgradeDialog);
                })
                .show();
        });
    }

    // register for event
    ox.on('upsell:requires-upgrade', showUpgradeDialog);

    // upsell.demo(true); // useful during development

});
