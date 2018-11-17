import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['md-padding', 'tabbed-container'],
    // selectedTab: 0,
    // selectedComponent: 'contract-viewer',
    // tabTitles: computed(() => ['Smart Contract', 'Graph']),
    init() {
        this._super(...arguments);
    },

    actions: {
        viewChange() {
            this.viewChange();
        }
    }
});