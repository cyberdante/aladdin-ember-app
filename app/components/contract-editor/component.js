import Component from '@ember/component';
import { computed } from '@ember/object';
import { debounce } from '@ember/runloop';
import { inject as service } from '@ember/service';
import { Range } from 'ember-ace';

export default Component.extend({
    blockchainUtils: service(),
    classNames: ['md-padding'],
    newValue: '',
    value: '# sequencer protocols for Laser eye surgery\n' +
    '---\n' +
    '- step:  &id001                  # defines anchor label &id001\n' +
    '    instrument:      Lasik 2000\n' +
    '    pulseEnergy:     5.4\n' +
    '    pulseDuration:   12\n' +
    '    repetition:      1000\n' +
    '    spotSize:        1mm\n' +
    '\n' +
    '- step: &id002\n' +
    '    instrument:      Lasik 2000\n' +
    '    pulseEnergy:     5.0\n' +
    '    pulseDuration:   10\n' +
    '    repetition:      500\n' +
    '    spotSize:        2mm\n' +
    '- step: *id001                   # refers to the first step (with anchor &id001)\n' +
    '- step: *id002                   # refers to the second step\n' +
    '- step:\n' +
    '    <<: *id001\n' +
    '    spotSize: 2mm                # redefines just this key, refers rest from &id001\n' +
    '- step: *id002',

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
        // this.send(this.get('value'));
        // this.send('valueUpdated', '{"$schema":"http://json-schema.org/draft-04/schema","title":"Voting","description":"Smart Contract Form for the demo","type":"object","properties":{"vote":{"type":"object","properties":{"uid":{"name":"uid","type":"string"},"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"castVote"},"totalVotes":{"type":"object","properties":{"candidateID":{"name":"candidateID","type":"number"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{"name":"","type":"number"}},"title":"totalVotes"},"addCandidate":{"type":"object","properties":{"name":{"name":"name","type":"string"},"party":{"name":"party","type":"string"},"dependencies":{"assetId":{"name":"assetId","type":"candidate"}},"returns":{}},"title":"addCandidate"},"AddedCandidate":{"type":"object","properties":{"candidateID":{"indexed":false,"name":"candidateID","type":"number"}},"title":"AddedCandidate"}}}');
    },
    
    setUpdatedValueLazily(newValue) {
        // console.log(newValue);
        // call syntax checkers from Sarah's service here
        // this.set('value', JSON.stringify(JSON.parse(newValue), null, 2));
        this.set('value', newValue);
        // let blockchainService = this.get('blockchainUtils');
        // let schema = blockchainService.generateSchemaYaml(this.get('value'));
        // console.log(JSON.stringify(JSON.parse(schema), null, 2));
        // blockchainService.generateGraph(schema);
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
            this.onViewChange(newValue);
        }
    }
});
