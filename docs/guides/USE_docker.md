<img align="right" height="50" src="https://raw.githubusercontent.com/startxfr/sqlup/master/docs/assets/logo.svg?sanitize=true">

# USE sqlup with docker

You can use sqlup within a container by using our public [official sqlup docker image](https://hub.docker.com/r/startx/sqlup/)

## Want to try ?

To try this application before working on it, the easiest way 
is to use the container version. Follow theses steps to run
a sqlup job within the next couple of minutes. 
(You can skip the first step if you already have [docker](https://www.docker.com)
installed and running)

## Requirements

### 1. Install and start docker

Theses command are for a Red Hat Linux like
environement (Fedora, CentOS, RHEL, Suse). Please adapt `yum` command to the 
```apt-get``` equivalent if you are using a Debian like system (Ubuntu, Debian)

```bash
sudo yum install -y docker
sudo service docker start
```
For more information on how to install and execute a docker runtime, please see
the [official docker installation guide](https://docs.docker.com/engine/installation/)
After installation, pay attention to your user authorisation. Your current user
must interact with the docker daemon.

### 2. Create your working directory

To run you test in a sandbox, you should isolate your sqlup test from 
your current work by creating a working directory.
```bash
mkdir ~/test-sqlup
cd ~/test-sqlup
```

### 3. Get the sqlup container image

Use docker command to get sqlup container image from the docker hub registry. 
This will update your local docker image cache.

```bash
docker pull startx/sqlup:latest
```

### 4. Create your sqlup.json configuration file

Create a file named sqlup.json

```bash
vi ~/test-sqlup/sqlup.json
```

Edit it with the following content

```javascript
{
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
}
```
You can change `name`, `version`, `server.*` and `sequence.*` with personalized content

### 5. Create patch files

in the same directory, create patch files 

```bash
echo "SET names 'utf8';" > v0.0.0.sql
echo "SET names 'utf8';" > v0.0.1.sql
```

## Using docker only

### 1. Create your sample database container

```bash
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=mypassword --name sqlup-db mariadb:5.5
```

### 2. Run your job

```bash
docker run -l sqlup-db -v ~/test-sqlup:/sqlup:ro --name sqlup startx/sqlup:latest
```

### 3. Observe output of the running job

The previous command will display action from the job container


## Using docker-compose

If you also use the docker-compose tool, you can use this example

1. Get the last version of sqlup container from docker hub registry
```bash
docker pull startx/sqlup:latest
```

2. Create a file named docker-compose.yml and edit it with the following content
```yml
sqlup:
  container_name: "sqlup"
  image: node:8-alpine
  environment:
    - SQLUP_HOST=db-mariadb
    - SQLUP_PWD=mypassword
    - SQLUP_DB=myprojectdb
  links:
    - "db-postgres"
    - "db-mariadb"
  volumes:
    - "./:/sqlup:ro"
  command: ["npm" , "start"]

db-postgres:
  image: postgres:10.1-alpine
  container_name: "sqlup-db-postgres"
  ports:
    - "5432"
  environment:
   - POSTGRES_PASSWORD=mypassword

db-mariadb:
  image: mariadb:5.5
  container_name: "sqlup-db-mariadb"
  ports:
    - "3306"
  environment:
   - MYSQL_ROOT_PASSWORD=mypassword
```

2. Run your application
```bash
docker-compose up -d db-mariadb db-postgres
```

3. Run your application
```bash
docker-compose up sqlup
```

### 3. Observe output of the running job

The previous command will display action from the job container

## Using Openshift

If you're familiar with Openshift PaaS, you will find 3 usefull templates to use in
your project
- [images streams ready to import](./openshift-imageStreams.yml)
- [template with configuration in configMap mounted volume](./openshift-template-configMap.yml)
- [template for full build and deploy strategy](./openshift-template-build.yml)

You can add them in a project using [openshift user guide](https://docs.openshift.org/latest/dev_guide/templates.html#uploading-a-template)