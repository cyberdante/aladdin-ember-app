import Component from '@ember/component';
import EmberObject from '@ember/object';

export default Component.extend({
    classNames: ['md-padding'],
    outputs: EmberObject.create({}),

    init() {
        this._super(...arguments);

        this.set('outputs', [{
            id: 1,
            type: "error",
            value: "unknown syntax error"
        }, {
            id: 2,
            type: "error",
            value: "syntax error on schema. line:22"
        }, {
            id: 3,
            type: "warning",
            value: "unknown syntax warning"
        }, {
            id: 4,
            type: "other",
            value: "unknown output line"
        }]);
    }
});
