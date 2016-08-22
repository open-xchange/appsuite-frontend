 /**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/participants/add', [
    'io.ox/core/extensions',
    'io.ox/participants/model',
    'io.ox/participants/views',
    'io.ox/core/tk/typeahead',
    'io.ox/mail/util',
    'io.ox/contacts/util',
    'io.ox/core/util',
    'io.ox/core/yell',
    'gettext!io.ox/core'
], function (ext, pModel, pViews, Typeahead, util, contactsUtil, coreUtil, yell, gt) {

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

    var validation = {

        validate: function (list, options) {
            if (!this.options.blacklist) return;
            var opt = _.extend({ yell: true }, options),
                invalid = this.getInvalid(list);
            // process
            if (invalid.length === 0) return;
            // yell warning
            if (opt.yell) this.yell(list, invalid);
            return invalid;
        },

        getInvalid: function (list) {
            var blacklist = this.options.blacklist;
            return _(getAddresses(list)).filter(function (address) {
                return !!blacklist[address];
            });
        },

        yell: function (list, invalid) {
            yell('warning', gt.format(
                //#. %1$d a list of email addresses
                //#, c-format
                gt.ngettext('This email address cannot be used', 'The following email addresses cannot be used: %1$d', list.length),
                gt.noI18n(invalid.join(', '))
            ));
        }
    };

    function getAddresses(list) {
        return _(list).map(getAddress);
    }

    function getAddress(item) {
        // string, data, or model
        if (_.isString(item)) item = { email1: item };
        else if (item instanceof Backbone.Model) item = item.toJSON();
        return contactsUtil.getMail(item);
    }

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
            if (_.isString(this.options.blacklist)) {
                // turn blacklist into hash to have simpler checks
                var hash = {};
                _(this.options.blacklist.split(/,/)).each(function (address) {
                    hash[address.trim().toLowerCase()] = true;
                });
                this.options.blacklist = hash;
                _.extend(this, validation);
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

            // ensure a fixed scroll position when adding participants/members
            var scrollIntoView = _.debounce(function () {
                this.typeahead.el.scrollIntoView();
            }.bind(this), 0);

            this.collection.on('render', scrollIntoView);
        },

        keyDown: function (e) {
            if (e.which !== 13) return;
            var val = this.typeahead.$el.typeahead('val'),
                list = val.match(/('[^']*'|"[^"]*"|[^"',;]+)+/g),
                participants = [];
            // split based on comma or semi-colon as delimiter
            _.each(list, function (value) {
                if (_.isEmpty(value)) return;
                participants.push({
                    display_name: util.parseRecipient(value)[0],
                    email1: util.parseRecipient(value)[1],
                    field: 'email1', type: 5
                });
            });
            this.addParticipant(e, participants, val);
        },

        setFocus: function () {
            if (this.typeahead) this.typeahead.$el.focus();
        },

        addParticipant: function (e, data, value) {
            var list = [].concat(data),
                // validate is just used to check against blacklist
                error = this.validate ? this.validate(list) : false;
            // abort when blacklisted where found
            if (error) return;
            // now really validate address
            list = this.getValidAddresses(list);
            this.collection.add(list);
            // clean typeahad input
            if (value) this.typeahead.$el.typeahead('val', '');
        },

        getValidAddresses: function (list) {
            return _(list).filter(function (item) {
                var address = getAddress(item);
                if (coreUtil.isValidMailAddress(address)) return true;
                //#. %1$s is an email address
                yell('error', gt('Cannot add participant/member with an invalid mail address: %1$s', address));
                return false;
            });
        },

        render: function () {
            var guid = _.uniqueId('form-control-label-');
            this.typeahead = new Typeahead(this.options);
            this.$el.append(
                $('<label class="sr-only">').attr({ for: guid }).text(this.options.label),
                this.typeahead.$el.attr({ id: guid }).addClass('add-participant')
            );
            this.typeahead.render();
            if (this.options.scrollIntoView) {
                var $el = this.$el;
                this.typeahead.on('typeahead-custom:dropdown-rendered', function () {
                    var target = $el.find('.tt-dropdown-menu'),
                        container = target.scrollParent(),
                        pos = target.offset().top - container.offset().top;
                    if (!target.is(':visible')) return;
                    if ((pos < 0) || (pos + target.height() > container.height())) {
                        // scroll to Node, leave 16px offset
                        container.scrollTop(container.scrollTop() + pos - 16);
                    }
                });
            }
            return this;
        }
    });

    return AddParticipantView;
});
