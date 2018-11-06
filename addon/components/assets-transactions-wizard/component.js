import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';
import { observer, computed } from '@ember/object';
import { /*or,*/ and, not } from '@ember/object/computed';
import layout from './template';

export default Component.extend({
  classNames: ['assets-transactions-wizard'],
  classNameBindings: ['showTitle'],
  layout,
  blockchainUtils: service(),
  schema: '',
  assets: A([]),
  assetTitles: computed('assets', function(){
    return this.get('assets').mapBy('title');
  }),

  editingContract:false,
  editingAssetTitle: false,
  editingTxnTitle: false,
  editingParamTitle: false,
  editingTxnAdd: true,
  editingTxnDelete: true,
  editingTxnAddName: false,
  editingTxnDeleteName: false,
  showDialog: false,
  addParams: true,
  bundlehash: false,
  origTitle: '',
  tranParamTitle: '',
  txnName: '',
  options: computed(function () {
    return ['string', 'bytes32', 'uint', 'address'];
  }),
  origTxnTitle: '',
  origParamTitle: '',
  tranAssetTitle: '',
  newTxnName: '',
  txnParamType: '',
  parameters: computed(function () {
    return A([{}]);
  }),
  selectedTxn: O.create({}),

  typeSelected: '',

  schemaChanged: observer('schema', function () {
    this.generateView(this.schema);
    this.set('tranAssetTitle', this.get('assetTitles')[0]);
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
    assets.forEach(x => x.expanded = false);
    self.set('assets', assets);
  },

  validNewParameters: computed('parameters', 'parameters.{length,@each.name}', function(/*parameters*/) {
    let valid = true;
    this.get('parameters').forEach(p => {
      valid = valid && (p.name && p.name.length > 0);
    });
    return valid;
  }),
  newMethodHasName: computed('newTxnName', 'newTxnName.length', function(/*newTxnName*/) {
    return this.get('newTxnName').length > 0;
  }),
  doneButtonEnabled: and('newMethodHasName','validNewParameters'), 
  doneButtonDisabled: not('doneButtonEnabled'),

  actions: {
    toggleAssetState(asset) {
      asset.set('expanded', !asset.get('expanded'));
    },

    selectTxn(txn) {
      this.set('selectedTxn.isSelected', false);
      txn.set('isSelected', true);
      this.set('selectedTxn', txn);

      let params = Object.keys(txn.meta).reduce((acc, paramTitle) => {
        if (paramTitle !== 'dependencies' && paramTitle !== 'returns' && paramTitle !== 'title') {
          acc.push({ title: paramTitle, type: txn.meta[paramTitle].type, txn: txn });
        }
        return acc;
      }, []);
      this.set('txnReturnsType', 'void');
      this.set('txnParameters', A(params));
    },

    toggleAsset(origAsset) {
      this.set('origTitle', origAsset);
      this.set('editingAssetTitle', true);
    },
    toggleOff(newAsset) {
      this.set('editingAssetTitle', false);
      let schema = this.blockchainUtils.updateAssetSchema(newAsset, this.origTitle, this.schema);
      this.set('schema', schema);
    },
    toggleTxn(origTxn) {
      this.set('origTxnTitle', origTxn);
      this.set('editingTxnTitle', true);
    },
    toggleOffTxn(newTxn) {
      this.set('editingTxnTitle', false);
      let schema = this.blockchainUtils.updateTxnSchema(newTxn, this.origTxnTitle, this.schema);
      this.set('schema', schema);
    },
    toggleParam(origParam) {
      this.set('origParamTitle', origParam);
      this.set('editingParamTitle', true);
    },
    toggleOffParam(txnTitle, param) {
      this.set('editingParamTitle', false);
      let schema = this.blockchainUtils.updateParamSchema(txnTitle.title, this.origParamTitle, param.title, param.type, this.schema);
      this.set('schema', schema);
    },
    typeChange(event) {
      this.set('txnParamType', event.target.value);
    },
    typeChangeAdd(txnTitle, param, event) {
      let schema = this.blockchainUtils.updateParamSchemaType(txnTitle.title, param.title, event.target.value, this.schema);
      this.set('schema', schema);
    },
    addNewTxn() {
      let schema = this.blockchainUtils.updateSchemaAddTxn(this.newTxnName, this.tranAssetTitle, this.parameters, this.schema, this.bundlehash);
      this.set('schema', schema);
      this.set('editingTxnAddName', false);
      this.set('editingTxnAdd', true);
      this.set('newTxnName', '');
      this.set('tranAssetTitle', '');
      this.set('paramName', '');
      this.set('paramType', '');
      this.set('txnParamType', '');
      //   this.set('parameters', [{}]);
      this.get('parameters').clear();
      this.set('bundlehash', false);
    },
    toggleOffAddTxn() {
      this.set('editingTxnAdd', false);
      this.set('editingTxnAddName', true);
      this.set('showDialog', true);
    },
    toggleOffDeleteTxn() {
      this.set('editingTxnDelete', false);
      this.set('editingTxnDeleteName', true);
    },
    deleteTxn() {
      let schema = this.blockchainUtils.updateSchemaDeleteTxn(this.deleteTxnName, this.schema);
      this.set('schema', schema);
      this.set('deleteTxnName', '');
    },
    toggleInput() {
      this.set('addInput', true);
    },
    moreParams() {
      this.get('parameters').pushObject({ name: '', type: '' });
      for (var key in this.parameters) {
        if (this.parameters.hasOwnProperty(key)) {
          // TODO linter complains if this block is blank
        }
      }
    },
    openPromptDialog(){
        this.set('showDialog',true);
    },
    closePromptDialog(){
        this.set('showDialog',false);
        this.set('editingTxnAdd', true);
        this.set('editingTxnAddName', false);
    }
   
  }
});
