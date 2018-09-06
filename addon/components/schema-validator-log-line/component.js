import Component from '@ember/component';
import { computed } from '@ember/object';
import layout from './template';

export default Component.extend({
    layout,
    classNameBindings: ['isError:output-error', 'isWarning:output-warning'],
    classNames: ['schema-validator-log-line'],

    isError: computed('output', 'output.type', function() {
        return this.get('output') && this.get('output').type === 'error';
    }),

    isWarning: computed('output', 'output.type', function() {
        return this.get('output') && this.get('output').type === 'warning';
    })
});
