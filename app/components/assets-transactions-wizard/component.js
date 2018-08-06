import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';
import { observer } from '@ember/object';

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
