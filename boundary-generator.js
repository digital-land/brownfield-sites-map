const path = require('path')
const fs = require('fs')
const csv = require('csv')
const stringifySync = require('csv-stringify/lib/sync')
const parseSync = require('csv-parse/lib/sync')

const datasets = [
  {
    title: 'Brownfield Land',
    type: 'brownfield',
    file: path.resolve(process.cwd(), 'brownfield-land-collection/index/dataset.csv')
  },
  {
    title: 'Organisations',
    type: 'organisation',
    file: path.resolve(process.cwd(), 'organisation-collection/collection/organisation.csv')
  }
]

function getFileByType (type) {
  return datasets.find(set => set.type === type).file
}

const brownfieldParsed = parseSync(fs.readFileSync(getFileByType('brownfield')))
const brownfieldHeaders = brownfieldParsed.shift()
const brownfieldMapped = brownfieldParsed.map(row => {
  const obj = {}
  row.forEach((cell, index) => {
    obj[brownfieldHeaders[index]] = cell
  })
  return obj
})

const organisationStream = fs.createReadStream(getFileByType('organisation'))
const baselineRequirements = ['organisation', 'statistical-geography']

organisationStream.pipe(csv.parse({
  columns: true,
  on_record: function (record) {
    if (record['end-date'].length) {
      return null
    }

    let hasAllData = 0

    baselineRequirements.forEach(requirement => {
      if (record[requirement].length) {
        hasAllData = parseInt(hasAllData) + parseInt(1)
      }
    })

    const brownfield = brownfieldMapped.filter(function (row) {
      return row['organisation'].toLowerCase() === record['organisation'].toLowerCase()
    })

    const resource = brownfieldMapped.find(function (row) {
      return (row['organisation'].toLowerCase() === record['organisation'].toLowerCase())
    })

    record['resource'] = resource ? resource['resource'].toString() : 'notfound'
    record['point-count'] = brownfield.length || 0

    return (hasAllData === baselineRequirements.length) ? record : null
  }
})).pipe(csv.stringify({
  header: true,
  columns: baselineRequirements.concat(['start-date', 'end-date', 'point-count', 'name', 'resource'])
})).pipe(fs.createWriteStream(path.join(__dirname, './docs/data/organisation-boundary-referral.csv')))
