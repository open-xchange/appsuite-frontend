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
    'io.ox/core/viewer/eventdispatcher',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/backbone/disposable',
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/files/api',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core'
], function (EventDispatcher, Dropdown, DisposableView, Ext, LinksPattern, ActionsPattern, FilesAPI, Util, gt) {

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
                mobile: 'lo',
                title: gt('File name'),
                customize: function (baton) {
                    //console.warn('ToolbarView.meta.customize()', baton);
                    var fileSource = baton.model.get('source'),
                        fileIcon = $('<i class="fa">').addClass(Util.getIconClass(baton.model)),
                        filenameLabel = $('<span class="filename-label">').text(baton.model.get('filename'));
                    this.addClass('viewer-toolbar-filename')
                        .attr('title', gt('File name'))
                        .append(fileIcon, filenameLabel)
                        .parent().addClass('pull-left');
                    if (fileSource === 'file') {
                        this.attr({
                            title: gt('Double click to rename'),
                            'aria-label': gt('Filename, double click to rename')
                        })
                            .addClass('viewer-toolbar-rename');
                    }
                }
            },
            'zoomout': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-search-minus',
                ref: TOOLBAR_ACTION_ID + '/zoomout',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomout').attr({
                        tabindex: '1',
                        title: gt('Zoom out'),
                        'aria-label': gt('Zoom out')
                    });
                }
            },
            'zoomin': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-search-plus',
                ref: TOOLBAR_ACTION_ID + '/zoomin',
                customize: function () {
                    this.addClass('viewer-toolbar-zoomin').attr({
                        tabindex: '1',
                        title: gt('Zoom in'),
                        'aria-label': gt('Zoom in')
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
                            title: gt('View details'),
                            'aria-label': gt('View details')
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
                            title: gt('Close'),
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
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Download'),
                    section: 'export',
                    ref: 'io.ox/files/actions/download'
                },
                //'print': {
                //    prio: 'lo',
                //    mobile: 'lo',
                //    label: gt('Print'),
                //    section: 'export',
                //    ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
                //},
                'share': {
                    prio: 'lo',
                    mobile: 'lo',
                    label: gt('Share'),
                    section: 'export',
                    ref: 'io.ox/files/icons/share'
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
            var actionBaton = Ext.Baton({ data: {
                id: baton.model.get('id'),
                folder_id: baton.model.get('folderId'),
                description: baton.model.get('description')
            }});
            ActionsPattern.invoke('io.ox/files/actions/edit-description', null, actionBaton);
        }
    });
    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/print', {
        id: 'print',
        action: function () {
            //console.warn('ToolbarView.actions.print', baton);
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/togglesidebar', {
        id: 'togglesidebar',
        action: function () {
            //console.warn('ToolbarView.actions.togglesidebar', baton);
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/close', {
        id: 'close',
        action: function () {
            //console.warn('ToolbarView.actions.close', baton);
        }
    });
    // define actions for the zoom function
    new Action(TOOLBAR_ACTION_ID + '/zoomin', {
        id: 'zoomin',
        requires: function (e) {
            return e.baton.model.isDocumentFile() && ox.debug;
        },
        action: function (baton) {
            EventDispatcher.trigger('viewer:document:zoomin', baton);
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/zoomout', {
        id: 'zoomout',
        requires: function (e) {
            return e.baton.model.isDocumentFile() && ox.debug;
        },
        action: function (baton) {
            EventDispatcher.trigger('viewer:document:zoomout', baton);
        }
    });

    // define the Backbone view
    var ToolbarView = DisposableView.extend({

        className: 'viewer-toolbar',

        tagName: 'ul',

        events: {
            'click a.viewer-toolbar-close': 'onClose',
            'click a.viewer-toolbar-togglesidebar': 'onToggleSidebar',
            'click a.viewer-toolbar-rename': 'onRename',
            'dblclick a.viewer-toolbar-rename': 'onRename',
            'keydown a.viewer-toolbar-rename': 'onRename'
        },

        initialize: function () {
            //console.info('ToolbarView.initialize()', options);
            // rerender on slide change
            this.listenTo(EventDispatcher, 'viewer:displayeditem:change', this.render.bind(this));
            // run own disposer function at global dispose
            this.on('dispose', this.disposeView.bind(this));
        },

        /**
         * Close the viewer.
         */
        onClose: function () {
            //console.info('ToolbarView.onClose()');
            this.trigger('close');
        },

        /**
         * Toggles the visibility of the sidebar.
         *
         * @param {Event} event
         */
        onToggleSidebar: function (event) {
            //console.warn('ToolbarView.onClose()', event);
            $(event.currentTarget).toggleClass('active');
            EventDispatcher.trigger('viewer:toggle:sidebar');
        },

        /**
         * Handler for the file rename event.
         * Invokes the file rename action on SPACE key, ENTER key or a mouse double click.
         *
         * @param {jQuery.Event} event
         */
        onRename: function (event) {
            //console.warn('TooölbarView.onRename()', event);
            var fileSource = this.model.get('source');
            if (fileSource === 'file' && (event.which === 32 || event.which === 13 || event.type === 'dblclick' || (_.device('smartphone || tablet') && event.type === 'click'))) {
                event.preventDefault();
                ActionsPattern.invoke('io.ox/files/actions/rename', null, { data: this.model.get('origData') });
            }
        },

        /**
         * Renders the toolbar.
         *
         * @param {Object} data
         *  an object containing the active viewer model
         *
         * @returns {ToolbarView} toolbarView
         *  this view object itself.
         */
        render: function (data) {
            //console.warn('ToolbarView.render()', data, this);
            if (!data || !data.model) { return this; }
            // draw toolbar
            var origData = data.model.get('origData'),
                toolbar = this.$el.attr({ role: 'menu', 'aria-label': gt('Viewer Toolbar') }),
                baton = Ext.Baton({
                    $el: toolbar,
                    model: data.model,
                    models: origData instanceof Backbone.Model ? [origData] : null,
                    data: origData instanceof Backbone.Model ? origData.toJSON() : origData
                }),
                appName = data.model.get('source');
            // save current data as view model
            this.model = data.model;
            // set device type
            Util.setDeviceClass(this.$el);
            toolbar.empty();
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
                ref: TOOLBAR_LINKS_ID + '/' + appName
            }));
            toolbarPoint.invoke('draw', toolbar, baton);
            return this;
        },

        /**
         * Destructor of this view
         */
        disposeView: function () {
            //console.warn('ToolbarView.disposeView()');
        }

    });

    return ToolbarView;

});
