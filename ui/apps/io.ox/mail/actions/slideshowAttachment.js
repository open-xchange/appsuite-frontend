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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/mail/actions/slideshowAttachment', [
    'io.ox/mail/api'
], function (api) {

    'use strict';

    return {

        multiple: function (list, baton) {
            require(['io.ox/files/carousel'], function (slideshow) {
                var regIsImage = /\.(gif|bmp|tiff|jpe?g|gmp|png)$/i,
                    files = _(list).map(function (file) {
                        // get URL
                        var url = api.getUrl(file, 'view');
                        // non-image files need special format parameter
                        if (!regIsImage.test(file.filename)) url += '&format=preview_image&session=' + ox.session;
                        return { url: url, filename: file.filename };
                    }),
                    startIndex = 0;
                if (baton.startItem) {
                    _(files).each(function (file, index) {
                        if (file.url.indexOf('attachment=' + baton.startItem.id) !== -1) {
                            startIndex = index;
                        }
                    });
                }
                slideshow.init({
                    fullScreen: false,
                    baton: { allIds: files, startIndex: startIndex },
                    attachmentMode: true,
                    useSelectionAsStart: true
                });
            });
        }
    };
});
