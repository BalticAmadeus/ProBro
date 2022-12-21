#!/bin/sh

DLC=/usr/dlc

export TERM=xterm
export PROPATH=$PROPATH:$(dirname "$PWD")

PROEXE=${PROEXE-$DLC/bin/_progres}

# set the Progress shared lib  environment
if [ ! -f $DLC/bin/slib_env ]
then
    echo "Progress $PROG Messages:"
    echo
    echo "slib_env could not be found."
    echo
    echo "Progress shared library environment not set correctly."
    echo "Progress DLC environment variable may not be set correctly."
    echo "Set DLC variable to Progress installation directory."
    echo
    echo "Progress DLC setting: $DLC"
    echo
    echo
    exit 1
fi

# Set Java environment for -SMQConnect and Java-based Debugger
if [ ! -n "$JREHOME" ]
  then
# Make sure that the script exists
  if [ -f $DLC/bin/java_env ]
    then
    . $DLC/bin/java_env
    PATH=$JREHOME/bin:$PATH
  fi
fi
 
# Set the Progress Shared lib environment
. $DLC/bin/slib_env

export PROWD254=/usr/dlc/proword.254

exec $PROEXE -1 "$@"
