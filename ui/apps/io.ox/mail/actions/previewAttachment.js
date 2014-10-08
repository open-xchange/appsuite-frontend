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

define('io.ox/mail/actions/previewAttachment', [
    'io.ox/mail/api'
], function (api) {

    'use strict';

    return {

        multiple: function (list, baton) {
            //remove last element from id-list if previewing during compose (forward mail as attachment)
            var adjustFn = list[0].parent.adjustid || '';
            list[0].id = _.isFunction(adjustFn) ? adjustFn(list[0].id) : list[0].id;
            // open side popup
            require(['io.ox/core/tk/dialogs', 'io.ox/preview/main'], function (dialogs, p) {
                new dialogs.SidePopup({ tabTrap: true }).show(baton.e, function (popup) {
                    _(list).each(function (data) {
                        var pre = new p.Preview({
                            data: data,
                            filename: data.filename,
                            parent: data.parent,
                            mimetype: data.content_type,
                            dataURL: api.getUrl(data, 'view'),
                            downloadURL: api.getUrl(data, 'download')
                        }, {
                            width: popup.parent().width(),
                            height: 'auto'
                        });
                        if (pre.supportsPreview()) {
                            popup.append(
                                $('<h4>').addClass('mail-attachment-preview').text(data.filename)
                            );
                            pre.appendTo(popup);
                            popup.append($('<div>').text('\u00A0'));
                        }
                    });
                });
            });
        }
    };
});
