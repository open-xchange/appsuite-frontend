
/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/fileinfoview', [
    'io.ox/core/extensions',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/core/viewer/util',
    'io.ox/core/date',
    'io.ox/core/folder/api',
    'gettext!io.ox/core/viewer'
], function (Ext, EventDispatcher, Util, OXDate, FolderAPI, gt) {

    'use strict';

    var DRIVE_ROOT_FOLDER = '9',
        POINT = 'io.ox/core/viewer/sidebar/fileinfo';

    Ext.point(POINT).extend({
        index: 100,
        id: 'fileinfo',
        draw: function (baton) {
            //console.info('FileInfoView.draw()');
            var panel, panelBody,
                fileName, size, modified, folderId,
                model = baton && baton.model;

            /**
             * adds a row to the panel body
             */
            function addRow(label, content, cls) {
                panelBody.find('dl').append(
                    $('<dt>').text(label),
                    $('<dd>').addClass(cls).text(content)
                );
            }

            if (!model) { return; }

            fileName = model.get('filename') || '-';
            size = (_.isNumber(model.get('size'))) ? _.filesize(model.get('size')) : '-';
            modified = Util.getDateFormated(model.get('lastModified'));
            folderId = model.get('folderId');

            panel = Util.createPanelNode({ title: gt('General Info') });
            panelBody = panel.find('.panel-body').append($('<dl>'));

            addRow(gt('Filename'), fileName, 'file-name');
            addRow(gt('Size'), size, 'size');
            addRow(gt('Modified'), modified, 'modified');
            addRow(gt('Saved in'), '\xa0', 'saved-in');
            panelBody.find('dl>dd.saved-in').busy();

            FolderAPI.path(folderId)
            .done(function success(list) {
                //console.info('path: ', list);
                var folderPath = '';

                _.each(list, function (folder, index, list) {
                    var isLast = (index === list.length - 1);

                    if (folder.id !== DRIVE_ROOT_FOLDER) {
                        folderPath += gt.noI18n(FolderAPI.getFolderTitle(folder.title, 30));
                        if (!isLast) {
                            folderPath += gt.noI18n(' / ');
                        }
                    }
                });

                panelBody.find('dl>dd.saved-in').text(folderPath);
            })
            .fail(function fail() {
                panelBody.find('dl>dd.saved-in').text('-');
            })
            .always(function () {
                panelBody.find('dl>dd.saved-in').idle();
            });

            this.empty().attr({ role: 'tablist' }).append(panel);
        }
    });

    /**
     * The FileInfoView is intended as a sub view of the SidebarView and
     * is responsible for displaying the general file details.
     */
    var FileInfoView = Backbone.View.extend({

        className: 'viewer-fileinfo',

        events: {
            'click .toggle-panel': 'onTogglePanel'
        },

        onTogglePanel: function (event) {
            var panelBody = this.$el.find('.panel>.panel-body');
            event.preventDefault();

            if (panelBody.hasClass('panel-collapsed')) {
                // expand the panel
                panelBody.slideDown().removeClass('panel-collapsed');
            } else {
                // collapse the panel
                panelBody.slideUp().addClass('panel-collapsed');
            }
        },

        initialize: function () {
            //console.info('FileInfoView.initialize()');
            this.$el.on('dispose', this.dispose.bind(this));
        },

        render: function (data) {
            //console.info('FileInfoView.render() ', data);
            if (!data || !data.model) { return this; }

            var baton = Ext.Baton({ model: data.model, data: data.model.get('origData') });

            Ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', this.$el, baton);
            return this;
        },

        dispose: function () {
            //console.info('FileInfoView.dispose()');

            this.stopListening();
            return this;
        }
    });

    return FileInfoView;
});
