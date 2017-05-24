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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/categories/picker', [
    'io.ox/mail/categories/api',
    'io.ox/backbone/mini-views/dropdown',
    'io.ox/core/extPatterns/actions',
    'gettext!io.ox/mail'
], function (api, Dropdown, actions, gt) {

    function getLabel() {
        return [$('<i class="fa fa-folder-open-o" aria-hidden="true">'), $('<span class="sr-only">').text(gt('Move to category'))];
    }

    var PickerDropdown = Dropdown.extend({

        tagName: 'li',

        renderToggle: function (node) {
            // replace toolbar icon
            node.closest('li').replaceWith(this.$el);
            // render container once
            if (this.rendered) return;
            this.render().$el.attr({ 'data-dropdown': 'category', role: 'presentation', tabindex: '-1' });
            this.rendered = true;
        },

        renderMenu: function (options) {
            this.$ul.empty();
            this.props = options.props;
            var data = [].concat(options.data);
            this.addCategories(data);
            this.addLinks(data);
        },

        addCategories: function (data) {

            var current = this.props.get('category_id'),
                list = api.collection.filter(function (model) {
                    return model.isEnabled() && model.id !== current;
                });

            if (!list.length) return;

            this.header(gt('Move to category'));
            _.each(list, function (model) {
                this.link(model.id, model.get('name'), $.proxy(this.onCategory, this, data));
            }.bind(this));
            this.divider();
        },

        addLinks: function (data) {
            this.link('move-to-folder', gt('Move to folder') + ' …', $.proxy(this.onLink, this, data));
        },

        onCategory: function (data, e) {

            var node = $(e.currentTarget),
                category = node.attr('data-name') || '0',
                name = node.text(),
                dropdown = node.closest('.dropdown'),
                source = this.props.get('category_id');

            api.move({
                data: data,
                source: source,
                sourcename: api.collection.get(source).get('name'),
                target: category,
                targetname: name
            });

            dropdown.find('[data-toggle="dropdown"]').focus();
        },

        onLink: function (data) {
            actions.check('io.ox/mail/actions/move', data).done(function () {
                actions.invoke('io.ox/mail/actions/move', null, { data: data });
            });
        }
    });

    var picker = new PickerDropdown({ label: getLabel });

    return function (node, options) {
        // called only once
        picker.renderToggle(node);
        picker.renderMenu(options);
    };
});
