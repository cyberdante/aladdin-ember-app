import { module, test } from 'qunit';
import { visit, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import ace from 'ember-ace';

module('Acceptance | yaml -> schema -> contract', function(hooks) {
  setupApplicationTest(hooks);

  const getEditorSession = (currentTest, selector) => {
    let element = currentTest.element.querySelector(selector);
    let editor = ace.edit(element);
    return editor.getSession();
  };

  test('Parse valid YAML', async function(assert) {
    await visit('/');

    const expectedContract = `pragma solidity ^0.4.18;

contract Container {

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

    const expectedContract = '';
    const inputYaml = '';

    // Set the yaml
    getEditorSession(this, '.contract-editor-wrapper').setValue(inputYaml);

    // wait for the debounce action to resolve before checking the resulting smart contract
    await settled();

    // Get the smart contract
    let resultContract = getEditorSession(this, '.contract-viewer-wrapper').getValue();

    assert.equal(resultContract, expectedContract);
  });

  test('Parse invalid YAML', async function(assert){
    await visit('/');

    const expectedContract = '';
    const inputYaml = `---
- asset:  container              # must have '&'
      nme:   assetId             # assets must be followed by name field
      tpe:   container           # assets must have type field

  transaction:
    properties: object
    arrived                      # keys must end in ':'
      type: object
      properties:
        sNum:
          name: sNum
          type: number
        arrived:
          name arrived           # keys must end in ':'
          type: number
        dependencies: container  # dependencies must have '*'
      title: arrived`;

    let editorSession = getEditorSession(this, '.contract-editor-wrapper');

    // Clear the editor first
    editorSession.setValue('');
    await settled();

    // Set the yaml
    editorSession.setValue(inputYaml);

    // wait for the debounce action to resolve before checking the resulting smart contract
    await settled();

    // Get the smart contract
    let resultContract = getEditorSession(this, '.contract-viewer-wrapper').getValue();

    assert.equal(resultContract, expectedContract);
  });

});
