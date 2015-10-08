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
    'io.ox/core/extensions',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'io.ox/core/tk/typeahead',
    'io.ox/mail/util',
    'gettext!io.ox/core'
], function (ext, pModel, pViews, Typeahead, util, gt) {

    'use strict';

    // TODO:
    // - exceptions for global address book

    /*
     * extension point for autocomplete item
     */
    ext.point('io.ox/participants/add/autoCompleteItem').extend({
        id: 'view',
        index: 100,
        draw: function (participant) {
            var pview = new pViews.ParticipantEntryView({
                    model: participant,
                    closeButton: false,
                    halo: false,
                    field: true
                });
            this.append(pview.render().$el);
        }
    });

    var AddParticipantView = Backbone.View.extend({

        tagName: 'div',

        events: {
            'keydown input': 'keyDown'
        },

        typeahead: null,

        options: {
            placeholder: gt('Add participant/resource'),
            label: gt('Add participant/resource'),
            extPoint: 'io.ox/participants/add',
            blacklist: false
        },

        initialize: function (o) {
            this.options = $.extend({}, this.options, o || {});
            if (this.options.blacklist) {
                this.options.blacklist = this.options.blacklist.split(',');
            }
            this.options.click = _.bind(this.addParticipant, this);
            this.options.harmonize = _.bind(function (data) {
                data = _(data).map(function (m) {
                    return new pModel.Participant(m);
                });
                // remove duplicate entries from typeahead dropdown
                var col = this.collection;
                return _(data).filter(function (model) {
                    return !col.get(model);
                });
            }, this);
        },

        keyDown: function (e) {
            // enter
            if (e.which === 13) {
                var val = this.typeahead.$el.typeahead('val');
                if (!_.isEmpty(val)) {
                    this.addParticipant(e, {
                        display_name: util.parseRecipient(val)[0],
                        email1: util.parseRecipient(val)[1],
                        field: 'email1', type: 5
                    }, val );
                }
            }
        },

        setFocus: function () {
            if (this.typeahead) this.typeahead.$el.focus();
        },

        addParticipant: function (e, model, value) {
            // check blacklist
            var inBlackList = this.options.blacklist && this.options.blacklist.indexOf(value) > -1;

            if (inBlackList) {
                require('io.ox/core/yell')('warning', gt('This email address cannot be used'));
            } else {
                this.collection.add(model);
            }

            // clean typeahad input
            if (value) this.typeahead.$el.typeahead('val', '');
        },

        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.typeahead = new Typeahead(this.options);
            this.$el.append(
                $('<label class="sr-only">').attr({ for: guid }).text(this.options.label),
                this.typeahead.$el.attr({ id: guid }).addClass('add-participant')
            );
            this.typeahead.render();
            return this;
        }
    });

    return AddParticipantView;
});
