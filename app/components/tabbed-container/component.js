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
  tabTitles: computed(() => ['Smart Contract', 'Assets & Transactions', 'Errors Log']),
  schemaString: '',
  contractCode: computed('schemaString', function () {
    let utils = this.get('blockchainUtils');
    return utils.generateContract(this.get('schemaString'));
  }),
  init() {
    this._super(...arguments);
    this.set('schemaString', '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"vote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"}}}');
  },
  actions: {
    onChange(selected) {
      this.set('selectedTab', selected);

      switch (selected) {
        case 0:
          this.set('selectedComponent', 'contract-viewer');
          break;
        case 1:
          this.set('selectedComponent', 'schema-validator-log');
          break;
          // TODO update to display AST list component
        case 2:
          this.set('selectedComponent', 'schema-validator-log');
          break;
        default:
          this.set('selectedComponent', 'schema-validator-log');
      }
    }
  }
});