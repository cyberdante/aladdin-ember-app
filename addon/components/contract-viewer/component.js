import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { debounce } from '@ember/runloop';
// import { A } from '@ember/array';
import ace from 'ember-ace';
import { Range } from 'ember-ace';
import { inject as service } from '@ember/service';
import layout from './template';

export default Component.extend({
    layout,
    classNames: ['md-padding', 'contract-viewer'],
    classNameBindings: ['manualMode'],
    blockchainUtils: service(),
    showSolCVersion: true,

    value: '',

    // internalCodeChange: false,
    // codeObserver: observer('code', function() {
    //     this.sendAction('changeYaml');
    // }),

    editorSession: null,

    editingContract: false,
    highlightActiveLine: true,
    showPrintMargin: false,
    readOnly: true,
    tabSize: 4,
    useSoftTabs: true,
    useWrapMode: true,
    // printMarginColumn: 120,
    showInvisibles: false,
    showGutter: true,
    showIndentGuides: true,
    showLineNumbers: true,

    isCompiling: false,

    theme: 'ace/theme/monokai',
    themes: computed(function () {
        return [
            'ace/theme/monokai',
            'ace/theme/textmate',
            'ace/theme/ambiance',
            'ace/theme/chaos',
        ];
    }),

    contractType: 'ethereum',
    computedMode: computed('contractType', function () {
        switch (this.get('contractType')) {
            case 'ethereum': return 'ace/mode/solidity';
            case 'fabric': return 'ace/mode/golang';
            default: return 'ace/mode/text'
        }
    }),

    overlay: computed(function () {
        return {
            type: 'warning',
            text: 'Warning placeholder code',
            range: new Range(0, 4, 0, 7)
        }
    }),

    overlays: computed('overlay.{type,text}', 'overlay.range.{start,end}.{row,column}', function () {
        return [/*this.get('overlay')*/];
    }),

    setUpdatedValueLazily(newValue) {
        if (this.isDestroyed || this.isDestroying) {
            return;
        }
        this.set('value', newValue);
        this.sendAction('changeYaml');
        // console.log(newValue);
        // let errors = this.get('editorSession').getAnnotations();
        // Call parent component with the new yaml value only if there are currently no errors
        // if(!errors.length) {
        // if (!this.readOnly) {
        //   const self = this;
        //   self.set('isCompiling', true);
        //   this.blockchainUtils.solToYaml(newValue, (yamlCode) => {
        //     self.set('yaml', yamlCode);
        //     // self.set('isCompiling', false);
        //   });
        // }
        // }
    },

    init() {
        this._super(...arguments);
    },

    didUpdate() {
        if (!this.get('manualMode')) {
            this.beautifyEditorContents();
        }
    },

    didInsertElement() {
        this.beautifyEditorContents();
    },

    beautifyEditorContents() {
        let beautify = ace.require('ace/ext/beautify');
        if (!this.editorSession) {
            let element = document.getElementsByClassName('contract-viewer-wrapper')[0];
            let editor = ace.edit(element);
            this.set('editorSession', editor.getSession());
            beautify.beautify(editor.session);
            editor.navigateFileStart();
        } else {
            beautify.beautify(this.get('editorSession'));
        }
    },

    actions: {
        valueUpdated(newValue) {
            debounce(this, this.setUpdatedValueLazily, newValue, 15);
            // this.setUpdatedValueLazily(newValue);
        },

        toggleEditMode() {
            const updatedValue = this.get('value');
            this.get('toggleEditMode')(updatedValue);
        },

        closeVersionAlertBar() {
            this.set('showSolCVersion', false);
        }
    }
});