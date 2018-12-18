class Base {
  constructor(app) {
    this.app = app;
  }
}

class Controller extends Base {
  render() {
    console.log("Compile");
    console.log(this, this._view);
    this.app.directives.compile(this._view);
  }

  leave() {

  }
}

class Directives extends Base {
  constructor(app) {
    super(app);

    this.directives = {
      'volfe-go': (element, attrValue) => {
        element.onclick = () => {
          this.app.router.go(attrValue);
        };
      }
    }
  }

  compile(parentSelector) {
    for (var directiveName in this.directives) {
      var elements = document.querySelectorAll(`${parentSelector || 'body'} [${directiveName}]`);
      if (!elements) break;
      for (var element of elements) {
        var callback = this.directives[directiveName];
        callback(element, element.getAttribute(directiveName));
      }
    }
  }
}

class HtmlService  extends Base {
  elem(el) {
    if (typeof(el) === 'string') {
      return document.querySelector(el);
    }
    return el;
  }

  clear(el) {
    this.elem(el).innerHTML = '';
  }

  insert(el, html) {
    this.clear(el);
    this.elem(el).innerHTML = html;
  }

  load(url, target) {
    return this.app.http.load(url).then(html => {
      this.insert(target, html);
      return html;
    });
  }
}


class HttpService extends Base {
  constructor(app) {
    super(app);
    this.staticServer = "http://127.0.0.1:8889";
  }

  ajax(options) {
    return $.ajax(options);
  }

  load(url) {
    return this.ajax(`${this.staticServer}/${url}`);
  }
}


class Router extends Base {
  constructor(app) {
    super(app);

    this.routeChain = [];
    this.defaultView = "main";
    this.urlNavigator = {};
    this.nameNavigator = {};

    this._routeProcesses();
  }

  runRoute(route) {
    if (route.templateUrl) {
      let view = route.view || this.defaultView;
      this.app.html.load(route.templateUrl, view).then(html => {
        route._view = view;
        this.runController(route);
      });
    } else {
      this.runController(route);
    }
  }

  runController(route) {
    var controller = route.controller || Controller;
    route._controller = new controller(this.app);
    route._controller._view = route._view;
    route._controller.render();
    this.routeChain.push(route);
    this.changeAddress(route._url);
  }

  changeAddress(newAddress) {
    window.history.pushState("object or string", "Title", newAddress);
  }

  go(url) {
    var chain = this._getRouteChain(url);
    var targetRoute = this.urlNavigator[url];
    this._destroyOldRoutes(targetRoute);
    if (!chain) return;

    for (var i = chain.length - 1; i >= 0; i--) {
      this.runRoute(chain[i]);
    }
  }

  _destroyOldRoutes(newRoute) {
    for (var i = this.routeChain.length - 1; i >= 0; i--) {
      if (this._isChildOf(newRoute, this.routeChain[i])) {
        break;
      }
      if (this.routeChain[i]._controller) {
        this.routeChain[i]._controller.leave();
        delete this.routeChain[i]._controller;
        this.routeChain.pop();
      }
    }
  }

  _isChildOf(route, parent) {
    return route._name.split('.')[0] === parent._name.split('.')[0];
  }

  _routeProcesses() {
    function traverse(routes, parentRoute) {
      for (var routeName in routes) {
        var route = routes[routeName];
        if (parentRoute) {
          route._url = parentRoute._url + route.url;
          route._parent = parentRoute;
          route._name = `${parentRoute._name}.${routeName}`;
        } else {
          route._url = route.url;
          route._name = routeName;
        }
        this.urlNavigator[route._url] = route;
        this.nameNavigator[route._name] = route;
        if (route.children) {
          traverse.call(this, route.children, route);
        }
      }
    }
    traverse.call(this, this.app.routes);
  }

  _getRouteChain(url) {
    var route = this.urlNavigator[url];
    if (!route) return false;
    var res = route;
    var res_parent = route._parent;
    var chain = [res];
    while (res_parent !== undefined) {
      res = res_parent;
      chain.push(res);
      res_parent = res_parent._parent;
    }
    return chain;
  }
}

class App {
  constructor(routes) {
    this.routes = routes;

    this.html = new HtmlService(this);
    this.http = new HttpService(this);
    this.router = new Router(this);
    this.directives = new Directives(this);

    this.directives.compile('body');
    this.router.go(window.location.pathname);
  }
}
