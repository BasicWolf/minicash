'use strict';

/* global _,$,console,document,jQuery,minicash,require */

import Decimal from 'decimal.js';
import Hb from 'handlebars';
import {Handlebars as LoaderHb} from 'handlebars-template-loader';
import {tr, decimalToString} from 'minicash/utils';


/*--------- Handlebars -----------*/
/*================================*/

/* This early hack is required due to handlebars-template-loader
   creating a separate instance of Handlebars environment */
LoaderHb.default = Hb.default;

/* ---------- Partials ----------- */

Hb.registerPartial(
    'components/non_field_errors',
    require('templates/components/non_field_errors.hbs')
);


/* ============ Helpers =============== */
Hb.registerHelper('log', function(v) {
    console.log(v);
});

/* ----------- Conditionals ---------- */
Hb.registerHelper('ifnot', function(v, options) {
    return v? options.inverse(this) : options.fn(this);
});

Hb.registerHelper('ifdef', function(v, options) {
    return v != null ? options.fn(this) : options.inverse(this);
});

Hb.registerHelper('ifndef', function(v, options) {
    return v == null ? options.fn(this) : options.inverse(this);
});

Hb.registerHelper('ifeq', function(v, v2, options) {
    return v === v2 ? options.fn(this) : options.inverse(this);
});

Hb.registerHelper('ifeq-ns', function(v, v2, options) {
    return v == v2 ? options.fn(this) : options.inverse(this);
});

Hb.registerHelper('ifneq', function(v, v2, options) {
    return v !== v2 ? options.fn(this) : options.inverse(this);
});

Hb.registerHelper('iflte', function(v, v2, options) {
    return v <= v2 ? options.fn(this) : options.inverse(this);
});

Hb.registerHelper('ifgt', function(v, v2, options) {
    return v > v2 ? options.fn(this) : options.inverse(this);
});
/*-----------------------------------*/

Hb.registerHelper('decimal', function(s, options) {
    let val = new Decimal(s);
    return decimalToString(val);
});

/*================================*/


(function($) { $.fn.extend({
    serializeForm: function (options) {
        let defaults = {
            forceArray: false,
        };
        let o = $.extend(defaults, options);
        let ret = [];

        this.each(function() {
            let $obj = $(this);
            let arrayData = $obj.serializeArray();
            let formData = _.chain(arrayData)
                .keyBy('name')
                .mapValues((val) => val.value)
                .value();

            // non_field_errors is an invisible field in forms,
            // which is used to display generic form errors.
            // see http://www.django-rest-framework.org/api-guide/serializers/
            // Usage: in conjunction with components/non_fields_error Handlebars partial
            delete formData['non_field_errors'];
            ret.push(formData);
        });

        if (ret.length == 1 && !o.forceArray) {
            return ret[0];
        } else {
            return ret;
        }
    }
}); })(jQuery);


/*------ CSRF ---------- */

let getCookie = function (name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

let csrfToken = getCookie('csrftoken');

let csrfSafeMethod = function (method) {
    // these HTTP methods do not require CSRF protection
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
};

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        /*===== CSRF =====*/
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrfToken);
        }

        /*===== Trailing slash =====*/
        if (!this.crossDomain) {
            let url = settings.url;
            let lastChar = url.slice(-1);
            if (lastChar != '/') {
                settings.url = url + '/';
            }
        }
    },

    complete: function(xhr, status) {
        handleAjaxError(xhr, status);
    },
});


function handleAjaxError(xhr, status) {
    const HTTP_500_INTERNAL_SERVER_ERROR = 500;

    switch(status) {
    case 'error':
        console.debug(`AJAX Error: ${xhr.responseText}`);

        if (xhr.status === HTTP_500_INTERNAL_SERVER_ERROR) {
            let errorMessage = tr('Unfortunately an application error has happened. <br>Please try again later.');
            if (xhr.responseJSON && xhr.responseJSON.detail) {
                errorMessage = xhr.responseJSON.detail;
            }

            minicash.notify.error(errorMessage);
        } else if (xhr.status === 0) {
            let errorMessage = tr('Error connecting to server');
            minicash.notify.error(errorMessage);
        }

        break;
    }
}

/*================================*/
