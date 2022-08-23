
function initRootsAndAffixesResource(errorFn) {
  fetch('/find-roots-of-word/roots-and-affixes.csv', {
    method: 'GET',
  })
    .then(response => {})
    .catch(errorFn)
}

function initWordExchangesResource(errorFn) {
  fetch('/find-roots-of-word/word-exchanges.csv', {
    method: 'GET',
  })
    .then(response => {})
    .catch(errorFn)
}

var rootsAndAffixesMap
var wordExchangeMap

// findRootAffixes is find root-affixes of word
function findRootAffixes(word, errorFn) {
  return []
}
