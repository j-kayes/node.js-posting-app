(function(){
    var app = angular.module("postingApp", ['ngRoute', 'ngCookies']);

    app.config(function($routeProvider, $locationProvider) {
        $routeProvider
        .when('/', {
            templateUrl: 'home.html',
            controller: 'HomeController'

        })
        .when('/register', {
            templateUrl: 'register.html',
            controller: 'RegisterController'
  
        });
    });

    app.run(['$rootScope', '$cookies', function($rootScope, $cookies) { 
        // If user already logged in:
        if($cookies.get('token') && $cookies.get('currentUser')) { 
            $rootScope.token = $cookies.get('token'); 
            $rootScope.currentUser = $cookies.get('currentUser'); 
        }
    }]);

    app.controller("HomeController", ['$rootScope', '$scope', '$http', '$cookies', function($rootScope, $scope, $http, $cookies) {

        $scope.login = function() { 
            // Send post request with login data to server:
            $http.post('/login', { username: $scope.username, password: $scope.password }).then(function(res) {
                // Login successful
                $cookies.put('token', res.data.token); // Creates cookie with token data from jwt
                $cookies.put('currentUser', $scope.username);
                $rootScope.token = res.data.token;
                $rootScope.currentUser = $scope.username;

            }, function() { // Function called if response value >399
                alert('Bad login');
            });

        };

        $scope.logOut = function() { 
            $cookies.remove('token'); // Creates cookie with token data from jwt
            $cookies.remove('currentUser');
            $rootScope.token = null;
            $rootScope.currentUser = null;
        }

        $scope.submitNewPost = function() {
            // Send post request to server:
            $http.post('/posts', { newPost: $scope.newPost }, { headers: {'authorization' : $rootScope.token} }).then(function() {
                $scope.getPosts();
            });
        };

        // Fill $scope.posts array with post data from db:
        $scope.getPosts = function() {
            $http.get('/posts').then(function(response) {
                $scope.posts = response.data.reverse();
            });
        };

        $scope.deletePost = function(post) {
            // Send delete request to server:
            $http.put('/posts/remove', { id: post._id }, { headers: {'authorization' : $rootScope.token} }).then(function() {
                // After completion:
                $scope.getPosts(); // Update posts
            });
        };

        $scope.getPosts();

    }]);

    app.controller("RegisterController",  ['$scope', '$http', function($scope, $http) {
        $scope.submitSignup = function() {
            var newUser = {
                username: $scope.username,
                password: $scope.password
            };
            $http.post('/users', newUser).then(function(response){
                if(response.status === 201) {
                    alert("Registered");
                }
                if(response.status === 409) {
                    alert("Error");
                }             
            }); 
        }
    }]);

}());