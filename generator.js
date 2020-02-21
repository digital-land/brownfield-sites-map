const path = require('path')
const fs = require('fs')
const csv = require('csv')
const stringifySync = require('csv-stringify/lib/sync')
const parseSync = require('csv-parse/lib/sync')

const datasets = [
  {
    title: 'Brownfield Land',
    type: 'brownfield',
    file: path.join(__dirname, 'brownfield-land-collection/index/dataset.csv')
  },
  {
    title: 'Organisations',
    type: 'organisation',
    file: path.join(__dirname, 'organisation-collection/collection/organisation.csv')
  }
]

function getFileByType (type) {
  return datasets.find(set => set.type === type).file
}

// Pared back brownfield file
const baselineRequirements = ['organisation', 'latitude', 'longitude', 'hectares']
const brownfieldStream = fs.createReadStream(getFileByType('brownfield'))

brownfieldStream.pipe(csv.parse({
  columns: true,
  on_record (record) {
    let hasAllData = 0

    baselineRequirements.forEach(requirement => {
      if (record[requirement].length) {
        hasAllData = parseInt(hasAllData) + parseInt(1)
      }
    })

    return (hasAllData === baselineRequirements.length) ? record : null
  }
})).pipe(csv.stringify({
  header: true,
  columns: baselineRequirements
})).pipe(fs.createWriteStream(path.join(__dirname, './docs/data/brownfield/index.csv')))

// Per organisation file
const organisationParsed = parseSync(fs.readFileSync(getFileByType('organisation')))
const organisationHeaders = organisationParsed.shift()
const organisationMapped = organisationParsed.map(row => {
  const obj = {}
  row.forEach((cell, index) => {
    obj[organisationHeaders[index]] = cell
  })
  return obj
})

console.log(organisationMapped)

let count = 0
const organisations = {}
brownfieldStream.pipe(csv.parse({
  columns: true,
  on_record (record) {
    if (!Object.keys(organisations).includes(record['organisation'])) {
      organisations[record['organisation']] = []
    }
    organisations[record['organisation']].push(record)
    count = count + 1
    console.log(count)
  }
})).on('finish', () => Object.keys(organisations).map(organisation => {
  const writeStream = fs.createWriteStream(path.join(__dirname, `./docs/data/brownfield/${organisation.toLowerCase().replace(':', '-')}.csv`))

  const row = organisations[organisation].map(function (record) {
    const org = organisationMapped.find(org => record['organisation'] === org['organisation'])
    record.name = org ? org['name'] : record['organisation']
    return record
  })

  writeStream.write(stringifySync(row, {
    header: true
  }))
}))
