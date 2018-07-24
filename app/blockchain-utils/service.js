import Service from '@ember/service';
import mocks from './mocks';

export default Service.extend({

  generateSchema: function() {
    return mocks.schema;
  },

  generateGraph: function() {
    return mocks.graphvz;
  },

  generateContract: function() {
    return mocks.contract;
  }

});
