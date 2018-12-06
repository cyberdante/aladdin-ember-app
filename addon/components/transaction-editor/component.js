import Component from '@ember/component';
import layout from './template';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import O from '@ember/object';
import { observer, computed } from '@ember/object';
import { and, not } from '@ember/object/computed';
import { copy, Copyable } from 'ember-copy';

export default Component.extend({
    layout,
    blockchainUtils: service(),
    transaction: O.create({}),
    options: computed(function () {
        return ['string', 'bytes32', 'uint', 'address', 'int', 'bool'];
    }),
    assetTitles: computed('assets', function () {
        return this.get('assets').mapBy('title');
    }),

    validNewParameters: computed('parameters', 'parameters.{length,@each.title}', function () {
        let valid = true;
        this.get('parameters').forEach(p => {
            valid = valid && (p.title && p.title.length > 0);
        });
        return valid;
    }),
    newMethodHasName: computed('newTxnName', 'newTxnName.length', function () {
        return this.get('newTxnName').length > 0;
    }),
    doneButtonEnabled: and('newMethodHasName', 'validNewParameters'),
    doneButtonDisabled: not('doneButtonEnabled'),
    origTxnTitle: '',
    origParamTitle: '',
    tranAssetTitle: '',
    newTxnName: '',
    txnParamType: '',
    parameters: computed(function () {
        return A([{
            title: '',
            type: 'string',
            txn: this.transaction,
            index: 0
        }]);
    }),
    paramsChanged: false,
    selectedTxn: O.create({}),

    schemaChanged: observer('schema', function () {
        this.get('generateView')(this.schema);
        this.set('tranAssetTitle', this.get('assets')[0]);
    }),

    typeSelected: '',

    init() {
        this._super(...arguments);
        const txn = this.get('transaction');
       
        if (txn) {
            if (txn.title && txn.title.length) {
                this.set('newTxnName', txn.title);
            }
            if (txn.parameters && txn.parameters.length) {
                let paramsCopy = [];
                txn.parameters.forEach(p => {
                    paramsCopy.push({
                        title: copy(p.title, true),
                        txn: txn,
                        type: copy(p.type, true)
                    })
                });
                this.set('parameters', paramsCopy);
            }
        }
    },

    getParams(txn) {
        let params = Object.keys(txn.meta).reduce((acc, paramTitle) => {
            if (paramTitle !== 'dependencies' && paramTitle !== 'returns' && paramTitle !== 'title') {
                acc.push({ title: paramTitle, type: txn.meta[paramTitle].type || 'string', txn: txn });
            }
            return acc;
        }, []);
        return params;
    },
    repeatedValues: computed('parameters', 'parameters.{length,@each.title}', function () {
        let repeated = [];
        const params = this.get('parameters');
        params.map(x => x.title).forEach((title, index, self) => {
            if (title && title.trim().length && self.indexOf(title) > -1 && self.indexOf(title) !== index && repeated.indexOf(title) < 0) {
                repeated.push(title);
            }
        });
        return repeated;
    }),

    actions: {
        closePromptDialog() {
            this.get('closePromptDialog')();
        },
        upsertTransaction() {
           
            this.get('upsertTransaction')(this.get('paramsChanged'),this.get('newTxnName'), this.get('parameters'));
        },
        deleteParam(index) {
            A(this.get('parameters')).removeAt(index, 1);
            this.set('paramsChanged', true);
        },
        addParam() {
            const idx = this.get('parameters') ? this.get('parameters').length : 0;
            A(this.get('parameters')).pushObject({
                title: '',
                txn: this.get('transaction'),
                type: 'string', index: idx
            });
            this.set('paramsChanged', true);
        }
        
    }
});
