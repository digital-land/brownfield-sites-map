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
var map = L.map('map', { renderer: L.canvas() }).setView([52.561928, -1.464854], 7);
var renderer = L.canvas({ padding: 0.5 })

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)
`)

    sets.forEach(set => {
      set.json.filter(row => {
        return !(isNaN(row.GeoY) || isNaN(row.GeoX))
      }).filter(row => {
        return !((row.GeoY > 100) || (row.GeoX > 100))
      }).map(row => {
        const size = isNaN(row.Hectares) ? 100 : (Math.sqrt((row.Hectares * 10000) / Math.PI))
        row.mapped = {
          location: [row.GeoY, row.GeoX],
          size: isNaN(size) ? 100 : size
        }
        return row
      }).forEach(json => {
        const locationString = JSON.stringify(json.mapped.location)
        const popup = `<strong>Data provided by</strong> ${json.OrganisationURI}<br><pre>lat:${json.GeoY}, long:${json.GeoX}</pre>`
        stream.write(`L.circle(${locationString}, { color: "red", fillColor: "#f03", fillOpacity: 0.5, radius: ${json.mapped.size} }).addTo(map).bindPopup("${popup}")\n`)
      })
    })
  })
})
