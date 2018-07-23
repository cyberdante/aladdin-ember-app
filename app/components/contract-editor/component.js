import Component from '@ember/component';
import { debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';

export default Component.extend({
    classNames: ['md-padding'],
    value: '',
    newValue: '',
    setUpdatedValueLazily(newValue) {
        console.log(newValue);
    },

    actions: {
        valueUpdated(newValue) {
            let component = this;
            debounce(component, component.setUpdatedValueLazily, newValue, 500);
        }
    }
});
