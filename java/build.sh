#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
$DIR/openjdk/build.sh
$DIR/oraclejdk/build.sh
