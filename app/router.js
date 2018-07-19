import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  // found this typical error:
  // this.route("search", { path: "/search" });
  // this.route("search", { path: "/search/:query" });
  // MUST be changed into:
  // this.resource("search", { path: "/search" }, function() {
  //   this.route(':query');
  // });
});

export default Router;
