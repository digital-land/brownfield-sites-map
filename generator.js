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
  const stream = fs.createWriteStream(path.join(__dirname, './docs/mapped.js'))
  stream.once('open', () => {
    stream.write(`
function popup (resource, organisation, address) {
  const resourceUrl = 'https://digital-land.github.io/resource/' + resource
  const organisationUrl = 'https://digital-land.github.io/organisation/' + organisation.replace(':', '/')
  return '<strong>Address:</strong> ' + address + '<br><br>' + '<a href="' + resourceUrl + '">Resource</a>, published by <a href="' + organisationUrl + '">' + organisation + '</a>, as part of the <a href="https://digital-land.github.io/dataset/brownfield-land/">brownfield land dataset</a>'
}

const brownfield = L.layerGroup()
const markers = [
  `)

    sets.forEach(set => {
      set.json.filter(row => {
        return (row.latitude && !isNaN(row.latitude)) && (row.longitude && !isNaN(row.longitude))
      }).filter(row => {
        return !row['end-date'].length
      }).map(row => {
        const size = isNaN(row.hectares) ? 100 : (Math.sqrt((row.hectares * 10000) / Math.PI))
        row.mapped = {
          location: [row.latitude, row.longitude],
          size: isNaN(size) ? 100 : size.toFixed(2)
        }
        return row
      }).sort(function compare (a, b) {
        const aLong = a.latitude
        const bLong = b.latitude
        if (aLong < bLong) return -1
        if (aLong > bLong) return 1
        return 0
      }).forEach(json => {
        // console.log(json)
        const locationString = JSON.stringify(json.mapped.location)
        stream.write(`L.circle(${locationString}, { color: "red", fillColor: "#f03", fillOpacity: 0.5, radius: ${json.mapped.size} }).bindPopup(popup('${json.resource}', '${json.organisation}', '${json['site-address'].replace(/'/g, '\\\'')}')),\n`)
      })
    })

    stream.write(`
]

markers.forEach(function(marker) {
  marker.addTo(brownfield)
})

const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  id: 'base',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

const map = L.map('map', { preferCanvas: true, renderer: L.canvas({ padding: 0.5 }), layers: [base, brownfield] }).setView([52.561928, -1.464854], 7)

const baseLayers = {
  OpenStreetMap: base
}

const overlay = {
  'Brownfield Land': brownfield
}

L.control.layers(baseLayers, overlay, { hideSingleBase: true, collapsed: false }).addTo(map)
`)
  })
})
