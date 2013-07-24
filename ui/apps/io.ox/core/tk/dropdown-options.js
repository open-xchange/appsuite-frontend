/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define("io.ox/core/tk/dropdown-options",
    ['io.ox/core/event',
     'gettext!iopt.ox/core'], function (Events, gt) {

    'use strict';

    return function (options) {
        var self = {},
            opt,
            //data
            nodes = {},
            data = {},
            //nodes
            $anchor,
            $container = $('<span class="dropdown"">'),
            $menu = $('<ul class="dropdown-menu no-clone" role="menu">'),

            /**
             * @return {object} self for chaining
             */
            init = function () {
                opt = _.extend({
                    id: 'unknown',
                    //label prefix for textnode anchors
                    label: '',
                    anchor: undefined,
                    settings: undefined,
                    //add a close action to dropdown
                    addclose: false
                }, options);

                $anchor = opt.anchor;

                Events.extend(self);
                //init
                load();
                save();


                //add nodes
                $anchor.after($container);
                $container.append($anchor);

                //add options to menu
                $container.append($menu);

                // Tell the anchor that it triggers the dropdown
                $anchor.attr({
                    'data-toggle': 'dropdown',
                    'aria-haspopup': true,
                    role: 'menuitem'
                });

                //add dropdown to anchor
                $anchor.dropdown();

                //draw
                self.draw();

                return self;
            },


            /**
             * load last used options (or default)
             * @return {undefined}
             */
            load = function () {
                data = opt.defaults;
                if (opt.settings) {
                    var stored = opt.settings.get('options/' + opt.id, data);
                    _.each(data, function (item) {
                        //only use options that are currently available
                        data[item.name] = stored[item.name] || data[item.name];
                    });
                }
            },

            /**
             * store data in node and settings
             * @return {undefined}
             */
            save = function () {
                //store in node
                $anchor.data(_.extend($anchor.data(), {options: data}));
                //store setting
                if (opt.settings)
                    opt.settings.set('options/' + opt.id, data).save();
            },

            toggleValue = function (item) {
                item.checked = !item.checked;
                save();
                self.refresh();
                self.trigger('change', self);
                self.trigger('change:' + item.name, self);
            };

        /**
         * anchor node
         * @return {jquery} anchor node
         */
        self.anchor = function () {
            return $anchor;
        };

        /**
         * current data
         * @return {object} option name, label and value
         */
        self.data = function () {
            return data;
        };

        /**
         * toggle visibility
         * @return {object} self for chaining
         */
        self.toggle = function () {
            $anchor.dropdown('toggle');
            return self;
        };

        /**
         * refresh nodes (values/icons)
         * @return {object} self for chaining
         */
        self.refresh = function () {
            var selected = [];
            _(nodes).each(function (node, name) {
                var item = data[name];
                //reset
                node.find('span').removeClass('icon-ok icon-remove');
                //set icons
                if (item.checked) {
                    selected.push(item.label);
                    node.find('span').addClass('icon-ok');
                } else {
                    node.find('span').addClass('icon-remove');
                }
            });

            //update text (icon only anchor vs. text anchor)
            if ($anchor.text() !== '') {
                self.trigger('redraw', self);
                $anchor.text(
                    opt.label + (selected.length ? (opt.label !== '' ? ': ' : '') + selected.join(', ') : '')
                ).focus();
            }
            return self;
        };

        /**
         * redraw
         * @return {object} self for chaining
         */
        self.redraw = function () {
            self.draw();
            return self;
        };

        /**
         * create nodes
         * @return {object} self for chaining
         */
        self.draw = function () {
            $menu.empty();
            //create nodes
            _(data).each(function (item) {
                $menu.append(
                     nodes[item.name] = $('<li>')
                        .append($('<a href="#">')
                            .attr({ tabindex: $anchor.attr('tabindex') })
                            .text(item.label)
                            .append('<span class="pull-left"></span>')
                            .on('click', function (e) {
                                e.preventDefault();
                                toggleValue(item);
                                return false;
                            })
                    )
                );

            });
            //close action
            if (opt.addclose) {
                $menu.append('<li class="divider"></li>');
                $menu.append($('<li style="text-align: center">').append(
                        $('<a href="#">')
                        .text(gt('close'))
                        .on('click', function (e) {
                                e.preventDefault();
                                self.toggle();
                                return false;
                            })
                    )
                );
            }
            //refresh node values/icons
            self.refresh();
            return self;
        };

        return init();
    };
});

