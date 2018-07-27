import Component from '@ember/component';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { Range } from 'ember-ace';

export default Component.extend({
  classNames: ['md-padding'],
  value: '',

  highlightActiveLine: true,
  showPrintMargin: true,
  readOnly: true,
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

  mode: 'ace/mode/solidity',

  overlay: computed(function() {
    return {
      type: 'warning',
      text: 'Warning placeholder code',
      range: new Range(0, 4, 0, 7)
    }
  }),

  overlays: computed('overlay.{type,text}', 'overlay.range.{start,end}.{row,column}', function() {
    return [this.get('overlay')];
  }),

  init() {
    this._super(...arguments);
  },

  actions: {
    valueUpdated(newValue) {
      debounce(this, () => this.set('value', newValue), newValue, 500);
    }
  }
})
