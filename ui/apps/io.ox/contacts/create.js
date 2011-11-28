/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/create',
    ['io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/dialogs',
     'io.ox/core/config',
     'css!io.ox/contacts/style.css'
    ], function (util, api, dialogs, config) {

    'use strict';

    function fieldHtml(label, name) {
        return $('<div>').addClass('field')
            .append($('<label>').text(label))
            .append($('<input>', { type: 'text', name: name }));
    }

    //assemble create form
    var show = function () {

        var pane = new dialogs.CreateDialog(),
            content = pane.getContentNode();

        content
            .addClass('create-contact')
            .append(
                $('<div>')
                .addClass('block new_contact name')
                .append(fieldHtml('first name', 'first_name'))
                .append(fieldHtml('last name', 'last_name'))
            )
            .append(
                $('<div>')
                .addClass('block new_contact company')
                .append(fieldHtml('company', 'company'))
                .append(fieldHtml('department', 'department'))
                .append(fieldHtml('position', 'position'))
                .append(fieldHtml('profession', 'profession'))
            )
            .append(
                $('<div>')
                .addClass('block new_contact address')
                .append(fieldHtml('street', 'street_business'))
                .append(fieldHtml('postal code', 'postal_code_business'))
                .append(fieldHtml('city', 'city_business'))
            )
            .append(
                $('<div>')
                .addClass('block new_contact phone')
                .append(fieldHtml('tel.', 'telephone_business1'))
            )
            .append(
                $('<div>')
                .addClass('block new_contact image')
                .append(
                    $('<form>',
                    {   method: 'POST',
                        target: 'hiddenframePicture',
                        enctype: 'multipart/form-data',
                        'accept-charset': 'UTF-8'
                    })
                    .append(
                        $('<label>').text('contact image')
                    )
                    .append(
                        $('<input>', { name: 'image1', type: 'file' })
                    )
                    .append(
                        $('<iframe>',
                        {   name: 'hiddenframePicture',
                            src: 'blank.html'
                        })
                        .css('display', 'none')
                    )
                )
            );

        content.find('.block .field:nth-child(even)').addClass('even');

        pane.addButton('cancel', 'Cancel');
        pane.addButton('create', 'Save');

        var create = function () {

            var fId = config.get('folder.contacts'),
                data = {},
                image = content.find('input[type=file][name=image1]').val();

            // collect the data
            content.find('input[type=text]').each(function () {
                var node = $(this),
                    name = node.attr('name'),
                    value = $.trim(node.val());
                if (value !== '') {
                    data[name] = value;
                }
            });

            if (image !== '') {
                data.folder_id = fId;
                data.display_name = util.createDisplayName(data);
                api.createNewImage(JSON.stringify(data), image.get(0).files[0]);
            } else {
                if (!_.isEmpty(data)) {
                    data.folder_id = fId;
                    data.display_name = util.createDisplayName(data);
                    api.create(data);
                }
            }
        };

        pane.show().done(function (action) {
            if (action === 'create') {
                create();
            }
            pane = content = create = null;
        });
    };

    return {
        show: show
    };

});