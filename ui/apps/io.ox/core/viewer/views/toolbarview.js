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
    'gettext!io.ox/core'
], function (EventDispatcher, Dropdown, Ext, Links, gt) {

    /**
     * The ToolbarView is responsible for displaying the top toolbar,
     * with all its functions buttons/widgets.
     */

    'use strict';

    // define extension points for this ToolbarView
    var toolbarPoint = Ext.point('io.ox/core/viewer/toolbar'),
        toolbarLinksPoint = Ext.point('io.ox/core/viewer/toolbar/links'),
        // toolbar link meta object used to generate extension points later
        toolbarLinksMeta = {
            // high priority links
            'close': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-times',
                label: gt('Close viewer'),
                ref: 'io.ox/core/viewer/actions/close'
            },
            'togglesidebar': {
                prio: 'hi',
                mobile: 'lo',
                icon: 'fa fa-info-circle',
                label: gt('See file detail'),
                ref: 'io.ox/core/viewer/actions/togglesidebar'
            },
            // low priority links, will be shown in a dropdown.
            'share': {
                prio: 'lo',
                mobile: 'lo',
                icon: 'fa fa-share-alt',
                label: gt('Share'),
                ref: 'io.ox/core/viewer/actions/share'
            },
            'download': {
                prio: 'lo',
                mobile: 'lo',
                icon: 'fa fa-download',
                label: gt('Download'),
                ref: 'io.ox/core/viewer/actions/download'
            },
            'print': {
                prio: 'lo',
                mobile: 'lo',
                icon: 'fa fa-print',
                label: gt('Print'),
                ref: 'io.ox/core/viewer/actions/print'
            },
            'delete': {
                prio: 'lo',
                mobile: 'lo',
                icon: 'fa fa-trash-o',
                label: gt('Delete'),
                ref: 'io.ox/core/viewer/actions/delete'
            }
        };

    // create extension points from the toolbar links meta object with the links ext pattern
    var index = 0;
    _(toolbarLinksMeta).each(function (extension, extensionIndex) {
        extension.id = extensionIndex;
        extension.index = (index += 100);
        toolbarLinksPoint.extend(new Links.Link(extension));
    });

    // extend toolbar extension point with the toolbar links
    toolbarPoint.extend(new Links.InlineLinks({
        attributes: {},
        classes: '',
        // always use drop-down
        dropdown: true,
        index: 200,
        id: 'toolbar-links',
        ref: 'io.ox/core/viewer/toolbar/links'
    }));

    // define actions of this ToolbarView
    var Action = Links.Action;

    // high priority actions
    new Action('io.ox/core/viewer/actions/togglesidebar', {
        id: 'togglesidebar',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.warn('ToolbarView.actions.togglesidebar', baton);
        }
    });

    new Action('io.ox/core/viewer/actions/close', {
        id: 'close',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.warn('ToolbarView.actions.close', baton);
        }
    });

    // low priority actions
    new Action('io.ox/core/viewer/actions/share', {
        id: 'share',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.warn('ToolbarView.actions.share', baton);
        }
    });

    new Action('io.ox/core/viewer/actions/download', {
        id: 'download',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.warn('ToolbarView.actions.download', baton);
        }
    });

    new Action('io.ox/core/viewer/actions/print', {
        id: 'print',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.warn('ToolbarView.actions.print', baton);
        }
    });

    new Action('io.ox/core/viewer/actions/delete', {
        id: 'delete',
        requires: function () {
            return true;
        },
        action: function (baton) {
            console.warn('ToolbarView.actions.delete', baton);
        }
    });

    // define the Backbone view
    var ToolbarView = Backbone.View.extend({

        className: 'viewer-toolbar',

        tagName: 'ul',

        events: {
            'click a[data-action="close"]': 'onClose',
            'click a[data-action="togglesidebar"]': 'onToggleSidebar'
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

        onToggleSidebar: function () {
            //console.info('ToolbarView.onClose()');
            this.$el.find('#viewer-toggle-sidebar').toggleClass('active');
            EventDispatcher.trigger('viewer:toggle:sidebar');
        },

        render: function (data) {
            //console.warn('ToolbarView.render()', data, this);
            if (!data || !data.model) { return this; }
            // draw toolbar
            var toolbar = this.$el,
                baton = Ext.Baton({ $el: toolbar, model: data.model }),
                fileNameLabel = $('<li id="filename">');
            toolbar.empty();
            fileNameLabel.text(data.model.get('filename'));
            toolbar.append(fileNameLabel);
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
