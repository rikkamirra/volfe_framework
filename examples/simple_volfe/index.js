class HomeController extends Controller {
  render() {
    super.render();
    console.log("Hello from Home");
  }

  leave() {
    console.log("Bye Home");
  }
}


var routes = {
  'home': {
    url: '/home',
    controller: HomeController,
    templateUrl: "templates/home.html",
    children: {
      "articles": {
        url: '/articles',
        view: "#home_content",
        templateUrl: "templates/articles.html"
      }
    }
  },
  'about': {
    url: '/about',
    templateUrl: "templates/about.html"
  }
}

var app = new App(routes);
