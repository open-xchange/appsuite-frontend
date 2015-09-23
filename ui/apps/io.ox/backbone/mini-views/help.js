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
    //  href            {string or function} The target id of the help site or a function, which should return the help site. If it is a function, it can also return an object containing base and target.
    //  base            {string} The base of the help site
    //  iconClass       {string} These classes are added to the i-tag
    //  tabindex        {string} The tabindex of the link
    //  content         {object or string} The object to display. If unset, the help icon will be displayed

    var HelpView = Backbone.View.extend({

        tagName: 'a',

        className: 'io-ox-context-help',

        events: {
            'click': 'onClick'
        },

        onClick: function (e) {
            var href = this.options.href,
                base = this.options.base;

            // if target is dynamic, execute as function
            if (_.isFunction(href)) href = this.options.href();

            if (_.isObject(href)) {
                base = href.base || base;
                href = href.target || href;
            }

            // metrics
            require(['io.ox/metrics/main'], function (metrics) {
                if (!metrics.isEnabled()) return;
                // track help as separate app/page
                metrics.trackPage({
                    id: 'io.ox/help'
                });
                // track what page/anchor of help is requested
                metrics.trackEvent({
                    app: 'core',
                    target: 'toolbar',
                    type: 'click',
                    action: 'help',
                    detail: href.substr(href.lastIndexOf('#') + 1)
                });
            });

            window.open(base + '/l10n/' + ox.language + '/' + href);

            e.preventDefault();
        },

        initialize: function (options) {
            this.options = _.extend({
                href: 'index.html',
                tabindex: '1',
                content: $('<i class="fa fa-question-circle">'),
                base: 'help'
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
