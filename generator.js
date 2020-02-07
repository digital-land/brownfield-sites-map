const path = require('path')
const fs = require('fs')
const csv = require('csv')
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

const brownfield = datasets.find(set => set.type === 'brownfield')

const organisation = parseSync(fs.readFileSync(datasets.find(set => set.type === 'organisation').file))

const organisationHeaders = organisation.shift()

const organisationMapped = organisation.map(row => {
  const obj = {}
  row.forEach((cell, index) => {
    obj[organisationHeaders[index]] = cell
  })
  return obj
})

// Add organisation name to the brownfield dataset
fs.createReadStream(brownfield.file).pipe(csv.parse({
  columns: true
})).pipe(csv.transform(record => {
  const org = organisationMapped.find(org => record['organisation'] === org['organisation'])
  record.name = org ? org['name'] : record['organisation']
  return record
})).pipe(csv.stringify({
  header: true
})).pipe(fs.createWriteStream(path.join(__dirname, './docs/data/brownfield.csv')))
