// Exchange is english word exchange
class Exchange {
  constructor(name, word, lamme, desc) {
    this.name = name
    this.word = word
    this.lamme = lamme
    this.desc = desc
  }
}

class Path {
  constructor(value, start, size) {
    this.value = value
    this.start = start
    this.size = size
  }
  toString() {
    return this.value
  }
}

async function initRootsAndAffixesResource() {
  if (0 < rootsAndAffixesMap.size) {
    return Promise.resolve()
  }
  return fetch(domain + '/roots-and-affixes.csv', { method: 'GET', })
    .then(response => {
      if (200 != response.status) {
        throw `Init roots-and-affixes.csv failed: ${response.statusText}`
      }
      return response
    })
    .then(response => response.text())
    .then(text => text.split("\n"))
    .then(lines => {
      lines.forEach(line => {
        var temp = line.split("|")
        if (2 == temp.length) {
          rootsAndAffixesMap.set(temp[0], temp[1])
        }
      })
    })
    .then(_ => console.log(`Root-affix length is ${rootsAndAffixesMap.size}`))
    .catch(_ => console.error(err))
}

async function initWordExchangesResource() {
  if (0 < wordExchangeMap.size) {
    return Promise.resolve()
  }
  const handleWordExchange = function (lamme, exchanges) {
    // 格式
    // i:eating,p:ate,d:eaten,3:eats
    let arr = exchanges.split(",")
    arr.forEach(element => {
      let temp = element.split(":")
      if (wordExchangeMap.has(temp[1])) {
        var exchangeObj = wordExchangeMap.get(temp[1])
        exchangeObj.name += temp[0]
      } else {
        wordExchangeMap.set(temp[1], new Exchange(temp[0], temp[1], lamme, "DESC"))
      }
    })
  }
  return fetch(domain + '/word-exchanges.csv', { method: 'GET', })
    .then(response => {
      if (200 != response.status) {
        throw `Init roots-and-affixes.csv failed: ${response.statusText}`
      }
      return response
    })
    .then(response => response.text())
    .then(text => text.split("\n"))
    .then(lines => {
      lines.forEach(line => {
        var temp = line.split("|")
        if (2 == temp.length) {
          handleWordExchange(temp[0], temp[1])
        }
      })
    })
    .then(_ => console.log(`Word exchanges length is ${wordExchangeMap.size}`))
    .catch(err => console.error(err))
}

const domain = ""
// const domain = "/find-roots-of-word"
const roots_and_affixes_csv = domain + '/roots-and-affixes.csv'
const word_exchanges_csv = domain + '/word-exchanges.csv'

const rootsAndAffixesMap = new Map()
const wordExchangeMap = new Map()

// WordRootAffixes is find root-affixes of word
async function WordRootAffixes(word) {
  // QA: https://stackoverflow.com/questions/46241827/fetch-api-requesting-multiple-get-requests
  return Promise
    .all([initRootsAndAffixesResource(), initWordExchangesResource()])
    .then(_ => findWordRootAffixes(word))
}

function findWordRootAffixes(word) {
  // Step 0.
  if (2 >= word.length) {
    return [word]
  }
  // Step 1.
  if (wordExchangeMap.has(word)) {
    let exchange = wordExchangeMap.get(word)
    let arr = findLammeRootAffixes(exchange.lamme)
    return [exchange.lamme].concat(arr)
  }
  return findLammeRootAffixes(word)
}

