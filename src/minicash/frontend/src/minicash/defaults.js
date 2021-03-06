'use strict';
/* global $ */


import Decimal from 'decimal.js';



Decimal.set({ rounding: 3 });


$.validator.setDefaults({
    highlight: function (element) {
        $(element).closest('.form-group').addClass('has-error');
    },

    unhighlight: function (element) {
        $(element).closest('.form-group').removeClass('has-error');
    },

    errorElement: 'span',

    errorClass: 'help-block',

    errorPlacement: function (error, element) {
        if (element.parent('.input-group').length) {
            error.insertAfter(element.parent());
        }
        else {
            error.insertAfter(element);
        }
    },

    ignore: '',
});


$.fn.select2.defaults.set("theme", "bootstrap");
