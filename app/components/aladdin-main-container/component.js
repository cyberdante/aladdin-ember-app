import Component from '@ember/component';
import ColumnsMixin from '../../mixins/columns';
import {
    keyDown,
    EKMixin
} from 'ember-keyboard';
import {
    inject as service
} from '@ember/service';
// import { computed } from '@ember/object';
import {
    run
} from '@ember/runloop';
// import { on } from '@ember/object/evented';
// import { isBlank } from '@ember/utils';

export default Component.extend(ColumnsMixin, EKMixin, {
    numColumns: 1,
    fullScreen: false,

    init() {
        this._super(...arguments);
        this.createColumns();
        this.setProperties({
            activeCol: '1'
        });
        this.set('fullScreen', false);
        this.set('leftColumnShow', true);
        this.set('centerColumnShow', true);
        this.set('rightColumnShow', true);
    },

    /**
     * If the code is currently being built
     * @type {boolean}
     */
    isBuilding: false,

    /**
     * Column which has the currently focused editor
     * @type {Number}
     */
    activeCol: null,

    settings: null,

    /**
     * Whether the left column is currently shown
     * @type {boolean}
     */
    leftColumnShow: true,
    /** 
     * Whether the right column is currently shown
     * @type {boolean}
     */
    rightColumnShow: true,
    /** 
     * Whether the central column is currently shown
     * @type {boolean}
     */
    centerColumnShow: true,

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
            console.log('calling contentChanged action');
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
                console.log('cannot close only remaining panel');
            }
        },

        showRightColumn() {
            this.set('rightColumnShow', true);
        },

        hideRightColumn() {
            if(this.get('leftColumnShow') || this.get('centerColumnShow')) {
                this.set('rightColumnShow', false);
            } else {
                console.log('cannot close only remaining panel');
            }
        },

        closeCentralColumn() {
            if(this.get('leftColumnShow') || this.get('rightColumnShow')) {
                this.set('centerColumnShow', false);
            } else {
                console.log('cannot close only remaining panel');
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