function findLammeRootAffixes(lamme = "") {
  // Step 2.
  var rootPaths = finAvailableRootPath(lamme)
  var availablePaths = []
  var tempPaths = []
  rootPaths.forEach(rootPath => {
    availablePaths.push(rootPath)
    let prefixPaths = findAvailablePrefixPath(lamme.substring(0, rootPath.start), "-")
    let suffixPaths = findAvailableSuffixPath(lamme.substring(rootPath.start + rootPath.size), "-")
    tempPaths = []
    if (0 == prefixPaths.length) {
      tempPaths.push(rootPath)
    }
    prefixPaths.forEach(prefixPath => {
      tempPaths.push(new Path(
        prefixPath.value + "," + rootPath.value,
        prefixPath.start,
        prefixPath.size + rootPath.size,
      ))
    })
    if (0 == suffixPaths.length) {
      tempPaths.forEach(tempPath => {
        availablePaths.push(tempPath)
      })
    }
    suffixPaths.forEach(suffixPath => {
      tempPaths.forEach(tempPath => {
        availablePaths.push(new Path(
          tempPath.value + "," + suffixPath.value,
          tempPath.start,
          tempPath.size + suffixPath.size,
        ))
      })
    })
  })

  // Step 3.
  tempPaths = availablePaths
  availablePaths = []
  tempPaths.forEach(path => {
    console.log(`find ${path.value}`);
    if (path.start == 0 && path.start + path.size == lamme.length) {
      availablePaths.push(path)
    }
  })

  // Step 4.
  var maxPathLength = lamme.length
  tempPaths = availablePaths
  availablePaths = []
  tempPaths.forEach(path => {
    let len = path.value.split(",").length
    if (len < maxPathLength) {
      maxPathLength = len
      availablePaths = []
      availablePaths.push(path)
    } else if (len == maxPathLength) {
      availablePaths.push(path)
    }
  })

  // Step 5.
  var singleRootPaths = []
  tempPaths = availablePaths
  availablePaths = []
  tempPaths.forEach(path => {
    let affixes = path.value.split(",")
    let rootCount = 0
    affixes.forEach(affix => {
      if (affix.charAt(0) != "-" && affix.charAt(affix.length - 1) != "-") {
        rootCount++
      }
    })
    if (1 < rootCount) {
      availablePaths.push(path)
    } else {
      singleRootPaths.push(path)
    }
  })
  if (0 != singleRootPaths.length) {
    availablePaths = singleRootPaths
  }

  // Step 6.
  var lastValueOfMaxMinusMin = lamme.length
  tempPaths = availablePaths
  availablePaths = []
  tempPaths.forEach(path => {
    let affixes = path.value.split(",")
    let maxAffixLength = 0
    let minAffixLength = lamme.length
    let maxValue = 0
    for (let i = 0; i < affixes.length; i++) {
      // QA: https://stackoverflow.com/q/26156292
      const affix = affixes[i].replace(/^\-+|\-+$/g, '')
      if (maxAffixLength < affix.length) {
        maxAffixLength = affix.length
      }
      if (affix.length < minAffixLength) {
        minAffixLength = affix.length
      }
      if (i == 0) {
        continue
      }
      let value = maxAffixLength - minAffixLength
      if (maxValue < value) {
        maxValue = value
      }
    }
    if (maxValue < lastValueOfMaxMinusMin) {
      lastValueOfMaxMinusMin = maxValue
      availablePaths = []
      availablePaths.push(path)
    } else if (maxValue == lastValueOfMaxMinusMin) {
      availablePaths.push(path)
    }
  })

  // Step 7.
  var affixes = []
  availablePaths.forEach(path => {
    affixes.push(path.value)
  });
  return affixes
}

function finAvailableRootPath(word) {
  var paths = []
  for (let i = 0; i < word.length; i++) {
    for (let j = i + 1; j <= word.length; j++) {
      let temp = word.substring(i, j)
      if (rootsAndAffixesMap.has(temp)) {
        paths.push(new Path(temp, i, temp.length))
        let _paths = findAvailableSuffixPath(word.substring(j), "")
        _paths.forEach(path => {
          paths.push(new Path(temp + "," + path.value, i, temp.length + path.size))
        })
      }
    }
  }
  return paths
}

function findAvailablePrefixPath(word = "", symbol = "") {
  var paths = []
  for (let i = word.length - 1; 0 <= i; i--) {
    let temp = word.substring(i)
    let symbolTemp = temp + symbol
    if (rootsAndAffixesMap.has(symbolTemp)) {
      let _paths = findAvailablePrefixPath(word.substring(0, i), symbol)
      if (0 == _paths.length) {
        paths.push(new Path(symbolTemp, i, temp.length))
      }
      _paths.forEach(path => {
        paths = [
          new Path(path.value + "," + symbolTemp, path.start, temp.length + path.size),
        ].concat(paths)
      })
    }
  }
  return paths
}

function findAvailableSuffixPath(word = "", symbol = "") {
  var paths = []
  for (let i = 1; i <= word.length; i++) {
    let temp = word.substring(0, i)
    let symbolTemp = symbol + temp
    if (rootsAndAffixesMap.has(symbolTemp)) {
      let _paths = findAvailableSuffixPath(word.substring(i), symbol)
      if (0 == _paths.length) {
        paths.push(new Path(symbolTemp, 0, temp.length))
      }
      _paths.forEach(path => {
        paths.push(new Path(symbolTemp + "," + path.value, 0, temp.length + path.size))
      })
    }
  }
  return paths
}