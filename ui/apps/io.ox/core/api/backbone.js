/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/backbone', [], function () {

    'use strict';

    // basic model with custom cid
    var Model = Backbone.Model.extend({
        idAttribute: 'cid',
        constructor: function () {
            Backbone.Model.apply(this, arguments);
            this.cid = _.cid(this.attributes);
        },
        toString: function () {
            // just helps debugging
            return 'Model(' + this.cid + ')';
        }
    });

    // collection using custom models
    var Collection = Backbone.Collection.extend({
        comparator: 'index',
        model: Model
    });

    return {
        Model: Model,
        Collection: Collection
    };
});
