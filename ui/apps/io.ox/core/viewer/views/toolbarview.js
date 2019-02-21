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
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/files/api',
    'io.ox/backbone/mini-views/helplink',
    'io.ox/core/tk/doc-converter-utils',
    'io.ox/core/viewer/util',
    'io.ox/core/viewer/settings',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (Dropdown, DisposableView, Ext, LinksPattern, ActionsPattern, FilesAPI, HelpLinkView, DocConverterUtils, Util, Settings, CoreSettings, gt) {

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */

    'use strict';

    // define constants
    var TOOLBAR_ID = 'io.ox/core/viewer/toolbar',
        TOOLBAR_LINKS_ID = TOOLBAR_ID + '/links',
        TOOLBAR_ACTION_ID = 'io.ox/core/viewer/actions/toolbar',
        TOOLBAR_ACTION_DROPDOWN_ID = TOOLBAR_ACTION_ID + '/dropdown';

    // define extension points for this ToolbarView
    var toolbarPoint = Ext.point(TOOLBAR_ID),
        // toolbar link meta object used to generate extension points later
        toolbarLinksMeta = {
            // high priority links
            'filename': {
                prio: 'hi',
                mobile: 'hi',
                ref: TOOLBAR_ACTION_ID + '/rename',
                title: gt('File name'),
                customize: function (baton) {
                    var displayName = baton.model.getDisplayName();
                    this.append(
                        // icon
                        !baton.context.standalone ?
                            $('<i class="fa" aria-hidden="true">').addClass(Util.getIconClass(baton.model)) :
                            null,
                        // filename
                        $('<span class="filename-label">').text(displayName)
                    ).attr({
                        role: 'button',
                        'aria-label': displayName
                    });

                    this.addClass('viewer-toolbar-filename').parent().addClass('pull-left');

                    // check if action is available
                    if (baton.model.isFile()) {
                        ActionsPattern.check('io.ox/files/actions/rename', [baton.data]).then(
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
                    }
                }
            },
            'zoomout': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-minus',
                label: gt('Zoom out'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomout',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomout').attr({
                        role: 'button',
                        'aria-label': gt('Zoom out')
                    });
                }
            },
            'zoomin': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-plus',
                label: gt('Zoom in'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomin',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomin').attr({
                        role: 'button',
                        'aria-label': gt('Zoom in')
                    });
                }
            },
            'zoomfitwidth': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Fit to screen width'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomfitwidth',
                customize: function () {
                    this.addClass('viewer-toolbar-fitwidth')
                        .attr({
                            'aria-label': gt('Fit to screen width')
                        });
                }
            },
            'zoomfitheight': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Fit to screen size'),
                section: 'zoom',
                ref: TOOLBAR_ACTION_ID + '/zoomfitheight',
                customize: function () {
                    this.addClass('viewer-toolbar-fitheight')
                        .attr({
                            'aria-label': gt('Fit to screen size')
                        });
                }
            },
            'autoplaystart': {
                prio: _.device('desktop') ? 'hi' : 'lo',
                mobile: 'lo',
                label: gt('Slideshow'),
                ref: TOOLBAR_ACTION_ID + '/autoplaystart',
                customize: function () {
                    this.addClass('viewer-toolbar-autoplay-start')
                        .attr({
                            'aria-label': gt('Run slideshow')
                        });
                }

            },
            'autoplaystop': {
                prio: _.device('desktop') ? 'hi' : 'lo',
                mobile: 'lo',
                label: gt('Stop slideshow'),
                ref: TOOLBAR_ACTION_ID + '/autoplaystop',
                customize: function () {
                    this.addClass('viewer-toolbar-autoplay-stop')
                        .attr({
                            'aria-label': gt('Stop slideshow')
                        });
                }

            },
            'togglesidebar': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-info-circle',
                label: gt('View details'),
                ref: TOOLBAR_ACTION_ID + '/togglesidebar',
                customize: function () {
                    this.addClass('viewer-toolbar-togglesidebar')
                        .attr({
                            role: 'button',
                            'aria-label': gt('View details')
                        });
                }
            },
            'popoutstandalone': {
                prio: 'hi',
                mobile: false,
                label: gt('Pop out'),
                icon: 'fa fa-external-link-square',
                ref: TOOLBAR_ACTION_ID + '/popoutstandalone',
                customize: function () {
                    this.addClass('viewer-toolbar-popoutstandalone')
                        .attr({
                            role: 'button',
                            'aria-label': gt('Pop out standalone viewer')
                        });
                }
            },
            'close': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-times',
                label: gt('Close'),
                ref: TOOLBAR_ACTION_ID + '/close',
                customize: function () {
                    this.addClass('viewer-toolbar-close')
                        .attr({
                            role: 'button',
                            'aria-label': gt('Close viewer')
                        })
                        .parent().addClass('pull-right');
                }
            }
        },
        // a map containing App <-> Links mapping
        linksMap = {
            drive: {
                'rename': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Rename'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/rename'
                },
                'editdescription': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Edit description'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/edit-description'
                },
                'download': {
                    prio: 'hi',
                    mobile: _.device('ios') ? 'lo' : 'hi',
                    icon: 'fa fa-download',
                    label: gt('Download'),
                    section: 'export',
                    ref: Util.getRefByModelSource('drive')
                },
                'open': {
                    prio: 'lo',
                    mobile: _.device('android') ? 'lo' : 'hi',
                    icon: 'fa fa-download',
                    label: gt('Open attachment'),
                    section: 'export',
                    ref: 'io.ox/files/actions/open'
                },
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Print as PDF'),
                    section: 'export',
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                // on smartphones the separate dropdown is broken up and the options are added to the actions dropdown
                'share': {
                    prio: 'hi',
                    icon: 'fa fa-user-plus',
                    label: gt('Share'),
                    title: gt('Share this file'),
                    ref: 'io.ox/files/dropdown/share',
                    customize: function (baton) {
                        var self = this;
                        this.append('<i class="fa fa-caret-down" aria-hidden="true"></i>');

                        new Dropdown({
                            el: this.parent().addClass('dropdown'),
                            $toggle: this,
                            $ul: LinksPattern.DropdownLinks({
                                ref: 'io.ox/files/links/toolbar/share',
                                wrap: false,
                                emptyCallback: function () {
                                    self.parent().hide();
                                }
                            }, baton)
                        }).render();
                    }
                },
                'invite': {
                    mobile: 'lo',
                    label: gt('Invite people'),
                    section: 'share',
                    ref: 'io.ox/files/actions/invite'
                },
                'sharelink': {
                    mobile: 'lo',
                    label: gt('Create sharing link'),
                    section: 'share',
                    ref: 'io.ox/files/actions/getalink'
                },
                'sendbymail': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Send by mail'),
                    section: 'share',
                    ref: 'io.ox/files/actions/send'
                },
                'addtoportal': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Add to portal'),
                    section: 'share',
                    ref: 'io.ox/files/actions/add-to-portal'
                },
                'addtofavorites': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Add to favorites'),
                    section: 'favorites',
                    ref: 'io.ox/files/favorites/add'
                },
                'removefromfavorites': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Remove from favorites'),
                    section: 'favorites',
                    ref: 'io.ox/files/favorites/remove'
                },
                'uploadnewversion': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Upload new version'),
                    section: 'import',
                    ref: 'io.ox/files/actions/upload-new-version'
                },
                'delete': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Delete'),
                    section: 'delete',
                    ref: 'io.ox/files/actions/delete'
                }
            },
            mail: {
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Print as PDF'),
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                'downloadmailattachment': {
                    prio: 'hi',
                    mobile: 'lo',
                    icon: 'fa fa-download',
                    label: gt('Download'),
                    ref: Util.getRefByModelSource('mail')
                },
                'savemailattachmenttodrive': {
                    prio: 'lo',
                    mobile: 'lo',
                    //#. %1$s is usually "Drive" (product name; might be customized)
                    label: gt('Save to %1$s', gt.pgettext('app', 'Drive')),
                    ref: 'io.ox/mail/actions/save-attachment'
                }
            },
            pim: {
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Print as PDF'),
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                'downloadmailattachment': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Download'),
                    ref: Util.getRefByModelSource('pim')
                },
                'savemailattachmenttodrive': {
                    prio: 'lo',
                    mobile: 'lo',
                    //#. %1$s is usually "Drive" (product name; might be customized)
                    label: gt('Save to %1$s', gt.pgettext('app', 'Drive')),
                    ref: 'io.ox/core/tk/actions/save-attachment'
                }
            },
            guardDrive: {
                'rename': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Rename'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/rename'
                },
                'eidt': {
                    prio: 'hi',
                    mobile: 'lo',
                    label: gt('Edit'),
                    ref: 'io.ox/files/actions/editor'
                },
                'editdescription': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Edit description'),
                    section: 'edit',
                    ref: 'io.ox/files/actions/edit-description'
                },
                'download': {
                    prio: 'hi',
                    mobile: 'lo',
                    icon: 'fa fa-download',
                    label: gt('Download'),
                    section: 'export',
                    ref: Util.getRefByModelSource('guardDrive')
                },
                'open': {
                    prio: 'lo',
                    mobile: 'hi',
                    icon: 'fa fa-download',
                    label: gt('Open attachment'),
                    section: 'export',
                    ref: 'oxguard/open'
                },
                'sendbymail': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Send by mail'),
                    section: 'share',
                    ref: 'oxguard/sendcopy'
                },
                'addtoportal': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Add to portal'),
                    section: 'share',
                    ref: 'io.ox/files/actions/add-to-portal'
                },
                'uploadnewversion': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Upload new version'),
                    section: 'import',
                    ref: 'io.ox/files/actions/upload-new-version'
                },
                'delete': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Delete'),
                    section: 'delete',
                    ref: 'io.ox/files/actions/delete'
                }
            },
            guardMail: {
            }
        };
    // create 3 extension points containing each sets of links for Drive, Mail, and PIM apps
    _.each(linksMap, function (appMeta, appName) {
        var index = 0,
            extId = TOOLBAR_LINKS_ID + '/' + appName,
            extPoint = Ext.point(extId),
            defaultMeta = _.copy(toolbarLinksMeta),
            completeMeta = _.extend(defaultMeta, appMeta);
        _.each(completeMeta, function (linkMeta, linkId) {
            linkMeta.id = linkId;
            linkMeta.index = (index += 100);
            extPoint.extend(new LinksPattern.Link(linkMeta));
        });
    });

    // define actions of this ToolbarView
    var Action = ActionsPattern.Action;

    new Action(TOOLBAR_ACTION_DROPDOWN_ID, {
        requires: function () { return true; },
        action: $.noop
    });

    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/print', {
        capabilities: 'document_preview',
        requires: function (e) {
            if (!e.collection.has('one')) {
                return false;
            }

            var model = e.baton.model;
            var meta = model.get('meta');
            var isError = meta && meta.document_conversion_error && meta.document_conversion_error.length > 0;

            if (isError) {
                return false;
            }

            if (model.isFile() && !e.collection.has('read')) {
                return false;
            }

            return (model.isOffice() || model.isPDF());
        },
        action: function (baton) {
            var documentPDFUrl = DocConverterUtils.getEncodedConverterUrl(baton.context.model);
            blankshield.open(documentPDFUrl, '_blank');
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/rename', {
        requires: function () {
            return true;
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/togglesidebar', {
        action: function (baton) {
            baton.context.onToggleSidebar();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/popoutstandalone', {
        capabilities: 'infostore',
        requires: function (e) {
            var model = e.baton.model;
            // no support for mail attachments and no popout for already popped out viewer
            return model.get('group') !== 'localFile' && !e.baton.context.standalone;
        },
        action: function (baton) {
            var fileModel;

            if (baton.model.isFile()) {
                fileModel = baton.model;
            } else {
                fileModel = { file: baton.data };
            }

            ox.launch('io.ox/files/detail/main', fileModel);
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/close', {
        action: function () {}
    });

    // define actions for the zoom function
    new Action(TOOLBAR_ACTION_ID + '/zoomin', {
        requires: function (e) {
            var model = e.baton.model;
            return model.isOffice() || model.isPDF() || model.isText() || model.isImage();
        },
        action: function (baton) {
            baton.context.onZoomIn();
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/zoomout', {
        requires: function (e) {
            var model = e.baton.model;
            return model.isOffice() || model.isPDF() || model.isText() || model.isImage();
        },
        action: function (baton) {
            baton.context.onZoomOut();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/zoomfitwidth', {
        requires: function (e) {
            var model = e.baton.model;
            return (model.isOffice() || model.isPDF() || model.isText()) && e.baton.context.standalone;
        },
        action: function (baton) {
            baton.context.viewerEvents.trigger('viewer:zoom:fitwidth');
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/zoomfitheight', {
        requires: function (e) {
            var model = e.baton.model;
            return (model.isOffice() || model.isPDF() || model.isText()) && e.baton.context.standalone;
        },
        action: function (baton) {
            baton.context.viewerEvents.trigger('viewer:zoom:fitheight');
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/autoplaystart', {
        requires: function (e) {
            var model = e.baton.model;
            var imageModelCount = model.collection.reduce(function (memo, model) { return (model.isImage() ? memo + 1 : memo); }, 0);
            var autoplayStarted = e.baton.context.autoplayStarted;

            return model.isImage() && !autoplayStarted && (imageModelCount >= 2);
        },
        action: function (baton) {
            baton.context.onAutoplayStart();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/autoplaystop', {
        requires: function (e) {
            var model = e.baton.model;
            var imageModelCount = model.collection.reduce(function (memo, model) { return (model.isImage() ? memo + 1 : memo); }, 0);
            var autoplayStarted = e.baton.context.autoplayStarted;

            return model.isImage() && autoplayStarted && (imageModelCount >= 2);
        },
        action: function (baton) {
            baton.context.onAutoplayStop();
        }
    });

    // define the Backbone view
    var ToolbarView = DisposableView.extend({

        className: 'viewer-toolbar',

        tagName: 'ul',

        events: {
            'click a.viewer-toolbar-close': 'onClose',
            'click a.viewer-toolbar-popoutstandalone': 'onClose',
            'click a.viewer-toolbar-filename': 'onRename',
            'keydown a.viewer-toolbar-filename': 'onRename'
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
            // give toolbar a standalone class if its in one
            this.$el.toggleClass('standalone', this.standalone);
            // the current autoplay state
            this.autoplayStarted = false;
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
            var POINT = 'io.ox/files/actions/rename',
                data = this.model.toJSON();
            ActionsPattern.check(POINT, [data]).done(function () {
                ActionsPattern.invoke(POINT, null, data);
            });
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
         * Handles when autoplay is started or stopped
         *
         * @param {Object} state
         */
        onAutoplayRunningStateChanged: function (state) {
            if (!state) { return; }

            this.autoplayStarted = state.autoplayStarted;
            this.onModelChange(this.model);
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

            this.renderQueued(model);

            return this;
        },

        /**
         * Render the DisplayerView in a queued version, because some extensionpoints are rendered asynchronous.
         * And calling toolbar.empty() before the toolbarpoint has not finished rendering may result in a race condition.
         * will only store the next model to draw, so we can skip models that are no longer valid
         */
        renderQueued: function (model) {
            if (this.currentlyDrawn) {
                this.nextToDraw = model;
            } else {
                this.currentlyDrawn = model;
                // draw toolbar
                var origData = model.get('origData'),
                    toolbar = this.$el.attr({ role: 'toolbar', 'aria-label': gt('Viewer Toolbar') }),
                    pageNavigation = toolbar.find('.viewer-toolbar-navigation'),
                    isDriveFile = model.isFile(),
                    toolbarTmp = toolbar.clone().empty(),
                    baton = Ext.Baton({
                        context: this,
                        $el: toolbarTmp,
                        model: model,
                        models: isDriveFile ? [model] : null,
                        data: isDriveFile ? model.toJSON() : origData,
                        openedBy: this.openedBy,
                        favorites: CoreSettings.get('favorites/infostore', [])
                    }),
                    appName = model.get('source'),
                    self = this,
                    funcName = toolbarPoint.has(appName) ? 'replace' : 'extend';

                // remove listener from previous model
                if (this.model) {
                    this.stopListening(this.model, 'change');
                }
                // save current data as view model
                this.model = model;
                this.stopListening(this.model);
                this.listenTo(this.model, 'change', this.onModelChange);

                // listener for added/removed favorites
                this.stopListening(FilesAPI);
                this.listenTo(FilesAPI, 'favorite:add favorite:remove', function (file) {
                    if (file.id === _.cid(model.toJSON())) {
                        self.onModelChange(FilesAPI.pool.get('detail').get(file.id));
                    }
                });

                // set device type
                Util.setDeviceClass(this.$el);
                // enable only the link set for the current app
                _.each(toolbarPoint.keys(), function (id) {
                    if (id === appName) {
                        toolbarPoint.enable(id);
                    } else {
                        toolbarPoint.disable(id);
                    }
                });
                //extend or replace toolbar extension point with the toolbar links
                toolbarPoint[funcName](new LinksPattern.InlineLinks({
                    id: appName,
                    dropdown: true,
                    compactDropdown: true,
                    ref: TOOLBAR_LINKS_ID + '/' + appName,
                    customize: function () {
                        // workaround for correct TAB traversal order:
                        // move the close button 'InlineLink' to the right of the 'InlineLinks Dropdown' manually.
                        if (self.disposed) return;
                        // using .dropdown would also select other dropdowns, like the sharing dropdown
                        this.find('[data-action="more"]').parent().after(
                            this.find('.viewer-toolbar-togglesidebar, .viewer-toolbar-popoutstandalone, .viewer-toolbar-close').parent()
                        );
                    }
                }));

                var ret = toolbarPoint.invoke('draw', toolbarTmp, baton);
                $.when.apply(self, ret.value()).done(function () {
                    toolbar.empty().append(pageNavigation).append(toolbarTmp.children());
                    self.currentlyDrawn = null;
                    if (self.nextToDraw) {
                        var temp = self.nextToDraw;
                        self.nextToDraw = null;
                        self.renderQueued(temp);
                    }

                    if (_.device('smartphone')) return;
                    var helpLinkView = new HelpLinkView({
                        href: 'ox.appsuite.user.sect.drive.gui.viewer.html',
                        modal: true
                    });
                    toolbar.append(
                        $('<li role="presentation">').append(helpLinkView.render().$el)
                    );
                });
            }
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
            this.model = null;
        }

    });

    return ToolbarView;

});
