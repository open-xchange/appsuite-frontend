/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/sidebarview', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/viewer/util',
    'io.ox/files/api',
    'io.ox/core/folder/api',
    'io.ox/core/dropzone',
    'io.ox/core/capabilities',
    'io.ox/core/viewer/settings',
    'io.ox/core/viewer/views/types/typesregistry',
    'io.ox/core/viewer/views/document/thumbnailview',
    'io.ox/core/viewer/views/sidebar/fileinfoview',
    'io.ox/core/viewer/views/sidebar/filedescriptionview',
    'io.ox/core/viewer/views/sidebar/fileversionsview',
    'io.ox/core/viewer/views/sidebar/uploadnewversionview',
    'io.ox/core/extensions',
    'gettext!io.ox/core/viewer',
    // prefetch cause all views need the base view
    'io.ox/core/viewer/views/sidebar/panelbaseview'
], function (DisposableView, Util, FilesAPI, folderApi, Dropzone, Capabilities, ViewerSettings, TypesRegistry, ThumbnailView, FileInfoView, FileDescriptionView, FileVersionsView, UploadNewVersionView, ext, gt) {

    'use strict';

    ext.point('io.ox/core/viewer/views/sidebarview/detail').extend({
        id: 'file-info',
        index: 100,
        draw: function (baton) {
            var fileInfoOpt = {
                model: baton.model,
                fixed: true,
                closable: baton.options.closable,
                disableFolderInfo: !!(baton.options.opt && baton.options.opt.disableFolderInfo)
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
            this.append(new FileDescriptionView({ model: baton.model }).render().el);
        }
    });

    ext.point('io.ox/core/viewer/views/sidebarview/detail').extend({
        id: 'file-versions',
        index: 300,
        draw: function (baton) {
            //check if supported
            if (!(baton.model.isFile() && folderApi.pool.models[baton.data.folder_id] && folderApi.pool.models[baton.data.folder_id].can('add:version'))) return;
            this.append(new FileVersionsView({ model: baton.model, viewerEvents: baton.context.viewerEvents, isViewer: baton.context.isViewer }).render().el);
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
            this.app = options.app;

            // listen to slide change and set fresh model
            this.listenTo(this.viewerEvents, 'viewer:displayeditem:change', this.setModel);

            // bind scroll handler
            this.$el.on('scroll', _.throttle(this.onScrollHandler.bind(this), 500));
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
         * tab id string to be activated. Supported: 'thumbnail' and 'detail'.
         */
        activateTab: function (tabId) {
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
                    this.renderSections();
                    break;
                case 'thumbnail':
                    if (this.$('.document-thumbnail').length === 0) {
                        var thumbnailView = new ThumbnailView({
                            el: this.$('.thumbnail-pane'),
                            model: this.model,
                            viewerEvents: this.viewerEvents
                        });
                        thumbnailView.render();
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
            this.renderSections();
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

            var detailPane = this.$('.detail-pane'), folder = folderApi.pool.models[this.model.get('folder_id')];
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
                isViewer: this.isViewer,
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

            // show tab navigation in office standalone mode
            if (this.standalone && !_.device('smartphone') && TypesRegistry.isDocumentType(model)) {
                this.$('.viewer-sidebar-tabs').removeClass('hidden');
                var lastActivatedThumbnail = ViewerSettings.getSidebarActiveTab();
                this.activateTab(lastActivatedThumbnail);
            } else {
                this.activateTab('detail');
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
            require(['io.ox/files/upload/main'], function (fileUpload) {
                var data = {
                    folder: self.model.get('folder_id'),
                    id: self.model.get('id'),
                    // If file already encrypted, update should also be encrypted
                    params: self.model.isEncrypted() ? { 'cryptoAction': 'Encrypt' } : {}
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
        }
    });

    return SidebarView;
});
