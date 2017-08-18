FROM buildpack-deps:sid-scm

# A few problems with compiling Java from source:
#  1. Oracle.  Licensing prevents us from redistributing the official JDK.
#  2. Compiling OpenJDK also requires the JDK to be installed, and it gets
#       really hairy.

RUN apt-get update && apt-get install -y --no-install-recommends \
		bzip2 \
		unzip \
		xz-utils \
	&& rm -rf /var/lib/apt/lists/*

RUN echo 'deb http://deb.debian.org/debian experimental main' > /etc/apt/sources.list.d/experimental.list

# Default to UTF-8 file.encoding
ENV LANG C.UTF-8

# oracle jdk
COPY ./install-oraclejdk.sh /tmp
RUN /tmp/install-oraclejdk.sh %%version%%

ENV JAVA_HOME /usr/lib/jvm/oraclejdk-%%version%%

# install maven
RUN apt-get update
RUN apt-get install -y maven
