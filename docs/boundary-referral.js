// Initial map view
var boundaries = {
  'Local authorities': L.layerGroup()
}

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

var boundaryStyle = {
  fillOpacity: 0.5,
  weight: 2,
  color: 'gray',
  fillColor: 'white'
}

var localAuthorityDistricts = []
Papa.parse('data/organisation-boundary-referral.csv', {
  download: true,
  header: true,
  step: function (row) {
    return localAuthorityDistricts.push(row)
  },
  complete: function () {
    $.ajax({
      url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/local-authorities/generalised.geojson'
    }).done(function (data) {
      var parsed = JSON.parse(data)

      var englandOnly = parsed.features.filter(function (item) {
        return item.properties.lad19cd.startsWith('E')
      })

      parsed.features = englandOnly

      L.geoJSON(parsed, {
        style: boundaryStyle,
        onEachFeature: boundaryLabel
      }).addTo(boundaries['Local authorities'])
    })
  }
})

function boundaryLabel (feature, layer) {
  var html = localAuthorityDistricts.find(function (item) {
    if (item.data['statistical-geography'] && item.data['statistical-geography'].length) {
      return item.data['statistical-geography'].toString().toLowerCase() === feature.properties.lad19cd.toString().toLowerCase()
    }
  })

  if (html) {
    layer.bindPopup(html.data.name, { closeButton: false, offset: L.point(0, -20) })
  } else {
    layer.setStyle({
      fillColor: 'red'
    })
  }

  layer.on({
    mouseover: function () {
      layer.openPopup()
      this.setStyle({
        fillColor: 'black'
      })
    },
    mouseout: function () {
      layer.closePopup()
      if (!html) {
        this.setStyle({
          fillColor: 'red'
        })
      } else {
        this.setStyle({
          fillColor: 'white'
        })
      }
    },
    click: function () {
      return window.location.assign('https://digital-land.github.io/resource/' + html.data.resource + '/#map')
    }
  })

  return L.marker(layer.getBounds().getCenter(), {
    icon: L.divIcon({
      className: 'rounded',
      html: html ? html.data['point-count'].toString() : '0',
      iconSize: [0, 0]
    })
  }).addTo(map)
}
