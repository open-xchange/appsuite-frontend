/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/contacts/create/view', 
    ['io.ox/contacts/model',
     'io.ox/backbone/views',
      'io.ox/backbone/forms',
      'io.ox/core/tk/dialogs',
      'io.ox/contacts/widgets/pictureUpload',
      'gettext!io.ox/contacts/contacts'], function (model, views, forms, dialogs, PictureUpload, gt) {
    "use strict";
    
    var point = views.point('io.ox/contacts/create/view'),
        ContactCreateView = point.createView({
            tagName: 'form',
            className: 'form-horizontal create-contact'
        });
    
    // Let's do some metaprogramming here
    var index = 300;
    _(['first_name', 'last_name', 'display_name', 'email1', 'cellular_telephone1']).each(function (fieldName) {
        point.extend(new forms.ControlGroup({
            id: 'io.ox/contacts/create/view/' + fieldName,
            label: model.fields[fieldName],
            control: '<input type="text" class="input-xlarge" name="' + fieldName + '">',
            attribute: fieldName
        }));
        
        index += 100;
    });
    
    return {
        ContactCreateView: ContactCreateView,
        getPopup: function (contactModel) {
            if (!contactModel) {
                contactModel = model.factory.create();
            } else {
                contactModel = model.factory.wrap(contactModel);
            }
            
            var view = new ContactCreateView({model: contactModel});
            
            // create modal popup
            var pane = new dialogs.CreateDialog({ easyOut: true, async: true, width: 500 });
            // header
            pane.header(
                $('<h3>').text(gt('Add new contact'))
            );
            // body
            pane.getBody()
                .append(view.render().$el);
            // footer
            pane.addPrimaryButton('save', gt('Save'))
                .addButton('cancel', gt('Cancel'));
            // on show
            return pane.on('show', function () {
                view.$el.find('input[type=text]').first().focus();
            });
        }
    };
});

if (false) {
    define('io.ox/contacts/create/view',
        ['io.ox/contacts/util',
         'io.ox/core/tk/dialogs',
         'io.ox/core/tk/view',
         'gettext!io.ox/contacts/contacts',
         'less!io.ox/contacts/style.css'
        ], function (util, dialogs, View, gt) {

        'use strict';

        var handleFileSelect = function (e) {
                var file = e.target.files,
                    reader = new FileReader(),
                    view = e.data.view;
                reader.onload = function (e) {
                    view.node.find('.picture').css('background-image', 'url(' + e.target.result + ')');
                };
                reader.readAsDataURL(file[0]);
            },

            picTrigger = function () {
                $(this).closest('.io-ox-dialog-popup').find('input[type="file"]').trigger('click');
            },

            updateHeader = function (e) {
                var view = e.data.view,
                    name = util.getDisplayName(this.get());
                view.node.find('[data-property="display_name"]').text(name);
            },

            updateDisplayName = function () {
                var name = util.getFullName(this.get());
                this.set('display_name', name);
            },

            modelInvalid = function (e, data) {
                var view = e.data.view;
                $.alert(gt('Could not create contact'), data.message)
                    .insertAfter(view.node.find('.section.formheader'));
            },

            modelProgress = function (e) {
                e.data.view.node.css('visibility', 'hidden').parent().busy();
            },

            modelFail = function (e, data) {
                var view = e.data.view;
                view.node.css('visibility', '').parent().idle();
                $.alert(gt('Could not create contact'), data.error)
                    .insertAfter(view.node.find('.section.formheader'));
            },

            meta = ['first_name', 'last_name', 'display_name', 'email1', 'cellular_telephone1'];

        /*
         * View class
         */
        var ContactCreateView = View.extend({

            draw: function () {

                this.node.append(
                    this.createSection()
                    .addClass('formheader')
                    .append(
                        // picture
                        $('<div>')
                            .addClass('picture')
                            .css({
                                backgroundImage: 'url(' + ox.base + '/apps/themes/default/dummypicture.png)',
                                marginRight: '15px'
                            })
                            .on('click', picTrigger),
                        // full name
                        $('<span>')
                            .addClass('text name clear-title')
                            .attr('data-property', 'display_name')
                            .text('\u00A0'),
                        // hidden form
                        this.createPicUpload()
                            .find('input').on('change', { view: this }, handleFileSelect).end()
                    )
                );

                // draw input fields
                _.each(meta, function (field) {
                    var myId = _.uniqueId('c'),
                        label = this.getModel().schema.getFieldLabel(field);
                    this.node.append(
                        this.createSectionGroup().append(
                            this.createLabel({ id: myId, text: gt(label) }),
                            this.createTextField({ property: field, id: myId })
                        )
                    );
                }, this);

                this.getModel()
                    .on('change:display_name', { view: this }, updateHeader)
                    .on('change:first_name change:last_name', updateDisplayName)
                    .on('error:invalid', { view: this }, modelInvalid)
                    .on('save:progress', { view: this }, modelProgress)
                    .on('save:fail', { view: this }, modelFail);

                return this;
            }
        });

        return {

            View: ContactCreateView,

            getPopup: function (view) {
                // create modal popup
                var pane = new dialogs.CreateDialog({ easyOut: true, async: true, width: 500 });
                // header
                pane.header(
                    $('<h3>').text(gt('Add new contact'))
                );
                // body
                pane.getBody()
                    .addClass('create-contact')
                    .append(view.draw().node);
                // footer
                pane.addPrimaryButton('save', gt('Save'))
                    .addButton('cancel', gt('Cancel'));
                // on show
                return pane.on('show', function () {
                    this.getPopup().find('input[type=text]').first().focus();
                });
            }
        };
    });
}
