#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OLDDIR="$( pwd )"

cd $DIR

VERSIONS=(8 9)
for v in ${VERSIONS[*]}; do 
    sed "s/%%version%%/${v}/" Dockerfile > Dockerfile.${v}
    docker build -t get.applatix.io/applatix/java:openjdk-$v-jdk -f ./Dockerfile.${v} .
    rm Dockerfile.${v}
    docker push get.applatix.io/applatix/java:openjdk-$v-jdk
done

cd $OLDDIR