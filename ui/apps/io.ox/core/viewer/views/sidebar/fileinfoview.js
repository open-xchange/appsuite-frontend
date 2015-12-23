
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
    'io.ox/core/api/user',
    'io.ox/core/util',
    'io.ox/core/capabilities',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, Ext, folderAPI, UserAPI, util, capabilities, gt) {

    'use strict';

    function setFolder(e) {
        // launch files and set/change folder
        e.preventDefault();
        var id = e.data.id;
        ox.launch('io.ox/files/main', { folder: id }).done(function () {
            this.folder.set(id);
        });
    }

    function openShareDialog(e) {
        e.preventDefault();
        var model = e.data.model;
        require(['io.ox/files/share/permissions'], function (controller) {
            controller.showByModel(model);
        });
    }

    Ext.point('io.ox/core/viewer/sidebar/fileinfo').extend({
        index: 100,
        id: 'fileinfo',
        draw: function (baton) {

            if (!baton.model) return;

            var panelBody,
                model = baton.model,
                name = model.getDisplayName() || '-',
                size = model.get('file_size'),
                sizeString = (_.isNumber(size)) ? _.filesize(size) : '-',
                modifiedBy = model.get('modified_by'),
                modified = model.get('last_modified'),
                isToday = moment().isSame(moment(modified), 'day'),
                dateString = modified ? moment(modified).format(isToday ? 'LT' : 'l LT') : '-',
                folder_id = model.get('folder_id'),
                link =  util.getDeepLink('io.ox/files', model.isFile() ? model.pick('folder_id', 'id') : model.pick('id')),
                dl = $('<dl>');

            dl.append(
                // filename
                $('<dt>').text(gt('Name')),
                $('<dd class="file-name">').text(name),
                // size
                $('<dt>').text(gt('Size')),
                $('<dd class="size">').text(sizeString),
                // modified
                $('<dt>').text(gt('Modified')),
                $('<dd class="modified">').append(
                    $.txt(dateString), $('<br>'), UserAPI.getTextNode(modifiedBy)
                )
            );

            // folder info block
            if (!baton.options.disableFolderInfo) {
                dl.append(
                    // path; using "Folder" instead of "Save in" because that one
                    // might get quite long, e.g. "Gespeichert unter"
                    $('<dt>').text(gt('Folder')),
                    $('<dd class="saved-in">').append(
                        $('<a>')
                        .attr('href', folderAPI.getDeepLink({ module: 'infostore', id: folder_id }))
                        .append(folderAPI.getTextNode(folder_id))
                        .on('click', { id: folder_id }, setFolder)
                    )
                );
            }

            if (!capabilities.has('alone') && !capabilities.has('guest')) {
                folderAPI.get(folder_id).done(function (folderData) {
                    // only show links to infostore files, links to mail attachments would mean broken links, see bug 39752
                    if (folderAPI.is('infostore', folderData)) {
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
                });
            }

            var permissions = model.isFile() ?
                model.get('object_permissions') || [] :
                _(model.get('permissions')).filter(function (item) { return item.entity !== ox.user_id; });

            if (capabilities.has('invite_guests')) {
                dl.append(
                    //#. "Shares" in terms of "shared with others" ("Freigaben")
                    $('<dt>').text(gt('Shares')),
                    $('<dd>').append(
                        permissions.length ?
                            $('<a href="#">').text(
                                model.isFile() ? gt('This file is shared with others') : gt('This folder is shared with others')
                            )
                            .on('click', { model: model }, openShareDialog) :
                            $.txt('-')
                    )
                );
            }

            panelBody = this.find('.sidebar-panel-body').empty().append(dl);
        }
    });

    /**
     * The FileInfoView is intended as a sub view of the SidebarView and
     * is responsible for displaying the general file details.
     */
    var FileInfoView = PanelBaseView.extend({

        className: 'viewer-fileinfo',

        initialize: function (options) {
            this.options = options || {};
            this.closable = !!this.options.closable;
            //#. File and folder details
            this.setPanelHeader(gt('Details'));
            // attach event handlers
            this.listenTo(this.model, 'change:cid change:filename change:file_size change:last_modified change:folder_id', this.render);
            this.on('dispose', this.disposeView.bind(this));
        },

        render: function () {

            if (!this.model) return;

            var data = this.model.isFile() ? this.model.toJSON() : this.model.get('origData'),
                baton = Ext.Baton({ model: this.model, data: data, options: this.options });
            Ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', this.$el, baton);

            // only draw if needed
            if (this.closable && this.$('.sidebar-panel-heading .close').length === 0) {
                this.$('.sidebar-panel-heading').prepend(
                    $('<button type="button" class="close pull-right" tabindex="1">')
                    .attr('aria-label', gt('Close'))
                    .append('<span aria-hidden="true">&times;</span></button>')
                );
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
