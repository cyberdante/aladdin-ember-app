import Component from '@ember/component';
import ColumnsMixin from '../../mixins/columns';
import PanesController from '../../mixins/panes-controller';
import { EKMixin } from 'ember-keyboard';
import { run } from '@ember/runloop';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import layout from './template';

export default Component.extend(ColumnsMixin, EKMixin, PanesController, {
    layout,
    numColumns: 1,
    fullScreen: false,
    classNames: ['aladdin-main-container'],
    manualMode: false,
    readOnly: true,
    logValues: A([]),
    blockchainUtils: service(),
    yaml: computed('code', function(){
        if(typeof this.get('code') !== 'undefined') {
            let utils = this.get('blockchainUtils');
            utils.solToYaml(this.get('code'), (result) => this.set('yaml', result));
        }
    }),
    workingValue: computed('code', function() {
        return this.get('code');
    }),

    init() {
        this._super(...arguments);
        this.createColumns();
        this.setProperties({
            activeCol: '1'
        });
        this.set('fullScreen', false);

        this.set('logValues', A([
            { id: 0, type: "warning", value: "No errors detected" }
        ]));
    },

    /**
     * If the code is currently being built
     * @type {boolean}
     */
    isCompiling: false,

    /**
     * Column which has the currently focused editor
     * @type {Number}
     */
    activeCol: null,

    settings: null,

    panels: computed(function () {
        return [{
            component: 'assets-transactions-wizard',
            componentName: 'Assets and Transactions',
            columnIcon: 'list-ul',
            width: 30,
        }, {
            component: 'tabbed-container',
            componentName: 'Smart Contract and Graph',
            columnIcon: 'bezier-curve',
            width: 70,
        }, {
            component: 'contract-editor',
            componentName: 'Contract Editor',
            columnIcon: 'pencil-alt',
            width: 0,
        }];
    }),

    /**
     * Whether the left column is currently shown
     * @type {boolean}
     */
    leftColumnShow: true,
    leftColumnIcon: 'list-ul',
    leftComponent: 'assets-transactions-wizard',
    leftComponentName: 'Assets and Transactions',
    leftWidth: 50,

    /** 
     * Whether the central column is currently shown
     * @type {boolean}
     */
    centerColumnShow: true,
    centerColumnIcon: 'bezier-curve', // 'hubspot' or 'chart-line' maybe???
    centerComponent: 'tabbed-container',
    centerComponentName: 'Smart Contract and Graph',
    centerWidth: 50,

    /** 
     * Whether the right column is currently shown
     * @type {boolean}
     */
    rightColumnShow: false,
    rightColumnIcon: 'pencil-alt',
    rightComponent: 'contract-editor',
    rightComponentName: 'Contract Editor',
    rightWidth: 0,

    /**
     * reinitialize component when the model has changed
     */
    didReceiveAttrs() {
        this._super(...arguments);

        const model = this.get('model');

        if (model !== this._oldModel) {
            this.clearColumns();
            this.initializeColumns();
            run(() => {
                // this.get('rebuildApp').perform();
            });
        }

        this._oldModel = model;
    },

    actions: {
        contentsChanged() {
            // console.log('calling contentChanged action');
        },

        focusColumn(column) {
            this.set('activeCol', column);
        },

        showLeftColumn() {
            this.set('leftColumnShow', true);
        },

        hideLeftColumn() {
            if (this.get('rightColumnShow') || this.get('centerColumnShow')) {
                this.set('leftColumnShow', false);
            }
        },

        showRightColumn() {
            this.set('rightColumnShow', true);
        },

        hideRightColumn() {
            if (this.get('leftColumnShow') || this.get('centerColumnShow')) {
                this.set('rightColumnShow', false);
            }
        },

        closeCentralColumn() {
            if (this.get('leftColumnShow') || this.get('rightColumnShow')) {
                this.set('centerColumnShow', false);
            }
        },

        openCentralColumn() {
            this.set('centerColumnShow', true);
        },

        exitFullScreen() {
            this.get('transitionQueryParams')({
                fullScreen: false
            }).then(() => {
                this.initializeColumns();
            });
        },

        compile() {
            const self = this;
            this.set('isCompiling', true);
            this.blockchainUtils.compileSol(this.workingValue, function (err) {
                if (err) {
                    let id = 0;
                    let logValues = err.map(strErr => {
                        let type = /Error:/gi.test(strErr) ? "error" : "warning";
                        return { id: id++, type: type, value: strErr };
                    });
                    self.set('logValues', A(logValues));
                }
                self.set('isCompiling', false);
            });
        },

        toggleEditMode(value) {
            const self = this;
            this.set('workingValue', value || '');
            if (this.manualMode) {
                self.set('isCompiling', true);
                this.blockchainUtils.solToYaml(value, (yamlCode) => {
                    self.set('yaml', yamlCode);
                    self.set('isCompiling', false);
                    self.set('manualMode', !this.manualMode);
                    self.set('readOnly', !this.readOnly);
                });
            } else {
                self.set('manualMode', !this.manualMode);
                self.set('readOnly', !this.readOnly);
            }
        }
    }
});