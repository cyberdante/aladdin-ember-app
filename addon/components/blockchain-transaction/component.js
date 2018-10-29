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
    editingTxnTitle: false,
    title: computed('transaction', 'transaction.title', function() {
        let txn = this.get('transaction');
        return txn ? txn.title : '';
    }),
    isSelected: computed.equal('selectedTxn.title', 'transaction.title'),

    actions: {
        createTransaction(asset) {
            console.log('creating new transaction for ', asset);
        }, 
        deleteTxn(txnTitle) {
            console.log('deleting transaction');
            this.get('deleteTxn')(txnTitle);
        },
        toggleTxn(txnTitle) {
            this.get('toggleTxn')(txnTitle);
        },
        toggleOffTxn(txnTitle) {
            this.get('toggleOffTxn')(txnTitle);
        },
        selectTxn(txn) {
            this.get('selectTxn')(txn);
        }
    }
});
