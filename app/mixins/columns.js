import Mixin from '@ember/object/mixin';
import Column from '../utils/column';
import {
  computed
} from '@ember/object';

const MAX_COLUMNS = 3;

export default Mixin.create({
  columns: null,

  realNumColumns: computed('numColumns', function () {
    return Math.min(this.get('numColumns'), MAX_COLUMNS);
  }),

  getColumnFile(column) {
    return this.get('columns').objectAt(column - 1).get('file');
  },

  setColumnFile(column, file) {
    this.get('columns').objectAt(column - 1).set('file', file);
  },

  /**
   * Creates the column objects
   */
  createColumns() {
    let columns = [];
    for (let i = 0; i < MAX_COLUMNS; ++i) {
      let col = (i + 1) + "";
      columns.pushObject(Column.create({
        col: col,
        controller: this
      }));
    }
    this.set('columns', columns);
  },

  /**
   * Clears the columns
   */
  clearColumns() {
    let numColumns = this.get('realNumColumns');
    for (let i = 1; i <= numColumns; ++i) {
      this.setColumnFile(i, undefined);
    }
  },

  /**
   * Set the initial files in the columns
   */
  initializeColumns() {
    const numColumns = this.get('realNumColumns');
  }
});