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

define('io.ox/search/autocomplete/extensions',
    ['io.ox/core/extensions',
     'settings!io.ox/contacts',
     'gettext!io.ox/core',
     'less!io.ox/search/style'], function (ext, settings, gt) {

    var POINT = 'io.ox/search/autocomplete';

    var extensions = {

        dummy: function (baton) {
            var group;
            // input group and dropdown
            this.append(
                group = $('<div class="input-group">')
                    .append(
                        $('<input type="text" class="form-control search-field" tabindex="1">')
                        .attr({
                            placeholder: gt('Search') + ' ...'
                        })
                    )
            );

            //buttons
            extensions.cancelButton.call(group, baton);
            extensions.searchButton.call(group, baton);

            return this;
        },

        register: function (baton) {
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
                        var individual = ext.point(POINT + '/item/' + baton.data.facet);
                        baton.data = value;

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
                            value = node.data();
                        ref.val('');

                        // exclusive: define used option (type2 default is index 0 of options)
                        var option = _.find(value.options, function (item) {
                            return item.id === value.id;
                        });

                        model.add(value.facet, value.id, (option || {}).id);
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
                    opt = _.extend({}, opt || {}, { keepClosed: e.type.indexOf('focus') === 0});

                    // simulate tab keyup event
                    ref.trigger({
                            type: 'keyup',
                            which: 9
                        }, opt);

                })
                .on('mousedown', function () {
                    if(!ref.is(':focus'))
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
                        e.data = _.extend({}, e.data || {}, opt, {isRetry: true});
                    }
                });

            this.find('.btn-clear')
                .on('click', function () {
                    debugger;
                    view.trigger('button:clear');
                });

            this.find('.btn-search')
                .on('click', function (e) {
                    debugger;
                    ref.trigger(e);
                    view.trigger('button:search');
                });

            return this;
        },

        // searchfield: function (baton) {
        //     var ref,
        //         app = baton.app,
        //         model = baton.model,
        //         container = baton.$.container,
        //         group;
        //     // input group and dropdown
        //     this.append(
        //         group = $('<div class="input-group">')
        //             .append(
        //                 baton.$.input = ref = $('<input type="text" class="form-control search-field" tabindex="1">')
        //                 .attr({
        //                     placeholder: gt('Search') + ' ...'
        //                 })
        //                 .autocomplete({
        //                     api: app.apiproxy,
        //                     minLength: Math.max(1, settings.get('search/minimumQueryLength', 1)),
        //                     mode: 'search',
        //                     delay: 100,
        //                     parentSelector: container  ? '.query' : '.io-ox-search',
        //                     //model: model,
        //                     container: container,
        //                     cbshow: function () {
        //                         // reset autocomplete tk styles (currently only mobile)
        //                         ext.point(POINT + '/style-container').invoke('draw', this, baton);

        //                     },
        //                     // TODO: would be nice to move to control
        //                     source: function (val) {
        //                         // show dropdown immediately (busy by autocomplete tk)
        //                         ref.open();
        //                         return app.apiproxy.search(val);
        //                     },
        //                     reduce: function (data) {
        //                         // only show not 'advanced'
        //                         data.list = _.filter(data.list, function (facet) {
        //                             return !_.contains(facet.flags, 'advanced');
        //                         });
        //                         return data;
        //                     },
        //                     draw: function (value) {
        //                         var individual = ext.point(POINT + '/item/' + baton.data.facet);
        //                         baton.data = value;

        //                         // use special draw handler
        //                         if (individual.list().length) {
        //                             // special
        //                             individual.invoke('draw', this, baton);
        //                         } else {
        //                             // default
        //                             ext.point(POINT + '/item').invoke('draw', this, baton);
        //                         }
        //                     },
        //                     stringify: function () {
        //                         // keep input value when item selected
        //                         return ref.val();
        //                     },
        //                     click: function (e) {

        //                         // apply selected filter
        //                         var node = $(e.target).closest('.autocomplete-item'),
        //                             value = node.data();
        //                         ref.val('');

        //                         // exclusive: define used option (type2 default is index 0 of options)
        //                         var option = _.find(value.options, function (item) {
        //                             return item.id === value.id;
        //                         });

        //                         model.add(value.facet, value.id, (option || {}).id);
        //                     }
        //                 })
        //                 .on('focus focus:custom click', function (e, opt) {

        //                     //search mode: not when enterin input with tab key
        //                     if (ref.data('byclick')) {
        //                         ref.removeData('byclick');
        //                         app.view.trigger('focus', model.getApp());
        //                     }
        //                     // hint: 'click' supports click on already focused
        //                     // keep dropdown closed on focus event
        //                     opt = _.extend({}, opt || {}, { keepClosed: e.type.indexOf('focus') === 0});

        //                     // simulate tab keyup event
        //                     ref.trigger({
        //                             type: 'keyup',
        //                             which: 9
        //                         }, opt);

        //                 })
        //                 .on('mousedown', function () {
        //                     if(!ref.is(':focus'))
        //                         ref.data('byclick', true);

        //                 })
        //                 .on('keyup', function (e, options) {
        //                     var opt = _.extend({}, (e.data || {}), options || {}),
        //                         // keys pressed
        //                         down = e.which === 40 && !ref.isOpen(),
        //                         tab = e.which === 9;

        //                     // adjust original event instead of throwing a new one
        //                     // cause handler (fnKeyUp) is debounced and we might set some options
        //                     if (_.isUndefined(opt.isRetry) && (down || tab)) {
        //                         e.data = _.extend({}, e.data || {}, opt, {isRetry: true});
        //                     }
        //                 })
        //             )
        //     );

        //     //buttons
        //     ext.point(POINT + '/cancel-button').invoke('draw', group, baton);
        //     ext.point(POINT + '/search-button').invoke('draw', group, baton);

        //     return this;
        // },

        cancelButton: function () {

            this.append(
                $('<a href="#">')
                    .attr({
                        'tabindex': '1',
                        'class': 'btn-clear',
                    }).append(
                        $('<i class="fa fa-times"></i>')
                    )
                    .on('click', function (e) {
                        e.preventDefault();
                        //view.trigger('button:clear');
                    })
            );
        },

        searchButton: function () {
            this.append(
                $('<span class="input-group-btn">').append(
                    // submit
                    $('<button type="button">')
                    .attr({
                        'tabindex': '1',
                        'class': 'btn btn-default btn-search',
                        'data-toggle': 'tooltip',
                        'data-placement': 'bottom',
                        'data-animation': 'false',
                        'data-container': 'body',
                        'data-original-title': gt('Search'),
                        'aria-label': gt('Search')
                    })
                    .append(
                        $('<i class="fa fa-search"></i>')
                    )
                    .tooltip()
                    .on('click', function (e) {
                        e.preventDefault();
                        var e = $.Event('keydown');
                        e.which = 13;
                    })
                )
            );
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
                    .css('background-image', 'url(' + image+ ')')
            );
        },

        name: function (baton) {
            var name = (baton.data.item && baton.data.item.name ? baton.data.item.name : baton.data.name) || '&nbsp;';

            this
                .data(baton.data)
                .append(
                    //use html for the umlauts
                    $('<div class="name">').html(name)
                );

        },

        detail: function (baton) {
            var detail = baton.data.item  && baton.data.item.detail.length ? baton.data.item.detail : undefined,
                isContact = this.is('.contacts, .contact, .participant, .task_participants');

            // contact
            if (isContact) {
                this.removeClass('indent');
                this.append(
                    $('<div class="detail">').html(detail || '&nbsp;')
                );
            } else if (detail) {
                var node = this.find('.name');
                node.html(node.text() + ' <i>' + detail + '</i>');

            }

        }

    };

    return extensions;
});
