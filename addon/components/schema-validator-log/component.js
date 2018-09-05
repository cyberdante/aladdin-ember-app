import Component from '@ember/component';
import EmberObject from '@ember/object';
import layout from './template';

export default Component.extend({
    layout,
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
        }, {
            id: 5,
            type: "error",
            value: "unknown syntax error"
        }, {
            id: 6,
            type: "error",
            value: "syntax error on schema. line:22"
        }, {
            id: 7,
            type: "warning",
            value: "unknown syntax warning"
        }, {
            id: 8,
            type: "other",
            value: "unknown output line"
        }]);
    }
});
