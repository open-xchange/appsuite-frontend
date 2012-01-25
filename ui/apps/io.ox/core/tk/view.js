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
        var self = this;
        options = options || {};
        options.model = options.model || new SimpleModel({});
        this.node = $('<div>');
        this.model = options.model;
        $(this.node).on('update', _.bind(this.onUpdateFormElement, this));
    };


    View.prototype.setModel = function (model) {
        this.model = model;
    };

    View.prototype.append = function (jqWrapped) {
        this.node.append(jqWrapped);
    };

    View.prototype.onUpdateFormElement = function (evt, options) {
        console.log(this);
        this.model.set(options.dataid, options.value);
        evt.stopPropagation();
    };

    _.each(forms, function (item, itemname) {
        if (_.isFunction(item)) {
            View.prototype[itemname] = function () {
                var args = [].slice.call(arguments);
                args[0] = args[0] || {};
                args[0].model = this.model;
                var el = item.apply(this, args);
                return el;
            };
        }
    });

    return View;
});