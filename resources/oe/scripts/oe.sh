#!/bin/sh
echo $0 called with
echo $*

export DLC="$7"
export TERM=xterm
export PROPATH=$PROPATH:$(dirname "$PWD")

called_path=${0%/*}
parent_path=$(dirname $called_path)

export PROSTARTUP=$called_path/oe.pf

export PROPATH=$PROPATH:$parent_path

if [ -z "$DLC" ] || [ ! -f "$DLC/bin/_progres" ]; then
    echo "Failed to initialize client: _progres executable is missing in $DLC/bin."
    exit 1
fi

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

exec $PROEXE -1 "$1" "$2" "$3" "$4" "$5" "$6"
