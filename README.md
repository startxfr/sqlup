# [![sqlup](https://raw.githubusercontent.com/startxfr/sqlup/master/docs/assets/logo.svg?sanitize=true)](https://github.com/startxfr/sqlup)

**sqlup** for **sql** **up**grade is an an open-source job container who apply sql patch to a database following a sequentially versionned plan.
Very light (application less than 100Ko, full container stack for less than 30Mo) application configured with a single json file, to deploy and follow update lifecycle of a database stored in mysql, posgresql or dynamodb backend.

[![Build Status](https://travis-ci.org/startxfr/sqlup.svg?branch=master)](https://travis-ci.org/startxfr/sqlup) [![npm dependencies](https://david-dm.org/startxfr/sqlup.svg)](https://www.npmjs.com/package/sqlup) [![last commit](https://img.shields.io/github/last-commit/startxfr/sqlup.svg)](https://github.com/startxfr/sqlup) [![licence](https://img.shields.io/github/license/startxfr/sqlup.svg)](https://github.com/startxfr/sqlup) 

## Getting Started

- [![docker build](https://img.shields.io/docker/build/startx/sqlup.svg)](https://hub.docker.com/r/startx/sqlup/) [container image](https://hub.docker.com/r/startx/sqlup) published in dockerhub public registry. The simplest and fastest way to execute a sqlup job is to use the public docker image. For more information on how to run your first sqlup job using sqlup docker image, please read the [docker image user guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/USE_docker.md)
- [![npm version](https://badge.fury.io/js/sqlup.svg)](https://www.npmjs.com/package/sqlup) [npm module](https://www.npmjs.com/package/sqlup) published in npm public database. If you plan to sqlup into another application, you should be more interested by the npm method. For more information on how to run your first sqlup job using sqlup npm module, please read the [npm module user guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/USE_npm.md)
- [![sqlup](https://img.shields.io/badge/latest-v0.1.7-blue.svg)](https://github.com/startxfr/sqlup) [source code](https://github.com/startxfr/sqlup/tree/dev) published in github. If you plan to extend sqlup capabilities with your own component, change default software design, extend core functinalities or more globaly improve this application, please read the [source code user guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/USE_source.md)

## Want to try ?

- [Docker user guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/USE_docker.md)
- [NodJS user guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/USE_npm.md)
- [Source code user guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/USE_source.md)

## Documentation

If you want to have more information on how to install, develop and run this framework and use it in your project, please read the [full documentation](https://github.com/startxfr/sqlup/tree/master/docs/README.md) or our [user guides](https://github.com/startxfr/sqlup/tree/master/docs/guides/README.md) and execute the following steps :
1. [Install sqlup](https://github.com/startxfr/sqlup/tree/master/docs/guides/1.Install.md)
2. [Configure sqlup](https://github.com/startxfr/sqlup/tree/master/docs/guides/2.Configure.md)
3. [Run your job](https://github.com/startxfr/sqlup/tree/master/docs/guides/3.Run.md)

## Troubleshooting

If you run into difficulties installing or running sqlup, you can [create an issue](https://github.com/startxfr/sqlup/issues/new).

## Built With

* [docker](https://www.docker.com/) - Container plateform
* [alpine](https://alpinelinux.org/) - OS envelop
* [nodejs](https://nodejs.org) - Application server

## Contributing

Read the [contributing guide](https://github.com/startxfr/sqlup/tree/master/docs/guides/5.Contribute.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

This project is mainly developped by the [startx](https://www.startx.fr) dev team. You can see the complete list of contributors who participated in this project by reading [CONTRIBUTORS.md](https://github.com/startxfr/sqlup/tree/master/docs/CONTRIBUTORS.md).

## License

This project is licensed under the GPL Version 3 - see the [LICENSE.md](https://github.com/startxfr/sqlup/tree/master/docs/LICENSE.md) file for details
