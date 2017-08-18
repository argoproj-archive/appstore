#!/bin/bash

if [ "$#" -ne 1 ]; then
    echo "usage: install-oraclejdk.sh version_to_install"
    echo "example: install.sh 8u111-b14"
    exit 1
fi

JDK_VER=$1
verArray=(${JDK_VER//-/ })
mkdir /usr/lib/jvm
mkdir /usr/lib/jvm/oraclejdk-${JDK_VER}
cd /tmp
wget --header "Cookie: oraclelicense=accept-securebackup-cookie" http://download.oracle.com/otn-pub/java/jdk/${JDK_VER}/jdk-${verArray[0]}-linux-x64.tar.gz -O jdk.tar.gz
tar -zxf jdk.tar.gz -C /usr/lib/jvm/oraclejdk-${JDK_VER} --strip-components 1
update-alternatives --install /usr/bin/java java /usr/lib/jvm/oraclejdk-${JDK_VER}/bin/java 10000
update-alternatives --install /usr/bin/javac javac /usr/lib/jvm/oraclejdk-${JDK_VER}/bin/javac 10000
rm jdk.tar.gz
