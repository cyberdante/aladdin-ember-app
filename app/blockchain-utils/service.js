import Service from '@ember/service';

import mocks from './mocks';

export default Service.extend({

  generate_schema: function() {
    return mocks.schema;
  },

  generate_graph: function() {
    return mocks.graphvz;
  },

  generate_contract: function() {
    return mocks.contract;
  }

});
