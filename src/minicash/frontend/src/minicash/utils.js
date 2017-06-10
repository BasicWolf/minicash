'use strict';

/* global $, _ */

import Bb from 'backbone';
import Bhound from 'bloodhound-js';
import Decimal from 'decimal.js';
import Mn from 'backbone.marionette';
import PageableCollection from 'backbone.paginator';

/* --- CONSTANTS --- */
/*-------------------*/
export let KEYS = {
    ENTER: 13,
    ESCAPE: 27,
}


/* --- NOTIFICATIONS AND STATUS --- */
/* ---------------------------------*/
export let notifier = (function() {
    let invoke = (message, type='info') =>
        $.notify({
            message: message
        }, {
            type: type,
            allow_dismiss: true,
        });

    return {
        info: (message) => invoke(message, 'info'),
        success: (message) => invoke(message, 'success'),
        warning: (message) => invoke(message, 'warning'),
        error: (message) => invoke(message, 'danger'),
    };
})();

export let status = (function() {
    let $el = $('<div class="minicash-status" style="display:none;"><div></div></div>');
    $('body').append($el);

    return {
        show: () => $el.show(),
        hide: () => $el.fadeOut(500),
    };
})();

/* ==================================================================================================== */


/* --- HELPER CLASSES --- */
/*------------------------*/
export let UnwrappedView = Mn.View.extend({
    onRender() {
        // Get rid of that pesky wrapping-div.
        // Assumes 1 child element present in template.
        this.$el = this.$el.children();
        // Unwrap the element to prevent infinitely
        // nesting elements during re-render.
        this.$el.unwrap();
        this.setElement(this.$el);
    }
});


export class Bloodhound {
    constructor(collection, attribute) {
        _.extend(this, Bb.Events);

        this._bloodhound = null;
        this.collection = collection;
        this.attribute = attribute;

        this.listenTo(this.collection, 'update', this.refreshBloodhound);
        this.listenTo(this.collection, 'reset', this.refreshBloodhound);
    }

    refreshBloodhound() {
        this._bloodhound = new Bhound({
            local: this.collection.toJSON(),
            datumTokenizer: Bhound.tokenizers.obj.whitespace(this.attribute),
            queryTokenizer: Bhound.tokenizers.whitespace,
        });
        this._bloodhound.initialize();
    }

    adapter() {
        return this._bloodhound.ttAdapter();
    }
}


export let BaseModel = Bb.Model.extend({
    serverAttributes: null,

    save(attrs, options) {
        attrs = attrs || this.toJSON();
        options = options || {};

        // if model defines serverAttributes, replace attrs with trimmed version
        if (_.isNull(this.serverAttributes)) {
            attrs = _.pick(attrs, this.serverAttributes);
        }

        Backbone.Model.prototype.save.call(this, attrs, options);
    },

    serialize() {
        let data = _.clone(this.attributes);
        data['id'] = this.id;
        return data;
    }
});


let SerializableCollectionMixin = {
    serialize() {
	    return this.map( (model) => {
            if (model instanceof BaseModel)
                return model.serialize();
            else
                return _.clone(model.attributes);
        });
    }
};


export let BaseCollection = Bb.Collection.extend({});
_.extend(BaseCollection.prototype, SerializableCollectionMixin);


export let BasePageableCollection = Bb.PageableCollection.extend({
    state: {
        firstPage: 1
    },

    queryParams: {
        currentPage: 'page',
        pageSize: 'page_size',
        totalRecords: 'count',
        totalPages: 'num_pages',
    },

    parseState(resp, queryParams, state, options) {
        let newState = Bb.PageableCollection.prototype.parseState.apply(this, arguments);

        // add `previousPage` and `nextPage` to state - handy when rendering
        newState.previousPage = null;
        newState.nextPage = null;

        if (!_.isNull(newState.currentPage)) {
            newState.previousPage = newState.currentPage - 1;
            newState.nextPage = newState.currentPage + 1;
        }
        return newState;
    },
});
_.extend(BasePageableCollection.prototype, SerializableCollectionMixin);

/* ==================================================================================================== */


/* --- HELPER FUNCTIONS --- */
/*--------------------------*/

// generateId :: Integer -> String
export function generateId(len) {
    let dec2hex = (dec) => dec.toString(16);
    let arr = new Uint8Array((len || 40) / 2);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(dec2hex).join('');
}


export function splitToNonEmpty(s, splitter) {
    return s.split(splitter).filter((s) => s);
}


export function decimalToString(dec) {
    return dec.toPrecision();
}


export function compareStringsAsDecimals(s1, s2) {
    return decimalToString(new Decimal(s1)) === decimalToString(new Decimal(s2));
}

/* ==================================================================================================== */