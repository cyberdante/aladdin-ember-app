import Component from '@ember/component';
import layout from './template';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    layout,
    classNames: ['blockchain-transaction'],
    classNameBindings: ['inputTitleEmpty:error'],
    blockchainUtils: service(),
    editingTitle: false,
    showDialog: false,
    blockchainUtils: service(),
    assets: A([]),
    assetTitles: computed('assets', function() {
        return this.get('assets').mapBy('title');
    }),
    assetName:'',
    title: computed('transaction', 'transaction.title', function() {
        let txn = this.get('transaction');
        return txn ? txn.title : '';
    }),
    isSelected: computed.equal('selectedTxn.title', 'transaction.title'),
    hasValidTitle: computed.gt('transaction.title.length', 0),
    inputTitleEmpty: computed.not('hasValidTitle'),
    options: computed(function () {
        return ['string', 'bytes32', 'uint', 'address'];
    }),

    init() {
        this._super(...arguments);
        this.set('origTxnTitle', this.get('title'));
    },
    
    saveTitle(transactionTitle) {
        let modifiedSchema = this.blockchainUtils.updateTxnSchema(transactionTitle, this.origTxnTitle, this.schema);
        this.set('transaction.title', transactionTitle);
        this.set('schema', modifiedSchema);
        this.set('editingTitle', false);
    },
    // getParams(txn) {
    //     let params = Object.keys(txn.meta).reduce((acc, paramTitle) => {
    //         if (paramTitle !== 'dependencies' && paramTitle !== 'returns' && paramTitle !== 'title') {
    //             acc.push({ title: paramTitle, type: txn.meta[paramTitle].type, txn: txn });
    //         }
    //         return acc;
    //     }, []);
    //     return params;
    // },
    actions: {
        deleteTxn() {
            let schema = this.blockchainUtils.updateSchemaDeleteTxn(this.get('transaction.title'), this.schema);
            this.set('schema', schema);
        },
        showConfirmationDialog() {
            this.set('showPromptDialog', true); 
        },
        closeConfirmationDialog() {
            this.set('showPromptDialog', false);
        },
        toggleTxnEdition() {
            this.set('editingTitle', true);
            this.set('origTxnTitle', this.get('transaction.title'));
        },
        setNewTransactionTitle(txnTitle) {
            if(txnTitle && txnTitle.length) {
                this.saveTitle(txnTitle);
            } else {
                this.set('transaction.title', this.get('origTxnTitle'));
            }
        },
        selectTxn(txn) {
            this.get('selectTxn')(txn);
        },
        toggleTransactionDisplay() {
            let val = this.get('showingParams');
            this.set('showingParams', !val);
        },
        openPromptDialog() {
            this.set('showDialog', true);
            const self = this;
            let assets = this.blockchainUtils.extractAssetsTransactions(this.schema);
            assets.forEach(x => {
                x.transactions.forEach(txn=> {
                    if(txn.title === this.title){
                    this.set('assetName', x.title);
                  }
                })
            });
            self.set('assets', assets);
       },
       addParams() { 
           
        this.parameters.push({ title: '', type: '' });
        // for (var key in this.parameters) {
        //     if (this.parameters.hasOwnProperty(key)) {
        //         // TODO linter complains if this block is blank
        //     }
        // }
        this.parameters.forEach(x => {
            console.log(`{ title: ${x.title}; type: ${x.type} }`);

        });
    },

        closePromptDialog() {
            this.set('showDialog', false);
            // this.set('editingTxnAdd', true);
            // this.set('editingTxnAddName', false);
        },
        addNewTxn() {
            console.log(this.transaction.title, this.assetName, this.parameters, this.schema)
            // let schema = this.blockchainUtils.updateSchemaAddTxn(this.transaction.title, this.assetName, this.parameters, this.schema, false);
            // this.set('schema', schema);
            // this.set('editingTxnAddName', false);
            // this.set('editingTxnAdd', true);
            // this.set('newTxnName', '');
            // this.set('tranAssetTitle', '');
            // this.set('paramName', '');
            // this.set('paramType', '');
            // this.set('txnParamType', '');
            // // this.set('parameters', [{}]);
            // this.get('parameters').clear();
            // this.set('bundlehash', false);
        }
    }
});
