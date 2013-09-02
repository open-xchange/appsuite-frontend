/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/widgetview',
    ['io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'io.ox/core/manifests',
     'io.ox/core/upsell',
     'gettext!io.ox/portal',
     'less!io.ox/portal/style.less'
    ], function (ext, dialogs, manifests, upsell, gt) {

    'use strict';

    var WidgetSettingsView = Backbone.View.extend({

        tagName: 'li',

        className: "widget-settings-view",

        events: {
            'click [data-action="edit"]': 'onEdit',
            'click [data-action="change-color"]': 'onChangeColor',
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="remove"]': 'onRemove'
        },

        initialize: function () {
            this.$el.attr('data-widget-id', this.model.get('id'));
            // get explicit state
            var enabled = this.model.get('enabled');
            this.model.set('enabled', !!(enabled === undefined || enabled === true), {validate: true});
            // get default color
            var color = this.model.get('color');
            this.model.set('color', color === undefined || color === 'default' ? 'black' : color, {validate: true});
            // get widget options
            this.point = 'io.ox/portal/widget/' + this.model.get('type');
            this.options = ext.point(this.point + '/settings').options();
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/portal/settings/detail/view').invoke('draw', this.$el.empty(), baton);
            return this;
        },

        edit: function () {
            if (_.isFunction(this.options.edit)) {
                this.options.edit(this.model, this);
            }
        },

        onEdit: function (e) {
            e.preventDefault();
            this.edit();
        },

        onChangeColor: function (e) {
            e.preventDefault();
            var node = $(e.target),
                color = node.attr('data-color') ? node.attr('data-color') : node.parent().attr('data-color');
            this.model.set('color', color);
            this.render();
        },

        onToggle: function (e) {

            e.preventDefault();

            var enabled = this.model.get('enabled'),
                type = this.model.get('type'),
                requires = manifests.manager.getRequirements('plugins/portal/' + type + '/register');

            // upsell check
            if (!enabled && !upsell.any(requires)) {
                // trigger global upsell event
                upsell.trigger({
                    type: 'portal-widget',
                    id: type,
                    missing: upsell.missing(requires)
                });
            } else {
                // toggle widget
                this.model.set('enabled', !enabled, {validate: true});
                this.render();
            }
        },

        removeWidget: function () {
            this.model.collection.remove(this.model);
            this.remove();
        },

        onRemove: function (e) {
            e.preventDefault();
            var self = this, dialog;
            // do we have custom data that might be lost?
            if (!_.isEmpty(this.model.get('props'))) {
                var dialog = new dialogs.ModalDialog()
                .header($("<h4>").text(gt('Delete widget')))
                .append($('<span>').text(gt('Do you really want to delete this widget?')))
                .addPrimaryButton('delete',
                    //#. Really delete portal widget - in contrast to "just disable"
                    gt('Delete')
                )
                .addButton('cancel', gt('Cancel'));
                if (this.model.get('enabled')) {
                    dialog.addAlternativeButton('disable',
                        //#. Just disable portal widget - in contrast to delete
                        gt('Just disable widget')
                    );
                }
                dialog.show().done(function (action) {
                    if (action === 'delete') {
                        self.removeWidget();
                    } else if (action === 'disable') {
                        self.onToggle(e);
                    }
                });
            } else {
                this.removeWidget();
            }
        }
    });

    return WidgetSettingsView;
});
