/**
 * This file contains example input YAML files meant to be used
 * with the contract-editor component.
 */

const auditYAML = `---
    - asset:  &Audit 
          name:   assetId
          type:   Audit
    
    - transaction: 
        verifyAudit: 
          type: object
          properties: 
            approved: 
              name: approved
              type: bool
            bundleHashId: 
              name: bundleHashId
              type: string
            dependencies: *Audit
          title: verifyAudit
        saveNewAudit: 
          type: object
          properties: 
            establishment: 
              name: establishment
              type: string
            theaddress: 
              name: theaddress
              type: string
            timestamp: 
              name: timestamp
              type: string
            description: 
              name: description
              type: string
            comments: 
              name: comments
              type: string
            bundleHashId: 
              name: bundleHashId
              type: string
            Audit: 
              name: Audit
              type: string
            dependencies: *Audit  
          title: saveNewAudit
`;

const containerYAML = `---
- asset:  &container                 # defines anchor label
      name:   assetId
      type:   container
- transaction: 
   properties: object
   arrived:
    type: object
    properties:       # method variable
      sNum:
        name: sNum
        type: number
      arrived:
        name: arrived
        type: number
      dependencies:  *container
    title: arrived 
- assignAsset: 
   properties: object
   lock:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      locked:
        name: locked
        type: number
      dependencies:  *container
    title: lock
   

- asset:  &container                 # defines anchor label
      name:   assetId
      type:   container
- asset:  &lock                
      name:   assetId
      type:   lock
- asset:  &manifest                
      name:   assetId
      type:   manifest


- transaction: 
   properties: object
   arrived:
    type: object
    properties:       # method variable
      sNum:
        name: sNum
        type: number
      arrived:
        name: arrived
        type: number
      dependencies:  *container
    title: arrived

- transaction: 
   properties: object
   tampered:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      tampered:
        name: tampered
        type: number
      dependencies:  *lock
    title: tampered

- assignAsset: 
   properties: object
   lock:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      locked:
        name: locked
        type: number
      dependencies:  *container
    title: lock

- transaction: 
   properties: object
   idle:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      idle:
        name: idle
        type: number
      dependencies:  *container
    title: idle

- transaction: 
   properties: object
   unlock:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      tampered:
        name: tampered
        type: number
      unlocked:
        name: unlocked
        type: number
      dependencies:  *lock
    title: unlock

- transaction: 
   properties: object
   locked:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      tampered:
        name: tampered
        type: number
      locked:
        name: locked
        type: number
      dependencies:  *lock
    title: locked
 
- transaction: 
   properties: object
   saveManifest:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      carNum:
        name: carNum
        type: number
      dependencies:  *manifest
    title: saveManifest

- transaction: 
   properties: object
   departed:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      departed:
        name: departed
        type: number
      dependencies:  *container
    title: departed

- assignAsset: 
   properties: object
   manifest:
    type: object
    properties:
      contents:
        name: contents
        type: string
      locked:
        name: locked
        type: number
      dependencies:  *container
    title: manifest

- transaction: 
   properties: object
   received:
    type: object
    properties:
      sNum:
        name: sNum
        type: number
      received:
        name: received
        type: number
      dependencies:  *container
    title: received`;

export { auditYAML, containerYAML };
