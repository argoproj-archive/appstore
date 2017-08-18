#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "usage: install.sh package repo_root"
    echo "example: install.sh golang /src/go-example"
    exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# create .applatix if doesn't exist
if [ ! -d "$2/.applatix" ]; then
  echo "... mkdir $2/.applatix"
  mkdir $2/.applatix
fi
echo "... cp $DIR/$1/*.yaml $2/.applatix/"
cp $DIR/$1/*.yaml $2/.applatix/
