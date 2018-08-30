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
  editingParamTitle:false,
  editingTxnAdd:true,
  editingTxnDelete:true,
  editingTxnAddName:false,
  editingTxnDeleteName:false, 
  addParams:true,
  origTitle: '',
  tranParamTitle:'',
  txnName:'',
  options: ['string', 'bytes32', 'number'],
  origTxnTitle:'',
  origParamTitle:'',
  tranAssetTitle:'',
  newTxnName:'',
  deleteTxnName:'',
//   tranParamType: O.create({}),
txnParamType:'',


  selectedAsset: O.create({}),
  selectedTxn: O.create({}),

  typeSelected:'',

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
            acc.push({title:paramTitle, type:txn.meta[paramTitle].type, txn:txn});
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
    },
    toggleParam(origParam){
        this.set('origParamTitle', origParam);
        this.set('editingParamTitle', true);
    },
    toggleOffParam(txnTitle, param){
        this.set('editingParamTitle', false);
        let schema = this.blockchainUtils.updateParamSchema(txnTitle.title, this.origParamTitle, param.title, param.type, this.schema);
        this.set('schema', schema);
    },
    typeChangeAdd(event){
         this.set('txnParamType', event.target.value);
     },
     typeChange(txnTitle, param, event ){
        let schema = this.blockchainUtils.updateParamSchemaType(txnTitle.title, param.title,event.target.value, this.schema);
        this.set('schema', schema);
     },
     addNewTxn(){
        let schema = this.blockchainUtils.updateSchemaAddTxn(this.newTxnName, this.tranAssetTitle, this.paramName, this.txnParamType, this.schema)
        this.set('schema', schema);
        this.set('editingTxnAddName', false);
        this.set('editingTxnAdd', true);
        this.set('newTxnName', '');
        this.set('tranAssetTitle', '');
        this.set('paramName','');
        this.set('paramType','');
    },
    toggleOffAddTxn(){
        this.set('editingTxnAdd', false);
         this.set('editingTxnAddName', true);
    },
    toggleOffDeleteTxn(){
        this.set('editingTxnDelete', false);
        this.set('editingTxnDeleteName', true);
    },
    deleteTxn(){
        let schema = this.blockchainUtils.updateSchemaDeleteTxn(this.deleteTxnName, this.schema)
        this.set('schema', schema);
        this.set('deleteTxnName', '')
    }
  }
});