/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/backbone/mini-views/help', [], function () {

    'use strict';

    //
    // HelpView
    //
    // options          {object}    HelpView options (see below)
    //
    // Attributes:
    //  href            {string or function} The target id of the help site or a function, which should return the help site
    //  iconClass       {string} These classes are added to the i-tag
    //  tabindex        {string} The tabindex of the link
    //  content         {object or string} The object to display. If unset, the help icon will be displayed

    var HelpView = Backbone.View.extend({

        tagName: 'a',

        className: 'io-ox-context-help',

        events: {
            'click': 'onClick'
        },

        onClick: function () {
            var href = this.options.href;

            // if target is dynamic, execute as function
            if (_.isFunction(href)) href = this.options.href();

            window.open('help/l10n/' + ox.language + '/' + href);
        },

        initialize: function (options) {
            this.options = _.extend({
                href: 'index.html',
                tabindex: '1',
                content: $('<i class="fa fa-question-circle">')
            }, options);

            if (!_.isString(this.options.content)) {
                this.options.content.addClass(this.options.iconClass);
            }
        },

        render: function () {
            this.$el.append(
                this.options.content
            ).attr({
                target: '_blank',
                href: '',
                role: 'menuitem',
                tabindex: this.options.tabindex
            });
            return this;
        }
    });

    return HelpView;
});
