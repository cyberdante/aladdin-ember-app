import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | services/internal-state', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test('it exists', function(assert) {
    let service = this.owner.lookup('service:services/internal-state');
    assert.ok(service);
  });
});

