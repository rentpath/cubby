#!/bin/bash
export GH_ACTOR=$1
export GH_TOKEN=$2
git remote set-url origin https://$GH_ACTOR:$GH_TOKEN@github.com/rentpath/cubbyjs
git config --global user.email "gha_bot@rentpath.com"
git config --global user.name "GHA Bot"
git config --global http.http.https://github.com/.extraheader "AUTHORIZATION: bearer ${GH_TOKEN}"