/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/switchboard/views/jitsi-call', [
    'io.ox/switchboard/zoom',
    'io.ox/backbone/views/disposable',
    'settings!io.ox/core',
    'gettext!io.ox/switchboard'
], function (zoom, DisposableView, settings, gt) {

    'use strict';

    var JitsiCallView = DisposableView.extend({

        className: 'conference-view jitsi',

        constructor: function () {
            this.model = new Backbone.Model({ type: 'jitsi', state: 'done', joinLink: this.createJoinLink() });
            DisposableView.prototype.constructor.apply(this, arguments);
        },

        createJoinLink: function () {
            var host = settings.get('switchboard/jitsi/host');
            return host + '/' + s4() + s4();
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1);
            }
        },

        getJoinLink: function () {
            return this.model.get('joinLink');
        },

        render: function () {
            this.renderDone();
            return this;
        },

        renderDone: function () {
            var link = this.getJoinLink() || 'https://...';
            this.$el.addClass('compact').append(
                $('<div>').append(
                    $('<a target="_blank" rel="noopener">').attr('href', link).html(
                        _.escape(link).replace(/([-/.?&=])/g, '$1<wbr>')
                    )
                ),
                $('<div>').append(
                    $('<a href="#" class="secondary-action">')
                        .text(gt('Copy to clipboard'))
                        .attr('data-clipboard-text', link)
                        .on('click', false)
                )
            );
            var el = this.$('[data-clipboard-text]').get(0);
            require(['static/3rd.party/clipboard.min.js'], function (Clipboard) {
                new Clipboard(el);
            });
        }
    });

    return JitsiCallView;
});
