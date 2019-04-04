/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/portal/settings/widgetview', [
    'io.ox/core/extensions',
    'io.ox/backbone/views/modal',
    'io.ox/core/manifests',
    'io.ox/core/upsell',
    'gettext!io.ox/portal',
    'io.ox/backbone/views/disposable',
    'less!io.ox/portal/style'
], function (ext, ModalDialog, manifests, upsell, gt, DisposableView) {

    'use strict';

    var WidgetSettingsView = DisposableView.extend({

        tagName: 'li',

        className: 'settings-list-item',

        events: {
            'click [data-action="edit"]': 'onEdit',
            'click [data-action="change-color"]': 'onChangeColor',
            'click [data-action="toggle"]': 'onToggle',
            'click [data-action="delete"]': 'onDelete'
        },

        initialize: function () {
            this.$el.attr('data-widget-id', this.model.get('id'));
            // get explicit state
            var enabled = this.model.get('enabled');
            this.model.set('enabled', !!(enabled === undefined || enabled === true), { validate: true });
            // get default color
            var color = this.model.get('color');
            this.model.set('color', color === undefined || color === 'default' ? 'default' : color, { validate: true });
            // get widget options
            this.point = 'io.ox/portal/widget/' + this.model.get('type');
            this.options = ext.point(this.point + '/settings').options();
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });

            if (this.disposed) {
                return this;
            }
            ext.point('io.ox/portal/settings/detail/list-item').invoke('draw', this.$el.empty(), baton);
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
                this.model.set('enabled', !enabled, { validate: true });
                this.render();
            }
        },

        removeWidget: function () {
            this.model.collection.remove(this.model);
        },

        onDelete: function (e) {
            e.preventDefault();
            var self = this;
            // do we have custom data that might be lost?
            if (!_.isEmpty(this.model.get('props'))) {
                var dialog = new ModalDialog({ title: gt('Delete widget'), description: gt('Do you really want to delete this widget?') })
                .addCancelButton()
                .on('delete', function () { self.removeWidget(); })
                //#. Really delete portal widget - in contrast to "just disable"
                .addButton({ label: gt('Delete'), action: 'delete' });

                if (this.model.get('enabled')) {
                    //#. Just disable portal widget - in contrast to delete
                    dialog.on('disable', function () { self.onToggle(e); })
                        .addButton({ label: gt('Just disable widget'), action: 'disable', placement: 'left', className: 'btn-default' });
                }
                dialog.open();
            } else {
                this.removeWidget();
            }
        }
    });

    return WidgetSettingsView;
});
