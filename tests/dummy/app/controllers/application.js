import Controller from '@ember/controller';
import { later } from '@ember/runloop';

export default Controller.extend({

    samples: {
        code: `pragma solidity ^0.4.24;
     contract Application {
         function Application() public {}
         enum Assets {
             Container, Lock
         }
         Assets _arrived = Assets.Container;
         Assets _tampered = Assets.Lock;
         Assets _Lock = Assets.Container;
         Assets _idle = Assets.Container;
         Assets _unlock = Assets.Lock;
         Assets _locked = Assets.Lock;
         Assets _departed = Assets.Container;
         Assets _received = Assets.Container;
     
         function arrived (
             uint sNum, /* optional parameter */
             uint arrived,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function tampered (
             uint sNum, /* optional parameter */
             uint tampered,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function Lock (
             uint sNum, /* optional parameter */
             uint locked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function idle (
             uint sNum, /* optional parameter */
             uint idle,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function unlock (
             uint sNum, /* optional parameter */
             uint tampered, /* optional parameter */
             uint unlocked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function locked (
             uint sNum, /* optional parameter */
             uint tampered, /* optional parameter */
             uint locked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function departed (
             uint sNum, /* optional parameter */
             uint departed,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function received (
             uint sNum, /* optional parameter */
             uint received,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
     }`,
        newCode: `pragma solidity ^0.4.24;
     contract Application {
         function Application() public {}
         enum Assets {
             Container, Lock, Manifest
         }
         Assets _arrived = Assets.Container;
         Assets _tampered = Assets.Lock;
         Assets _Lock = Assets.Container;
         Assets _idle = Assets.Container;
         Assets _unlock = Assets.Lock;
         Assets _locked = Assets.Lock;
         Assets _saveManifest = Assets.Manifest;
         Assets _departed = Assets.Container;
         Assets _Manifest = Assets.Container;
         Assets _received = Assets.Container;
     
         function arrived (
             uint sNum, /* optional parameter */
             uint arrived,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function tampered (
             uint sNum, /* optional parameter */
             uint tampered,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function Lock (
             uint sNum, /* optional parameter */
             uint locked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function idle (
             uint sNum, /* optional parameter */
             uint idle,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function unlock (
             uint sNum, /* optional parameter */
             uint tampered, /* optional parameter */
             uint unlocked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function locked (
             uint sNum, /* optional parameter */
             uint tampered, /* optional parameter */
             uint locked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function saveManifest (
             uint sNum, /* optional parameter */
             uint carNum,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function departed (
             uint sNum, /* optional parameter */
             uint departed,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function Manifest (
             string contents, /* optional parameter */
             uint locked,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
         function received (
             uint sNum, /* optional parameter */
             uint received,   /* optional parameter */
             string assetId) /* parameter needed for linking assets and transactions */
         public {}
     
     }`
    },

    init() {
        this._super();
        let self = this;
        console.log('attempting to call application controller');
        later(this, function () {
            self.set('code', self.get('samples.code'));
        }, 1000);
        later(this, function () {
            self.set('code', self.get('samples.newCode'));
        }, 3000);

    }

});
