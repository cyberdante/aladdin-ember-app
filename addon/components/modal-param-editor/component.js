import Component from '@ember/component';
// import { inject as service } from '@ember/service';
// import { A } from '@ember/array';
import O from '@ember/object';
import { observer, computed } from '@ember/object';
// import { and, not } from '@ember/object/computed';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['modal-param-editor'],

    param: O.create({
        title: '',
        type: 'string',
        index: 0
    }),
    cannotDelete: computed('totalParams', function() {
        return this.get('totalParams') <=1;
    }),

    singleConstraint: computed('repeatedValues', function() {
        return [{
            message: 'Parameter names must be unique',
            validate: (inputValue) => {
                if(this.repeatedValues && this.repeatedValues.length && inputValue && inputValue.length) {
                    return this.repeatedValues.indexOf(inputValue) < 0;
                }
                return true;
            }
        }];
    }),

    options: computed(function () {
        return ['string', 'bytes32', 'uint', 'address', 'int', 'bool'];
    }),

    init() {
        this._super(...arguments);
    },

    actions: {
        deleteParam(index) {
            this.get('deleteParam')(index);
        }
    }
});