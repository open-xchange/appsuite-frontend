/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */
define('io.ox/backbone/validation',
    ['io.ox/core/extensions',
     'io.ox/core/util',
     'settings!io.ox/core',
     'gettext!io.ox/backbone/validation'], function (ext, util, settings, gt) {

    'use strict';

    var emptycheck  = function (value) {
        return (_.isUndefined(value) || value === null || value === '');
    };

    var formats = {
        string: function () {
            return true;
        },
        text: function () {
            return true;
        },
        anyFloat: function (val) {//numbers with . or , as a separator are valid 1.23 or 1,23 for example
            val = String(val).replace(/,/g, '.');
            var isValid = (emptycheck(val)) || //empty value is valid (if not, add the mandatory flag)
            (!isNaN(parseFloat(val, 10)) &&  //check if its a number
            (parseFloat(val, 10).toString().length === val.toString().length));//check if parseFloat did not cut the value (1ad2 would be made to 1 without error)
            return isValid ||
              gt('Please enter a valid number');
        },
        number: function (val) {
            var isValid = (emptycheck(val)) || //empty value is valid (if not, add the mandatory flag)
                          (!isNaN(parseFloat(val, 10)) &&  //check if its a number
                          (parseFloat(val, 10).toString().length === val.toString().length));//check if parseFloat did not cut the value (1ad2 would be made to 1 without error)
            return isValid ||
                gt('Please enter a valid number');
        },
        array: function (val) {
            return _.isArray(val) ||
                'Please enter a valid array';
        },
        boolean: function (val) {
            return _.isBoolean(val) ||
                'Please enter a bool';
        },
        date: function (val) {
            // val: timestamp
            // tasks allows null values to remove a date. Calendar must have start and end date
            // calendar fields use val = undefined if they are empty so this should work correctly for both systems
            if (val !== null && !_.isNumber(val) || val > 253402214400008) {
                return gt('Please enter a valid date');
            }
            return true;
        },
        pastDate: function (val) {
            if (_.isString(val)) {
                if (val !== '') {
                    return gt('Please enter a valid date');
                }
            }
            return _.now() > val || gt('Please enter a date in the past');
        },
        email: function (val) {
            return settings.get('features/validateMailAddresses', true) === false || // enabled by default
                util.isValidMailAddress(val) ||
                gt('Please enter a valid email address');
        },
        phone: function (val) {
            return settings.get('features/validatePhoneNumbers', false) === false || // disabled by default
                util.isValidPhoneNumber(val) ||
                gt('Please enter a valid phone number. Allowed characters are: %1$s', '0-9 , . - ( ) # + ; /');
        },
        'email/phone': function (val) {
            return settings.get('features/validateMailAddresses', true) === false ||
                util.isValidMailAddress(val) ||
                settings.get('features/validatePhoneNumbers', false) === false ||
                util.isValidPhoneNumber(val) ||
                gt('Please enter a valid email address or phone number');
        },
        url: function () {
            return true;
        },
        object: function (val) {
            return _.isObject(val) ||
                gt('Please enter a valid object');
        }
    };

    ext.point('io.ox/backbone/validation/formats').invoke('customize', formats, formats);

    ext.point('io.ox/backbone/validation/formats').on('extended', function (extension) {
        extension.invoke('customize', formats, formats);
    });

    return {
        validationFor: function (modelNamespace, validationDefinitions) {
            var validationNamespace = modelNamespace + (/\/$/.test(modelNamespace) ? 'validation' : '/validation');

            // We'll register validation extensions according to the validationDefinitions
            _(validationDefinitions).each(function (definition, attribute) {
                ext.point(validationNamespace + '/' + attribute).extend({
                    id: definition.id || attribute,
                    validate: function (value, errors, attributes) {
                        var analysis = [];

                        if (definition.format && formats[definition.format]) {
                            var retval = formats[definition.format].call(errors, value);
                            if (retval !== true) {
                                analysis.push(retval);
                            }
                        }

                        if (definition.fn) {
                            var messages = definition.fn.apply(errors, value, errors, attributes, attribute);
                            if (messages) {
                                if (_.isArray(messages)) {
                                    _(messages).each(function (message) {
                                        analysis.push(message);
                                    });
                                } else {
                                    analysis.push(messages);
                                }
                            }
                        }
                        return analysis;
                    }
                });

                if (definition.mandatory) {
                    ext.point(validationNamespace + '/save').extend({
                        id: attribute + '-is-mandatory',
                        validate: function (attributes, errors) {
                            var value = attributes[attribute];

                            if (emptycheck(value)) {
                                errors.add(attribute, gt('Please enter a value'));
                            }
                        }
                    });
                }
            });
        },
        formats: formats
    };
});
