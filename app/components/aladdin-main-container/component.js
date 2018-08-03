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

    /** Previously: fileTreeShown (boolean) - Whether the file tree is currently shown
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
            debugger;
            this.set('activeCol', column);
        },

        showLeftColumn() {
            this.set('leftColumnShow', true);
        },

        hideLeftColumn() {
            debugger;
            this.set('leftColumnShow', false);
        },

        showRightColumn() {
            this.set('rightColumnShow', true);
        },

        hideRightColumn() {
            this.set('rightColumnShow', false);
        },

        removeColumn(col) {
            this.removeColumn(col);
            // this.get('transitionQueryParams')({numColumns: this.get('realNumColumns') - 1});
        },

        addColumn() {
            let numColumns = this.get('realNumColumns');

            //   this.get('transitionQueryParams')({
            //     numColumns: numColumns + 1
            //   }).then((queryParams) => {
            //     this.setProperties(queryParams);
            //     this.initializeColumns();
            //   });
        },

        updateColumn(isUserChange, content) {
            if (isUserChange) {
                this.set('activeFile.content', content);
                this.send('contentsChanged');
            }
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