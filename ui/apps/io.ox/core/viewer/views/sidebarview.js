/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

define('io.ox/core/viewer/views/sidebarview', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/viewer/util',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/dropzone',
    'io.ox/core/capabilities',
    'io.ox/core/viewer/settings',
    'io.ox/core/viewer/views/types/typesutil',
    'io.ox/core/viewer/views/document/thumbnailview',
    'io.ox/core/viewer/views/sidebar/fileinfoview',
    'io.ox/core/viewer/views/sidebar/filedescriptionview',
    'io.ox/core/viewer/views/sidebar/fileversionsview',
    'io.ox/core/viewer/views/sidebar/uploadnewversionview',
    'io.ox/core/extensions',
    'gettext!io.ox/core/viewer',
    // prefetch cause all views need the base view
    'io.ox/core/viewer/views/sidebar/panelbaseview'
], function (DisposableView, Util, FilesAPI, folderApi, Dropzone, Capabilities, ViewerSettings, TypesUtil, ThumbnailView, FileInfoView, FileDescriptionView, FileVersionsView, UploadNewVersionView, ext, gt) {

    'use strict';

    ext.point('io.ox/core/viewer/views/sidebarview/detail').extend({
        id: 'file-info',
        index: 100,
        draw: function (baton) {
            var fileInfoOpt = {
                model: baton.model,
                fixed: true,
                closable: baton.options.closable,
                disableFolderInfo: !!(baton.options.opt && baton.options.opt.disableFolderInfo),
                viewerEvents: baton.context.viewerEvents,
                isViewer: baton.context.isViewer
            };

            this.append(new FileInfoView(fileInfoOpt).render().el);
        }
    });

    ext.point('io.ox/core/viewer/views/sidebarview/detail').extend({
        id: 'file-description',
        index: 200,
        draw: function (baton) {
            //check if supported
            if (!(baton.model.isFile() && folderApi.pool.models[baton.data.folder_id] && folderApi.pool.models[baton.data.folder_id].supports('extended_metadata'))) return;
            this.append(new FileDescriptionView({ model: baton.model, viewerEvents: baton.context.viewerEvents }).render().el);
        }
    });

    ext.point('io.ox/core/viewer/views/sidebarview/detail').extend({
        id: 'file-versions',
        index: 300,
        draw: function (baton) {
            //check if supported
            if (!(baton.model.isFile() && folderApi.pool.models[baton.data.folder_id] && folderApi.pool.models[baton.data.folder_id].can('add:version'))) return;
            this.append(new FileVersionsView({ model: baton.model, viewerEvents: baton.context.viewerEvents, isViewer: baton.context.isViewer, standalone: baton.context.standalone }).render().el);
        }
    });

    ext.point('io.ox/core/viewer/views/sidebarview/detail').extend({
        id: 'upload-new-version',
        index: 400,
        draw: function (baton) {
            //check if supported
            if (!(baton.model.isFile() && folderApi.pool.models[baton.data.folder_id] && folderApi.pool.models[baton.data.folder_id].can('add:version'))) return;
            this.append(new UploadNewVersionView({ model: baton.model, app: baton.app }).render().el);
        }
    });

    /**
     * notifications lazy load
     */
    function notify() {
        var self = this, args = arguments;
        require(['io.ox/core/notifications'], function (notifications) {
            notifications.yell.apply(self, args);
        });
    }

    /**
     * The SidebarView is responsible for displaying the detail side bar.
     * This includes sections for file meta information, file description
     * and version history.
     * Triggers 'viewer:sidebar:change:state' event when thr sidebar opens / closes.
     */
    var SidebarView = DisposableView.extend({

        className: 'viewer-sidebar',

        // the visible state of the side bar, hidden per default.
        open: false,

        events: {
            'keydown .tablink': 'onTabKeydown'
        },

        initialize: function (options) {

            options = options || {};

            _.extend(this, {
                viewerEvents: options.viewerEvents || _.extend({}, Backbone.Events),
                standalone: options.standalone,
                options: options,
                isViewer: options.isViewer
            });

            this.model = null;
            this.zone = null;
            this.thumbnailView = null;
            this.app = options.app;

            // listen to slide change and set fresh model
            this.listenTo(this.viewerEvents, 'viewer:displayeditem:change', this.setModel);

            // bind scroll handler
            this.$el.on('scroll', _.throttle(function () {
                this.onScrollHandler();
            }.bind(this), 500));
            this.initTabNavigation();
        },

        /**
         * Create and draw sidebar tabs.
         */
        initTabNavigation: function () {
            // build tab navigation and its panes
            var tabsList = $('<ul class="viewer-sidebar-tabs hidden">');
            var detailTabLink = $('<a class="tablink" data-tab-id="detail">').text(gt('Details'));
            var detailTab = $('<li class="viewer-sidebar-detailtab">').append(detailTabLink);
            var detailPane = $('<div class="viewer-sidebar-pane detail-pane" data-tab-id="detail">');
            var thumbnailTabLink = $('<a class="tablink selected"  data-tab-id="thumbnail">').text(gt('Thumbnails'));
            var thumbnailTab = $('<li class="viewer-sidebar-thumbnailtab">').append(thumbnailTabLink);
            var thumbnailPane = $('<div class="viewer-sidebar-pane thumbnail-pane" data-tab-id="thumbnail">');

            tabsList.append(thumbnailTab, detailTab);
            this.$el.append(tabsList);
            tabsList.on('click', '.tablink', this.onTabClicked.bind(this));
            this.$el.append(thumbnailPane, detailPane);
        },

        /**
         * Sidebar scroll handler.
         * @param {jQuery.Event} event
         */
        onScrollHandler: function (event) {
            if (this.disposed) return;
            this.viewerEvents.trigger('viewer:sidebar:scroll', event);
        },

        /**
         * Sidebar tab click handler.
         * @param {jQuery.Event} event
         */
        onTabClicked: function (event) {
            var clickedTabId = $(event.target).attr('data-tab-id');
            this.activateTab(clickedTabId);
        },

        /**
         * Sidebar tab keydown handler.
         * @param {jQuery.Event} event
         */
        onTabKeydown: function (event) {
            event.stopPropagation();
            switch (event.which) {
                case 13: // enter
                    this.onTabClicked(event);
                    break;
                case 32: // space
                    this.onTabClicked(event);
                    break;
                // no default
            }
        },

        /**
         * Activates a sidebar tab and render its contents.
         *
         * @param {String} tabId
         *  The tab id string to be activated. Supported: 'thumbnail' and 'detail'.
         *
         * @param {Boolean} [forceRender = false]
         *  If set to 'true' renders (again) even if content is already present.
         */
        activateTab: function (tabId, forceRender) {
            var tabs = this.$('.tablink');
            var panes = this.$('.viewer-sidebar-pane');
            var activatedTab = tabs.filter('[data-tab-id="' + tabId + '"]');
            var activatedPane = panes.filter('[data-tab-id="' + tabId + '"]');

            tabs.removeClass('selected');
            panes.addClass('hidden');
            activatedTab.addClass('selected');
            activatedPane.removeClass('hidden');

            // render the tab contents
            switch (tabId) {
                case 'detail':
                    if (forceRender || this.$('.sidebar-panel').length === 0) {
                        this.renderSections();
                    }
                    break;
                case 'thumbnail':
                    if (this.thumbnailView && (forceRender || this.$('.document-thumbnail').length === 0)) {
                        this.thumbnailView.render();
                    }
                    break;
                default: break;
            }

            // save last activated tab in office standalone mode
            if (this.standalone && (this.model.isOffice() || this.model.isPDF())) {
                ViewerSettings.setSidebarActiveTab(tabId);
            }
        },

        /**
         * Toggles the side bar depending on the state.
         *  A state of 'true' opens the panel, 'false' closes the panel and
         *  'undefined' toggles the side bar.
         *
         * @param {Boolean} [state]
         *  The panel state.
         */
        toggleSidebar: function (state) {
            // determine current state if undefined
            this.open = _.isUndefined(state) ? !this.open : Boolean(state);
            this.$el.toggleClass('open', this.open);
            this.viewerEvents.trigger('viewer:sidebar:change:state', this.open);

            if (this.open && this.$('.sidebar-panel').length === 0) {
                this.renderSections();
            }
        },

        /**
         * Sets a new model and renders the sections accordingly.
         *
         * @param {FilesAPI.Model} model.
         *  The new model.
         */
        setModel: function (model) {
            this.model = model || null;
            this.renderSections();
        },

        /**
         * Renders the sections for file meta information, file description
         * and version history.
         */
        renderSections: function () {

            // render sections only if side bar is open
            if (!this.model || !this.open) return;

            var detailPane = this.$('.detail-pane');
            var folder = folderApi.pool.models[this.model.get('folder_id')];
            // remove previous sections
            detailPane.empty();
            // remove dropzone handler
            if (this.zone) {
                this.zone.off();
                this.zone.remove();
                this.zone = null;
            }

            // load file details
            this.loadFileDetails();
            // add dropzone for drive files if the folder supports new versions
            if (this.model.isFile() && folder && folder.can('add:version')) {
                this.zone = new Dropzone.Inplace({
                    //#. %1$s is the filename of the current file
                    caption: gt('Drop new version of "%1$s" here', this.model.get('filename'))
                });
                // drop handler
                this.zone.on({
                    show: function () {
                        detailPane.addClass('hidden');
                    },
                    hide: function () {
                        detailPane.removeClass('hidden');
                    },
                    drop: this.onNewVersionDropped.bind(this)
                });
                detailPane.parent().append(this.zone.render().$el.addClass('abs'));
            }

            ext.point('io.ox/core/viewer/views/sidebarview/detail').invoke('draw', detailPane, ext.Baton({
                options: this.options,
                context: this,
                app: this.app,
                $el: detailPane,
                model: this.model,
                data: this.model.isFile() ? this.model.toJSON() : this.model.get('origData')
            }));
        },

        /**
         * Renders the sidebar container.
         *
         * @param {FilesAPI.Model} model.
         *  The initial model.
         */
        render: function (model) {
            // a11y
            this.$el.attr({ tabindex: -1, role: 'complementary', 'aria-label': gt('Details') });
            // set device type
            Util.setDeviceClass(this.$el);
            // attach the touch handlers
            if (this.$el.enableTouch) {
                this.$el.enableTouch({ selector: null, horSwipeHandler: this.onHorizontalSwipe.bind(this) });
            }
            // initially set model
            this.model = model;

            // init thumbnail view, but for popout viewer on desktop and tablets
            if (!this.thumbnailView && this.standalone && !_.device('smartphone')) {
                this.thumbnailView = new ThumbnailView({
                    el: this.$('.thumbnail-pane'),
                    model: this.model,
                    viewerEvents: this.viewerEvents
                });
            }

            // show tab navigation in office standalone mode
            if (this.standalone && !_.device('smartphone') && TypesUtil.isDocumentType(model)) {
                this.$('.viewer-sidebar-tabs').removeClass('hidden');
                var lastActivatedTab = ViewerSettings.getSidebarActiveTab();
                this.activateTab(lastActivatedTab, true);
            } else {
                this.activateTab('detail', true);
            }
            return this;
        },

        /**
         * Loads the file details, especially needed for the file description
         * and the number of versions.
         */
        loadFileDetails: function () {

            if (!this.model) return;

            // f.e. when used to preview file attachments in mail
            if (this.options.opt && this.options.opt.disableFileDetail) return;

            if (this.model.isFile()) {
                FilesAPI.get(this.model.toJSON()).done(function (file) {
                    // after loading the file details we set at least an empty string as description.
                    // in order to distinguish between 'the file details have been loaded but the file has no description'
                    // and 'the file details have not been loaded yet so we don't know if it has a description'.
                    if (!this.model) return;
                    if (_.isString(this.model.get('description'))) return;
                    var description = (file && _.isString(file.description)) ? file.description : '';
                    this.model.set('description', description);
                }.bind(this));
            }
        },

        /**
         * Handles new version drop.
         *
         * @param {Array} files.
         *  An array of File objects.
         */
        onNewVersionDropped: function (files) {

            // check for single item drop
            if (!_.isArray(files) || files.length !== 1) {
                notify({ error: gt('Drop only a single file as new version.') });
                return;
            }
            var self = this;
            var fileName = _.first(files).name;

            require(['io.ox/files/upload/main'], function (fileUpload) {
                var data = {
                    folder: self.model.get('folder_id'),
                    id: self.model.get('id'),
                    // If file already encrypted, update should also be encrypted
                    params: FilesAPI.versions.mustEncryptNewVersion(self.model, fileName) ? { 'cryptoAction': 'Encrypt' } : {}
                };
                var node = self.isViewer ? self.$el.parent().find('.viewer-displayer') : self.app.getWindowNode();
                fileUpload.setWindowNode(node);
                fileUpload.update.offer(_.first(files), data);
            });

        },

        /**
         * Handles horizontal swipe events.
         *
         * @param {String} phase
         *  The current swipe phase (swipeStrictMode is true, so we only get the 'end' phase)
         *
         * @param {jQuery.Event} event
         *  The jQuery tracking event.
         *
         * @param {Number} distance
         *  The swipe distance in pixel, the sign determines the swipe direction (left to right or right to left)
         *
         */
        onHorizontalSwipe: function (phase, event, distance) {
            //console.info('SidebarView.onHorizontalSwipe()', 'event phase:', phase, 'distance:', distance);

            if (distance > 0) {
                this.toggleSidebar();
            }
        },

        /**
         * Destructor function of this view.
         */
        onDispose: function () {
            this.$el.disableTouch();
            if (this.zone) {
                this.zone.off();
                this.zone = null;
            }
            this.model = null;
            this.thumbnailView = null;
        }
    });

    return SidebarView;
});
