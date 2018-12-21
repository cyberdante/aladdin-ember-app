import Component from '@ember/component';
import ColumnsMixin from '../../mixins/columns';
import PanesController from '../../mixins/panes-controller';
import { EKMixin } from 'ember-keyboard';
import { run } from '@ember/runloop';
import { A } from '@ember/array';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';
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
      if(typeof this.get('code') !== 'undefined' && this.get('code') !== '') {
          let utils = this.get('blockchainUtils');
          const self = this;
          utils.solToYaml(this.get('code'), (result) => {
              // If result is an array display errors
              if(Array.isArray(result)){
                  let id = 0;
                  let logValues = result.map(strErr => {
                      let type = /Error:/gi.test(strErr) ? "error" : "warning";
                      return { id: id++, type: type, value: strErr };
                  });
                  self.set('logValues', A(logValues));
                  // Show error dialog
                  self.set('showErrorDialog', true);
              } else {
                  self.set('yaml', result);
                  self.set('outputs', A([{id: 0, type: 'warning', value: 'No errors detected'}]));
              }
          });
      }
  }),
    workingValue: alias('code'),

    init() {
        this._super(...arguments);
        this.createColumns();
        this.setProperties({
            activeCol: '1'
        });
        this.set('fullScreen', false);

        scheduleOnce('afterRender', this, function(){
          this.set('outputs', A([
              { id: 0, type: "warning", value: "No errors detected" }
          ]));
        });
    },
    
    solCversion: computed(function() {
        let version = this.blockchainUtils.solCversion;
        let start = version.indexOf('-') + 2;
        let end = this.blockchainUtils.solCversion.indexOf('+');
        return version.substring(start, end);
    }),

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
            columnIcon: 'code',//'pencil-alt',
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
    rightColumnIcon: 'code',//'pencil-alt',
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
            if (this.get('manualMode')) {
                self.set('isCompiling', true);
                this.blockchainUtils.solToYaml(value, (result) => {
                    // If result is an array display errors
                    if(Array.isArray(result)){
                        let id = 0;
                        let logValues = result.map(strErr => {
                            let type = /Error:/gi.test(strErr) ? "error" : "warning";
                            return { id: id++, type: type, value: strErr };
                        });
                        self.set('logValues', A(logValues));
                        // Show error dialog
                        self.set('showErrorDialog', true);
                        self.set('yaml', '');
                    } else {
                        self.set('yaml', result);
                        self.set('logValues', A([{id: 0, type: 'warning', value: 'No errors detected'}]));
                    }
                    self.set('isCompiling', false);
                    self.set('manualMode', !this.get('manualMode'));
                    self.set('readOnly', !this.get('readOnly'));
                });
            } else {
                self.set('manualMode', !this.get('manualMode'));
                self.set('readOnly', !this.get('readOnly'));
            }
        },
        closeErrorDialog() {
            this.set('showErrorDialog', false);
        }
    }
});