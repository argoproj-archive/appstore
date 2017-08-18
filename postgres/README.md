### Postgres

The service template named "postgres_server" runs postgres server in a container. It takes as input parameters the postgres version to install and password for the root user. The service template "postgres_server_test" is a simple workflow that starts postgres server as a fixture and runs an sql script against the server using a postgres client container.  
