import Component from '@ember/component';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { Range } from 'ember-ace';

export default Component.extend({
    blockchainUtils: service(),
    classNames: ['md-padding'],
    newValue: '',
    value: '',

    highlightActiveLine: true,
    showPrintMargin: true,
    readOnly: false,
    tabSize: 4,
    useSoftTabs: true,
    useWrapMode: true,
    showInvisibles: false,
    showGutter: true,
    showIndentGuides: true,

    theme: 'ace/theme/monokai',
    themes: computed(function() {
        return [
            'ace/theme/monokai',
            'ace/theme/textmate',
            'ace/theme/ambiance',
            'ace/theme/chaos',
        ];
    }),

    mode: 'ace/mode/aladdin',

    overlay: computed(function() {
        return {
            type: 'warning',
            text: 'Warning text on line 1',
            range: new Range(0, 4, 0, 7)
        }
    }),

    overlays: computed('overlay.{type,text}', 'overlay.range.{start,end}.{row,column}', function() {
        return [/*this.get('overlay')*/];
    }),

    init() {
        this._super(...arguments);
    },
    
    setUpdatedValueLazily(newValue) {
        this.set('value', newValue);
      // Call parent component with the new yaml value
        this.get('onViewChange')(newValue);
    },

    actions: {
        suggestCompletions(editor, session, position, prefix) {
            return [
                { value: prefix + '111', snippet: 'one', meta: 'MetaOne', caption: 'The one', score: 1 },
                { value: prefix + '222', snippet: 'two', meta: 'MetaTwo', caption: 'The two', score: 2 },
            ];
        },
        valueUpdated(newValue) {
            let component = this;
            debounce(component, component.setUpdatedValueLazily, newValue, 500);
        }
    }
});
