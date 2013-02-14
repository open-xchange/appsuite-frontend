/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2013
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */

define('io.ox/core/import',
    ['io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'io.ox/core/tk/attachments',
    'io.ox/core/api/folder',
    'io.ox/core/notifications',
    'io.ox/core/config',
    'gettext!io.ox/core',
    'less!io.ox/backbone/forms.less'], function (ext, dialogs, attachments, folderApi, notifications, config, gt) {

    'use strict';

    //header: title
    ext.point('io.ox/core/import/title').extend({
        id: 'default',
        draw: function (title) {
            this.append(
                $('<h3>').text(gt(title))
            );
        }
    });

    //body: breadcrumb
    ext.point('io.ox/core/import/breadcrumb').extend({
        id: 'default',
        draw: function (id, prefix) {
            this.append(
                folderApi.getBreadcrumb(id, { prefix: prefix || '' })
                .css({'padding-top': '5px', 'padding-left': '5px'})
            );
        }
    });

    ext.point('io.ox/core/import/file_upload').extend({
        id: 'default',
        draw: function () {
            this.append(
                attachments.fileUploadWidget({displayLabel: true})
            );
        }
    });

    //buttons
    ext.point('io.ox/core/import/buttons').extend({
        id: 'default',
        draw: function () {
            this
                .addButton('cancel', gt('Cancel'))
                .addPrimaryButton('import', gt('Import'));
        }
    });

    return {
        show: function (module, id) {
            var id = String(id),
                dialog = new dialogs.ModalDialog({width: 500}),
                baton = {id: id, module: module, simulate: true, format: {}, nodes: {}};

            //get folder and process
            folderApi.get({ folder: id}).done(function (folder) {
                dialog.build(function () {
                        //header
                        ext.point('io.ox/core/import/title')
                            .invoke('draw', this.getHeader(), gt('Import'));
                        //body
                        ext.point('io.ox/core/import/breadcrumb')
                            .invoke('draw', this.getContentNode(), id, gt('Path'));
                        ext.point('io.ox/core/import/file_upload')
                            .invoke('draw', this.getContentNode());
                        //buttons
                        ext.point('io.ox/core/import/buttons')
                            .invoke('draw', this);
                    })
                    .show()
                    .done(
                        function (action) {
                            if (action !== 'import') {
                                dialog = null;
                                return;
                            }
                        });
            });
        }
    };

});
