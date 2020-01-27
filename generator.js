const path = require('path')
const fs = require('fs')
const csv = require('csvtojson')

const datasets = [
  {
    title: 'Brownfield Land',
    file: path.join(__dirname, 'brownfield-land-collection/index/dataset.csv')
  }
]

Promise.all(
  datasets.map(async set => {
    set.json = await csv().fromFile(set.file)
    return set
  })
).then(sets => {
  const stream = fs.createWriteStream(path.join(__dirname, 'mapped.js'))
  stream.once('open', () => {
    stream.write(`
var brownfield = L.layerGroup()
`)

    sets.forEach(set => {
      set.json.filter(row => {
        return !(isNaN(row.latitude) || isNaN(row.longitude))
      }).map(row => {
        const size = isNaN(row.hectares) ? 100 : (Math.sqrt((row.hectares * 10000) / Math.PI))
        row.mapped = {
          location: [row.latitude, row.longitude],
          size: isNaN(size) ? 100 : size
        }
        return row
      }).forEach((json, index, array) => {
        const locationString = JSON.stringify(json.mapped.location)
        const popup = `<a href='https://digital-land.github.io/resource/${json.resource}'>Resource</a>, published by <a href='https://digital-land.github.io/organisation/${json.organisation.replace(':', '/')}'>${json.organisation}</a>, as part of the <a href='https://digital-land.github.io/dataset/brownfield-land/'>brownfield land dataset</a>`
        stream.write(`L.circle(${locationString}, { color: "red", fillColor: "#f03", fillOpacity: 0.5, radius: ${json.mapped.size} }).bindPopup("${popup}").addTo(brownfield)\n`)
      })

      stream.write(`
var base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    id: 'base',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

var map = L.map('map', { renderer: L.canvas(), layers: [base, brownfield] }).setView([52.561928, -1.464854], 7);
var renderer = L.canvas({ padding: 0.5 })

var baseLayers = {
  "OpenStreetMap": base
}

var overlay = {
  "Brownfield Land": brownfield
}

L.control.layers(baseLayers, overlay, { hideSingleBase: true, collapsed: false }).addTo(map)`)
    })
  })
})
