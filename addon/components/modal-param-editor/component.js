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
    allParamsValid: '',
    param: O.create({
        title: '',
        type: 'string',
        index: 0
    }),
    doneButtonEnabled: '',
    cannotDelete: computed('totalParams', function() {
        return this.get('totalParams') <=1;
    }),

    singleConstraint: computed('repeatedValues', function() {
       return [{
            message: 'Parameter names must be unique and no special characters',
            validate: (inputValue) => {
                if(this.repeatedValues && this.repeatedValues.length && inputValue && inputValue.length) {
                   
                    this.set('doneButtonEnabled', false);
                    return this.repeatedValues.indexOf(inputValue) < 0;
                }
                var regex = new RegExp("^[a-zA-Z0-9_\s]+$");
                if (!regex.exec(inputValue)) {
                    this.set('doneButtonEnabled', false);
                    return false;
                }
                
                this.set('doneButtonEnabled', true);
                // || this.get('allParamsValid'));
                return true;
            }
        }];
    
    }),

        options: computed(function () {
        return ['string', 'bytes32', 'uint', 'address', 'int', 'bool'];
    }),

    init() {
        this._super(...arguments);
        this.set('allParamsValid', false);
    },

    actions: {
        deleteParam(index) {
            this.get('deleteParam')(index);
        }
    }
});
