Node starter REST service with Mongo & Express
==============================

This repo is a starter kit for Node based REST services and comes with APIs to create & login users with Redis backed sessions

You can add the APIs specific to your application under [/lib/api](https://github.com/saiaspire/starter-app-node-express-mongo/tree/master/lib/api)

## API
The user and session related APIs are under [/lib/auth](https://github.com/saiaspire/starter-app-node-express-mongo/tree/master/lib/auth)

###Create new user

####POST /user

**Request**
```
{
    "username":"hashbrown",
    "password":"saltedhashbrown", 
    "name":"Salted Hashbrown", 
    "email": "hashbrown@salt.com"
}
```
**Response**
```
{
    "status": "Successfully registered user"
}
```

###Get details of currently logged in user

####GET /user

**Response**
```
{
    "user": {
        "name": "Saik",
        "username": "saikrishnan",
        "email": "saiaspire@gmail.com"
    }
}
```

###Delete currently logged in user

####DELETE /user

**Response**
```
{
    "status": "Deleted user successfully"
}
```

###Login user and create new session

####POST /session

**Request**
```
{
    "username":"hashbrown",
    "password":"saltedhashbrown"
}
```
**Response**
```
{
    "status": "Logged in successfully"
}
```

###Logout current user and delete session

####DELETE /session

**Response**
```
{
    "status": "Logged out successfully"
}
```

### Requirements

* **node.js** >= *v0.10.29*
* **mongodb** >= *2.4.6*

## How to use this?
Clone the repository and install all dependencies,

```
npm install
```

Add new APIs under [/lib/api](https://github.com/saiaspire/starter-app-node-express-mongo/tree/master/lib/api)

Start the app
```
node app
```

## Tests
Mocha is used for BDD style testing

Tests for the user & session API and sample tests for the app are located under [/test](https://github.com/saiaspire/starter-app-node-express-mongo/tree/master/test) directory

To run the tests execute the following under the root directory

```
mocha
```
