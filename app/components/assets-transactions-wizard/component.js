import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';
import { observer } from '@ember/object';

export default Component.extend({
  blockchainUtils: service(),

  schema: '',

  assets: A([]),

  editingAssetTitle:false,
  editingTxnTitle:false,
  origTitle: '',
  origTxnTitle:'',

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

      let params = Object.keys(txn.meta).reduce((acc, paramTitle) => {
        if (paramTitle !== 'dependencies' && paramTitle !== 'returns' && paramTitle !== 'title') {
          acc.push({title:paramTitle, type:txn.meta[paramTitle].type});
        }
        return acc;
      }, []);

      // this.set('txnReturnsType', txn.meta.returns.type || 'void');
      this.set('txnReturnsType', 'void');
      this.set('txnParameters', A(params));
    },

    toggleAsset(origAsset){
        this.set('origTitle', origAsset);
        this.set('editingAssetTitle', true);
    },
    toggleOff(newAsset){
        this.set('editingAssetTitle', false);
        let schema = this.blockchainUtils.updateAssetSchema(newAsset, this.origTitle, this.schema);
        this.set('schema', schema);
    },
    toggleTxn(origTxn){
        this.set('origTxnTitle', origTxn);
        this.set('editingTxnTitle', true);
    },
    toggleOffTxn(newTxn){
        this.set('editingTxnTitle', false);
        let schema = this.blockchainUtils.updateTxnSchema(newTxn, this.origTxnTitle, this.schema);
        this.set('schema', schema);
    }
  }
});
