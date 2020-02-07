const brownfield = L.layerGroup()

function popup (data) {
  var datastring = data['site-address'].length ? (data['site-address'] + '<hr>') : ''

  Object.keys(data).forEach(function (key) {
    var append = ''

    if (key === 'resource') {
      append = '<a href="https://digital-land.github.io/resource/' + data[key] + '">More info</a>'
    } else if (key === 'site-plan-url') {
      append = '<a href="' + data[key] + '">More info</a>'
    } else if (key === 'organisation') {
      append = '<a href="https://digital-land.github.io/organisation/' + data[key] + '">' + data.name + '</a>'
      delete data['name']
    } else if (key === 'name') {
      return
    } else {
      append = data[key]
    }

    datastring = datastring + '<strong>' + key + '</strong>: ' + append + '<br>'
  })

  return datastring
}

Papa.parse('https://digital-land.github.io/map/data/brownfield.csv', {
  download: true,
  header: true,
  step: function (row) {
    var data = row.data
    var size = isNaN(data.hectares) ? 100 : (Math.sqrt((data.hectares * 10000) / Math.PI))

    if (data.latitude && data.longitude) {
      L.circle([data.latitude, data.longitude], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: size.toFixed(2) }).addTo(brownfield).bindPopup(popup(data))
    }
    return row
  }
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
