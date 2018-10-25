import Component from '@ember/component';
import { A } from '@ember/array';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['md-padding', 'schema-validator-log'],
    outputs: A(),

    init() {
        this._super(...arguments);
    },

    actions: {
        compile() {
          this.get('compile')();
        }
    }
});
