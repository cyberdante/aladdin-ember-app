import Component from '@ember/component';
import layout from './template';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
    layout,
    classNames: ['blockchain-transaction'],
    classNameBindings: ['inputTitleEmpty:error'],
    blockchainUtils: service(),
    editingTitle: false,
    title: computed('transaction', 'transaction.title', function() {
        let txn = this.get('transaction');
        return txn ? txn.title : '';
    }),
    isSelected: computed.equal('selectedTxn.title', 'transaction.title'),
    hasValidTitle: computed.gt('transaction.title.length', 0),
    inputTitleEmpty: computed.not('hasValidTitle'),

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
        }
    }
});
