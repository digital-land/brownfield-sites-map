// Initial map view
var map = L.map('map', {
  preferCanvas: true,
  fullscreenControl: true
}).setView([52.3555, 1.1743], 7)

// Tile layers
L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  id: 'base',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

// Brownfield Features
var brownfieldFeatures = brownfield.map(function (point) {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [point.longitude, point.latitude]
    },
    properties: point
  }
})

// Local authority boundaries (England only)
geoJson = geoJson.features.filter(function (item) {
  return item.properties.lad19cd.startsWith('E')
}).map(function (item) {
  item.properties.organisation = organisations.find(function (organisation) {
    if (organisation['statistical-geography'] && organisation['statistical-geography'].length) {
      return organisation['statistical-geography'].toString().toLowerCase() === item.properties.lad19cd.toString().toLowerCase()
    }
  })

  return item
})

L.geoJSON(geoJson, {
  style: {
    fillOpacity: 0,
    weight: 2,
    color: 'gray'
  },
  onEachFeature: function (feature, layer) {
    // var count = feature.properties.organisation ? feature.properties.organisation['point-count'].toString() : '0'

    if (!feature.properties.organisation) {
      layer.setStyle({
        fillColor: 'red',
        fillOpacity: 0.25
      })
    } else {
      var thisOrganisationsFeatures = brownfieldFeatures.filter(function (brownfieldFeature) {
        if (brownfieldFeature.properties.organisation.toLowerCase() === feature.properties.organisation.organisation.toLowerCase()) {
          return true
        }
        return false
      })

      var brownfieldMarkers = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: false,
        spiderfyOnMaxZoom: false,
        removeOutsideVisibleBounds: true,
        animate: false,
        disableClusteringAtZoom: 11,
        maxClusterRadius: 600,
        singleMarkerMode: false
      })
      var brownfieldOnMap = L.geoJSON({
        type: 'FeatureCollection',
        features: thisOrganisationsFeatures
      }, {
        pointToLayer: function (feature, latlng) {
          var size = isNaN(feature.properties.hectares) ? 100 : (Math.sqrt((feature.properties.hectares * 10000) / Math.PI))
          return L.circle(latlng, { color: 'red', fillColor: '#f03', fillOpacity: 0.5, radius: size.toFixed(2) })
        },
        onEachFeature: function (feature, layer) {
          layer.on({
            click: function () {
              console.log(feature, layer)
            }
          })
        }
      })

      brownfieldMarkers.addLayer(brownfieldOnMap)
      map.addLayer(brownfieldMarkers)
    }

    layer.on({
      mouseover: function () {
        this.setStyle({
          fillColor: 'black',
          fillOpacity: 0.25
        })
      },
      mouseout: function () {
        this.setStyle({
          fillColor: 'white',
          fillOpacity: 0
        })
      },
      click: function () {
        return map.fitBounds(layer.getBounds())
      }
    })
  }
}).addTo(map)
