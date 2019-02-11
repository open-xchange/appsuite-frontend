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
/* global blankshield */
define('io.ox/core/viewer/views/toolbarview', [
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/views/disposable',
    'io.ox/backbone/views/toolbar',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'io.ox/files/api',
    'io.ox/core/tk/doc-converter-utils',
    'io.ox/core/viewer/util',
    'io.ox/core/viewer/settings',
    'gettext!io.ox/core'
], function (Dropdown, DisposableView, ToolbarView, Ext, actionsUtil, FilesAPI, DocConverterUtils, Util, Settings, gt) {

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */

    'use strict';

    // define constants
    var TOOLBAR_ID = 'io.ox/core/viewer/toolbar',
        TOOLBAR_LINKS_ID = TOOLBAR_ID + '/links',
        TOOLBAR_ACTION_ID = 'io.ox/core/viewer/actions/toolbar',
        TOOLBAR_ACTION_DROPDOWN_ID = TOOLBAR_ACTION_ID + '/dropdown',
        // define extension points for this ToolbarView
        // toolbarPoint = Ext.point(TOOLBAR_ID),
        // toolbar link meta object used to generate extension points later
        toolbarLinksMeta = {
            // high priority links
            'filename': {
                prio: 'hi',
                mobile: 'hi',
                ref: TOOLBAR_ACTION_ID + '/rename',
                title: gt('File name'),
                customize: (function () {

                    var RenameView = DisposableView.extend({
                        initialize: function (options) {
                            this.standalone = options.standalone;
                            this.listenTo(this.model, 'change', this.render);
                            this.$el.addClass('viewer-toolbar-filename');
                        },
                        render: function () {
                            this.$el.empty().append(
                                // icon
                                !this.standalone ? $('<i class="fa" aria-hidden="true">').addClass(Util.getIconClass(this.model)) : null,
                                // filename
                                $('<span class="filename-label">').text(this.model.getDisplayName())
                            );
                            return this;
                        }
                    });

                    return function (baton) {

                        new RenameView({ el: this, model: baton.model, standalone: baton.standalone }).render();
                        this.parent().addClass('align-left');

                        // check if action is available
                        if (!baton.model.isFile()) return;

                        actionsUtil.checkAction('io.ox/files/actions/rename', baton.data).then(
                            function yep() {
                                this.attr({
                                    'data-original-title': gt('Rename File'),
                                    'data-placement': 'bottom'
                                });
                                this.tooltip();
                            }.bind(this),
                            function nope() {
                                this.addClass('disabled');
                            }.bind(this)
                        );
                    };
                }())
            },
            'zoomout': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-minus',
                title: gt('Zoom out'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomout',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomout');
                }
            },
            'zoomin': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-plus',
                title: gt('Zoom in'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomin',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomin');
                }
            },
            'zoomfitwidth': {
                prio: 'lo',
                mobile: 'lo',
                title: gt('Fit to screen width'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomfitwidth',
                customize: function () {
                    this.addClass('viewer-toolbar-fitwidth');
                }
            },
            'zoomfitheight': {
                prio: 'lo',
                mobile: 'lo',
                title: gt('Fit to screen size'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomfitheight',
                customize: function () {
                    this.addClass('viewer-toolbar-fitheight');
                }
            },
            'autoplaystart': {
                prio: _.device('desktop') ? 'hi' : 'lo',
                mobile: 'lo',
                icon: 'fa fa-play',
                tooltip: gt('Run slideshow'),
                ref: TOOLBAR_ACTION_ID + '/autoplaystart',
                customize: function () {
                    this.addClass('viewer-toolbar-autoplay-start');
                }
            },
            'autoplaystop': {
                prio: _.device('desktop') ? 'hi' : 'lo',
                mobile: 'lo',
                title: gt('Stop slideshow'),
                ref: TOOLBAR_ACTION_ID + '/autoplaystop',
                customize: function () {
                    this.addClass('viewer-toolbar-autoplay-stop');
                }
            }
        },
        rightSide = {
            'togglesidebar': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-info-circle',
                title: gt('View details'),
                ref: TOOLBAR_ACTION_ID + '/togglesidebar',
                customize: function () {
                    this.addClass('viewer-toolbar-togglesidebar');
                }
            },
            'popoutstandalone': {
                prio: 'hi',
                mobile: false,
                icon: 'fa fa-external-link-square',
                title: gt('Pop out standalone viewer'),
                ref: TOOLBAR_ACTION_ID + '/popoutstandalone',
                customize: function () {
                    this.addClass('viewer-toolbar-popoutstandalone');
                }
            },
            'close': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-times',
                title: gt('Close'),
                tooltip: gt('Close viewer'),
                ref: TOOLBAR_ACTION_ID + '/close'
            }
        },
        // a map containing App <-> Links mapping
        linksMap = {
            drive: {
                'rename': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Rename'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/rename'
                },
                'editdescription': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Edit description'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/edit-description'
                },
                'download': {
                    prio: 'hi',
                    mobile: _.device('ios') ? 'lo' : 'hi',
                    icon: 'fa fa-download',
                    title: gt('Download'),
                    section: 'export',
                    ref: Util.getRefByModelSource('drive')
                },
                // on smartphones the separate dropdown is broken up and the options are added to the actions dropdown
                'share': {
                    prio: 'hi',
                    title: gt('Share'),
                    tooltip: gt('Share this file'),
                    dropdown: 'io.ox/files/toolbar/share',
                    customize: function () {
                        this.next().addclass('dropdown-menu-right');
                    }
                },
                'open': {
                    prio: 'lo',
                    mobile: _.device('android') ? 'lo' : 'hi',
                    //icon: _.device('android') ? '' : 'fa fa-download',
                    title: gt('Open attachment'),
                    section: 'export',
                    ref: 'io.ox/files/actions/open'
                },
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Print as PDF'),
                    section: 'export',
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                'invite': {
                    mobile: 'lo',
                    title: gt('Invite people'),
                    section: 'share',
                    ref: 'io.ox/files/actions/invite'
                },
                'sharelink': {
                    mobile: 'lo',
                    title: gt('Create sharing link'),
                    section: 'share',
                    ref: 'io.ox/files/actions/getalink'
                },
                'sendbymail': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Send by email'),
                    section: 'share',
                    ref: 'io.ox/files/actions/send'
                },
                'addtoportal': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Add to portal'),
                    section: 'share',
                    ref: 'io.ox/files/actions/add-to-portal'
                },
                'addtofavorites': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Add to favorites'),
                    section: 'favorites',
                    ref: 'io.ox/files/actions/favorites/add'
                },
                'removefromfavorites': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Remove from favorites'),
                    section: 'favorites',
                    ref: 'io.ox/files/actions/favorites/remove'
                },
                'uploadnewversion': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Upload new version'),
                    section: 'import',
                    ref: 'io.ox/files/actions/upload-new-version'
                },
                'delete': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Delete'),
                    section: 'delete',
                    ref: 'io.ox/files/actions/delete'
                }
            },
            mail: {
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Print as PDF'),
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                'downloadmailattachment': {
                    prio: 'hi',
                    mobile: 'lo',
                    icon: 'fa fa-download',
                    title: gt('Download'),
                    ref: Util.getRefByModelSource('mail')
                },
                'savemailattachmenttodrive': {
                    prio: 'lo',
                    mobile: 'lo',
                    //#. %1$s is usually "Drive" (product name; might be customized)
                    title: gt('Save to %1$s', gt.pgettext('app', 'Drive')),
                    ref: 'io.ox/mail/attachment/actions/save'
                }
            },
            pim: {
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Print as PDF'),
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                'downloadmailattachment': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Download'),
                    ref: Util.getRefByModelSource('pim')
                },
                'savemailattachmenttodrive': {
                    prio: 'lo',
                    mobile: 'lo',
                    //#. %1$s is usually "Drive" (product name; might be customized)
                    title: gt('Save to %1$s', gt.pgettext('app', 'Drive')),
                    ref: 'io.ox/core/tk/actions/save-attachment'
                }
            },
            guardDrive: {
                'rename': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Rename'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/rename'
                },
                'eidt': {
                    prio: 'hi',
                    mobile: 'lo',
                    title: gt('Edit'),
                    ref: 'io.ox/files/actions/editor'
                },
                'editdescription': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Edit description'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/edit-description'
                },
                'download': {
                    prio: 'hi',
                    mobile: 'lo',
                    icon: 'fa fa-download',
                    title: gt('Download'),
                    section: 'export',
                    ref: Util.getRefByModelSource('guardDrive')
                },
                'open': {
                    prio: 'lo',
                    mobile: 'hi',
                    icon: 'fa fa-download',
                    title: gt('Open attachment'),
                    section: 'export',
                    ref: 'oxguard/open'
                },
                'sendbymail': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Send by email'),
                    section: 'share',
                    ref: 'oxguard/sendcopy'
                },
                'addtoportal': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Add to portal'),
                    section: 'share',
                    ref: 'io.ox/files/actions/add-to-portal'
                },
                'uploadnewversion': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Upload new version'),
                    section: 'import',
                    ref: 'io.ox/files/actions/upload-new-version'
                },
                'delete': {
                    prio: 'lo',
                    mobile: 'lo',
                    title: gt('Delete'),
                    section: 'delete',
                    ref: 'io.ox/files/actions/delete'
                }
            },
            guardMail: {
            }
        };
    // create 3 extension points containing each sets of links for Drive, Mail, and PIM apps
    _(linksMap).each(function (appMeta, appName) {
        var index = 0,
            extId = TOOLBAR_LINKS_ID + '/' + appName,
            extPoint = Ext.point(extId),
            completeMeta = _.extend({}, toolbarLinksMeta, appMeta, rightSide);
        _(completeMeta).each(function (extension, id) {
            extPoint.extend(_.extend({ id: id, index: index += 100 }, extension));
        });
    });

    // define actions of this ToolbarView
    var Action = actionsUtil.Action;

    // tested: no
    new Action(TOOLBAR_ACTION_DROPDOWN_ID, {
        action: $.noop
    });

    // tested: no
    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/print', {
        capabilities: 'document_preview',
        collection: 'one',
        matches: function (baton) {
            var model = baton.model,
                meta = model.get('meta'),
                isError = meta && meta.document_conversion_error && meta.document_conversion_error.length > 0;
            if (isError) return false;
            if (model.isFile() && !baton.collection.has('read')) return false;
            return model.isOffice() || model.isPDF();
        },
        action: function (baton) {
            var documentPDFUrl = DocConverterUtils.getEncodedConverterUrl(baton.context.model);
            blankshield.open(documentPDFUrl, '_blank');
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/rename', {
        action: _.noop
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/togglesidebar', {
        action: function (baton) {
            baton.context.onToggleSidebar();
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/popoutstandalone', {
        capabilities: 'infostore',
        matches: function (baton) {
            var model = baton.model;
            // no support for mail attachments and no popout for already popped out viewer
            return model.get('group') !== 'localFile' && !baton.context.standalone;
        },
        action: function (baton) {
            var fileModel = baton.model.isFile() ? baton.model : { file: baton.data };
            ox.launch('io.ox/files/detail/main', fileModel);
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/close', {
        action: _.noop
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/zoomin', {
        matches: function (baton) {
            var model = baton.model;
            return model.isOffice() || model.isPDF() || model.isText() || model.isImage();
        },
        action: function (baton) {
            baton.context.onZoomIn();
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/zoomout', {
        matches: function (baton) {
            var model = baton.model;
            return model.isOffice() || model.isPDF() || model.isText() || model.isImage();
        },
        action: function (baton) {
            baton.context.onZoomOut();
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/zoomfitwidth', {
        matches: function (baton) {
            var model = baton.model;
            return (model.isOffice() || model.isPDF() || model.isText()) && baton.context.standalone;
        },
        action: function (baton) {
            baton.context.viewerEvents.trigger('viewer:zoom:fitwidth');
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/zoomfitheight', {
        matches: function (baton) {
            var model = baton.model;
            return (model.isOffice() || model.isPDF() || model.isText()) && baton.context.standalone;
        },
        action: function (baton) {
            baton.context.viewerEvents.trigger('viewer:zoom:fitheight');
        }
    });

    // tested: no
    new Action(TOOLBAR_ACTION_ID + '/autoplaystart', {
        matches: function (baton) {
            return supportsAutoPlay(baton, false);
        },
        action: function (baton) {
            baton.context.onAutoplayStart();
        }
    });

    // tested: noalign
    new Action(TOOLBAR_ACTION_ID + '/autoplaystop', {
        matches: function (baton) {
            return supportsAutoPlay(baton, true);
        },
        action: function (baton) {
            baton.context.onAutoplayStop();
        }
    });

    function supportsAutoPlay(baton, started) {
        if (baton.context.autoplayStarted !== started) return false;
        if (!baton.model.isImage()) return false;
        return imageCount(baton.model) >= 2;
    }

    function imageCount(model) {
        return model.collection.reduce(function (memo, model) {
            return (model.isImage() ? memo + 1 : memo);
        }, 0);
    }

    // define the Backbone view
    var ViewerToolbarView = DisposableView.extend({

        className: 'viewer-toolbar',

        events: {
            'click a[data-action="io.ox/core/viewer/actions/toolbar/close"]': 'onClose',
            'click a[data-action="io.ox/core/viewer/actions/toolbar/rename"]': 'onRename',
            'keydown a[data-action="io.ox/core/viewer/actions/toolbar/rename"]': 'onRename'
        },

        initialize: function (options) {
            _.extend(this, options);
            // rerender on slide change
            this.listenTo(this.viewerEvents, 'viewer:displayeditem:change', this.render);
            // show current page on the navigation page box
            this.listenTo(this.viewerEvents, 'viewer:document:loaded', this.onDocumentLoaded);
            this.listenTo(this.viewerEvents, 'viewer:document:pagechange', this.onPageChange);
            // listen to sidebar toggle for document navigation positioning
            this.listenTo(this.viewerEvents, 'viewer:sidebar:change:state', this.onSideBarToggled);
            // listen to autoplay events
            this.listenTo(this.viewerEvents, 'viewer:autoplay:state:changed', this.onAutoplayRunningStateChanged);
            // listen to added/removed favorites
            this.listenTo(FilesAPI, 'favorite:add favorite:remove', _.debounce(this.onFavoritesChange.bind(this), 10));


            api.on('favorite:add favorite:remove', _.debounce(function () {
                +                app.forceUpdateToolbar(app.listView.selection.get());
                +            }), 10);


            // give toolbar a standalone class if its in one
            this.$el.toggleClass('standalone', this.standalone);
            // the current autoplay state
            this.autoplayStarted = false;

            this.toolbar = new ToolbarView({ el: this.el, align: 'right' });
        },

        /**
         * Document load success handler.
         * - renders the page navigation in the toolbar.
         */
        onDocumentLoaded: function () {
            if (this.standalone && !_.device('smartphone')) {
                this.renderPageNavigation();
            }
        },

        /**
         * Toggle position offset when sidebar is opened/closed.
         *
         * @param {Boolean} state
         *  toggle state of the viewer sidebar.
         */
        onSideBarToggled: function (state) {
            this.$('.viewer-toolbar-navigation').toggleClass('sidebar-offset', state);
        },

        /**
         * Page change handler:
         * - updates page number in the page input control
         *
         * @param pageNumber
         * @param pageTotal
         */
        onPageChange: function (pageNumber, pageTotal) {
            var pageInput = this.$('.viewer-toolbar-page'),
                pageTotalDisplay = this.$('.viewer-toolbar-page-total');
            pageInput.val(pageNumber).attr('data-page-number', pageNumber).trigger('change', { preventPageScroll: true });
            if (pageTotal) {
                pageTotalDisplay.text(gt('of %1$d', pageTotal));
                pageInput.attr('data-page-total', pageTotal);
            }
        },

        /**
         * Close the viewer.
         */
        onClose: function (event) {
            event.preventDefault();
            event.stopPropagation();
            this.viewerEvents.trigger('viewer:close');
        },

        /**
         * Toggles the visibility of the sidebar.
         */
        onToggleSidebar: function () {
            this.viewerEvents.trigger('viewer:toggle:sidebar');
        },

        /**
         * Handler for the file rename event.
         * Invokes the file rename action on SPACE key, ENTER key or a mouse double click.
         *
         * @param {jQuery.Event} event
         */
        onRename: function (e) {
            if (!(e.which === 32 || e.which === 13 || e.type === 'click')) return;
            e.preventDefault();
            if (!this.model.isFile()) return;
            actionsUtil.invoke('io.ox/files/actions/rename', this.model.toJSON());
        },

        /**
         * Publishes zoom-in event to the MainView event aggregator.
         */
        onZoomIn: function () {
            if (this.model.isImage()) {
                this.viewerEvents.trigger('viewer:zoom:in:swiper');
            } else {
                this.viewerEvents.trigger('viewer:zoom:in');
            }
        },

        /**
         * Publishes zoom-out event to the MainView event aggregator.
         */
        onZoomOut: function () {
            if (this.model.isImage()) {
                this.viewerEvents.trigger('viewer:zoom:out:swiper');
            } else {
                this.viewerEvents.trigger('viewer:zoom:out');
            }
        },

        /**
         * Model change handler.
         * - rerenders the toolbar
         * @param {Object} changedModel
         *  an object with changed model attributes.
         */
        onModelChange: function (changedModel) {
            // ignore events that require no render
            if (changedModel.changed.description && (this.model.previous('description') !== changedModel.get('description'))) {
                return;
            }
            this.render(changedModel);
        },

        /**
         * Listener for added/removed favorites.
         * - rerenders the toolbar
         * @param {Object} file
         *  the file descriptor.
         */
        onFavoritesChange: function (file) {
            if (file.id === _.cid(this.model.toJSON())) {
                this.forceUpdateToolbar();
            }
        },

        /**
         * Handles when autoplay is started or stopped
         *
         * @param {Object} state
         */
        onAutoplayRunningStateChanged: function (state) {
            if (!state) { return; }

            this.autoplayStarted = state.autoplayStarted;
            this.forceUpdateToolbar();
        },

        /**
         * Publishes autoplay event to the MainView event aggregator.
         */
        onAutoplayStart: function () {
            this.viewerEvents.trigger('viewer:autoplay:toggle', 'running');
        },

        /**
         * Publishes autoplay event to the MainView event aggregator.
         */
        onAutoplayStop: function () {
            this.viewerEvents.trigger('viewer:autoplay:toggle', 'pausing');
        },

        /**
         * Renders this DisplayerView with the supplied model.
         *
         * @param {Object} model
         *  The file model object.
         *
         * @returns {ToolbarView} toolbarView
         *  this view object itself.
         */
        render: function (model) {

            if (!model) {
                console.error('Core.Viewer.ToolbarView.render(): no file to render');
                return this;
            }

            // update inner toolbar
            var appName = appName = model.get('source');

            // remove listener from previous model
            if (this.model) { this.stopListening(this.model, 'change'); }

            // save current data as view model
            this.model = model;

            // add listener for new model
            this.listenTo(this.model, 'change', this.onModelChange);

            // add CSS device class to $el for smartphones or tablets
            Util.setDeviceClass(this.$el);

            this.toolbar.setPoint(TOOLBAR_LINKS_ID + '/' + appName);
            this.updateToolbar();

            return this;
        },

        /**
         * Update inner toolbar.
         */
        updateToolbar: function () {
            if (!this.model) { return; }

            var isDriveFile = this.model.isFile();
            var modelJson = this.model.toJSON();

            this.toolbar
                // .setPoint(TOOLBAR_LINKS_ID + '/' + appName)
                .setSelection([modelJson], function () {
                    return {
                        context: this,
                        data: isDriveFile ? modelJson : this.model.get('origData'),
                        model: this.model,
                        models: isDriveFile ? [this.model] : null,
                        openedBy: this.openedBy
                    };
                }.bind(this));
        },

        /**
         * Force update of inner toolbar.
         */
        forceUpdateToolbar: function () {
            this.toolbar.selection = null;
            this.updateToolbar();
        },

        /**
         * Renders the document page navigation controls.
         */
        renderPageNavigation: function () {
            var prev = $('<a class="viewer-toolbar-navigation-button" role="button">')
                    .attr({ 'aria-label': gt('Previous page'), 'title': gt('Previous page') })
                    .append($('<i class="fa fa-arrow-up" aria-hidden="true">')),
                next = $('<a class="viewer-toolbar-navigation-button" role="button">')
                    .attr({ 'aria-label': gt('Next page'), 'title': gt('Next page') })
                    .append($('<i class="fa fa-arrow-down" aria-hidden="true">')),
                pageInput = $('<input type="text" class="viewer-toolbar-page" role="textbox">'),
                pageInputWrapper = $('<div class="viewer-toolbar-page-wrapper">').append(pageInput),
                totalPage = $('<div class="viewer-toolbar-page-total">'),
                group = $('<li class="viewer-toolbar-navigation" role="presentation">'),
                // #58229 - sidebar closed by default for shared files
                sidebarState = (this.isSharing) ? false : Settings.getSidebarOpenState(),
                self = this;

            function setButtonState(nodes, state) {
                if (state) {
                    $(nodes).removeClass('disabled').removeAttr('aria-disabled');
                } else {
                    $(nodes).addClass('disabled').attr('aria-disabled', true);
                }
            }
            function onPrevPage() {
                self.viewerEvents.trigger('viewer:document:previous');
            }
            function onNextPage() {
                self.viewerEvents.trigger('viewer:document:next');
            }
            function onInputKeydown(e) {
                e.stopPropagation();
                if (e.which === 13 || e.which === 27) {
                    self.$el.parent().focus();
                }
            }
            function onInputChange(event, options) {
                options = _.extend({ preventPageScroll: false }, options);
                var newValue = parseInt($(this).val(), 10),
                    oldValue = parseInt($(this).attr('data-page-number'), 10),
                    pageTotal = parseInt($(this).attr('data-page-total'), 10);
                if (isNaN(newValue)) {
                    $(this).val(oldValue);
                    return;
                }
                if (newValue <= 0) {
                    $(this).val(1);
                    newValue = 1;
                }
                if (newValue > pageTotal) {
                    $(this).val(pageTotal);
                    newValue = pageTotal;
                }
                setButtonState([prev[0], next[0]], true);
                if (newValue === 1) {
                    setButtonState(prev, false);
                }
                if (newValue === pageTotal) {
                    setButtonState(next, false);
                }
                $(this).attr('data-page-number', newValue);
                if (!options.preventPageScroll) {
                    self.viewerEvents.trigger('viewer:document:scrolltopage', newValue);
                }
            }
            function onClick() {
                $(this).select();
            }

            pageInput.on('keydown', onInputKeydown).on('change', onInputChange).on('click', onClick);
            prev.on('click', onPrevPage);
            next.on('click', onNextPage);
            group.append(prev, next, pageInputWrapper, totalPage)
                .toggleClass('sidebar-offset', sidebarState);
            this.$el.prepend(group);
        },

        /**
         * Destructor of this view
         */
        onDispose: function () {
            this.stopListening(FilesAPI);
            this.model = null;
        }

    });

    return ViewerToolbarView;

});
