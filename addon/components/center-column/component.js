import Component from '@ember/component';
import ResizeMixin from '../../mixins/resize';
import {
    computed
} from '@ember/object';
import layout from './template';

const MAX_COLUMNS = 3;

export default Component.extend(ResizeMixin, {
    layout,
    classNames: ['center-column'],
    isLastColumn: computed('col', 'numColumns', function () {
        let numColumns = this.get('numColumns');
        return (this.get('col') | 0) === numColumns && numColumns < MAX_COLUMNS;
    }),

    isFirstColumn: computed.equal('col', '1'),

    canCloseCentralColumn: computed('leftColumnShow', 'rightColumnShow', function () {
        return this.get('leftColumnShow') || this.get('rightColumnShow');
    }),

    showLeftColumnOpenIcon: computed('isFirstColumn', 'leftColumnShow', function () {
        return this.get('isFirstColumn') && !this.get('leftColumnShow');
    }),

    showRightColumnOpenIcon: computed('isLastColumn', 'rightColumnShow', function () {
        return this.get('isLastColumn') && !this.get('rightColumnShow');
    }),

    actions: {
        didBecomeReady() {
            if (this.didBecomeReady) {
                this.didBecomeReady();
            }
        },

        didChange() {
            if (this.didChange) {
                this.didChange();
            }
        },

        valueUpdated(value, __, changeObj) {
            const isUserChange = changeObj.origin !== 'setValue';
            this.contentChanged(isUserChange, value);
        },

        showLeftColumn() {
            this.showLeftColumn();
        },

        showRightColumn() {
            this.showRightColumn();
        },

        closeCentralColumn() {
            this.closeCentralColumn();
        },

        viewChange() {
            this.viewChange();
        },

        swapComponents(comps) {
            if (!comps) {
                return;
            }
            comps = comps.split(',');
            let center = comps[0];
            let right = comps[1];
            let tempName = this.get(right + 'ComponentName');
            let tempComponent = this.get(right + 'Component');
            let tempIcon = this.get(right + 'ColumnIcon');

            this.set(right + 'ComponentName', this.get(center + 'ComponentName'));
            this.set(right + 'Component', this.get(center + 'Component'));
            this.set(right + 'ColumnIcon', this.get(center + 'ColumnIcon'));

            this.set(center + 'ComponentName', tempName);
            this.set(center + 'Component', tempComponent);
            this.set(center + 'ColumnIcon', tempIcon);
        },
        onChange(selected) {
            this.onChange(selected);
        }
    }
});