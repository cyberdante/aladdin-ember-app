import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from './template';

export default Component.extend({
  layout,
  classNames: ['md-padding'],
  selectedTab: 0,
  selectedComponent: 'contract-viewer',
  tabTitles: computed(() => ['Smart Contract', 'Graph', 'Asset & Transactions']),
  init() {
    this._super(...arguments);
  },
  
  actions: {
    onChange(selected) {
      this.set('selectedTab', selected);

      switch (selected) {
        case 0:
          this.set('selectedComponent', 'contract-viewer');
          break;
        case 1:
          this.set('selectedComponent', 'graph-view');
          break;
        case 2:
          this.set('selectedComponent', 'assets-transactions-wizard');
          break;
        default:
          this.set('selectedComponent', 'graph-view');
      }
    },
    viewChange() {
      this.viewChange();
    }
  }
});