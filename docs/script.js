// Lazy loading popups...
function generatePopup (data) {
  var hidden = ['latitude', 'longitude', 'start-date', 'end-date', 'lad17nm', 'resource-date', 'entry-date', 'name']
  if (data) {
    var datastring = data['site-address'].length ? (data['site-address'] + '<hr>') : ''

    Object.keys(data).forEach(function (key) {
      var append = ''

      if (!hidden.includes(key)) {
        if (key === 'resource') {
          append = '<a href="https://digital-land.github.io/resource/' + data[key] + '">More info</a>'
        } else if (key === 'site-plan-url') {
          append = '<a href="' + data[key] + '">More info</a>'
        } else if (key === 'organisation') {
          append = '<a href="https://digital-land.github.io/organisation/' + data[key].replace(':', '/') + '">' + data.name + '</a>'
          delete data['name']
        } else {
          append = data[key]
        }
        datastring = datastring + '<strong>' + key + '</strong>: ' + append + '<br>'
      }
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
var boundaries = {
  'Local authorities': L.layerGroup(),
  Constituencies: L.layerGroup()
}

var brownfield = {
  Current: L.layerGroup(),
  Historical: L.layerGroup()
}

const base = L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  id: 'base',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

const map = L.map('map', {
  preferCanvas: true,
  renderer: L.canvas({ padding: 0.5 }),
  layers: [base, brownfield.Current, boundaries['Local authorities']]
}).setView([52.561928, -1.464854], 7)

const baseLayers = {
  OpenStreetMap: base
}

const overlay = {
  Boundaries: boundaries,
  'Brownfield Land': brownfield
}

L.control.groupedLayers(baseLayers, overlay, { hideSingleBase: true, collapsed: false, exclusiveGroups: ['Boundaries'] }).addTo(map)

var boundingBox = []

// Boundaries
var boundaryStyle = {
  fillOpacity: 0.1,
  weight: 2,
  color: 'gray',
  fillColor: 'gray'
}

$.ajax({
  url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/local-authorities/generalised.geojson'
}).done(function (data) {
  L.geoJSON(JSON.parse(data), {
    style: boundaryStyle
  }).addTo(boundaries['Local authorities'])

  // Brownfield
  Papa.parse('data/brownfield/index.csv', {
    download: true,
    header: true,
    step: function (row) {
      var data = row.data
      var size = isNaN(data.hectares) ? 100 : (Math.sqrt(data.hectares * 1000) / Math.PI)

      if (data.latitude && data.longitude) {
        boundingBox.push([data.latitude, data.longitude])
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
    },
    complete: function () {
      return map.fitBounds(boundingBox)
    }
  })
})

$.ajax({
  url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/parliamentary/generalised.geojson'
}).done(function (data) {
  L.geoJSON(JSON.parse(data), {
    style: boundaryStyle
  }).addTo(boundaries['Constituencies'])
})
