import Component from '@ember/component';
import layout from './template';
import { computed } from '@ember/object';
// import { A } from '@ember/array';
import { inject as service } from '@ember/service';

export default Component.extend({
    layout,
    classNames: ['blockchain-transaction-parameter'],
    blockchainUtils: service(),
    editingParamType: false,
    newParamType: '',

    possibleTypeOptions: computed(function () {
        return ['string', 'bytes32', 'uint', 'address'];
    }),

    init() {
        this._super(...arguments);
        this.set('originalParamType', this.get('param.type'));
        this.set('newParamType', this.get('originalParamType'));
        this.set('originalParamName', this.get('param.title'));
    },
    saveTitle(transaction, parameter) {
        let schema = this.blockchainUtils.updateParamSchema(transaction.title, this.originalParamName, parameter.title, parameter.type, this.schema);
        this.set('schema', schema);
        this.set('editingTitle', false);
    },

    actions: {
        toggleOffParam(transaction, parameter) {
            if(parameter && parameter.title && parameter.title.length) {
                this.saveTitle(transaction, parameter);
            } else {
                this.set('param.title', this.get('originalParamName'));
            }
        },
        toggleParam(paramTitle) {
            this.set('originalParamName', paramTitle);
            this.set('editingTitle', true);
        },
        toggleParamTypeEdition() {
            this.set('editingParamType', true);
        },
        changeParamTypeSelection(event) {
            this.set('newParamType', event.target.value);
        },
        paramTypeChange() {
            this.set('param.type', this.get('newParamType'));
            let parameter = this.get('param');
            let schema = this.blockchainUtils.updateParamSchemaType(parameter.txn.title, parameter.title, parameter.type, this.schema);
            this.set('schema', schema);
            if (this.get('editingTitle')) {
                this.saveTitle(parameter.txn, parameter);
            }
            this.set('editingParamType', false);
        },
        deleteParameter(transaction) {
            let schema = this.blockchainUtils.deleteParam(transaction.title, this.get('param.title'),this.schema);
            this.set('schema', schema);
           
        }
    }
});
