#!/bin/bash

WHEREAMI="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo $WHEREAMI
cd $WHEREAMI
./build.sh

