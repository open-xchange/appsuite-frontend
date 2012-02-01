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
       'io.ox/core/tk/model'], function (forms, SimpleModel) {

    'use strict';

    var View = function (options) {
        options = options || {};
        options.node = options.node || $('<div>');

        if (options.model) {
            this.model = options.model;
        }
        this.node = options.node;

        var self = this,

            getPropertyNodes = function (name) {
                return $('[data-property=' + name + ']', self.node);
            };


        // #1: capture all changes of form elements
        $(this.node).on('update.model', function (e, o) {
            e.stopPropagation();
            self.model.set(o.property, o.value);
        });

        // #2: update form elements if model changes
        $(this.model).on('change', function (e, name, value) {
            // loop over all elements - yes, manually!
            console.log('update model  >>>>>');
            console.log(arguments);
            getPropertyNodes(name).each(function () {
                // triggerHandler does not bubble and is only triggered for the first element (aha!)
                // does nothing yet?
                console.log('trigger update.view');
                $(this).triggerHandler('update.view', value);
            });
        });

        window.horst = this.model;

        // delegate errors
        $(this.model).on('error:validation error:consistency', function (e, errorObj) {
            getPropertyNodes(errorObj.name).each(function () {
                $(this).triggerHandler('invalid', [errorObj]);
            });
        });
    };

    View.prototype = {
        setModel: function (model) {
            this.model = model;
        },
        getModel: function () {
            return this.model;
        },
        append: function (jqWrapped) {
            this.node.append(jqWrapped);
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
