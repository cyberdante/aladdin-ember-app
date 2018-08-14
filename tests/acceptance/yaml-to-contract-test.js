import { module, test } from 'qunit';
import { visit, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import ace from 'ember-ace';

module('Acceptance | convert YAML to smart contract', function(hooks) {
  setupApplicationTest(hooks);

  const getEditorSession = (currentTest, selector) => {
    let element = currentTest.element.querySelector(selector);
    let editor = ace.edit(element);
    return editor.getSession();
  };

  test('Parse valid YAML', async function(assert) {
    await visit('/');

    const expectedContract = `pragma solidity ^0.4.18;

contract Application {

    function arrived (
        uint sNum,
        uint arrived,
        bytes32 assetId,
        bytes32 container)
    public {}
}`;
    const inputYaml = `---
- asset:  &container 
      name:   assetId
      type:   container

  transaction: 
    properties: object
    arrived: 
      type: object
      properties: 
        sNum: 
          name: sNum
          type: number
        arrived: 
          name: arrived
          type: number
        dependencies: *container
      title: arrived`;

    // Set the yaml
    getEditorSession(this, '.contract-editor-wrapper').setValue(inputYaml);

    // wait for the debounce action to resolve before checking the resulting smart contract
    await settled();

    // Get the smart contract
    let resultContract = getEditorSession(this, '.contract-viewer-wrapper').getValue();

    assert.equal(resultContract, expectedContract);
  });

  test('Parse empty YAML', async function(assert){
    await visit('/');

    const expectedContract = `pragma solidity ^0.4.18;

contract Application {}`;
    const inputYaml = '';

    // Set the yaml
    getEditorSession(this, '.contract-editor-wrapper').setValue(inputYaml);

    // wait for the debounce action to resolve before checking the resulting smart contract
    await settled();

    // Get the smart contract
    let resultContract = getEditorSession(this, '.contract-viewer-wrapper').getValue();

    assert.equal(resultContract, expectedContract);
  });
});
