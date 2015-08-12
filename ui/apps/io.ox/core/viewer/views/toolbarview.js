/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Edy Haryono <edy.haryono@open-xchange.com>
 * @author Mario Schroeder <mario.schroeder@open-xchange.com>
 */
define('io.ox/core/viewer/views/toolbarview', [
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/files/api',
    'io.ox/mail/api',
    'io.ox/core/viewer/util',
    'io.ox/core/viewer/settings',
    'gettext!io.ox/core'
], function (Dropdown, DisposableView, Ext, LinksPattern, ActionsPattern, FilesAPI, MailAPI, Util, Settings, gt) {

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
                    var fileIcon = $('<i class="fa">').addClass(Util.getIconClass(baton.model)),
                        filenameLabel = $('<span class="filename-label">').text(baton.model.get('filename'));
                    this.addClass('viewer-toolbar-filename');
                    if (!baton.context.standalone) {
                        this.append(fileIcon);
                    }
                    this.append(filenameLabel).parent().addClass('pull-left');

                    if (baton.model.isFile()) {
                        this.attr('title', gt('File name, click to rename'));
                    } else {
                        this.attr('title', gt('File name'));
                    }
                }
            },
            'zoomout': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-minus',
                ref: TOOLBAR_ACTION_ID + '/zoomout',
                label: gt('Zoom out'),
                customize: function () {
                    this.addClass('viewer-toolbar-zoomout').attr({
                        tabindex: '1',
                        'aria-label': gt('Zoom out')
                    });
                }
            },
            'zoomin': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-search-plus',
                label: gt('Zoom in'),
                ref: TOOLBAR_ACTION_ID + '/zoomin',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomin').attr({
                        tabindex: '1',
                        'aria-label': gt('Zoom in')
                    });
                }
            },
            'zoomfitwidth': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Fit to screen width'),
                ref: TOOLBAR_ACTION_ID + '/zoomfitwidth',
                customize: function () {
                    var checkIcon = $('<i class="fa fa-fw fa-check fitzoom-check">'),
                        sectionLabel = $('<li class="dropdown-header" role="sectionhead">').text(gt('Zoom'));
                    this.before(sectionLabel);
                    this.prepend(checkIcon)
                        .addClass('viewer-toolbar-fitwidth')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('Fit to screen width')
                        });
                }
            },
            'zoomfitheight': {
                prio: 'lo',
                mobile: 'lo',
                label: gt('Fit to screen size'),
                ref: TOOLBAR_ACTION_ID + '/zoomfitheight',
                customize: function () {
                    var checkIcon = $('<i class="fa fa-fw fa-check fitzoom-check">');
                    this.prepend(checkIcon)
                        .addClass('viewer-toolbar-fitheight').attr({
                            tabindex: '1',
                            'aria-label': gt('Fit to screen size')
                        });
                }
            },
            'launchpresenter': {
                prio: 'hi',
                mobile: 'lo',
                label: /*#. launch the presenter app */ gt.pgettext('presenter', 'Present'),
                icon: 'fa fa-picture-o',
                ref: TOOLBAR_ACTION_ID + '/launchpresenter',
                customize: function () {
                    this.addClass('viewer-toolbar-launchpresenter')
                    .attr({
                        tabindex: '1',
                        'aria-label': /*#. launch the presenter app */ gt.pgettext('presenter', 'Present')
                    });
                }
            },
            'togglesidebar': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-info-circle',
                ref: TOOLBAR_ACTION_ID + '/togglesidebar',
                customize: function () {
                    this.addClass('viewer-toolbar-togglesidebar')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('View details')
                        });
                }
            },
            'popoutstandalone': {
                prio: 'hi',
                mobile: 'hi',
                label: gt('Pop out'),
                icon: 'fa fa-external-link-square',
                ref: TOOLBAR_ACTION_ID + '/popoutstandalone',
                customize: function () {
                    this.addClass('viewer-toolbar-popoutstandalone')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('Pop out standalone viewer')
                        });
                }
            },
            'close': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-times',
                ref: TOOLBAR_ACTION_ID + '/close',
                customize: function () {
                    this.addClass('viewer-toolbar-close')
                        .attr({
                            tabindex: '1',
                            'aria-label': gt('Close')
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
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/editdescription'
                },
                'download': {
                    prio: 'hi',
                    mobile: 'lo',
                    icon: 'fa fa-download',
                    label: gt('Download'),
                    section: 'export',
                    ref: 'io.ox/files/actions/download'
                },
                'print': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Print'),
                    section: 'export',
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                },
                'share': {
                    prio: 'hi',
                    mobile: 'lo',
                    icon: 'fa fa-user-plus',
                    label: gt('Share'),
                    drawDisabled: true,
                    title: gt('Share selected files'),
                    ref: 'io.ox/files/dropdown/share',
                    customize: function (baton) {
                        var self = this;
                        this.append('<i class="fa fa-caret-down">');

                        this.after(
                            LinksPattern.DropdownLinks({
                                ref: 'io.ox/files/links/toolbar/share',
                                wrap: false,
                                //function to call when dropdown is empty
                                emptyCallback: function () {
                                    self.addClass('disabled')
                                        .attr({ 'aria-disabled': true })
                                        .removeAttr('href');
                                }
                            }, baton)
                        );

                        this.addClass('dropdown-toggle').attr({
                            'aria-haspopup': 'true',
                            'data-toggle': 'dropdown',
                            'role': 'button'
                        }).dropdown();

                        this.parent().addClass('dropdown');
                    }
                },
                'sendbymail': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Send by mail'),
                    section: 'share',
                    ref: 'io.ox/files/actions/send'
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
                    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/delete'
                }
            },
            mail: {
                'openmailattachment': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Open in browser tab'),
                    ref: 'io.ox/mail/actions/open-attachment'
                },
                'downloadmailattachment': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Download'),
                    ref: 'io.ox/mail/actions/download-attachment'
                },
                'savemailattachmenttodrive': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Save to Drive'),
                    ref: 'io.ox/mail/actions/save-attachment'
                },
                'sendmailattachmentasmail': {
                    prio: 'lo',
                    mobile: 'lo',
                    section: 'share',
                    label: gt('Send as mail'),
                    ref: 'io.ox/core/viewer/actions/toolbar/sendasmail'
                }
            },
            pim: {
                'openmailattachment': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Open in browser tab'),
                    ref: 'io.ox/core/tk/actions/open-attachment'
                },
                'downloadmailattachment': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Download'),
                    ref: 'io.ox/core/tk/actions/download-attachment'
                },
                'savemailattachmenttodrive': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Save to Drive'),
                    ref: 'io.ox/core/tk/actions/save-attachment'
                }
            },
            guard: {
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
    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/editdescription', {
        id: 'edit-description',
        action: function (baton) {
            var actionBaton = Ext.Baton({ data: baton.model.toJSON() });
            ActionsPattern.invoke('io.ox/files/actions/edit-description', null, actionBaton);
        }
    });
    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/delete', {
        id: 'delete',
        requires: function (e) {
            return !e.baton.context.standalone;
        },
        action: function (baton) {
            var actionBaton = Ext.Baton({ data: baton.model.toJSON() });
            ActionsPattern.invoke('io.ox/files/actions/delete', null, actionBaton);
        }
    });
    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/print', {
        id: 'print',
        requires: function (e) {
            var model = e.baton.model;
            return e.baton.context.standalone && (model.isOffice() || model.isPDF() || model.isText());
        },
        action: function (baton) {
            var convertParams = Util.getConvertParams(baton.context.model),
                documentPDFUrl = Util.getConverterUrl(convertParams);
            window.open(documentPDFUrl, '_blank');
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/rename', {
        id: 'rename',
        requires: function () {
            return true;
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/togglesidebar', {
        id: 'togglesidebar',
        action: function (baton) {
            baton.context.onToggleSidebar();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/popoutstandalone', {
        id: 'popoutstandalone',
        requires: function () {
            var currentApp = ox.ui.App.getCurrentApp().getName();
            // detail is the target of popoutstandalone, no support for mail attachments
            return currentApp !== 'io.ox/files/detail' && currentApp !== 'io.ox/mail';
        },
        action: function (baton) {
            var fileModel = baton.model;
            ox.launch('io.ox/files/detail/main', fileModel);
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/launchpresenter', {
        id: 'launchpresenter',
        capabilities: 'document_preview',
        requires: function (e) {
            return e.baton.model.isPresentation();
        },
        action: function (baton) {
            var fileModel = baton.model;
            ox.launch('io.ox/presenter/main', fileModel);
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/close', {
        id: 'close',
        action: function () {}
    });
    // define actions for the zoom function
    new Action(TOOLBAR_ACTION_ID + '/zoomin', {
        id: 'zoomin',
        requires: function (e) {
            var model = e.baton.model;
            return model.isOffice() || model.isPDF() || model.isText();
        },
        action: function (baton) {
            baton.context.$el.find('.fitzoom-check').hide();
            baton.context.onZoomIn();
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/zoomout', {
        id: 'zoomout',
        requires: function (e) {
            var model = e.baton.model;
            return model.isOffice() || model.isPDF() || model.isText();
        },
        action: function (baton) {
            baton.context.$el.find('.fitzoom-check').hide();
            baton.context.onZoomOut();
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/zoomfitwidth', {
        id: 'zoomfitwidth',
        requires: function (e) {
            var model = e.baton.model;
            return (model.isOffice() || model.isPDF() || model.isText()) && e.baton.context.standalone;
        },
        action: function (baton) {
            baton.context.$el.find('.fitzoom-check').removeClass('fa-check').addClass('fa-none').css({ display: 'inline-block' });
            $(this).find('.fitzoom-check').removeClass('fa-none').addClass('fa-check');
            baton.context.viewerEvents.trigger('viewer:zoom:fitwidth');
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/zoomfitheight', {
        id: 'zoomfitheight',
        requires: function (e) {
            var model = e.baton.model;
            return (model.isOffice() || model.isPDF() || model.isText()) && e.baton.context.standalone;
        },
        action: function (baton) {
            baton.context.$el.find('.fitzoom-check').removeClass('fa-check').addClass('fa-none').css({ display: 'inline-block' });
            $(this).find('.fitzoom-check').removeClass('fa-none').addClass('fa-check');
            baton.context.viewerEvents.trigger('viewer:zoom:fitheight');
        }
    });

    new Action(TOOLBAR_ACTION_ID + '/sendasmail', {
        id: 'sendasmail',
        requires: function (e) {
            var model = e.baton.model;
            return model.isOffice() || model.isPDF();
        },
        action: function (baton) {
            var viewedAttachment = baton.data;
            MailAPI.get({ id: viewedAttachment.mail.id, folder_id: viewedAttachment.mail.folder_id }).done(function (mail) {
                ox.registry.call('mail-compose', 'replyall', mail ).then(function (MailApp) {
                    // look for currently viewed attachment in the list of attachments of the source email
                    var attachmentToSend = _.find(mail.attachments, function (attachment) {
                        return attachment.id === viewedAttachment.id;
                    });
                    MailApp.app.model.get('attachments').add(attachmentToSend);
                });
            });
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
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
            // give toolbar a standalone class if its in one
            this.$el.toggleClass('standalone', this.standalone);
        },

        /**
         * Document load success handler.
         * - renders the page navigation in the toolbar.
         */
        onDocumentLoaded: function () {
            if (this.standalone &&  !_.device('smartphone')) {
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
        onRename: function (event) {
            if ((this.model.isFile()) && (event.which === 32 || event.which === 13 || event.type === 'click')) {
                event.preventDefault();
                ActionsPattern.invoke('io.ox/files/actions/rename', null, { data: this.model.toJSON() });
            }
        },

        /**
         * Publishes zoom-in event to the MainView event aggregator.
         */
        onZoomIn: function () {
            this.viewerEvents.trigger('viewer:zoom:in');
        },

        /**
         * Publishes zoom-out event to the MainView event aggregator.
         */
        onZoomOut: function () {
            this.viewerEvents.trigger('viewer:zoom:out');
        },

        /**
         * Model change handler.
         * - rerenders the toolbar
         * @param {Object} changedModel
         *  an object with changed model attributes.
         */
        onModelChange: function (changedModel) {
            // ignore events that require no render
            if (!_.isString(this.model.previous('description')) && changedModel.get('description') === '') {
                return;
            }
            this.render(changedModel);
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
            // draw toolbar
            var origData = model.get('origData'),
                toolbar = this.$el.attr({ role: 'menu', 'aria-label': gt('Viewer Toolbar') }),
                pageNavigation = toolbar.find('.viewer-toolbar-navigation'),
                isDriveFile = model.isFile(),
                baton = Ext.Baton({
                    context: this,
                    $el: toolbar,
                    model: model,
                    models: isDriveFile ? [model] : null,
                    data: isDriveFile ? model.toJSON() : origData
                }),
                appName = model.get('source'),
                self = this;

            // remove listener from previous model
            if (this.model) {
                this.stopListening(this.model, 'change');
            }
            // save current data as view model
            this.model = model;
            this.listenTo(this.model, 'change', this.onModelChange);
            // set device type
            Util.setDeviceClass(this.$el);
            toolbar.empty().append(pageNavigation);
            // enable only the link set for the current app
            _.each(toolbarPoint.keys(), function (id) {
                if (id === appName) {
                    toolbarPoint.enable(id);
                } else {
                    toolbarPoint.disable(id);
                }
            });
            //extend toolbar extension point with the toolbar links
            toolbarPoint.extend(new LinksPattern.InlineLinks({
                id: appName,
                dropdown: true,
                compactDropdown: true,
                ref: TOOLBAR_LINKS_ID + '/' + appName
            }));
            toolbarPoint.invoke('draw', toolbar, baton);
            // workaround for correct TAB traversal order:
            // move the close button 'InlineLink' to the right of the 'InlineLinks Dropdown' manually.
            _.defer(function () {
                if (self.disposed) return;
                // using .dropdown would also select other dropdowns, like the sharing dropdown
                self.$el.find('[data-action="more"]').parent().after(
                    self.$('.viewer-toolbar-togglesidebar, .viewer-toolbar-popoutstandalone, .viewer-toolbar-close').parent()
                );
            });
            return this;
        },

        /**
         * Renders the document page navigation controls.
         */
        renderPageNavigation: function () {
            var prev = $('<a class="viewer-toolbar-navigation-button" tabindex="1" role="menuitem">')
                    .attr({ 'aria-label': gt('Previous page'), 'title': gt('Previous page') })
                    .append($('<i class="fa fa-arrow-up">')),
                next = $('<a class="viewer-toolbar-navigation-button" tabindex="1" role="menuitem">')
                    .attr({ 'aria-label': gt('Next page'), 'title': gt('Next page') })
                    .append($('<i class="fa fa-arrow-down">')),
                pageInput = $('<input type="text" class="viewer-toolbar-page" tabindex="1" role="textbox">'),
                pageInputWrapper = $('<div class="viewer-toolbar-page-wrapper">').append(pageInput),
                totalPage = $('<div class="viewer-toolbar-page-total">'),
                group = $('<li class="viewer-toolbar-navigation" role="presentation">'),
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
            function onInputKeydown(event) {
                event.stopPropagation();
                var keyCode = event.which;
                if (keyCode === 13 || keyCode === 27) {
                    self.$el.parent().focus();
                }
            }
            function onInputChange(event, options) {
                var options = _.extend({ preventPageScroll: false }, options),
                    newValue = parseInt($(this).val()),
                    oldValue = parseInt($(this).attr('data-page-number')),
                    pageTotal = parseInt($(this).attr('data-page-total'));
                if (isNaN(newValue)) {
                    $(this).val(oldValue);
                    return;
                }
                if (newValue <= 0 ) {
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
            pageInput.on('keydown', onInputKeydown).on('change', onInputChange);
            prev.on('click', onPrevPage);
            next.on('click', onNextPage);
            group.append(prev, next, pageInputWrapper, totalPage)
                .toggleClass('sidebar-offset', Settings.getSidebarOpenState());
            this.$el.prepend(group);
        },

        /**
         * Destructor of this view
         */
        disposeView: function () {
            this.model = null;
        }

    });

    return ToolbarView;

});
