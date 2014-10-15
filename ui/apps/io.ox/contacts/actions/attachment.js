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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/attachment', [
    'io.ox/core/api/attachment',
    'io.ox/core/download',
    'io.ox/core/yell',
    'gettext!io.ox/contacts'
], function (attachmentAPI, downloadAPI, yell, gt) {

    'use strict';

    var AttachmentActions = {

        open: function (list) {
            _(list).each(function (data) {
                var url = attachmentAPI.getUrl(data, 'view');
                window.open(url);
            });
        },

        download: function (list) {
            _(list).each(function (data) {
                var url = attachmentAPI.getUrl(data, 'download');
                downloadAPI.url(url);
            });
        },

        save: function (list) {
            //cannot be converted to multiple request because of backend bug (module overides params.module)
            _(list).each(function (data) {
                attachmentAPI.save(data);
            });
            setTimeout(function () { yell('success', gt('Attachments have been saved!')); }, 300);
        },

        preview: function (list, baton) {
            ox.load([ 'io.ox/core/tk/dialogs', 'io.ox/preview/main' ]).done(function (dialogs, p) {
                //build Sidepopup
                new dialogs.SidePopup({ tabTrap: true }).show(baton.e, function (popup) {
                    _(list).each(function (data) {
                        data.dataURL = attachmentAPI.getUrl(data, 'view');
                        var pre = new p.Preview(data, {
                            width: popup.parent().width(),
                            height: 'auto'
                        });
                        if (pre.supportsPreview()) {
                            popup.append(
                                $('<h4>').text(data.filename)
                            );
                            pre.appendTo(popup);
                            popup.append($('<div>').text('\u00A0'));
                        }
                    });
                    if (popup.find('h4').length === 0) {
                        popup.append($('<h4>').text(gt('No preview available')));
                    }
                });
            });
        },

        slideshow: function (list) {
            ox.load(['io.ox/files/carousel']).done(function (slideshow) {
                var files = _(list).map(function (file) {
                    return {
                        url: attachmentAPI.getUrl(file, 'open'),
                        filename: file.filename
                    };
                });
                slideshow.init({
                    baton: { allIds: files },
                    attachmentMode: false,
                    selector: '.window-container.io-ox-contacts-window'
                });
            });
        }

    };

    return AttachmentActions;
});
