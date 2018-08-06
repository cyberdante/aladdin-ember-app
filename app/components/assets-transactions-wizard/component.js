import Component from '@ember/component';
// import { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';
import { observer } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';

export default Component.extend({
  blockchainUtils: service(),

  schema: '',

  assets: A([]),

  selectedAsset: O.create({}),
  selectedTxn: O.create({}),

  schemaChanged: observer('schema', function() {
    this.generateView(this.schema);
  }),

  init() {
    this._super(...arguments);
    // this.send('onViewChange', '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"castVote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"},"AddedCandidate":{"type":"object","properties":{"candidateID":{"indexed":false,"name":"candidateID","type":"number"}},"title":"AddedCandidate"}}}');
  },

  didInsertElement() {
    this.generateView(this.schema);
  },

  generateView(schema) {
    const self = this;
    let assets = this.blockchainUtils.extractAssetsTransactions(schema);
    self.set('assets', assets);
  },

  actions: {
    selectAsset(asset) {
      this.set('selectedAsset.isSelected', false);
      asset.set('isSelected', true);
      this.set('selectedAsset', asset);
    },

    selectTxn(txn) {
      this.set('selectedTxn.isSelected', false);
      txn.set('isSelected', true);
      this.set('selectedTxn', txn);

      let params = Object.keys(txn.meta.properties).reduce((acc, paramTitle) => {
        if (paramTitle !== 'dependencies' && paramTitle !== 'returns') {
          acc.push({title:paramTitle, type:txn.meta.properties[paramTitle].type});
        }
        return acc;
      }, []);

      this.set('txnReturnsType', txn.meta.properties.returns.type || 'void');
      this.set('txnParameters', A(params));
    }
  }
});
