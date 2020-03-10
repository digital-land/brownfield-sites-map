// Initial map view
var boundaries = {
  'Local authorities': L.layerGroup()
  // Constituencies: L.layerGroup()
}

// var brownfield = {
//   Current: L.layerGroup(),
//   Historical: L.layerGroup()
// }

const base = L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  id: 'base',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

const map = L.map('map', {
  preferCanvas: true,
  renderer: L.canvas({ padding: 0.5 }),
  layers: [base, boundaries['Local authorities']]
}).setView([52.561928, -1.464854], 7)

const baseLayers = {
  OpenStreetMap: base
}

const overlay = {
  Boundaries: boundaries
}

L.control.groupedLayers(baseLayers, overlay, { hideSingleBase: true, collapsed: false, exclusiveGroups: ['Boundaries'] }).addTo(map)

// var boundingBox = []

// // Boundaries
var boundaryStyle = {
  fillOpacity: 0.5,
  weight: 2,
  color: 'gray',
  fillColor: 'white'
}

// $.ajax({
//   url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/local-authorities/generalised.geojson'
// }).done(function (data) {
//   L.geoJSON(JSON.parse(data), {
//     style: boundaryStyle
//   }).addTo(boundaries['Local authorities'])

//   // Brownfield
//   Papa.parse('data/brownfield/index.csv', {
//     download: true,
//     header: true,
//     step: function (row) {
//       var data = row.data
//       var size = isNaN(data.hectares) ? 100 : (Math.sqrt(data.hectares * 1000) / Math.PI)

//       if (data.latitude && data.longitude) {
//         boundingBox.push([data.latitude, data.longitude])
//         var marker = L.circle([data.latitude, data.longitude], { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: size.toFixed(2) })
//         marker.bindPopup(data.organisation)
//         marker.on('click', popup)

//         if (data['end-date'].length) {
//           marker.addTo(brownfield.Historical)
//         } else {
//           marker.addTo(brownfield.Current)
//         }
//       }

//       return row
//     },
//     complete: function () {
//       return map.fitBounds(boundingBox)
//     }
//   })
// })

// var localAuthorityDistricts = {}

// Papa.parse('data/brownfield/index.csv', {
//   download: true,
//   header: true,
//   step: function (row) {
//     // if (!Object.keys(localAuthorityDistricts).includes(row.data.organisation)) {
//     //   localAuthorityDistricts[row.data.organisation] = []
//     // }
//     // localAuthorityDistricts[row.data.organisation].push(0)
//   },
//   complete: function () {
//     console.log(localAuthorityDistricts)
//   }
// })

var localAuthorityDistricts = []
Papa.parse('data/organisation.csv', {
  download: true,
  header: true,
  step: function (row) {
    return localAuthorityDistricts.push(row)
  },
  complete: function () {
    $.ajax({
      url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/local-authorities/generalised.geojson'
    }).done(function (data) {
      L.geoJSON(JSON.parse(data), {
        style: boundaryStyle,
        onEachFeature: boundaryLabel
      }).addTo(boundaries['Local authorities'])
    })

    // console.log(localAuthorityDistricts)
  }
})

function boundaryLabel (feature, layer) {
  var html = localAuthorityDistricts.find(function (item) {
    if (item.data['statistical-geography'] && item.data['statistical-geography'].length) {
      return item.data['statistical-geography'].toString().toLowerCase() === feature.properties.lad19cd.toString().toLowerCase()
    }
  })

  return L.marker(layer.getBounds().getCenter(), {
    icon: L.divIcon({
      html: html ? html.data['point-count'].toString() : '0',
      iconSize: [0, 0]
    })
  }).addTo(map)
}

// $.ajax({
//   url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/parliamentary/generalised.geojson'
// }).done(function (data) {
//   L.geoJSON(JSON.parse(data), {
//     style: boundaryStyle
//   }).addTo(boundaries['Constituencies'])
// })
