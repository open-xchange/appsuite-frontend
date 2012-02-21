/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/create-dist-view',
    ['io.ox/core/extensions',
     'gettext!io.ox/contacts/contacts',
     'io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/view',
     'io.ox/core/tk/model'
    ], function (ext, gt, util, api, View, Model) {

    'use strict';


    var saveButton = function (options) {
        var button = $('<a>').attr({
            'data-action': 'save',
            'href': '#'
        }).addClass('button default-action saveButton').text('Save').on('click', function () {
            options.saveForm();
        });

        return button;
    };


    var growl = $('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '0', top: '0'});

    var ContactCreateView = View.extend({

        draw: function (app) {
            var self = this,
                meta = ['first_name',
                        'last_name',
                        'display_name',
                        'email1',
                        'cellular_telephone1'];

            _.each(meta, function (field) {
                var myId = _.uniqueId('c'),
                sectiongroup = self.createSectionGroup(),
                model = self.getModel(),
                fieldtype = model.schema.getFieldType(field),
                createFunction;

                switch (fieldtype) {
                case "string":
                    createFunction = self.createTextField({property: field, id: myId, classes: 'nice-input'});
                    break;
                case "pastDate":
                    createFunction = self.createDateField({property: field, id: myId, classes: 'nice-input'});
                    break;
                default:
                    createFunction = self.createTextField({property: field, id: myId, classes: 'nice-input'});
                    break;
                }

                sectiongroup.append(self.createLabel({
                    id: myId,
                    text: gt(field)
                }), createFunction);

                self.node.append(sectiongroup);
            });

            this.getModel().on('error:invalid', function (evt, err) {
                console.log('error validation');
                console.log(arguments);
                $('#myGrowl').jGrowl(err.message, {header: 'Make an educated guess!', sticky: false});
            });

            return self;
        },

        drawButtons: function () {
            var self = this,
                button = saveButton(self);
            return button;
        },

        saveForm: function () {
            console.log('saveForm -> save', this);
            this.getModel().save();
            //$(this).trigger('save');
        }
    });

    return ContactCreateView;
});
