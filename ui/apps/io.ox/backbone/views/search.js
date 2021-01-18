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
    'gettext!io.ox/core',
    'less!io.ox/backbone/views/search'
], function (ExtensibleView, mini, gt) {

    'use strict';

    var yelled = false,
        cache = { items: [], index: [], hash: {} };

    var SearchView = ExtensibleView.extend({

        events: {
            'click .dropdown-toggle': 'onToggle',
            'input .search-field': 'onInput',
            'focus .search-field': 'onFocus',
            'keydown .search-field': 'onKeyDownSeachField',
            'keyup': 'onKeyUp',
            'submit .dropdown': 'onSubmit'
        },

        constructor: function () {
            this.model = new Backbone.Model({ words: '', folder: 'current' });
            ExtensibleView.prototype.constructor.apply(this, arguments);
            this.$el
                .addClass('search-view')
                .one('focus', '.search-field', this.onFirstFocus.bind(this));
        },

        render: function () {
            this.$el.append(
                this.$input = $('<input type="text" class="search-field" spellcheck="false" autocomplete="off">')
                    .attr('placeholder', gt('New search ... (prototype)')),
                this.$dropdownToggle = $('<button type="button" class="dropdown-toggle">' + $.icon('fa-caret-down', false, 'dropdown-caret') + '</button>')
                    .attr({ 'aria-haspopup': true, 'aria-expanded': false }),
                this.$dropdown = $('<form class="dropdown" autocomplete="off">'),
                this.$progress = $('<div class="progress">'),
                this.$autocomplete = $('<ul class="autocomplete address-picker scrollable">')
            )
            .popover({
                container: 'body',
                content: '<p>This is just a <b>prototype</b> to play around with a visually different and more explicit user interface.</p>' +
                    '<p>Simple for the 99% use-case (just entering a word or name), still easy to use for explicit queries.</p>' +
                    '<p>You can open a dropdown by clicking on the caret on the right-hand side.</p>',
                html: true,
                placement: 'right',
                title: 'Please note',
                trigger: 'manual'
            });
            return this.invoke('render');
        },

        onFirstFocus: function () {
            // load addressbook picker for auto-complete
            var view = this;
            require(['io.ox/contacts/addressbook/popup'], function (picker) {
                view.$progress.css('width', '50%');
                picker.getAllMailAddresses().then(function (response) {
                    cache.items = response.items.sort(picker.sorter);
                    cache.index = response.index;
                    cache.hash = response.hash;
                    SearchView.picker = {
                        search: picker.search,
                        renderItems: picker.renderItems,
                        resolve: function (cid) {
                            return cache.hash[cid];
                        }
                    };
                    view.$progress.css('width', '100%').delay(300).fadeOut('fast');
                    view.$autocomplete.on('appear', picker.onAppear);
                    view.$input.trigger('input');
                    view = null;
                });
            });
        },

        onInput: function () {
            this.clear();
            this.model.set(this.parseQuery());
            this.renderAutoComplete();
        },

        clear: function () {
            var folder = this.model.get('folder');
            this.model.clear().set('folder', folder);
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
            if (state === undefined) state = !this.isDropdownOpen();
            this.$el.toggleClass('open', state);
            this.$dropdownToggle.attr('aria-expanded', state);
            this.trigger(state ? 'open' : 'close');
            this.$autocomplete.empty();
            return state;
        },

        isDropdownOpen: function () {
            return this.$el.hasClass('open');
        },

        isAutocompleteOpen: function () {
            return this.$autocomplete.children().length;
        },

        onKeyDownSeachField: function (e) {
            var selected, item, el, index, children;
            switch (e.which) {
                // enter
                case 13:
                    selected = this.$autocomplete.children('.selected');
                    if (this.isAutocompleteOpen() && selected.length) {
                        item = SearchView.picker.resolve(selected.attr('data-cid'));
                        index = this.$input.val().lastIndexOf(this.getLastWord());
                        this.$input.val(this.$input.val().substr(0, index) + item.email).trigger('input');
                        this.$autocomplete.empty();
                        // move cursor to end
                        el = this.$input[0];
                        el.scrollLeft = el.scrollWidth;
                    } else {
                        this.toggleDropdown(false);
                        this.submit();
                    }
                    break;
                // cursor up
                case 38:
                    children = this.$autocomplete.children();
                    index = children.index(children.filter('.selected'));
                    if (index <= 0) return;
                    children.filter('.selected').removeClass('selected');
                    children.eq(index - 1).addClass('selected').intoView(this.$autocomplete);
                    break;
                // cursor down
                case 40:
                    children = this.$autocomplete.children();
                    index = children.index(children.filter('.selected'));
                    if (index >= children.length - 1) return;
                    children.filter('.selected').removeClass('selected');
                    children.eq(index + 1).addClass('selected').intoView(this.$autocomplete);
                    break;
                // no default
            }
        },

        onKeyUp: function (e) {
            if (e.which === 27) this.toggleDropdown(false);
        },

        onSubmit: function (e) {
            e.preventDefault();
            this.toggleDropdown(false);
            this.serializeQuery();
            this.$input.focus();
            setTimeout(this.submit.bind(this), 0);
        },

        submit: function () {
            var criteria = this.parseQuery();
            if (criteria.empty) return this.trigger('cancel');
            criteria.folder = this.model.get('folder');
            this.trigger('search', criteria);
            // just yell once
            if (yelled) return;
            this.$el.popover('show');
            yelled = true;
            $(document).one('click', this.$el.popover.bind(this.$el, 'hide'));
        },

        cancel: function () {
            this.toggleDropdown(false);
            this.$autocomplete.empty();
            this.$input.val('');
            this.clear();
            return this.trigger('cancel');
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
                    //#. Context: Search. Label for date control.
                    $('<label>').attr('for', a).text(gt('After')),
                    new mini.DateView({ name: 'after', id: a, model: this.model, mandatory: false }).render().$el
                ),
                $('<div class="col-md-6">').append(
                    //#. Context: Search. Label for date control.
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
                    if (name === 'words' || name === 'addresses') return value;
                    if (_.isNumber(value)) return name + ':' + moment(value).utc(true).format('YYYY-MM-DD');
                    return name + ':' + (String(value).indexOf(' ') > -1 ? '"' + value + '"' : value);
                })
                .compact()
                .value()
                .join(' ')
            );
        },

        parseQuery: function () {
            var criteria = { words: [], addresses: [], empty: true };
            this.$input.val().trim().toLowerCase().split(/(\w+:(?:"[^"]+"|\S+)|\S+)/).forEach(function (word) {
                if (word === '' || word === ' ') return;
                var pair = word.split(':', 2), prefix = pair[0], value = (pair[1] || '').replace(/^"|"$/g, '');
                if (prefix && value) {
                    prefix = prefix.toLowerCase();
                    if (prefix === 'before' || prefix === 'after') {
                        if (/^\d\d\d\d-\d\d-\d\d$/.test(value)) criteria[prefix] = +moment(value).utc(true);
                    } else {
                        criteria[prefix] = value;
                    }
                } else if (/^[^@]+@[^@\s]*?\.\w+$/.test(word)) {
                    criteria.addresses.push(word);
                } else {
                    criteria.words.push(word);
                }
                criteria.empty = false;
            });
            criteria.addresses = criteria.addresses.join(' ');
            criteria.words = criteria.words.join(' ');
            return criteria;
        },

        renderAutoComplete: function () {
            var word = this.getLastWord(),
                items = SearchView.picker.search(word, cache.index, cache.hash, true);
            // empty?
            if (!items.length) return this.$autocomplete.empty();
            // filter lists & labels
            items = _(items).filter(function (item) {
                if (item.list || item.label) return false;
                return true;
            });
            // render
            SearchView.picker.renderItems.call(this.$autocomplete, items, { isSearch: true });
            this.$autocomplete.children().removeAttr('tabindex');
            // accelerate initial appear event for first 8 items
            this.$autocomplete.find('.contact-picture').slice(0, 8).trigger('appear');

        },

        getLastWord: function () {
            var match = this.$input.val().match(/(\w+:)?(\S+)$/);
            return match ? match[2] : '';
        }
    });

    // public functions
    SearchView.picker = {
        search: _.constant([]),
        renderItems: _.noop,
        resolve: _.noop
    };

    return SearchView;
});
