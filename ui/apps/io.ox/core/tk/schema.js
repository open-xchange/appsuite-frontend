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
define('io.ox/core/tk/schema',
      ['io.ox/core/tk/oop'], function (OOPObject) {

    'use strict';

    var Schema = function () {};
    OOPObject.extend(Schema, {
        ValidationError: function ValidationError(msg) {
            this.message = msg;
        },
        ConsistencyError: function ConsistencyError(msg) {
            this.message = msg;
        },
        formats: {
            string: function (key, val, fieldDesc) {
                return true;
            },
            pastDate: function (key, val, fieldDesc) {
                return true;
            },
            email: function (key, val, fieldDesc) {
                var emailRegExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                if (!emailRegExp.test(val)) {
                    return new this.ValidationError('should be a valid email address');
                }
                return true;
            }
        },
        validate: function (key, value) {
            var fieldDesc = this.properties[key];
            if (value === "" && fieldDesc.mandatory !== true) {
                return true;
            }
            if (fieldDesc && this.formats[fieldDesc.format] && _.isFunction(this.formats[fieldDesc.format])) {
                return this.formats[fieldDesc.format].apply(this, [key, value, fieldDesc]);
            }

        }
    });
    return Schema;
});
