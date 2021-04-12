#!/bin/bash
export GH_TOKEN=$1
echo "//npm.pkg.github.com/:_authToken=${GH_TOKEN}\n@rentpath:registry=https://npm.pkg.github.com/" > .npmrc
yarn config set @rentpath:registry https://npm.pkg.github.com