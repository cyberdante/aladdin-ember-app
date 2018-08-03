import Component from '@ember/component';
import ResizeMixin from '../../mixins/resize';
import {
    computed
} from '@ember/object';

const MAX_COLUMNS = 3;

export default Component.extend(ResizeMixin, {
    isLastColumn: computed('col', 'numColumns', function () {
        let numColumns = this.get('numColumns');
        return (this.get('col') | 0) === numColumns && numColumns < MAX_COLUMNS;
    }),

    isFirstColumn: computed.equal('col', '1'),

    showLeftColumnOpenIcon: computed('isFirstColumn', 'leftColumnShown', function () {
        return this.get('isFirstColumn') && !this.get('leftColumnShown');
    }),

    showRightColumnOpenIcon: computed('isLastColumn', 'rightColumnShown', function () {
        return this.get('isLastColumn') && !this.get('rightColumnShown');
    }),

    focusIn() {
        this.focusColumn(this);
    },

    actions: {
        valueUpdated(value, __, changeObj) {
            const isUserChange = changeObj.origin !== 'setValue';
            this.contentChanged(isUserChange, value);
        },

        removeColumn(col) {
            this.removeColumn(col);
        },

        addColumn() {
            this.addColumn();
        },

        showLeftColumn() {
            this.showLeftColumn();
        },

        showRightColumn() {
            this.showRightColumn();
        }
    }
});