import Component from '@ember/component';
import ColumnsMixin from '../../mixins/columns';
import PanesController from '../../mixins/panes-controller';
import { EKMixin /*,keydown*/ } from 'ember-keyboard';
import { run } from '@ember/runloop';
import { computed } from '@ember/object';
// import { on } from '@ember/object/evented';
import layout from './template';

export default Component.extend(ColumnsMixin, EKMixin, PanesController, {
    layout,
    numColumns: 1,
    fullScreen: false,
    classNames: ['aladdin-main-container'],

    init() {
        this._super(...arguments);
        this.createColumns();
        this.setProperties({
            activeCol: '1'
        });
        this.set('fullScreen', false);
        // this.set('leftColumnShow', true);
        // this.set('centerColumnShow', true);
        // this.set('rightColumnShow', false);
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

    panels: computed(function() {
        return [{
            component: 'assets-transactions-wizard',
            componentName: 'Assets and Transactions',
            columnIcon: 'list-ul',
            width: 50,
        }, {
            component: 'tabbed-container',
            componentName: 'Smart Contract and Graph',
            columnIcon: 'bezier-curve',
            width: 50,
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
            if(this.get('rightColumnShow') || this.get('centerColumnShow')) {
                this.set('leftColumnShow', false);
            } else {
                // console.log('cannot close only remaining panel');
            }
        },

        showRightColumn() {
            this.set('rightColumnShow', true);
        },

        hideRightColumn() {
            if(this.get('leftColumnShow') || this.get('centerColumnShow')) {
                this.set('rightColumnShow', false);
            } else {
                // console.log('cannot close only remaining panel');
            }
        },

        closeCentralColumn() {
            if(this.get('leftColumnShow') || this.get('rightColumnShow')) {
                this.set('centerColumnShow', false);
            } else {
                // console.log('cannot close only remaining panel');
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
        }
    }
});