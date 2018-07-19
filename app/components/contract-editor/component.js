import Component from '@ember/component';

export default Component.extend({
    classNames: ['md-padding'],
    value: '',
    newValue: '',
    actions: {
        valueUpdated(newValue) {
            console.log(newValue);
        }
    }
});
