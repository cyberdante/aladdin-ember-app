import Component from '@ember/component';
import EmberObject, { observer } from '@ember/object';
import { A } from '@ember/array';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['md-padding', 'schema-validator-log'],
    outputs: A(),

    init() {
        this._super(...arguments);
    }
});
