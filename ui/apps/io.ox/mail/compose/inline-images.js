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
 * @author David Bauer <david.bauer@open-xchange.com>
 */

define('io.ox/mail/compose/inline-images', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/tk/attachments',
    'io.ox/core/notifications',
    'io.ox/core/http',
    'gettext!io.ox/mail'
], function (ext, dialogs, attachments, notifications, http, gt) {

    'use strict';

    var api = {
        inlineImage: function (data) {
            if ('FormData' in window) {
                var formData = new FormData();
                formData.append('file', data.file);
                return http.UPLOAD({
                    module: 'file',
                    params: { action: 'new', module: 'mail', type: 'image' },
                    data: formData,
                    fixPost: true
                });
            } else {
                return http.FORM({
                    module: 'file',
                    form: data.form,
                    params: { module: 'mail', type: 'image' }
                });
            }
        },
        getInsertedImageUrl: function (data) {
            var url = ox.apiRoot + '/file',
            url_params = $.param({
                action: 'get',
                id: data.data[0],
                session: ox.session
            });
            return url + '?' + url_params;
        }
    };

    var POINT = 'io.ox/mail/compose/inline-images/';

    ext.point(POINT + 'title').extend({
        id: 'default',
        draw: function () {
            this.append(
                $('<h4>').text(gt('Insert inline image'))
            );
        }
    });

    ext.point(POINT + 'file_upload').extend({
        id: 'default',
        draw: function (baton) {
            baton.$.file_upload = attachments.fileUploadWidget({ tabindex: 0 });
            this.append(
                baton.$.file_upload
            );
        }
    });

    ext.point(POINT + 'buttons').extend({
        id: 'default',
        draw: function () {
            this.addPrimaryButton('insert', gt('Insert'), 'insert', { 'tabIndex': '1' })
                .addButton('cancel', gt('Cancel'), 'cancel', { 'tabIndex': '1' });
        }
    });

    return {
        api: api,
        show: function () {
            var noBusy = (_.browser.IE && _.browser.IE < 10),//IE9 upload fails if window becomes busy
                dialog = new dialogs.ModalDialog({ async: true, noBusy: noBusy }),
                baton =  new ext.Baton({ $: {} }),
                def = $.Deferred(),
                form;

            dialog.build(function () {
                form = $('<form>', { 'accept-charset': 'UTF-8', enctype: 'multipart/form-data', method: 'POST' });
                this.getContentNode().append(form);

                ext.point(POINT + 'title').invoke('draw', this.getHeader(), baton);

                ext.point(POINT + 'file_upload').invoke('draw', form, baton);

                ext.point(POINT + 'buttons').invoke('draw', this, baton);

                this.getPopup().addClass('inline-images').parent().css('z-index', 999999); // Get high!;
            });
            dialog.on('insert', function () {

                var file = baton.$.file_upload.find('input[type=file]'),
                    popup = this,
                    failHandler = function (data) {
                        if (data && data.error) {
                            notifications.yell('error', data.error);
                        }
                        popup.idle();
                    };

                if (!noBusy) {
                    popup.busy();
                }

                if (!(/\.(gif|bmp|tiff|jpe?g|gmp|png)$/i).test(file.val())) {
                    notifications.yell('error', gt('Please select a valid image File to insert'));
                    popup.idle();
                    def.reject();
                } else {
                    return api.inlineImage({
                        file: file[0].files ? file[0].files[0] : [],
                        form: form
                    }).then(function (data) {
                        popup.close();
                        def.resolve(api.getInsertedImageUrl(data));
                    }).fail(failHandler);
                }
            })
            .show();
            return def;
        }
    };

});
