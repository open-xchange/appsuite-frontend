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
    'io.ox/core/extensions',
    'io.ox/core/extPatterns/links',
    'io.ox/core/extPatterns/actions',
    'io.ox/files/api',
    'io.ox/core/viewer/util',
    'gettext!io.ox/core'
], function (EventDispatcher, Dropdown, Ext, LinksPattern, ActionsPattern, FilesAPI, Util, gt) {

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */

    'use strict';

    var TOOLBAR_ID = 'io.ox/core/viewer/toolbar',
        TOOLBAR_LINKS_ID = TOOLBAR_ID + '/links',
        TOOLBAR_LINKS_DROPDOWN_ID = TOOLBAR_LINKS_ID + '/dropdown',
        TOOLBAR_ACTION_ID = 'io.ox/core/viewer/actions/toolbar',
        TOOLBAR_ACTION_DROPDOWN_ID = TOOLBAR_ACTION_ID + '/dropdown',
        ITEM_TYPE_FILE = 'file',
        ITEM_TYPE_MAIL_ATTACHMENT = 'mail-attachment',
        ITEM_TYPE_PIM_ATTACHMENT = 'pim-attachment',
        ACTION_REF_PREFIX = {
            '1': 'io.ox/core/tk/attachment',
            '4': 'io.ox/tasks',
            '7': 'io.ox/contacts'
        };

    // define extension points for this ToolbarView
    var toolbarPoint = Ext.point(TOOLBAR_ID),
        toolbarLinksPoint = Ext.point(TOOLBAR_LINKS_ID),
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
                        this.attr({ title: gt('Double click to rename'), 'aria-label': gt('Filename, double click to rename') })
                            .addClass('viewer-toolbar-rename');
                    }
                }
            },
            'functiondropdown': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-bars',
                ref: TOOLBAR_ACTION_DROPDOWN_ID,
                customize: function (baton) {
                    var self = this,
                        fileSource = baton.model.get('source'),
                        pimModule = baton.model.get('module') || '',
                        dropdownLinks = LinksPattern.DropdownLinks({
                            ref: TOOLBAR_LINKS_DROPDOWN_ID + '/' + fileSource + pimModule,
                            wrap: false,
                            //function to call when dropdown is empty
                            emptyCallback: function () {
                                self.addClass('disabled')
                                    .attr({ 'aria-disabled': true })
                                    .removeAttr('href');
                            }
                        }, baton);
                    this.append('<i class="fa fa-caret-down">')
                        .after(dropdownLinks.addClass('dropdown-menu-right'))
                        .addClass('dropdown-toggle viewer-toolbar-dropdown')
                        .attr({ 'aria-haspopup': 'true', 'data-toggle': 'dropdown', 'role': 'button', 'tabindex': '1', 'title': gt('More functions'), 'aria-label': gt('More functions') })
                        .dropdown();
                    this.parent().addClass('dropdown');
                }
            },
            'togglesidebar': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-info-circle',
                ref: TOOLBAR_ACTION_ID + '/togglesidebar',
                customize: function () {
                    this.addClass('viewer-toolbar-togglesidebar').attr({ tabindex: '1', title: gt('View details'), 'aria-label': gt('View details') });
                }
            },
            'close': {
                prio: 'hi',
                mobile: 'hi',
                icon: 'fa fa-times',
                ref: TOOLBAR_ACTION_ID + '/close',
                customize: function () {
                    this.addClass('viewer-toolbar-close').attr({ tabindex: '1', title: gt('Close'), 'aria-label': gt('Close') });
                }
            }
        };

    // create extension points from the toolbar links meta object with the links ext pattern
    var index = 0;
    _(toolbarLinksMeta).each(function (extension, extensionIndex) {
        extension.id = extensionIndex;
        extension.index = (index += 100);
        toolbarLinksPoint.extend(new LinksPattern.Link(extension));
    });

    // extend toolbar extension point with the toolbar links
    toolbarPoint.extend(new LinksPattern.InlineLinks({
        attributes: {},
        classes: '',
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/core/viewer/toolbar/links'
    }));

    // define actions of this ToolbarView
    var Action = ActionsPattern.Action;
    new Action(TOOLBAR_ACTION_DROPDOWN_ID, {
        requires: function () { return true; },
        action: $.noop
    });
    new Action(TOOLBAR_ACTION_DROPDOWN_ID + '/editdescription', {
        id: 'edit-description',
        requires: function () {
            return true;
        },
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
        requires: function () {
            return true;
        },
        action: function () {
            //console.warn('ToolbarView.actions.print', baton);
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/togglesidebar', {
        id: 'togglesidebar',
        requires: function () {
            return true;
        },
        action: function () {
            //console.warn('ToolbarView.actions.togglesidebar', baton);
        }
    });
    new Action(TOOLBAR_ACTION_ID + '/close', {
        id: 'close',
        requires: function () {
            return true;
        },
        action: function () {
            //console.warn('ToolbarView.actions.close', baton);
        }
    });

    // action links for the function dropdown for Drive files
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_FILE, {
        index: 80,
        id: 'rename',
        label: gt('Rename'),
        section: 'edit',
        ref: 'io.ox/files/actions/rename'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_FILE, {
        index: 90,
        id: 'editdescription',
        label: gt('Edit description'),
        section: 'edit',
        ref: TOOLBAR_ACTION_DROPDOWN_ID + '/editdescription'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_FILE, {
        index: 100,
        id: 'share',
        label: gt('Share'),
        section: 'export',
        ref: 'io.ox/files/icons/share'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_FILE, {
        index: 200,
        id: 'download',
        label: gt('Download'),
        section: 'export',
        ref: 'io.ox/files/actions/download'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_FILE, {
        index: 300,
        id: 'print',
        label: gt('Print'),
        section: 'export',
        ref: TOOLBAR_ACTION_DROPDOWN_ID + '/print'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_FILE, {
        index: 400,
        id: 'delete',
        label: gt('Delete'),
        section: 'delete',
        ref: 'io.ox/files/actions/delete'
    });

    // action links of the function dropdown for mail attachments
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_MAIL_ATTACHMENT, {
        index: 100,
        id: 'open',
        label: gt('Open in browser tab'),
        ref: 'io.ox/mail/actions/open-attachment'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_MAIL_ATTACHMENT, {
        index: 200,
        id: 'download',
        label: gt('Download'),
        ref: 'io.ox/mail/actions/download-attachment'
    });
    new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_MAIL_ATTACHMENT, {
        index: 300,
        id: 'save',
        label: gt('Save to Drive'),
        ref: 'io.ox/mail/actions/save-attachment'
    });

    // action links of the function dropdown for pim attachments
    _.each(ACTION_REF_PREFIX, function (prefix, moduleId) {
        new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_PIM_ATTACHMENT + moduleId, {
            index: 100,
            id: 'open',
            label: gt('Open in browser tab'),
            ref: prefix + '/actions/open-attachment'
        });
        new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_PIM_ATTACHMENT + moduleId, {
            index: 200,
            id: 'download',
            label: gt('Download'),
            ref: prefix + '/actions/download-attachment'
        });
        new LinksPattern.ActionLink(TOOLBAR_LINKS_DROPDOWN_ID + '/' + ITEM_TYPE_PIM_ATTACHMENT + moduleId, {
            index: 300,
            id: 'save',
            label: gt('Save to Drive'),
            ref: prefix + '/actions/save-attachment'
        });
    });

    // define the Backbone view
    var ToolbarView = Backbone.View.extend({

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
            this.$el.on('dispose', this.dispose.bind(this));
            this.listenTo(EventDispatcher, 'viewer:displayeditem:change', function (data) {
                //console.warn('SidebarbarView viewer:displayeditem:change', data);
                this.render(data);
            });
            this.render();
        },

        onClose: function () {
            //console.info('ToolbarView.onClose()');
            this.trigger('close');
        },

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

        render: function (data) {
            //console.warn('ToolbarView.render()', data, this);
            if (!data || !data.model) { return this; }
            // draw toolbar
            var toolbar = this.$el.attr({ role: 'menu', 'aria-label': gt('Viewer Toolbar') }),
                baton = Ext.Baton({ $el: toolbar, model: data.model, data: data.model.get('origData') });
            this.model = data.model;
            // set device type
            Util.setDeviceClass(this.$el);
            toolbar.empty();
            Ext.point('io.ox/core/viewer/toolbar').invoke('draw', toolbar, baton);
            return this;
        },

        dispose: function () {
            //console.info('ToolbarView.dispose()');
            this.stopListening();
            return this;
        }

    });

    return ToolbarView;

});
