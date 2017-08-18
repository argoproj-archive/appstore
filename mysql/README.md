### Mysql

The service template named "mysql_server" runs mysql server in a container. It takes as input parameters the mysql version to install and password for the root user. The service template "mysql_server_test" is a simple workflow that starts mysql server as a fixture and runs a mysql script against the server using a mysql client container.  
