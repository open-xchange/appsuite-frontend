/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2019 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/backbone/views/toolbar', [
    'io.ox/backbone/views/disposable',
    'io.ox/core/extensions',
    'io.ox/backbone/views/actions/util',
    'gettext!io.ox/core'
], function (DisposableView, ext, util, gt) {

    'use strict';

    //
    // Toolbar.
    //
    // options:
    // - point: extension point id to render items
    // - inline (bool; default false): use as inline images; primarily uses different CSS classes
    // - dropdown (bool; default true): move "lo" prio items into dropdown (if more than 2 "hi")
    // - simple (bool; default false): defines whether simple collection checks should be used, i.e. no folder-specific stuff
    // - align (string; default "left"): defines default alignment (left or right)
    // - strict (boolean; default "true"): update only if selection has changed

    var ToolbarView = DisposableView.extend({

        events: {
            'click a[data-action]': 'onClick',
            'focus > ul > li > a': 'onFocus'
        },

        // we use the constructor here not to collide with initialize()
        constructor: function (options) {
            // add central extension point
            this.options = _.extend({ inline: false, point: '', dropdown: true, simple: false, strict: true, align: 'left' }, options);
            this.setPoint(this.options.point);
            DisposableView.prototype.constructor.apply(this, arguments);
            this.$el
                .addClass(this.options.inline ? 'inline-toolbar-container' : 'classic-toolbar-container')
                .toggleClass('align-right', this.options.align === 'right')
                .append(this.createToolbar());
            this.selection = null;
            if (this.options.data) this.setData(this.options.data);

            // _finalizeRender is added to the prototype, but for the _.lfo function
            // we a different instance for each toolbar.
            this.finalizeRender = function ($toolbar) { this._finalizeRender($toolbar); };
        },

        _finalizeRender: function ($toolbar) {
            if (this.disposed) return;

            this.injectMoreDropdown($toolbar);
            this.replaceToolbar($toolbar);
            this.initButtons($toolbar);
            this.ready();
        },

        render: function (baton) {
            if (!baton) return this;

            var items = this.point.list()
                .map(util.processItem.bind(null, baton))
                .map(util.createItem.bind(null, baton));
            var $toolbar = this.createToolbar().append(_(items).pluck('$li'));
            util.waitForMatches(items, _.lfo(true, this, this.finalizeRender, $toolbar));
            return this;
        },

        createToolbar: function () {
            var title = this.options.title ? gt('%1$s toolbar. Use cursor keys to navigate.', this.options.title) : gt('Actions. Use cursor keys to navigate.');
            return $('<ul role="toolbar">')
                .addClass(this.options.inline ? 'inline-toolbar' : 'classic-toolbar')
                .attr({ 'aria-label': title })
                // always avoid clearing the URL hash
                .on('click', 'a', $.preventDefault);
        },

        replaceToolbar: function ($toolbar) {
            // identify focused element and try to focus the same element later
            var focus = $.contains(this.el, document.activeElement), selector;
            if (focus) {
                var activeElement = $(document.activeElement),
                    action = activeElement.data('action');
                if (action) selector = '[data-action="' + action + '"]';
                // try to select the element at the same position as before
                else selector = '> li:eq(' + activeElement.closest('li').index() + ') ' + activeElement.prop('tagName') + ':first';
            }
            this.$('> ul').tooltip('hide').replaceWith($toolbar);
            if (selector) this.$(selector).focus();
            return this;
        },

        injectMoreDropdown: function ($toolbar) {
            // remove hidden elements first
            $toolbar.find('li.hidden').remove();
            // get elements with lower priority
            var $lo = $toolbar.children('[data-prio="lo"]');
            // hide $lo if all items are disabled (we had this behavior before)
            // reason: no disabled items at the end of the list & no useless dropdown
            if ($lo.length === $lo.children('a.disabled').length) return $lo.remove();
            // injecting dropdowns must be allowed by configuration
            // avoid useless dropdowns with no items
            if (!this.options.dropdown || !$lo.length) return;
            // count hi
            var $hi = $toolbar.children('[data-prio="hi"]:not(.hidden)');
            // draw dropdown
            var $ul = util.createDropdownList().toggleClass('dropdown-menu-right', $hi.length > 1),
                $dropdown = util.createListItem().addClass('dropdown more-dropdown').append(
                    util.createDropdownToggle()
                        .attr('data-action', 'more')
                        .append('<i class="fa fa-ellipsis-h" aria-hidden="true">')
                        .addActionTooltip(_.device('smartphone') ? gt('Actions') : gt('More actions')),
                    $ul
                );
            // close tooltip when opening the dropdown
            $dropdown.on('shown.bs.dropdown', function () { $(this).find('a').tooltip('hide'); });
            // $ul is descendent of <body> for smartphones, so events bubble differently
            if (_.device('smartphone')) {
                util.bindActionEvent($ul);
            } else {
                util.addBackdrop($dropdown);
            }

            // metrics support
            $ul.on('click', 'a', this.track.bind(this));

            $dropdown.insertAfter($lo.last());
            // replace icons by text
            $lo.find('> a > i.fa').each(function () {
                var $a = $(this).parent(), title = $a.attr('title');
                $a.text(title);
            });
            $ul.append($lo);
            util.injectSectionDividers($ul);
        },

        getButtons: function () {
            return this.$('> ul > li > a').not(':hidden');
        },

        disableButtons: function () {
            // remove action attributes (also from dropdowns) and event handlers
            this.$('a[data-action]').attr('data-action', null);
            this.getButtons().off().tooltip('hide').tooltip('disable');
        },

        initButtons: function ($toolbar) {
            this.getButtons().attr('tabindex', -1);
            $toolbar.find('> li > a').first().attr('tabindex', 0);
        },

        // selection is expected to be array of object
        // - object must provide id and folder_id
        // - object_permissions if available
        // we serialize this array to check whether selection has really changed
        // this allows checking the selection for e2e testing
        // options can be object or function that returns options
        setSelection: function (selection, options) {

            // this function might be called through debounce(), so async, so check disposed
            if (this.disposed || !_.isArray(selection)) return;

            // just join array; we could sort() as well but that's just a theoretical case
            var serialized = selection.map(util.cid).join(',');
            // not changed?
            if (this.options.strict && this.selection === serialized) return this.ready();
            this.selection = serialized;
            this.disableButtons();

            return util.setSelection.call(this, selection, options);
        },

        setData: util.setData,

        setPoint: function (point) {
            this.point = _.isString(point) ? ext.point(point) : point;
            return this;
        },

        ready: function () {
            // this event can be used for e2e testing; toolbar is ready
            this.trigger('ready ready:' + this.selection, this.selection);
        },

        onFocus: function (e) {
            this.getButtons().attr('tabindex', -1);
            $(e.currentTarget).attr('tabindex', 0);
        },

        onClick: function (e) {
            this.track(e);
            util.invokeByEvent(e);
        },

        track: function (e) {
            // toolbar child vs. smart-dropdown childs
            var action = $(e.delegateTarget ? e.currentTarget : e.target),
                isDropDownClose = action.hasClass('dropdown-toggle') && action.parent().hasClass('open');
            if (isDropDownClose) return;
            this.$el.trigger('track', action);
        }
    });

    return ToolbarView;
});
