#!/bin/bash

##################
##              ##
## FLAG PARSING ##
##              ##
##################
while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do case $1 in
  -h | --help )
    printf "\nScript docs in progress"
    exit
    ;;
  -d | --dir )
    shift; export DIRECTORY=$1
    ;;
  -a | --actor )
    shift; export GITHUB_ACTOR=$1
    ;;
esac; shift; done

if [[ "$1" == '--' ]]; then shift; fi
##################
##              ##
## LOGGING UTIL ##
##              ##
##################
log(){
    printf "\n ============ \n[LOG]: %s \n \n" "$1"
}
error(){
    printf "\n ============ \n[ERROR]: %s \n \n"  "$1"
}


##################
##              ##
## SCRIPT START ##
##              ##
##################


IFS=$'\n' read -d '' -r -a owners < ${DIRECTORY}/OWNERS

log "Printing owners"

for i in "${owners[@]}"; do
    printf "\n $i"
done

if [[ " ${owners[@]} " =~ " ${GITHUB_ACTOR} " ]]; then
    log "User ${GITHUB_ACTOR} found in codeowners file located at ${DIRECTORY}/OWNERS. Allowing deployment to continue."
    exit 0
fi

if [[ ! " ${owners[@]} " =~ " ${GITHUB_ACTOR} " ]]; then
    error "User ${GITHUB_ACTOR} not found in codeowners file located at ${DIRECTORY}/OWNERS Cancelling deployment."
    exit 1
fi
