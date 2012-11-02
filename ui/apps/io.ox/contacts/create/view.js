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
      'gettext!io.ox/contacts'], function (model, views, forms, dialogs, PictureUpload, gt) {

    "use strict";

    var point = views.point('io.ox/contacts/create/view'),
        ContactCreateView = point.createView({
            tagName: 'form',
            className: 'form-horizontal create-contact'
        });

    // Picture Magic
    point.extend(new PictureUpload({
        id: 'picture',
        index: 100,
        customizeNode: function () {
            this.$el.css({
                display: 'inline-block',
                height: "100px",
                marginBottom: "15px"
            }).addClass("span2");
        }
    }));

    point.extend(new views.AttributeView({
        id: 'display_name_header',
        index: 150,
        tagName: 'span',
        className: 'clear-title',
        attribute: 'display_name'
    }));

    point.basicExtend({
        id: 'headerBreak',
        index: 200,
        draw: function () {
            this.append($('<div>').css({clear: 'both'}));
        }
    });

    // Show backend errors
    point.extend(new forms.ErrorAlert({
        id: 'backendErrors',
        index: 250
    }));

    // Let's do some metaprogramming here
    var index = 300;
    _(['first_name', 'last_name', 'display_name', 'email1', 'cellular_telephone1']).each(function (fieldName) {
        point.extend(new forms.ControlGroup({
            id: fieldName,
            label: model.fields[fieldName],
            control: '<input type="text" class="input-xlarge" name="' + fieldName + '">',
            attribute: fieldName
        }));

        index += 100;
    });

    //

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
            pane.addPrimaryButton('save', gt('Save'), 'save')
                .addButton('cancel', gt('Cancel'), 'cancel');
            // on show
            return pane.on('show', function () {
                view.$el.find('input[type=text]').first().focus();
            });
        }
    };
});