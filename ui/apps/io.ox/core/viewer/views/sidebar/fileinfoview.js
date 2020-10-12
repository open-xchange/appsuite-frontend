
/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebar/fileinfoview', [
    'io.ox/core/viewer/views/sidebar/panelbaseview',
    'io.ox/core/api/user',
    'io.ox/core/extensions',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/util',
    'io.ox/mail/util',
    'io.ox/core/capabilities',
    'io.ox/core/viewer/util',
    'io.ox/backbone/mini-views/copy-to-clipboard',
    'settings!io.ox/core',
    'gettext!io.ox/core/viewer'
], function (PanelBaseView, userApi, Ext, FilesAPI, folderAPI, util, mailUtil, capabilities, ViewerUtil, CopyToClipboardView, settings, gt) {

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

    function renderFileName(model, options) {
        var name = model.getDisplayName() || '-';
        var disableLink = options.disableLink || false;

        //fix for 53324, 58378, 58894
        if (!model.isDriveItem()) return $.txt(name);

        // fix for 56070
        if (disableLink) return $.txt(name);

        var link =  util.getDeepLink('io.ox/files', model.isFile() ? model.pick('folder_id', 'id') : model.pick('id'));

        var copyLinkButton = new CopyToClipboardView({
            className: 'copy-link',
            content: link,
            label: gt('Private link: Only people who have access to the file/folder can use it. Use it to point to members of your organization to this file/folder.'),
            iconClass: 'fa fa-link',
            events: {
                'click': function () {
                    this.$el.tooltip('hide');
                    require(['io.ox/core/yell'], function (yell) {
                        yell({ type: 'success', message: gt('The link has been copied to the clipboard.') });
                    });
                }
            }
        });

        return [$('<span style="word-break: break-all">').text(name), copyLinkButton.render().$el];
    }

    function createDateString(date) {
        var isToday = moment().isSame(moment(date), 'day');
        var dateString = date ? moment(date).format(isToday ? 'LT' : 'l LT') : '-';

        return dateString;
    }

    Ext.point('io.ox/core/viewer/sidebar/fileinfo').extend({
        index: 100,
        id: 'fileinfo',
        draw: function (baton) {

            if (!baton.model) return;

            var model = baton.model;
            var options = baton.options || {};
            var dateString = createDateString(model.get('last_modified'));
            var folder_id = model.get('folder_id');
            var media = model.get('media') || {};
            var dl = $('<dl>');
            var isAttachmentView = !_.isEmpty(model.get('com.openexchange.file.storage.mail.mailMetadata'));

            dl.append(
                // filename
                $('<dt>').text(gt('Name')),
                $('<dd class="file-name">').append(
                    renderFileName(model, options)
                ),
                // size
                $('<dt>').text(gt('Size')),
                $('<dd class="size">').text(ViewerUtil.renderItemSize(model))
            );
            if (!isAttachmentView) {

                if (media.width && media.height) {
                    dl.append(
                        $('<dt>').text(gt('Resolution')),
                        $('<dd class="resolution">').text(media.width + ' x ' + media.height)
                    );
                }

                if (media.camera_make) {
                    dl.append(
                        $('<dt>').text(gt('Device make')),
                        $('<dd class="camera_make">').text(media.camera_make)
                    );
                }

                if (media.camera_model) {
                    dl.append(
                        $('<dt>').text(gt('Device model')),
                        $('<dd class="camera_model">').text(media.camera_model)
                    );
                }

                if (media.camera_aperture || media.camera_exposure_time || media.camera_focal_length) {
                    var t = '';
                    if (media.camera_aperture) {
                        t = media.camera_aperture + ' ';
                    }
                    if (media.camera_exposure_time) {
                        t = t + media.camera_exposure_time + ' ';
                    }
                    if (media.camera_focal_length) {
                        t = t + media.camera_focal_length;
                    }
                    //#. german translation should be "Aufnahme".
                    dl.append(
                        $('<dt>').text(gt('Shot')),
                        $('<dd class="camera_shot">').text(t)
                    );
                }

                if (media.camera_iso_speed) {
                    dl.append(
                        $('<dt>').text(gt('ISO')),
                        $('<dd class="camera_iso_speed">').text(media.camera_iso_speed)
                    );
                }

                if (model.get('capture_date')) {
                    dl.append(
                        $('<dt>').text(gt('Capture date')),
                        $('<dd class="camera_capture_date">').text(createDateString(model.get('capture_date')))
                    );
                }

                dl.append(
                    // modified
                    $('<dt>').text(gt('Modified')),
                    $('<dd class="modified">').append(
                        $('<span class="modifiedAt">').text(dateString),
                        $('<span class="modifiedBy">').append(document.createTextNode('\u200B')).append(userApi.getTextNodeExtended(model.attributes, 'modified'))
                    )
                );

                // folder info block
                if (!options.disableFolderInfo) {
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

                var permissions = model.isFile() ?
                    model.get('object_permissions') || [] :
                    _(model.get('permissions')).filter(function (item) { return item.entity !== ox.user_id; });

                if (capabilities.has('invite_guests') && !options.disableSharesInfo) {
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
            } else {
                // All Attachment View
                var mail = model.get('com.openexchange.file.storage.mail.mailMetadata');
                var attachmentView = settings.get('folder/mailattachments', {});
                dl.append(
                    $('<dt>').text(gt('Folder')),
                    $('<dd class="mail-folder">').append(
                        $('<a>')
                        .attr('href', folderAPI.getDeepLink({ module: 'mail', id: mail.folder }))
                        .append(folderAPI.getTextNode(mail.folder))
                        .on('click', function (e) {
                            e.preventDefault();
                            ox.launch('io.ox/mail/main', { folder: mail.folder });
                        })
                    ),
                    $('<dt>').text(gt('Subject')),
                    $('<dd class="subject">').append(
                        $.txt(mailUtil.getSubject(mail.subject || ''))
                    ),
                    $('<dt>').text(folder_id === attachmentView.sent ? gt('To') : gt('From')),
                    $('<dd class="from">').append(
                        $.txt(mailUtil.getDisplayName(folder_id === attachmentView.sent ? mail.to[0] : mail.from[0]))
                    ),
                    $('<dt>').text(folder_id === attachmentView.sent ? gt('Sent') : gt('Received')),
                    $('<dd class="received">').append(
                        $.txt(dateString)
                    ),
                    $('<dt>'),
                    $('<dd class="link">').append(
                        $('<a>')
                        .attr('href', folderAPI.getDeepLink({ module: 'mail', id: mail.folder }))
                        .text(gt('View message'))
                        .on('click', function (e) {
                            e.preventDefault();
                            require(['io.ox/mail/api'], function (api) {
                                var cid = _.cid({ folder: mail.folder, id: mail.id });
                                // see if mail is still there. Also loads the mail into the pool. Needed for the app to work
                                api.get(_.extend({}, { unseen: true }, _.cid(cid))).done(function (item) {
                                    if (_.device('smartphone')) {
                                        require(['io.ox/core/tk/dialogs', 'io.ox/mail/detail/view'], function (dialogs, detail) {
                                            var sidepopup = new dialogs.SidePopup({ preserveOnAppchange: true, tabTrap: true }),
                                                obj = api.reduce(item);
                                            api.get(obj).done(function (data) {
                                                var view = new detail.View({
                                                    data: data,
                                                    // no threads - no different subject
                                                    disable: {
                                                        'io.ox/mail/detail/header/row3': 'different-subject',
                                                        'io.ox/mail/detail/header': 'picture'
                                                    }
                                                });
                                                sidepopup.show(e, function (popup) {
                                                    popup.append(view.render().expand().$el.addClass('no-padding'));
                                                });
                                            });
                                        });
                                    } else {
                                        ox.launch('io.ox/mail/detail/main', { cid: cid });
                                    }
                                }).fail(function (error) {
                                    //if the mail was moved or the mail was deleted the cid cannot be found, show error
                                    require(['io.ox/core/yell'], function (yell) {
                                        yell(error);
                                    });
                                });
                            });
                        })
                    )
                );
            }

            this.find('.sidebar-panel-body').empty().append(dl);
        }
    });

    /**
     * The FileInfoView is intended as a sub view of the SidebarView and
     * is responsible for displaying the general file details.
     */
    var FileInfoView = PanelBaseView.extend({

        className: 'viewer-fileinfo',

        initialize: function (options) {
            PanelBaseView.prototype.initialize.apply(this, arguments);
            this.options = options || {};
            this.closable = !!this.options.closable;
            //#. File and folder details
            this.setPanelHeader(gt('Details'));
            // attach event handlers
            this.listenTo(this.model, 'change:media change:cid change:filename change:title change:com.openexchange.file.sanitizedFilename change:file_size change:last_modified change:folder_id change:object_permissions change:permissions', this.render);
            // listen to version display events
            this.listenTo(this.viewerEvents, 'viewer:display:version', this.onDisplayTempVersion.bind(this));
        },

        render: function () {

            if (!this.model) return this;

            var data = this.model.isFile() ? this.model.toJSON() : this.model.get('origData'),
                baton = Ext.Baton({ model: this.model, data: data, options: this.options });
            Ext.point('io.ox/core/viewer/sidebar/fileinfo').invoke('draw', this.$el, baton);

            // only draw if needed
            if (this.closable && this.$('.sidebar-panel-heading .close').length === 0) {
                this.$('.sidebar-panel-heading').prepend(
                    $('<button type="button" class="close pull-right">').attr('title', gt('Hide details')).append('<i class="fa fa-times" aria-hidden="true">')
                );
            }

            return this;
        },

        /**
         * Handles display temporary file version events.
         *
         * @param {Object} versionData
         *   The JSON representation of the version.
         */
        onDisplayTempVersion: function (versionData) {
            if (!versionData) { return; }

            this.model = new FilesAPI.Model(versionData);
            this.render();
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            if (this.model) this.model = null;
        }

    });

    return FileInfoView;
});
