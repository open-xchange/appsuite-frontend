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

define('io.ox/contacts/create-view',
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
        }).addClass('btn btn-primary').text(gt('Save')).on('click', function () {
            options.saveForm();
        });

        return button;
    };

    var picform = function (options) {
        var pic = options.createPicUpload({
            wrap: false,
            label: false,
            charset: 'UTF-8',
            enctype: 'multipart/form-data',
            id: 'contactUploadImage',
            method: 'POST',
            formname: 'contactUploadImage',
            name: 'file',
            target: 'hiddenframePicture'
        });

        function handleFileSelect(evt) {
            console.log('triggered');
            var file = evt.target.files,
                reader = new FileReader();
            reader.onload = (function (theFile) {
                return function (e) {
                    $('.create-contact .picture').css('background-image', 'url(' + e.target.result + ')');
                };
            }(file[0]));
            reader.readAsDataURL(file[0]);
        }

        pic.find('input').on('change', handleFileSelect);
        return pic;
    };

    var picDummy = function () {
        function picTrigger() {
            $('input[type="file"]').trigger('click');
        }

        var picture = $('<div>').addClass('picture')
        .css('background-image', 'url(' + ox.base + '/apps/themes/default/dummypicture.png)');
        picture.on('click', picTrigger);

        return picture;
    };

    var growl = $('<div>', {id: 'myGrowl'}).addClass('jGrowl').css({position: 'absolute', right: '0', top: '0'});

    var ContactCreateView = View.extend({

        draw: function (app) {
            var self = this,
                meta = ['first_name',
                        'last_name',
                        'display_name',
                        'email1',
                        'cellular_telephone1'],
                header = self.createSection(),
                formtitle = self.createSectionTitle({
                    'text': gt('Add new contact')
                });

            var updateDisplayName = function () {
                console.log('update displayname');
                self.getModel().set('display_name', util.getFullName(self.getModel().get()));
            };

            this.getModel().on('change:title change:first_name change:last_name', updateDisplayName);

            header.addClass('formheader').append(picDummy(), picform(self));
            self.node.append(formtitle);
            self.node.append(header);
            _.each(meta, function (field) {
                var myId = _.uniqueId('c'),
                sectiongroup = self.createSectionGroup(),
                model = self.getModel(),
                label = model.schema.getFieldLabel(field),
                fieldtype = model.schema.getFieldType(field),
                createFunction;

                switch (fieldtype) {
                case "string":
                    createFunction = self.createTextField({property: field, id: myId, classes: 'form-vertical'});
                    break;
                case "pastDate":
                    createFunction = self.createDateField({property: field, id: myId, classes: 'form-vertical'});
                    break;
                default:
                    createFunction = self.createTextField({property: field, id: myId, classes: 'form-vertical'});
                    break;
                }

                sectiongroup.append(self.createLabel({
                    id: myId,
                    text: gt(label)
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
