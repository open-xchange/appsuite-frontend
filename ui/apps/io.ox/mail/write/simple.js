/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/write/simple', [], function () {

    'use strict';

    // var SimpleMailWriter = Backbone.View.extend({

    //     className: 'simple-mail-writer abs',

    //     events: {
    //         'click [data-action="send"]': 'onCancel',
    //         'click [data-action="draft"]': 'onCancel',
    //         'click [data-action="cancel"]': 'onCancel'
    //     },

    //     onCancel: function (e) {
    //         e.preventDefault();
    //         this.hide();
    //         this.reset();
    //     },

    //     show: function () {
    //         this.$el.show();
    //         this.$el.find('.field-to').focus();
    //     },

    //     hide: function () {
    //         this.$el.hide();
    //     },

    //     reset: function () {
    //         this.$el.find('.editor textarea, input').val('');
    //     },

    //     render: function () {
    //         this.$el.hide().append(
    //             $('<div class="inline-toolbar">').append(
    //                 $('<li><a href="#" role="button" data-action="send"><b>envoyer</b></a></li>'),
    //                 $('<li><a href="#" role="button" data-action="draft">enregistrer le brouillon</a></li>'),
    //                 $('<li><a href="#" role="button" data-action="cancel">annuler</a></li>')
    //             ),
    //             $('<div class="writer">').append(
    //                 $('<div class="header">').append(
    //                     $('<table border="0">').append(
    //                         $('<tr><td class="row-label">de :</td><td><b>' + ox.user + '</b></td></tr>'),
    //                         $('<tr><td class="row-label">à :</td><td><input type="text" class="field-to input-xxlarge"/></td></tr>'),
    //                         $('<tr><td class="row-label">objet :</td><td><input type="text" class="field-subject input-xxlarge" placeholder="Saisissez l\'objet de votre message"/></td></tr>'),
    //                         $('<tr><td class="row-label"></td><td><i class="icon-paper-clip"/> joindre un fichier</td></tr>')
    //                     )
    //                 ),
    //                 $('<div class="editor">').append(
    //                     $('<textarea>').attr('placeholder', 'Votre message')
    //                 )
    //             )
    //         );
    //         return this;
    //     }
    // });

    //var writer = new SimpleMailWriter();
    //win.nodes.body.append(writer.render().$el);

    // hide writer / go back to list
    // $(document).on('click', '.folder.selectable', function (e) {
    //     threadView.onBack(e);
    //     writer.hide();
    // });
});
