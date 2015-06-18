
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
    'io.ox/core/viewer/views/sidebar/panelbaseview',
    'io.ox/core/extensions',
    'io.ox/core/folder/api',
    'io.ox/core/util',
    'io.ox/core/capabilities',
    'io.ox/core/folder/breadcrumb',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, Ext, FolderAPI, util, capabilities, BreadcrumbView, gt) {

    'use strict';

    Ext.point('io.ox/core/viewer/sidebar/fileinfo').extend({
        index: 100,
        id: 'fileinfo',
        draw: function (baton) {

            if (!baton.model) return;

            var panelBody,
                model = baton.model,
                fileName = model.get('filename') || '-',
                size = model.get('file_size'),
                sizeString = (_.isNumber(size)) ? _.filesize(size) : '-',
                modified = model.get('last_modified'),
                isToday = moment().isSame(moment(modified), 'day'),
                dateString = modified ? moment(modified).format(isToday ? 'LT' : 'l LT') : '-',
                link = util.getDeepLink('io.ox/files', model.toJSON()),
                dl = $('<dl>');

            dl.append(
                // filename
                $('<dt>').text(gt('Filename')),
                $('<dd class="file-name">').text(fileName),
                // size
                $('<dt>').text(gt('Size')),
                $('<dd class="size">').text(sizeString),
                // modified
                $('<dt>').text(gt('Modified')),
                $('<dd class="modified">').text(dateString),
                // path
                $('<dt>').text(gt('Saved in')),
                $('<dd class="saved-in">')
            );

            if (!capabilities.has('alone')) {
                dl.append(
                    // deep link
                    $('<dt>').text(gt('Link')),
                    $('<dd class="link">').append(
                        $('<a href="#" target="_blank" style="word-break: break-all">')
                        .attr('href', link)
                        .text(link)
                    )
                );
            }

            panelBody = this.find('.sidebar-panel-body').empty().append(dl);

            var breadcrumb = new BreadcrumbView({ folder: model.get('folder_id'), exclude: ['9'], notail: true });

            breadcrumb.handler = function (id) {
                // launch files and set/change folder
                ox.launch('io.ox/files/main', { folder: id }).done(function () {
                    this.folder.set(id);
                });
            };

            panelBody.find('dl > dd.saved-in').append(
                breadcrumb.render().$el
            );
        }
    });

    /**
     * The FileInfoView is intended as a sub view of the SidebarView and
     * is responsible for displaying the general file details.
     */
    var FileInfoView = PanelBaseView.extend({

        className: 'viewer-fileinfo',

        initialize: function () {
            this.setPanelHeader(gt('File details'));
            // attach event handlers
            this.listenTo(this.model, 'change:filename change:file_size change:last_modified change:folder_id', this.render);
            this.on('dispose', this.disposeView.bind(this));
        },

        render: function () {
            if (this.model) {
                var baton = Ext.Baton({ model: this.model, data: this.model.isFile() ? this.model.toJSON() : this.model.get('origData') });
                Ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', this.$el, baton);
            }
            return this;
        },

        /**
         * Destructor function of this view.
         */
        disposeView: function () {
            if (this.model) this.model = null;
        }

    });

    return FileInfoView;
});
