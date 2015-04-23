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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/participants/add', [
    'io.ox/participants/model',
    'io.ox/participants/views',
    'io.ox/core/tk/typeahead'
], function (pModel, pViews, Typeahead) {

    'use strict';

    var AddParticipantView = Backbone.View.extend({

        tagName: 'div',

        events: {
            'keydown input': 'keyDown'
        },

        typeahead: null,

        options: {
            label: '',
            apiOptions: {
                contacts: true,
                users: true,
                groups: true,
                resources: true
            },
            harmonize: function (data) {
                var model = new pModel.Participant(data.data);
                return {
                    value: model.getTarget(),
                    label: model.getDisplayName(),
                    model: model
                };
            }
        },

        keyDown: function (e) {
            // enter
            if (e.which === 13) {
                var val = this.typeahead.$el.typeahead('val');
                if (!_.isEmpty(val)) {
                    this.addParticipant(e, { model: { email1: val, id: Math.random() } });
                }
            }
        },

        addParticipant: function (e, data) {
            if (this.collection) {
                this.collection.addUniquely(data.model);
            }
            // clean typeahad input
            this.typeahead.$el.typeahead('val', '');
        },

        initialize: function (o) {
            this.options = $.extend({}, this.options, o || {});

            this.options.click = _.bind(this.addParticipant, this);
        },

        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.typeahead = new Typeahead(this.options);
            this.$el.append(
                $('<label class="sr-only">').attr({ for: guid }).text(this.options.label),
                this.typeahead.$el.attr({ id: guid })
            );
            this.typeahead.render();
            return this;
        }
    });

    return AddParticipantView;
});
