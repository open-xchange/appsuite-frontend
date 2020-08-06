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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
(function ($) {

    //
    // Copied from bootstrap accessibility plugin
    // https://github.com/Open-Xchange-Frontend/bootstrap-accessibility-plugin
    //

    // Modal Extension
    // ===============================
    $.fn.modal.Constructor.prototype._hide = $.fn.modal.Constructor.prototype.hide;
    $.fn.modal.Constructor.prototype._show = $.fn.modal.Constructor.prototype.show;

    $.fn.modal.Constructor.prototype.hide = function () {
        var modalOpener = this.$element.parent().find('[data-target="#' + this.$element.attr('id') + '"]');
        $.fn.modal.Constructor.prototype._hide.apply(this, arguments);
        modalOpener.focus();
    };

    $.fn.modal.Constructor.prototype.show = function () {
        $('.modal-dialog', this).attr({ role: 'document' });
        $.fn.modal.Constructor.prototype._show.apply(this, arguments);
    };

    // GENERAL UTILITY FUNCTIONS
    // ===============================
    var removeMultiValAttributes = function (el, attr, val) {
        var describedby = (el.attr(attr) || '').split(/\s+/),
            index = $.inArray(val, describedby);
        if (index !== -1) {
            describedby.splice(index, 1);
        }
        describedby = $.trim(describedby.join(' '));
        if (describedby) {
            el.attr(attr, describedby);
        } else {
            el.removeAttr(attr);
        }
    };

    // Popover Extension
    // ===============================
    var showPopover =     $.fn.popover.Constructor.prototype.setContent,
        hidePopover =     $.fn.popover.Constructor.prototype.hide;

    $.fn.popover.Constructor.prototype.setContent = function () {
        showPopover.apply(this, arguments);
        var $tip = this.tip(),
            tooltipID = $tip.attr('id') || _.uniqueId('ui-tooltip');
        $tip.attr({ role: 'tooltip', id: tooltipID });
        this.$element.attr('aria-describedby', tooltipID);
    };

    $.fn.popover.Constructor.prototype.hide = function () {
        hidePopover.apply(this, arguments);
        removeMultiValAttributes(this.$element, 'aria-describedby', this.tip().attr('id'));
        return this;
    };

    // TOOLTIP Extension
    // ===============================
    var showTooltip =       $.fn.tooltip.Constructor.prototype.show,
        hideTooltip =       $.fn.tooltip.Constructor.prototype.hide,
        tooltipHasContent = $.fn.tooltip.Constructor.prototype.hasContent;

    $.fn.tooltip.Constructor.prototype.show = function () {
        showTooltip.apply(this, arguments);
        var $tip = this.tip(),
            tooltipID = $tip.attr('id') || _.uniqueId('ui-tooltip');
        $tip.attr({ role: 'tooltip', id: tooltipID });
        if (this.$element) this.$element.attr({ 'aria-describedby': tooltipID });
    };

    $.fn.tooltip.Constructor.prototype.hide = function () {
        hideTooltip.apply(this, arguments);
        if (this.$element) removeMultiValAttributes(this.$element, 'aria-describedby', this.tip().attr('id'));
        return this;
    };

    $.fn.tooltip.Constructor.prototype.hasContent = function () {
        if (!this.$element) return false;
        return tooltipHasContent.apply(this, arguments);
    };

})(jQuery);
