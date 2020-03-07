const fs = require('fs')
const verifyMt1t = [
  `arithmetic`, `crypto_high`,  `finance_high`,
  `finance_normal`, `image`, `multimedia`, `neural_high`,
  `power_float`, `power_int`, `scientific_high`
]

const verifyMtMc = [ `best_latency`, `worst_latency` ]

readFolder().then(() => {
  console.log(`Reading directory complete`)
  process.exit()
})

async function readFolder() {
  const dataDirectory = './2020-02/'
  const dirContents = fs.readdirSync(dataDirectory)

  dirContents.forEach((m) => {
    const machineFiles = fs.readdirSync(`${dataDirectory}/${m}`)
    const fixedPrefix = `${m}_cpu_`
    const expectedNames = new Set(createExpectedNames(fixedPrefix))
    const actualNames = new Set(createActualNames(fixedPrefix, machineFiles))
    if (inSubset(expectedNames, actualNames)) {
      console.log(`Machine: ${m} passed validation`)
    } else {
      console.log(`Machine: ${m} needs to be fixed. Errors listed below`)
      console.log(subtractSet(expectedNames, actualNames))
    }
  })
}

function inSubset(subset, set) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      console.log(`FAILURE DUE TO ${elem}`)
      return false
    }
  }
  return true
}

function subtractSet(a, b) {
  for (let elem of b) {
    if (a.has(elem)) {
      a.delete(elem)
    }
  }

  return a
}

function createExpectedNames(prefix) {
  return [
    ...verifyMt1t.flatMap((f) => {
      return [`${prefix}${f}_mt`, `${prefix}${f}_1t`]
    }),
    ...verifyMtMc.flatMap((f) => {
      return [`${prefix}${f}_mt`, `${prefix}${f}_mc`]
    })
  ]
}

function createActualNames(fixedPrefix, machineFiles) {
  return machineFiles.map((f) => {
    const fileName = f.slice(fixedPrefix.length)
    const fileNameWithoutExt= fileName.split(`.`)[0]
    return `${fixedPrefix}${fileNameWithoutExt}`
  })
}