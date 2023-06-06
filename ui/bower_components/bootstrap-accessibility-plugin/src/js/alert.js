    // Alert Extension
    // ===============================
    var alertConstructor = $.fn.dropdown.Constructor,
        alertFn = $.fn.dropdown;

    $.fn.alert = function () {
        $(this).attr({ role: 'alert' });
        return alertFn.apply(this, arguments);
    };
    $.fn.alert.Constructor = alertConstructor;
