import Component from '@ember/component';

export default Component.extend({
  schema: '',

  init() {
    this._super(...arguments);
  },

  viewChange(view, schema) {
    // console.log(...arguments);
    this.set('schema', schema);
  },

});
