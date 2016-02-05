/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/contacts/addressbook/popup', [
    'io.ox/core/http',
    'io.ox/core/folder/api',
    'io.ox/backbone/views/modal',
    'io.ox/core/tk/list',
    'io.ox/core/extensions',
    'io.ox/contacts/util',
    'gettext!io.ox/contacts',
    'less!io.ox/contacts/addressbook/style'
], function (http, folderAPI, ModalDialog, ListView, ext, util, gt) {

    'use strict';

    var names = 'last_name first_name display_name'.split(' '),
        addresses = 'email1 email2 email3'.split(' ');

    // split words
    var regSplitWords = /[\s,.\-:;\<\>\(\)\_\@\/\'\"]/;

    //
    // Build a search index
    //

    var buildIndex = (function () {

        var fields = names.concat('email');

        return function (list) {
            var index = {};
            list.forEach(function (item) {
                var words = getWords(item);
                firstLevel(index, words, item.cid);
            });
            return index;
        };

        function getWords(item) {
            var words = [];
            fields.forEach(function (name) {
                var value = item[name];
                if (typeof value === 'string' && value.length) words.push(value);
            });
            return words.join(' ').toLowerCase().split(regSplitWords);
        }

        function firstLevel(index, words, id) {
            // first char
            words.forEach(function (word) {
                var key = word.substr(0, 1), node;
                if (!key) return;
                node = (index[key] = index[key] || {});
                secondLevel(node, word, id);
            });
        }

        function secondLevel(index, word, id) {
            var key = word.substr(0, 2),
                node = (index[key] = index[key] || {});
            thirdLevel(node, word, id);
        }

        function thirdLevel(index, word, id) {
            var node = (index[word] = index[word] || {});
            node[id] = true;
        }

    }());

    //
    // Search index
    //

    var searchIndex = (function () {

        function traverse(index, query, level) {

            var part = query.substr(0, level);

            return _(index).reduce(function (array, node, word) {
                if (level <= 2) {
                    // recursion until third level; check partial query
                    return word.indexOf(part) === 0 ?
                        array.concat(traverse(node, query, level + 1)) : array;
                }
                // leaf node; return IDs
                return word.indexOf(query) === 0 ?
                    array.concat(_(node).keys()) : array;
            }, []);
        }

        return function (index, query) {
            // query must be string
            if (typeof query !== 'string' || !query.length) return [];
            // ensure lowercase
            query = query.toLowerCase();
            // traverse over index
            return _(traverse(index, query, 1).sort()).uniq(true);
        };

    }());

    //
    // Get all mail addresses (except collected addresses)
    //

    var getAllMailAddresses = (function () {

        var collected_id = 0;

        return function (options) {

            options = _.extend({
                // keep this list really small for good performance!
                columns: '1,20,500,501,502,505,555,556,557,606,608',
                limit: 10000
            }, options);

            return getCollectedAddressesId().then(function (id) {
                collected_id = id;
                return fetchAddresses(options).then(function (list) {
                    return processAddresses(list, options);
                });
            });
        };

        function getCollectedAddressesId() {
            // get contacts folders first (just to exclude "collected addresses" later on)
            return folderAPI.flat({ module: 'contacts' }).then(function (folders) {
                var collected = _(folders['private']).find(function (folder) {
                    return folder.standard_folder && folder.standard_folder_type === 0;
                });
                var collected_id = collected ? String(collected.id) : 0;
                return collected_id;
            });
        }

        function fetchAddresses(options) {
            return http.PUT({
                module: 'contacts',
                params: {
                    action: 'search',
                    columns: options.columns,
                    limit: '0,' + options.limit,
                    sort: '609'
                },
                data: {
                    // emailAutoComplete doesn't work; need to clean up client-side anyway
                    last_name: '*'
                }
            });
        }

        function processAddresses(list, options) {

            var result = [], dupl = {}, hash = {};

            // fail when exceeding the limit
            if (list.length > options.limit) return $.Deferred().reject('too-many');

            list.forEach(function (item) {
                // skip collected addresses
                if (String(item.folder_id) === collected_id) return;
                // get sort name
                var sort_name = [];
                names.forEach(function (name) {
                    if (item[name]) sort_name.push(item[name]);
                });
                // get a match for each address
                addresses.forEach(function (address, i) {
                    // skip if not string
                    address = item[address];
                    if (typeof address !== 'string') return;
                    // all lower-case
                    address = address.toLowerCase();
                    // avoid duplicates
                    if (dupl[address]) return;
                    dupl[address] = true;
                    // add to results
                    // do all calculations now; during rendering is more expensive
                    var initials = util.getInitials(item);
                    var obj = {
                        cid: item.folder_id + '.' + item.id + '.' + i,
                        display_name: item.display_name,
                        email: address,
                        first_name: item.first_name,
                        full_name: util.getFullName(item).toLowerCase(),
                        full_name_html: util.getFullName(item, true),
                        image: util.getImage(item),
                        initials: initials,
                        initial_color: util.getInitialsColor(initials),
                        last_name: item.last_name,
                        sort_name: sort_name.concat(address).join('_'),
                        title: item.title,
                        use_count: item.useCount + (String(item.folder_id) === '6' ? (3 - i) : 0)
                    };
                    result.push(obj);
                    hash[obj.cid] = obj;
                });
            });
            dupl = null;
            return { items: _(result).sortBy('sort_name'), hash: hash, index: buildIndex(result) };
        }

    }());

    //
    // Sorter for use_count and sort_name
    //
    function sorter(a, b) {
        // desc
        if (a.use_count !== b.use_count) return b.use_count - a.use_count;
        if (a.sort_name === b.sort_name) return 0;
        // asc
        return b.sort_name < a.sort_name ? +1 : -1;
    }

    //
    // Match all words
    //
    function matchAllWords(list, words) {
        if (_.isEmpty(words)) return list;
        return _(list).filter(function (item) {
            return _(words).every(function (word) {
                return item.full_name.indexOf(word) > -1 || item.email.indexOf(word) > -1;
            });
        });
    }

    //
    // Open dialog
    //

    var tooMany = false, cachedResponse = null;

    function open(callback) {

        return new ModalDialog({
            enter: false,
            maximize: true,
            point: 'io.ox/contacts/addressbook-popup',
            title: gt('Select contacts')
        })
        .extend({
            addClass: function (baton) {
                baton.view.$el.addClass('addressbook-popup');
            },
            search: function (baton) {
                baton.view.$('.modal-header').append(
                    $('<div class="form-group">').append(
                        $('<input type="text" class="form-control search-field" tabindex="1">')
                        .attr('placeholder', gt('Search'))
                    )
                );
            },
            list: function (baton) {
                var view = baton.view;
                // we just use a ListView to get its selection support
                // the collection is just a dummy; rendering is done
                // via templates to have maximum performance for
                // the find-as-you-type feature
                view.listView = new ListView({
                    collection: new Backbone.Collection(),
                    pagination: false,
                    ref: 'io.ox/contacts/addressbook-popup/list'
                });
                this.append(view.listView.render().$el);
            },
            onOpen: function (baton) {

                var view = baton.view;
                if (tooMany) return view.busy().trigger('too-many');

                // hide body initially / add busy animation
                view.busy(true);

                function success(response) {
                    if (view.disposed) return;
                    cachedResponse = response;
                    view.items = response.items;
                    view.hash = response.hash;
                    view.index = response.index;
                    view.renderItems(view.items);
                    view.idle();
                    view.$('.search-field').focus();
                }

                function fail(e) {
                    // remove animation but block form
                    if (view.disposed) return;
                    view.idle().disableFormElements();
                    if (e === 'too-many') view.trigger('too-many'); else view.trigger('error', e);
                }

                view.on('open', function () {
                    _.defer(function () {
                        if (cachedResponse) return success(cachedResponse);
                        getAllMailAddresses().then(success, fail);
                    });
                });
            },
            onInput: function (baton) {

                var view = baton.view, lastJSON = null;

                var onInput = _.debounce(function () {
                    var query = $(this).val(), result;
                    if (query.length) {
                        // split query into single words
                        var words = query.split(regSplitWords), firstWord = words[0];
                        // use first word for the index-based lookup
                        result = searchIndex(view.index, firstWord);
                        result = view.resolveItems(result).sort(sorter);
                        // final filter to match all words
                        result = matchAllWords(result, words.slice(1));
                        // render
                        var json = JSON.stringify(result);
                        if (json === lastJSON) return;
                        view.renderItems(result);
                        lastJSON = json;
                    } else {
                        view.renderItems(view.items);
                        lastJSON = null;
                    }
                }, 100);

                view.$('.search-field').on('input', onInput);
            },
            onCursorDown: function (baton) {
                var view = baton.view;
                view.$('.search-field').on('keydown', function (e) {
                    if (!(e.which === 40 || e.which === 13)) return;
                    view.listView.selection.select(0);
                });
            },
            onEnter: function (baton) {
                var view = baton.view;
                view.listView.$el.on('keydown', function (e) {
                    if (e.which !== 13) return;
                    view.trigger('select');
                    view.close();
                });
            },
            onDoubleClick: function (baton) {
                var view = baton.view;
                view.$('.list-view').on('dblclick', function () {
                    view.trigger('select');
                    view.close();
                });
            }
        })
        .build(function () {

            // use a template for maximum performance
            // yep, no extensions here; too slow for find-as-you-type
            var template = _.template(
                '<% _(list).each(function (item) { %>' +
                '<li class="list-item selectable" aria-selected="false" role="option" tabindex="-1" data-cid="<%- item.cid %>">' +
                '  <div class="list-item-checkmark"><i class="fa fa-checkmark" aria-hidden="true"></i></div>' +
                '  <div class="list-item-content">' +
                '    <% if (item.image) { %>' +
                '      <div class="contact-picture" data-original="<%= item.image %>" aria-label="hidden"></div>' +
                '    <% } else { %>' +
                '      <div class="contact-picture initials <%= item.initial_color %>" aria-label="hidden"><%- item.initials %></div>' +
                '    <% } %>' +
                '    <div class="name"><%= item.full_name_html || "\u00A0" %></div>' +
                '    <div class="email gray"><%- item.email || "\u00A0" %></div>' +
                '  </div>' +
                '</li>' +
                '<% }); %>'
            );

            var LIMIT = 100;

            this.renderItems = function (list) {
                // get subset; we never draw more than 100 items
                var subset = list.slice(0, LIMIT),
                    html = template({ list: subset, util: util });
                if (list.length > LIMIT) {
                    //#. %1$d and %2$d are both numbers; usually > 100; never singular
                    html += '<li class="limit">' + gt('%1$d contacts found. This list is limited to %2$d items.', list.length, LIMIT) + '</li>';
                }
                this.$('.list-view')[0].innerHTML = html;
                this.$('.contact-picture[data-original]').lazyload();
            };

            this.resolveItems = function (ids) {
                return _(ids)
                    .chain()
                    .map(function (cid) { return this.hash[cid]; }, this)
                    .compact()
                    .value();
            };
        })
        .on({
            'too-many': function () {
                tooMany = true;
                this.trigger('error', gt('Too many contacts in your address book.'));
            },
            'error': function (e) {
                this.$body.empty().addClass('error').text(e.error || e);
            },
            'select': function () {
                if (_.isFunction(callback)) callback(this.resolveItems(this.listView.selection.get()));
            }
        })
        .addCancelButton()
        //#. Context: Add selected contacts; German "Auswählen", for example
        .addButton({ label: gt.pgettext('select-contacts', 'Select'), action: 'select' })
        .open();
    }

    /* Debug lines

    require(['io.ox/contacts/addressbook/popup'], function (popup) { popup.getAllMailAddresses().always(_.inspect); });
    require('io.ox/contacts/addressbook/popup').searchIndex(window.index, 'b');

    void require(['io.ox/contacts/addressbook/popup'], function (popup) { popup.open(_.inspect); });
    */

    return {
        buildIndex: buildIndex,
        searchIndex: searchIndex,
        getAllMailAddresses: getAllMailAddresses,
        open: open
    };
});
