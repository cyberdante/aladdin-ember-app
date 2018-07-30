import Component from '@ember/component';
// import { observer } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';

export default Component.extend({
  blockchainUtils: service(),

  schema: '',

  assets: A([]),

  selectedAsset: Ember.Object.create({}),

  init() {
    this._super(...arguments);
    this.send('onViewChange', '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"castVote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"},"AddedCandidate":{"type":"object","properties":{"candidateID":{"indexed":false,"name":"candidateID","type":"number"}},"title":"AddedCandidate"}}}');
  },
  
  actions: {
    // NOTE(Adam): onViewChange() Is meant to be called on some external view change. Like the YAML was changed, 
    // so we need to update this view in response.
    onViewChange(schema) {
      this.set('schema', schema);
      let assets = this.blockchainUtils.extractAssetsTransactions(schema);
      this.set('assets', assets);
    },

    selectAsset(asset) {
      this.set('selectedAsset.isSelected', false);
      asset.set('isSelected', true);
      this.set('selectedAsset', asset);
    }
  }
});
