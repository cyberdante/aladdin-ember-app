import Component from '@ember/component';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['md-padding', 'tabbed-container'],
    
    init() {
        this._super(...arguments);
    },

    actions: {
        viewChange() {
            this.viewChange();
        }
    }
});