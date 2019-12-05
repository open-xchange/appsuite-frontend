/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/files/actions/rename', [
    'io.ox/files/api',
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/files/util',
    'gettext!io.ox/files'
], function (api, ext, ModalDialog, util, gt) {

    'use strict';

    return function (data) {

        var filename = data['com.openexchange.file.sanitizedFilename'] || data.filename || data.title;

        function rename(name) {
            // 'title only' entries vs files
            var changes = !data.filename && data.title ? { title: name } : { filename: name };
            return api.update(data, changes).fail(notify);
        }

        // notifications lazy load
        function notify() {
            var self = this, args = arguments;
            require(['io.ox/core/notifications'], function (notifications) {
                notifications.yell.apply(self, args);
            });
        }

        /**
         * user have to confirm if name doesn't contains a file extension
         * @return { promise }
         */
        function process(name) {

            var invalid;

            // check for valid filename
            ext.point('io.ox/core/filename')
                .invoke('validate', null, name, 'file')
                .find(function (result) {
                    if (result !== true) {
                        notify('warning', result);
                        return (invalid = true);
                    }
                });

            if (invalid) return $.Deferred().reject();

            // show confirm dialog if necessary
            return util.confirmDialog(name, filename).then(rename.bind(this, name));
        }

        new ModalDialog({ title: gt('Rename'), enter: 'rename', async: true })
            .build(function () {
                this.$body.append($('<input type="text" name="name" class="form-control">'));
                // Test for Guard .suffix.pgp such as .jpg.pgp
                var highlight = (/\.[a-z0-9]+\.pgp/i).test(filename) ? filename.replace('.pgp', '').lastIndexOf('.') : filename.lastIndexOf('.');
                this.$body.find('input[name="name"]')
                    .focus().val(filename)
                    .get(0).setSelectionRange(0, highlight > -1 ? highlight : filename.length);
            })
            .addCancelButton()
            .addButton({ label: gt('Rename'), action: 'rename' })
            .on('rename', function () {
                var node = this.$body,
                    name = node.find('input[name="name"]').val();
                process(name).then(this.close, this.idle).fail(function () {
                    _.defer(function () { node.focus(); });
                });
            })
            .open();
    };
});
