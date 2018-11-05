import Component from '@ember/component';
import layout from './template';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
// import { A } from '@ember/array';
import { inject as service } from '@ember/service';

export default Component.extend({
    layout,
    classNames: ['blockchain-transaction'],
    blockchainUtils: service(),
    editingTitle: false,
    title: computed('transaction', 'transaction.title', function() {
        let txn = this.get('transaction');
        return txn ? txn.title : '';
    }),
    isSelected: computed.equal('selectedTxn.title', 'transaction.title'),

    actions: {
        createTransaction(asset) {
            console.log('creating new transaction for ', asset);
        },
        deleteTxn() {
            console.log('deleting transaction');
            let schema = this.blockchainUtils.updateSchemaDeleteTxn(this.get('transaction.title'), this.schema);
            this.set('schema', schema);
        },
        toggleTxnEdition() {
            this.set('editingTitle', true);
            this.set('origTxnTitle', this.get('transaction.title'));
        },
        setNewTransactionTitle(txnTitle) {
            let schema = this.blockchainUtils.updateTxnSchema(txnTitle, this.origTxnTitle, this.schema);
            this.set('transaction.title', txnTitle);
            this.set('schema', schema);
            this.set('editingTitle', false);
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
