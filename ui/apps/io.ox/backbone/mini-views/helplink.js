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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/backbone/mini-views/helplink', [
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (settings, gt) {

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
    //  content         {object or string} The object to display. If unset, the help icon will be displayed
    //  context         {string} Translated label of current context. Is used as part of aria-label/titel

    var HelpLinkView = Backbone.View.extend({

        tagName: 'a',

        className: 'io-ox-context-help',

        events: {
            'click': 'onClick'
        },

        onClick: function (e) {

            e.preventDefault();

            var href = this.options.href,
                opt = this.options;

            require(['io.ox/help/main'], function (HelpApp) {
                if (opt.simple) {
                    window.open(HelpApp.getAddress(opt), '_blank');
                    return;
                }
                if (HelpApp.reuse(opt)) return;
                HelpApp.getApp(opt).launch();
            });

            // would otherwise break guards multifactor scenario
            if (opt.metrics === false) return;
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
        },

        initialize: function (options) {

            this.options = _.extend({
                base: 'help',
                content: $($.icon('fa-question-circle', gt('Online help'))),
                href: 'index.html',
                iconClass: 'fa-question-circle',
                context: '',
                modal: false
            }, options);

            if (!_.isString(this.options.content)) {
                this.options.content = $($.icon(this.options.iconClass, gt('Online help')));
            }

            if (!settings.get('features/showHelpLinks', true)) this.$el.addClass('hidden');
        },

        render: function () {
            if (this.$el.hasClass('hidden')) return this;
            this.$el
                .append(this.options.content)
                .attr({
                    href: '#',
                    target: '_blank',
                    'aria-label': gt('Online help')
                });

            if (this.options.context) {
                //#. label of help icon
                //#. %1$s current context (example: Inbox categories)
                var label = gt('Online help: %1$s', this.options.context);
                this.$el.attr('aria-label', label).find('i').attr('title', label).end();
            }
            return this;
        }
    });

    return HelpLinkView;
});
