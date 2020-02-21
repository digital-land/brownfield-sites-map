// Lazy loading popups...
function generatePopup (data) {
  if (data) {
    var datastring = data['site-address'].length ? (data['site-address'] + '<hr>') : ''

    Object.keys(data).forEach(function (key) {
      var append = ''

      if (key === 'resource') {
        append = '<a href="https://digital-land.github.io/resource/' + data[key] + '">More info</a>'
      } else if (key === 'site-plan-url') {
        append = '<a href="' + data[key] + '">More info</a>'
      } else if (key === 'organisation') {
        append = '<a href="https://digital-land.github.io/organisation/' + data[key].replace(':', '/') + '">' + data.name + '</a>'
        delete data['name']
      } else if (key === 'name') {
        return
      } else {
        append = data[key]
      }

      datastring = datastring + '<strong>' + key + '</strong>: ' + append + '<br>'
    })

    return datastring
  } else {
    return 'Failed to find point.'
  }
}

function popup (event) {
  var popup = event.target.getPopup()
  var holding = popup['_content']
  popup.setContent('Loading...')
  popup.update()
  return Papa.parse('data/brownfield/' + holding.toLowerCase().replace(':', '-') + '.csv', {
    download: true,
    header: true,
    complete: function (results) {
      var point = results.data.find(function (row) {
        return (row['latitude'] === event.latlng.lat.toString()) && (row['longitude'] === event.latlng.lng.toString())
      })
      popup.setContent(generatePopup(point))
      popup.update()
    }
  })
}

// Initial map view
var brownfield = {
  Current: L.layerGroup(),
  Historical: L.layerGroup()
}

Papa.parse('data/brownfield/index.csv', {
  download: true,
  header: true,
  step: function (row) {
    var data = row.data
    var size = isNaN(data.hectares) ? 100 : (Math.sqrt(data.hectares * 1000) / Math.PI)

    if (data.latitude && data.longitude) {
      var marker = L.circle([data.latitude, data.longitude], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: size.toFixed(2) })
      marker.bindPopup(data.organisation)
      marker.on('click', popup)

      if (data['end-date'].length) {
        marker.addTo(brownfield.Historical)
      } else {
        marker.addTo(brownfield.Current)
      }
    }

    return row
  }
})

const base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  id: 'base',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

const map = L.map('map', { preferCanvas: true, renderer: L.canvas({ padding: 0.5 }), layers: [base, brownfield.Current] }).setView([52.561928, -1.464854], 7)

const baseLayers = {
  OpenStreetMap: base
}

const overlay = {
  'Brownfield Land': brownfield
}

L.control.groupedLayers(baseLayers, overlay, { hideSingleBase: true, collapsed: false }).addTo(map)
