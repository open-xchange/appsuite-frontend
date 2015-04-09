
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
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/core/viewer/util',
    'io.ox/core/date',
    'io.ox/core/folder/api',
    'gettext!io.ox/core/viewer'
], function (DisposableView, Ext, EventDispatcher, Util, OXDate, FolderAPI, gt) {

    'use strict';

    var DRIVE_ROOT_FOLDER = '9',
        POINT = 'io.ox/core/viewer/sidebar/fileinfo';

    Ext.point(POINT).extend({
        index: 100,
        id: 'fileinfo',
        draw: function (baton) {
            //console.info('FileInfoView.draw()');
            var panel, panelBody,
                model = baton && baton.model,
                fileName = model && model.get('filename') || '-',
                size = model && (_.isNumber(model.get('size'))) ? _.filesize(model.get('size')) : '-',
                modified = model && Util.getDateFormated(model.get('lastModified'));

            if (!model) { return; }

            panel = Util.createPanelNode({ title: gt('General Info') });
            panelBody = panel.find('.panel-body').append(
                $('<dl>').append(
                    // filename
                    $('<dt>').text(gt('Filename')),
                    $('<dd class="file-name">').text(fileName),
                    // size
                    $('<dt>').text(gt('Size')),
                    $('<dd class="size">').text(size),
                    // modified
                    $('<dt>').text(gt('Modified')),
                    $('<dd class="modified">').text(modified),
                    // path
                    $('<dt>').text(gt('Saved in')),
                    $('<dd class="saved-in">').text('\xa0').busy()
                )
            );

            FolderAPI.path(model.get('folderId'))
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
    var FileInfoView = DisposableView.extend({

        className: 'viewer-fileinfo',

        initialize: function () {
            //console.info('FileInfoView.initialize()', this.model);
            this.on('dispose', this.disposeView.bind(this));
        },

        /**
         * Listens on model change events.
         */
        onModelChange: function (model) {
            //console.info('FileInfoView.onModelChangeDescription()', model);
            var baton = Ext.Baton({ model: model, data: model.get('origData') });
            Ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', this.$el, baton);
        },

        render: function () {
            //console.info('FileInfoView.render()');
            if (!this.model) { return this; }

            // add model change listener
            this.listenTo(this.model, 'change:filename change:size change:lastModified change:folderId', this.onModelChange.bind(this));

            var baton = Ext.Baton({ model: this.model, data: this.model.get('origData') });
            Ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', this.$el, baton);

            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            //console.info('FileDescriptionView.disposeView()');
            if (this.model) {
                this.model.off().stopListening();
                this.model = null;
            }
        }

    });

    return FileInfoView;
});
