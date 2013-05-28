/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 */
/*global
define: true
*/

define('io.ox/core/tk/view',
      ['io.ox/core/tk/forms',
       'io.ox/core/tk/model',
       'io.ox/core/event'], function (forms, Model, Event) {

    'use strict';

    var View = function (options) {

        // options become properties
        _(options || {}).each(function (value, key) {
            this[key] = value;
        }, this);

        this.model = this.model || new Model();
        this.node = this.node ? $(this.node) : $('<div>');

        Event.extend(this);

        var self = this,
            getPropertyNodes = function (names) {
                return _([].concat(names)).inject(function (memo, name) {
                    return memo.add($('[data-property=' + name + ']', self.node));
                }, $());
            };

        // #1: capture all changes of form elements
        this.node.on('update.model', function (e, o) {
            e.stopPropagation();
            self.model.set(o.property, o.value, {validate: true});
        });

        // #2: update form elements if model changes
        this.model.on('change', function (e, name, value) {
            // loop over all elements - yes, manually!
            getPropertyNodes(name).each(function () {
                // triggerHandler does not bubble and is only triggered for the first element (aha!)
                $(this).triggerHandler('update.view', value);
            });
        });

        // delegate errors
        this.model.on('error:invalid', function (e, error) {
            getPropertyNodes(error.properties).each(function () {
                $(this).triggerHandler('invalid', [error]);
            });
        });

        this.initialize.apply(this, arguments);
    };

    View.prototype = {

        initialize: $.noop,

        setModel: function (model) {
            this.model = model;
        },

        getModel: function () {
            return this.model;
        },

        append: function () {
            this.node.append.apply(this.node, arguments);
        },

        destroy: function () {
            this.model.off('change error:invalid');
            this.node.off('update.model');
            this.node.empty().remove();
            this.model.destroy();
            this.node = this.model = null;
        }
    };

    // still ugly
    _.each(forms, function (item, itemname) {
        if (_.isFunction(item)) {
            View.prototype[itemname] = function () {
                var args = [].slice.call(arguments);
                args[0] = args[0] || {};
                args[0].model = args[0].model || this.model; // injecting model is allowed
                var el = item.apply(this, args);
                return el;
            };
        }
    });

    _.makeExtendable(View);

    return View;
});
