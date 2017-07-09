'use strict';

// NOTE, these MUST be loaded before anything, because monkey-patching happens here
import './defaults';
import './extensions';

import {sprintf} from 'sprintf-js';
import Mn from 'backbone.marionette';

import {HomeTab} from './tabs/tab_home';
import {TabbarManager} from './components/tabbar_manager';
import * as models from './models';
import * as utils from './utils';


export default Mn.Application.extend({
    status: utils.status,
    notify: utils.notifier,

    initialize: function() {
        this.CONTEXT = window._minicashContext;
        this.initCollections();
    },

    initCollections: function() {
        this.collections = {
            assets: new models.Assets,
            records: new models.Records,
            tags: new models.Tags,
        };
    },

    onStart: function() {
        this.bootstrapData();
        this.tabbar = new TabbarManager({firstTab: HomeTab});
    },

    bootstrapData: function() {
        this.collections.assets.reset(this.CONTEXT.bootstrap.assets);
        this.collections.tags.reset(this.CONTEXT.bootstrap.tags);
        this.collections.records.fetch().done(() => {
            this.collections.records.on('sync', () => {
                this.collections.assets.fetch();
            });
        });
    },

    url: function(name, args={}) {
        let url = this.CONTEXT.urls[name].url;
        return sprintf(url, args);
    },

    static: function (url) {
        return this.CONTEXT.settings.STATIC_URL + url;
    }
});
