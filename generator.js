const path = require('path')
const fs = require('fs')
const csv = require('csv')
const stream = require('stream')

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
})).pipe(fs.createWriteStream(path.join(__dirname, './docs/data/brownfield.csv')))

// Per organisation file
// function getByOrganisation (organisation) {
//   console.log(organisation)

//   return brownfieldStream.pipe(csv.parse({
//     columns: true,
//     on_record: function (record) {
//       if (record['organisation'] === organisation) {
//         return record
//       }
//       return null
//     }
//   }), { end: false })
// }

// const organisationStream = fs.createReadStream(getFileByType('organisation'))

// stream.pipeline(
//   fs.createReadStream(getFileByType('organisation')),
//   fs.createWriteStream()
//   // getByOrganisation(organisation)
// )

// organisationStream.pipe(csv.parse({
//   columns: true,
//   on_record (record) {
//     const writeStream = fs.createWriteStream(path.join(__dirname, './docs/data/' + record['organisation'].replace(':', '-') + '.csv'), { end: false })
//     const readStream = getByOrganisation(record['organisation'])

//     readStream.pipe(writeStream)

//     // .pipe(writeStream)

//     // writeStream.pipe()
//     writeStream.on('finish', () => {
//       return record
//     })
//   }
// }))
