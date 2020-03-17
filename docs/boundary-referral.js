// Initial map view
var map = L.map('map', {
  preferCanvas: true
}).setView([52.3555, 1.1743], 7)

// Tile layers
L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
  id: 'base',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

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
      })

      brownfieldMarkers.addLayer(brownfieldOnMap)
      map.addLayer(brownfieldMarkers)
    }

    //     mouseover: function () {
    //       layer.openPopup()
    //       this.setStyle({
    //         fillColor: 'black'
    //       })
    //     },
    //     mouseout: function () {
    //       layer.closePopup()
    //       if (!html) {
    //         this.setStyle({
    //           fillColor: 'red'
    //         })
    //       } else {
    //         this.setStyle({
    //           fillColor: 'white'
    //         })
    //       }
    //     },
    //     click: function () {
    //       return window.location.assign('https://digital-land.github.io/resource/' + html.data.resource + '/#map')
    //     }

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

    // var brownfieldMarkers = L.markerClusterGroup({ chunkedLoading: true })
    // var brownfieldOnMap = L.geoJSON(brownfieldGeoJson)
    // brownfieldMarkers.addLayer(brownfieldOnMap)
    // map.addLayer(brownfieldMarkers)
    // map.fitBounds(markers.getBounds())

    // return layer.bindTooltip(count, {
    //   direction: 'top',
    //   permanent: true
    // }).openTooltip()
  }
}).addTo(map)

// Brownfield points
// var brownfieldGeoJson = {
//   type: 'FeatureCollection',
//   features: brownfield.map(function (point) {
//     return {
//       type: 'Feature',
//       geometry: {
//         type: 'Point',
//         coordinates: [point.longitude, point.latitude]
//       },
//       properties: point
//     }
//   })
// }

// var brownfieldMarkers = L.markerClusterGroup({ chunkedLoading: true })
// var brownfieldOnMap = L.geoJSON(brownfieldGeoJson)
// brownfieldMarkers.addLayer(brownfieldOnMap)
// map.addLayer(brownfieldMarkers)
// map.fitBounds(markers.getBounds())

// console.log(brownfieldGeoJson)

// L.geoJSON(brownfieldGeoJson).addTo(map)

// // Initial map view
// var boundaries = {
//   'Local authorities': L.layerGroup()
// }

// const base = L.tileLayer('https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
//   id: 'base',
//   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// })

// const map = L.map('map', {
//   preferCanvas: true,
//   renderer: L.canvas({ padding: 0.5 }),
//   layers: [base, boundaries['Local authorities']]
// }).setView([52.561928, -1.464854], 7)

// const baseLayers = {
//   OpenStreetMap: base
// }

// const overlay = {
//   Boundaries: boundaries
// }

// L.control.groupedLayers(baseLayers, overlay, { hideSingleBase: true, collapsed: false, exclusiveGroups: ['Boundaries'] }).addTo(map)

// var boundaryStyle = {
//   fillOpacity: 0.5,
//   weight: 2,
//   color: 'gray',
//   fillColor: 'white'
// }

// var localAuthorityDistricts = []
// Papa.parse('data/organisation-boundary-referral.csv', {
//   download: true,
//   header: true,
//   step: function (row) {
//     return localAuthorityDistricts.push(row)
//   },
//   complete: function () {
//     $.ajax({
//       url: 'https://raw.githubusercontent.com/digital-land/boundaries-collection/master/collection/local-authorities/generalised.geojson'
//     }).done(function (data) {
//       var parsed = JSON.parse(data)

//       var englandOnly = parsed.features.filter(function (item) {
//         return item.properties.lad19cd.startsWith('E')
//       })

//       parsed.features = englandOnly

//       L.geoJSON(parsed, {
//         style: boundaryStyle,
//         onEachFeature: boundaryLabel
//       }).addTo(boundaries['Local authorities'])
//     })
//   }
// })

// function boundaryLabel (feature, layer) {
//   var html = localAuthorityDistricts.find(function (item) {
//     if (item.data['statistical-geography'] && item.data['statistical-geography'].length) {
//       return item.data['statistical-geography'].toString().toLowerCase() === feature.properties.lad19cd.toString().toLowerCase()
//     }
//   })

//   if (html) {
//     layer.bindPopup(html.data.name, { closeButton: false, offset: L.point(0, -20) })
//   } else {
//     layer.setStyle({
//       fillColor: 'red'
//     })
//   }

//   layer.on({
//     mouseover: function () {
//       layer.openPopup()
//       this.setStyle({
//         fillColor: 'black'
//       })
//     },
//     mouseout: function () {
//       layer.closePopup()
//       if (!html) {
//         this.setStyle({
//           fillColor: 'red'
//         })
//       } else {
//         this.setStyle({
//           fillColor: 'white'
//         })
//       }
//     },
//     click: function () {
//       return window.location.assign('https://digital-land.github.io/resource/' + html.data.resource + '/#map')
//     }
//   })

//   return L.marker(layer.getBounds().getCenter(), {
//     icon: L.divIcon({
//       className: 'rounded',
//       html: html ? html.data['point-count'].toString() : '0',
//       iconSize: [0, 0]
//     })
//   }).addTo(map)
// }
