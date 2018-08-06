import Component from '@ember/component';
import {
  computed
} from '@ember/object';
import {
  inject as service
} from '@ember/service';

export default Component.extend({
  classNames: ['md-padding'],
  blockchainUtils: service(),
  selectedTab: 0,
  selectedComponent: 'contract-viewer',
  contractLanguage: 'solidity',
  tabTitles: computed(() => ['Smart Contract', 'Graph', 'Asset & Transactions']),
  contractCode: computed('schema', function () {
    let utils = this.get('blockchainUtils');
    return utils.generateContract(this.get('schema'));
  }),
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
          // TODO update to display AST list component
        case 2:
          this.set('selectedComponent', 'assets-transactions-wizard');
          break;
        default:
          this.set('selectedComponent', 'graph-view');
      }
    }
  }
});