<img align="right" height="50" src="https://raw.githubusercontent.com/startxfr/sqlup/master/docs/assets/logo.svg?sanitize=true">

# USE sqlup with npm

You can use sqlup with our 
[official sqlup NPM module](https://www.npmjs.com/package/sqlup)

### Application with your own configuration

1. Create your working environment
```bash
mkdir test
cd test
npm install sqlup
```

2. Create a file named app.js and add the following lines
```javascript
var sqlup = require("sqlup");
sqlup.launch({
    "name": "myproject",
    "version": "0.0.1",
    "path": "/sqlup",
    "server": {
        "type": "mysql",
        "host": "mydbhost",
        "user": "root",
        "password": "mypassword",
        "database": "myprojectdb"
    },
    "sequence": {
        "0.0.0": "v0.0.0.sql",
        "0.0.1": "v0.0.1.sql"
    }
});
```

3. Start your application
```bash
node app.js
```

4. Observe output of the running job