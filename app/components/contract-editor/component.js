import Component from '@ember/component';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import ace, { Range } from 'ember-ace';

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
  editorSession: null,

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

  didRender(){
    let element = document.getElementsByClassName('contract-editor-wrapper')[0];
    let editor = ace.edit(element);
    this.set('editorSession', editor.getSession());
  },
  
  setUpdatedValueLazily(newValue) {
    this.set('value', newValue);
    let errors = this.get('editorSession').getAnnotations();
    // Call parent component with the new yaml value only if there are currently no errors
    if(!errors.length) {
      this.get('viewChange')(newValue);
    }
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
    //   console.log(newValue)
      debounce(component, component.setUpdatedValueLazily, newValue, 500);
    },

    viewChange(view, yamlString) {
        this.set('yaml', yamlString);
    }
  }
});
