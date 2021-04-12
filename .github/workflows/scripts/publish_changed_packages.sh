#!/bin/bash
changed_packages=$(npx lerna changed -a | sed -e ':a' -e 'N;$!ba' -e 's/\n/,/g')
if [  $(echo $changed_packages | wc -c)  -gt 1 ] ; then
    npx lerna version --yes --exact --conventional-commits --conventional-graduate=${changed_packages}
    npx lerna publish from-package --yes --registry https://registry.npmjs.org
else
    echo "Refraining from publishing a new version."
fi