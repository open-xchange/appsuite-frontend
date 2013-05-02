/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/settings/errorlog/settings/pane',
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'io.ox/core/date',
     'gettext!io.ox/core'], function (ext, http, date, gt) {

    'use strict';

    ext.point('io.ox/settings/pane').extend({
        id: 'errorlog',
        title: gt('Error log'),
        ref: 'io.ox/core/settings/errorlog',
        index: 'last'
    });

    var ErrorLogView = Backbone.View.extend({

        tagName: 'ul',
        className: 'error-log',

        initialize: function () {
            this.collection = http.log();
            this.collection.on('add', this.renderError, this);
        },

        render: function () {
            // clear
            this.$el.empty();
            // empty?
            if (this.collection.isEmpty()) {
                this.$el.append(
                    $('<li class="empty">').text(gt('No errors to report'))
                );
            } else {
                this.collection.each(this.renderError, this);
            }
            return this;
        },

        getSummary: function () {
            return [
                gt('Date') + ': ' + (new date.Local()).format(date.DATE_TIME),
                gt('Host') + ': ' + location.href,
                gt('UI version') + ': ' + ox.serverConfig.version,
                gt('Server version') + ': ' + ox.serverConfig.serverVersion,
                gt('Browser') + ': ' + navigator.userAgent
            ].join(', ');
        },

        renderSummary: function () {
            this.$el.append(
                $('<li class="summary">').append(
                    $('<div>').text(this.getSummary())
                )
            );
        },

        getMessage: function (model) {
            return model.get('error');
        },

        getID: function (model) {
            var id = model.get('error_id'), code = model.get('code');
            return !id ? '' : '(ID: ' + id + (code ? ' / ' + code : '') + ')';
        },

        getStrackTrace: function (model) {
            var stack = model.get('error_stack');
            return _.isArray(stack) ? stack[0] + ' ...' : '';
        },

        renderError: function (model) {
            var length = this.collection.length;
            if (length === 1) {
                this.$el.find('.empty').remove();
                this.renderSummary();
            }
            this.$el.append(
                $('<li class="error">').append(
                    $('<div class="message">').append(
                        $('<b>').text(this.getMessage(model)), $.txt(' '),
                        $('<span class="error-id">').text(this.getID(model))
                    ),
                    $('<div class="url">').text(model.get('url')),
                    $('<div class="stack-trace">').text(this.getStrackTrace(model))
                )
            );
        }
    });

    var log = new ErrorLogView();

    ext.point('io.ox/core/settings/errorlog/settings/detail').extend({
        draw: function () {
            this.append(
                $('<h1>').text(gt('Error log')),
                log.render().$el
            );
        }
    });
});
