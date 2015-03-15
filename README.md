angular-soap
============

An Angular port of a <a href="http://javascriptsoapclient.codeplex.com/">JavaScript SOAP Client</a> into a factory that has a similar syntax to $http.

# Usage
Before using the factory, you must import the two scripts and its module:

``` html
<script src="soapclient.js"></script>
<script src="angular.soap.js"></script>
```

``` javascript
angular.module('myApp', ['angularSoap']);
```

Then, wherever you are going to consume it, make a reference to the $soap service for dependency injection:

``` javascript
.factory("testService", ['$soap',function($soap){
//use it here
}])
```

$soap has one method, post, which accepts the following paramaters:

| Parameter |Description | Example |
| ------------ | ------------  | ------------  |
| url | The base URL of the service | "http://www.cooldomain.com/SoapTest/webservicedemo.asmx" |
| action | The action you want to call | "HelloWorld" |
| params | An object of parameters to pass to the service | { name: "Andrew" } |

Syntax:
``` javascript
$soap.post(url,action,params);
```

Similar to $http methods, $soap.post returns a promise that you can act upon.

``` javascript
$soap.post(url,action,params).then(function(response){
	//Do Stuff
});
```

NOTE: Response will be a javascript object containing the response mapped to objects. Do a console.log of response so you can see what you are working with.

# Example 1: Hello World
A basic "Hello World" with no parameters.

``` javascript
angular.module('myApp', ['angularSoap'])

.factory("testService", ['$soap',function($soap){
	var base_url = "http://www.cooldomain.com/SoapTest/webservicedemo.asmx";

	return {
		HelloWorld: function(){
			return $soap.post(base_url,"HelloWorld");
		}
	}
}])

.controller('MainCtrl', function($scope, testService) {

  testService.HelloWorld().then(function(response){
	$scope.response = response;
  });
  
})

```

# Example 2: Invoke with Parameters
A basic method call with parameters.

``` javascript
angular.module('myApp', ['angularSoap'])

.factory("testService", ['$soap',function($soap){
	var base_url = "http://www.cooldomain.com/SoapTest/webservicedemo.asmx";

	return {
		CreateUser: function(firstName, lastName){
			return $soap.post(base_url,"CreateUser", {firstName: firstName, lastName: lastName});
		}
	}
}])

.controller('MainCtrl', function($scope, testService) {

  testService.CreateUser($scope.firstName, $scope.lastName).then(function(response){
	$scope.response = response;
  });
  
})

```

# Example 3: Get Single Object
A basic method call to get a single object.

``` javascript
angular.module('myApp', ['angularSoap'])

.factory("testService", ['$soap',function($soap){
	var base_url = "http://www.cooldomain.com/SoapTest/webservicedemo.asmx";

	return {
		GetUser: function(id){
			return $soap.post(base_url,"GetUser", {id: id});
		}
	}
}])

.controller('MainCtrl', function($scope, testService) {

  testService.GetUser($scope.id).then(function(user){
	console.log(user.firstName);
	console.log(user.lastName);
  });
  
})

```

# Example 4: Get Many Objects
A basic method call to get a collection of objects.

``` javascript
angular.module('myApp', ['angularSoap'])

.factory("testService", ['$soap',function($soap){
	var base_url = "http://www.cooldomain.com/SoapTest/webservicedemo.asmx";

	return {
		GetUsers: function(){
			return $soap.post(base_url,"GetUsers");
		}
	}
}])

.controller('MainCtrl', function($scope, testService) {

  testService.GetUsers().then(function(users){
	for(i=0;i<users.length;i++){
		console.log(users[i].firstName);
		console.log(users[i].lastName);
	}
  });
  
})

```
