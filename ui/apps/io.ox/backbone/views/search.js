/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/search', [
    'io.ox/backbone/views/extensible',
    'io.ox/backbone/mini-views/common',
    'io.ox/core/yell',
    'gettext!io.ox/core',
    'less!io.ox/backbone/views/search'
], function (ExtensibleView, mini, yell, gt) {

    'use strict';

    var SearchView = ExtensibleView.extend({

        className: 'search-view',

        events: {
            'click .dropdown-toggle': 'onToggle',
            'input .search-field': 'onInput',
            'focus .search-field': 'onFocus',
            'keypress .search-field': 'onKeypress',
            'keyup': 'onKeyUp',
            'submit .dropdown': 'onSubmit'
        },

        constructor: function () {
            this.model = new Backbone.Model({ words: '', folder: 'current' });
            ExtensibleView.prototype.constructor.apply(this, arguments);
        },

        render: function () {
            this.$el.append(
                this.$input = $('<input type="text" class="search-field" spellcheck="false">')
                    .attr('placeholder', gt('New search ... (prototype)')),
                this.$dropdownToggle = $('<button type="button" class="dropdown-toggle"><i class="fa fa-caret-down" aria-hidden="true"></i></button>')
                    .attr({ 'aria-haspopup': true, 'aria-expanded': false }),
                this.$dropdown = $('<form class="dropdown" autocomplete="off">')
            );
            return this.invoke('render');
        },

        onInput: function () {
            var folder = this.model.get('folder');
            this.model.clear().set('folder', folder).set(this.parseQuery());
        },

        onFocus: function () {
            this.serializeQuery();
            this.toggleDropdown(false);
        },

        onToggle: function () {
            this.toggleDropdownWithFocus();
        },

        toggleDropdownWithFocus: function () {
            var inside = this.isFocusInsideDropdown(),
                state = this.toggleDropdown();
            if (state) {
                this.$dropdown.find(':input:first').focus();
            } else if (inside) {
                this.$dropdownToggle.focus();
            }
        },

        toggleDropdown: function (state) {
            if (state === undefined) state = !this.$el.hasClass('open');
            this.$el.toggleClass('open', state);
            this.$dropdownToggle.attr('aria-expanded', state);
            this.trigger(state ? 'open' : 'close');
            return state;
        },

        onKeypress: function (e) {
            if (e.which !== 13) return;
            if (this.isEmpty()) this.toggleDropdown(); else this.submit();
        },

        onKeyUp: function (e) {
            if (e.which === 27) this.toggleDropdown(false);
        },

        onSubmit: function () {
            this.toggleDropdown(false);
            this.serializeQuery();
            this.$input.focus();
            setTimeout(this.submit.bind(this), 0);
            return false;
        },

        submit: function () {
            var criteria = this.parseQuery();
            if (criteria.empty) return;
            yell(
                'info',
                'That doesn\'t work yet!\n\n' +
                'This is just a prototype to play aorund with a visually different and more explicit user interface.\n\n' +
                'Simple for the 99% use-case (just entering a word or name), still easy to use for explicit queries.\n\n' +
                'You can open a dropdown by clicking on the caret or simply hitting enter while the search field is empty'
            );
        },

        input: function (name, label) {
            return $('<div class="form-group">').append(
                mini.getInputWithLabel(name, label, this.model)
            );
        },

        checkbox: function (name, label) {
            return new mini.CustomCheckboxView({ name: name, label: label, model: this.model }).render().$el;
        },

        select: function (name, label, list) {
            var guid = _.uniqueId('form-control-label-');
            return $('<div class="form-group">').append(
                $('<label>').attr('for', guid).text(label),
                new mini.SelectView({ name: name, id: guid, list: list, model: this.model }).render().$el
            );
        },

        dateRange: function () {
            var a = _.uniqueId('form-control-label-'),
                b = _.uniqueId('form-control-label-');
            return $('<div class="form-group row">').append(
                $('<div class="col-md-6">').append(
                    $('<label>').attr('for', a).text(gt('After')),
                    new mini.DateView({ name: 'after', id: a, model: this.model, mandatory: false }).render().$el
                ),
                $('<div class="col-md-6">').append(
                    $('<label>').attr('for', b).text(gt('Before')),
                    new mini.DateView({ name: 'before', id: b, model: this.model, mandatory: true }).render().$el
                )
            );
        },

        button: function () {
            return $('<div>').append(
                $('<button type="submit" class="btn btn-primary pull-right">').text(gt('Search'))
            );
        },

        isEmpty: function () {
            return !this.$input.val().trim().length;
        },

        isFocusInsideDropdown: function () {
            return $.contains(this.$dropdown[0], document.activeElement);
        },

        serializeQuery: function () {
            this.$input.val(
                _(this.model.toJSON())
                .chain()
                .map(function (value, name) {
                    if (!value || name === 'empty' || name === 'folder') return;
                    if (name === 'words') return value;
                    if (_.isNumber(value)) return name + ':' + moment(value).utc(true).format('YYYY-MM-DD');
                    return name + ':' + (String(value).indexOf(' ') > -1 ? '"' + value + '"' : value);
                })
                .compact()
                .value()
                .join(' ')
            );
        },

        parseQuery: function () {
            var criteria = { words: [], empty: true };
            this.$input.val().trim().split(/(\w+:(?:"[^"]+"|\S+)|\S+)/).forEach(function (word) {
                if (word === '' || word === ' ') return;
                var pair = word.split(':', 2), prefix = pair[0], value = (pair[1] || '').replace(/^"|"$/g, '');
                if (prefix && value) {
                    prefix = prefix.toLowerCase();
                    if (prefix === 'before' || prefix === 'after') {
                        if (/^\d\d\d\d-\d\d-\d\d$/.test(value)) criteria[prefix] = +moment(value).utc(true);
                    } else {
                        criteria[prefix] = value;
                    }
                } else {
                    criteria.words.push(word);
                }
                criteria.empty = false;
            });
            criteria.words = criteria.words.join(' ');
            return criteria;
        }
    });

    return SearchView;
});
