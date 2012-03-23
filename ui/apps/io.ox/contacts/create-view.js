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

define('io.ox/contacts/create-view',
    ['io.ox/core/extensions',
     'gettext!io.ox/contacts/contacts',
     'io.ox/contacts/util',
     'io.ox/contacts/api',
     'io.ox/core/tk/view',
     'io.ox/core/tk/model'
    ], function (ext, gt, util, api, View, Model) {

    'use strict';

    var handleFileSelect = function (e) {
        var file = e.target.files,
            reader = new FileReader(),
            view = e.data.view;
        reader.onload = function (e) {
            view.node.find('.picture').css('background-image', 'url(' + e.target.result + ')');
        };
        reader.readAsDataURL(file[0]);
    };

    var picTrigger = function () {
        $(this).closest('.io-ox-dialog-popup').find('input[type="file"]').trigger('click');
    };

    var updateHeader = function (e) {
        var view = e.data.view,
            name = util.getDisplayName(this.get());
        view.node.find('[data-property="display_name"]').text(name);
    };

    var updateDisplayName = function () {
        var name = util.getFullName(this.get());
        this.set('display_name', name);
    };

    var meta = ['first_name', 'last_name', 'display_name', 'email1', 'cellular_telephone1'];

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
                .on('error:invalid', function (e, err) {
                    // sooo, das kommt nicht immer - ist mir aber heute zu blöd, das zu debuggen
                    $('#myGrowl').jGrowl(err.message, { header: 'Make an educated guess!', sticky: false });
                })
                .on('save:progress', { view: this }, function (e) {
                    e.data.view.node.css('visibility', 'hidden').parent().busy();
                })
                .on('save:fail', { view: this }, function (e) {
                    e.data.view.node.css('visibility', '').parent().idle();
                })
                .on('save:beforedone', function () {
                    $('#myGrowl').jGrowl('shutdown');
                });

            return this;
        },

        drawButtons: function () {
            // create save button
            return $('<a>', { href: '#', 'data-action': 'save' })
                .addClass('btn btn-primary')
                .text(gt('Save'))
                .on('click', { view: this }, function (e) {
                    e.preventDefault();
                    e.data.view.getModel().save();
                });
        }
    });

    return ContactCreateView;
});
