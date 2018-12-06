import Component from '@ember/component';
import layout from './template';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
let assetArray = localStorage.getItem('asset') ? JSON.parse(localStorage.getItem('asset')) : [];



export default Component.extend({
    layout,
    classNames: ['blockchain-transaction'],
    classNameBindings: ['inputTitleEmpty:error'],
    blockchainUtils: service(),
    editingTitle: false,
    showTransactionEditorDialog: false,
    assets: A([]),
    assetTitles: computed('assets', function () {
        return this.get('assets').mapBy('title');
    }),
    assetName: '',
    title: computed('transaction', 'transaction.title', function () {
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
        let assets = this.blockchainUtils.extractAssetsTransactions(this.schema);
        let assetOpen;
        assets.forEach(x => {
            x.transactions.forEach(txn => {
                if (txn.title === this.title) {
                    assetOpen = x.title;
                }
            })
        });
        assetArray.push(assetOpen);
        localStorage.setItem('asset', JSON.stringify(assetArray));
        // console.log(localStorage)
        this.set('editingTitle', false);
    },
    params: computed('parameters', 'parameters.length', function () {
        return this.get('parameters');
    }),
    openPromptDialog() {
        this.set('showTransactionEditorDialog', true);
        const self = this;
        let assets = this.blockchainUtils.extractAssetsTransactions(this.schema);
        assets.forEach(x => {
            x.transactions.forEach(txn => {
                if (txn.title === this.title) {
                    this.set('assetName', x.title);
                }
            });
        });
        self.set('assets', assets);
    },
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
            this.set('origTxnTitle', this.get('transaction.title'));
            this.openPromptDialog();
            // this.set('editingTitle', true);
        },
        setNewTransactionTitle(txnTitle) {
            if (txnTitle && txnTitle.length) {
                this.saveTitle(txnTitle);
            } else {
                this.set('transaction.title', this.get('origTxnTitle'));
            }
        },
        saveTransaction(paramsChanged, newTxnName, newParams) {
            
            let newTitle = newTxnName;
            if (newTitle && newTitle.trim().length && this.get('transaction.title') !== newTitle) {
                let schema = this.blockchainUtils.updateTxnSchema(newTitle, this.get('transaction.title'), this.schema, newParams);
                this.set('transaction.title', newTitle);
                this.set('schema', schema);
                this.set('title', '');
            } else {
                this.set('title', this.get('transaction.title'));
                let schema = this.blockchainUtils.updateTxnSchema(newTitle, this.get('transaction.title'), this.schema, newParams);
                this.set('schema', schema);
             }

            this.set('showTransactionEditorDialog', false);
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
                x.transactions.forEach(txn => {
                    if (txn.title === this.title) {
                        this.set('assetName', x.title);
                    }
                })
            });
            self.set('assets', assets);
        },

        addParams() {
            A(this.get('parameters')).pushObject({ title: '', txn: this.get('transaction'), type: 'string', editingTitle: true, editingType: true });
        },
        closePromptDialog() {
            this.set('showTransactionEditorDialog', false);
        }
    }
});
