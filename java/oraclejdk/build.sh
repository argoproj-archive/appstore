#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OLDDIR="$( pwd )"

cd $DIR

VERSIONS=("7u79-b15" "8u111-b14")
for v in ${VERSIONS[*]}; do 
    sed "s/%%version%%/${v}/" Dockerfile > Dockerfile.${v}
    docker build -t get.applatix.io/applatix/java:oraclejdk-$v-jdk -f ./Dockerfile.${v} .
    rm Dockerfile.${v}
    docker push get.applatix.io/applatix/java:oraclejdk-$v-jdk
done

cd $OLDDIR