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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/search/autocomplete/extensions',[
    'io.ox/core/extensions',
    'settings!io.ox/contacts',
    'gettext!io.ox/core',
    'less!io.ox/search/style'
], function (ext, settings, gt) {
    'use strict';

    var POINT = 'io.ox/search/autocomplete';

    ext.point(POINT + '/handler/click').extend({
        id: 'default',
        index: 1000000000000,
        flow: function (baton) {
            baton.data.deferred.done(function (value) {
                // exclusive: define used option (type2 default is index 0 of options)
                var option = _.find(value.options, function (item) {
                    return item.id === value.id;
                });

                baton.data.model.add(value.facet, value.id, (option || {}).id);
            });
        }
    });

    var extensions = {

        searchfieldLogic: function (baton) {
            var ref = this.find('.search-field'),
                app = baton.app,
                model = baton.model,
                view = baton.app.view,
                container = baton.$.container;
            // input group and dropdown
            ref.autocomplete({
                api: app.apiproxy,
                minLength: Math.max(1, settings.get('search/minimumQueryLength', 1)),
                mode: 'search',
                delay: 100,
                parentSelector: container  ? '.query' : '.io-ox-search',
                container: container,
                cbshow: function () {
                    // reset autocomplete tk styles (currently only mobile)
                    ext.point(POINT + '/style-container').invoke('draw', this, baton);

                },
                // TODO: would be nice to move to control
                source: function (val) {
                    // show dropdown immediately (busy by autocomplete tk)
                    ref.open();
                    return app.apiproxy.search(val);
                },
                reduce: function (data) {
                    // only show not 'advanced'
                    data.list = _.filter(data.list, function (facet) {
                        return !_.contains(facet.flags, 'advanced');
                    });
                    return data;
                },
                draw: function (value) {
                    baton.data = value;
                    var individual = ext.point(POINT + '/item/' + baton.data.facet);

                    // use special draw handler
                    if (individual.list().length) {
                        // special
                        individual.invoke('draw', this, baton);
                    } else {
                        // default
                        ext.point(POINT + '/item').invoke('draw', this, baton);
                    }
                },
                stringify: function () {
                    // keep input value when item selected
                    return ref.val();
                },
                click: function (e) {

                    // apply selected filter
                    var node = $(e.target).closest('.autocomplete-item'),
                        value = node.data(),
                        baton = ext.Baton.ensure({
                            deferred: $.Deferred().resolve(value),
                            model: model,
                            view: view
                        });

                    // empty input field
                    if (!(model.getOptions().switches || {}).keepinput)
                        ref.val('');

                    ext.point(POINT + '/handler/click').invoke('flow', this, baton);
                }
            })
            .on('focus focus:custom click', function (e, opt) {

                //search mode: not when enterin input with tab key
                if (ref.data('byclick')) {
                    ref.removeData('byclick');
                    app.view.trigger('focus', model.getApp());
                }
                // hint: 'click' supports click on already focused
                // keep dropdown closed on focus event
                opt = _.extend({}, opt || {}, { keepClosed: e.type.indexOf('focus') === 0 });

                // simulate tab keyup event
                ref.trigger({
                    type: 'keyup',
                    which: 9
                }, opt);

            })
            .on('mousedown', function () {
                if (!ref.is(':focus'))
                    ref.data('byclick', true);

            })
            .on('keyup', function (e, options) {
                var opt = _.extend({}, (e.data || {}), options || {}),
                    // keys pressed
                    down = e.which === 40 && !ref.isOpen(),
                    tab = e.which === 9;

                // adjust original event instead of throwing a new one
                // cause handler (fnKeyUp) is debounced and we might set some options
                if (_.isUndefined(opt.isRetry) && (down || tab)) {
                    e.data = _.extend({}, e.data || {}, opt, { isRetry: true });
                }
            });

            this.find('.btn-clear')
                .on('click', function () {
                    view.trigger('button:clear');
                });

            this.find('.btn-search')
                .on('click', function () {
                    // open autocomplete dropdown
                    ref.trigger('click');
                    // trigger ENTER keypress
                    var keydown = $.Event('keydown');
                    keydown.which = 13;
                    ref.trigger(keydown);
                    // prevent, propagation
                    return false;
                });

            return this;
        },

        searchfieldMobile: function (baton) {

            if (!_.device('smartphone')) return;

            var group,
                label = gt('Search'),
                id = 'search-search-field';

            // input group and dropdown
            this.append(
                group = $('<div class="input-group">')
                    .append(
                        $('<input type="text">')
                        .attr({
                            class: 'form-control search-field',
                            role: 'search',
                            tabindex: 1,
                            id: id,
                            placeholder: label + ' ...'
                        }),
                        $('<label class="sr-only">')
                            .attr('for', id)
                            .text(label)
                    )
            );

            // buttons
            group.append(
                $('<a href="#">')
                    .attr({
                        'tabindex': '1',
                        'class': 'btn-clear',
                        'aria-label': gt('Clear field'),
                        'role': 'button'
                    }).append(
                        $('<i class="fa fa-times"></i>')
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                    })
            );
            group.append(
                $('<span class="input-group-btn">').append(
                    // submit
                    $('<button type="button">')
                    .attr({
                        'tabindex': '1',
                        'class': 'btn btn-default btn-search',
                        'aria-label': gt('Search')
                    })
                    .append(
                        $('<i class="fa fa-search"></i>')
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        var e = $.Event('keydown');
                        e.which = 13;
                    })
                )
            );

            // add search logic (autocomplet etc.)
            extensions.searchfieldLogic.call(this, baton);
        },

        styleContainer: function (baton) {
            var value = 'width: 100%;';
            //custom dropdown container?
            if (baton.$.container && baton.$.container.attr('style') !== value) {
                // reset calculated style from autocomplete tk
                baton.$.container.attr('style', value);
            }
        },

        item: function (baton) {
            this.addClass(baton.data.facet);
            // contact picture
            ext.point(POINT + '/image').invoke('draw', this, baton);
            // display name
            ext.point(POINT + '/name').invoke('draw', this, baton);
            // email address
            ext.point(POINT + '/detail').invoke('draw', this, baton);
            // aria lebel
            ext.point(POINT + '/a11y').invoke('draw', this, baton);
        },

        image: function (baton) {

            //disabled
            if (!this.is('.contacts, .contact, .participant, .task_participants')) return;

            var image = ox.base + '/apps/themes/default/dummypicture.png';

            // remove default indent
            this.removeClass('indent');

            // construct url
            image = (baton.data.item && baton.data.item.image_url ? baton.data.item.image_url + '&height=42&scaleType=contain' : image)
                .replace(/^https?\:\/\/[^\/]+/i, '')
                .replace(/^\/ajax/, ox.apiRoot);

            // add image node
            this.append(
                $('<div class="image">')
                    .css('background-image', 'url(' + image + ')')
            );
        },

        name: function (baton) {
            var name = (baton.data.item && baton.data.item.name ? baton.data.item.name : baton.data.name) || '\u00A0';

            this
                .data(baton.data)
                .append(
                    //use html for the umlauts
                    $('<div class="name">').text(name)
                );

        },

        detail: function (baton) {
            var detail = baton.data.item && baton.data.item.detail && baton.data.item.detail.length ? baton.data.item.detail : undefined,
                isContact = this.is('.contacts, .contact, .participant, .task_participants');

            // contact
            if (isContact) {
                this.removeClass('indent');
                this.append(
                    $('<div class="detail">').text(detail || '\u00A0')
                );
            } else if (detail) {
                var node = this.find('.name');
                node.append(
                    $('<i>').text('\u00A0' + detail)
                );
            }
        },

        a11y: function () {
            var text = this.find('.name').text() + ' ' +  this.find('.detail').text();
            this.attr({
                'aria-label': text,
                'tabIndex': 1
            });
        }

    };

    return extensions;
});
