<template>
    <div>
        <v-navigation-drawer :value="this.$store.state.appBarVisible" :clipped="clipped" fixed app>
            <v-list>
                <v-list-item v-for="(item, i) in trackObjects" :key="i" router exact>
                    <v-btn @click="displayObjectMarkers(item)">
                        <v-list-item-action>
                            <v-icon>{{ item.icon }}</v-icon>
                        </v-list-item-action>
                        <v-list-item-content>
                            <v-list-item-title v-text="item.name" />
                        </v-list-item-content>
                    </v-btn>
                </v-list-item>
            </v-list>
        </v-navigation-drawer>
        <div class="informationWindow" v-show="informationDrawer">
            <div class="informationWindowHeader">
                <h3 class="informationWindowHeaderTitle">Information window</h3>
                <div class="windowCloseButton">
                    <v-btn @click="hideInformationWindow" icon>
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </div>
            <div class="informationItemsBg">
                <div class="informationItem" v-for="(object) in trackObjects">
                    {{object.name}}
                </div>
            </div>
        </div>
        <div id='map' ref="mapRef"></div>
    </div>
</template> 

<script>

export default {
    layout: "mapLayout",
    name: "Map",
    computed: {
        geoJson() {
            return {
                type: "FeatureCollection",
                features: this.drawPoints.map((point) => {
                    return {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: point.coordinates
                        },
                        properties: point.properties
                    };
                })
            };
        }
    },
    methods: {
        hideScroll() {
            document.documentElement.style.overflow = "hidden";
        },
        addMarker(map, location, text) {
            const tt = window.tt;
            var popupOffset = 30;
            var element = document.createElement("div");
            element.className = "marker1";
            var marker = new tt.Marker({ element: element }).setLngLat(location).addTo(map);
            var popup = new tt.Popup({ offset: popupOffset }).setHTML(text);
            marker.setPopup(popup).togglePopup();
            this.markers.push(marker);
        },
        displayAllMarkers() {
            let locations = [];
            for (let i = 0; i < this.trackObjects.length; i++) {
                locations[i] = this.trackObjects[i].states[0].location;
            }
            ;
            this.setClustingData(locations);
            this.map.flyTo({
                "center": [0, 0],
                "zoom": 0.7
            });
        },
        setClustingData(locations) {
            this.drawPoints = [];
            for (let i = 0; i < locations.length; i++) {
                this.drawPoints.push({
                    coordinates: locations[i],
                    properties: {
                        id: i,
                        name: "Checkpoint A" + i
                    }
                });
            }
            ;
            this.map.getSource("point-source").setData(this.geoJson);
        },
        displayObjectMarkers(object) {
            this.displayInformationWindow();
            let locations = [];
            for (let i = 0; i < object.states.length; i++) {
                locations.push(object.states[i].location);
            }
            ;
            this.setClustingData(locations);
            this.map.flyTo({
                "center": object.states[0].location,
                "zoom": 9
            });
        },
        hideAllMarkers() {
            for (let i = 0; i < this.markers.length; i++) {
                this.markers[i].remove();
            }
        },
        displayInformationWindow() {
            this.informationDrawer = true;
        },
        hideInformationWindow() {
            this.displayAllMarkers();
            this.informationDrawer = false;
        },
        mapMoveTo(zoom, center) {
            this.map.setZoom(zoom);
            this.map.setCenter(center);
        },
        refreshMarkers() {
            Object.keys(this.markersOnTheMap).forEach((id) => {
                this.markersOnTheMap[id].remove();
                delete this.markersOnTheMap[id];
            });
            this.map.querySourceFeatures("point-source").forEach((feature) => {
                if (feature.properties && !feature.properties.cluster) {
                    var id = parseInt(feature.properties.id, 10);
                    if (!this.markersOnTheMap[id]) {
                        var element = document.createElement("div");
                        element.className = "marker1";
                        var newMarker = new tt.Marker({ element: element }).setLngLat(feature.geometry.coordinates);
                        newMarker.addTo(this.map);
                        newMarker.setPopup(new tt.Popup({ offset: 30 }).setText(feature.properties.name));
                        this.markersOnTheMap[id] = newMarker;
                    }
                }
            });
        },
        createSearchBox(type) {
            var searchBox = new tt.plugins.SearchBox(tt.services, {
                showSearchButton: false,
                searchOptions: {
                    key: 'AW5OTGOCL3pyo5GbAL8528R6PAv74ol0'
                },
                labels: {
                    placeholder: 'Query e.g. London'
                }
            });
            document.getElementById(type + 'SearchBox').appendChild(searchBox.getSearchBoxHTML());
            searchBox.on('tomtom.searchbox.resultscleared', onResultCleared.bind(undefined, type));
            searchBox.on('tomtom.searchbox.resultsfound', function (event) {
                handleEnterSubmit(event, onResultSelected.bind(this), errorHint, type);
            });
            searchBox.on('tomtom.searchbox.resultselected', function (event) {
                if (event.data && event.data.result) {
                    onResultSelected(event.data.result, type);
                }
            });
            return searchBox;
        },
        drawRoute(fitBounds) {
            if (!route.start || !route.finish) {
                return;
            }
            if (abortController) {
                abortController.abort();
            }
            abortController = new AbortController();
            loadingHint.setMessage('Loading...');
            var preparedSupportingPoints = supportingPoints.map(function (supportingPoint) {
                return supportingPoint.position.join();
            });
            var calculateRouteData = {
                key: '<your-tomtom-maps-API-key>',
                traffic: false,
                supportingPoints: preparedSupportingPoints.length > 1 ? preparedSupportingPoints : undefined,
                locations: route.start.join() + ':' + route.finish.join()
            };
            (function () {
                var signal = abortController.signal;
                tt.services.calculateRoute(calculateRouteData, { abortSignal: signal })
                    .then(function (response) {
                        clearMap();
                        var geojson = response.toGeoJson();
                        map.addLayer({
                            'id': 'route',
                            'type': 'line',
                            'source': {
                                'type': 'geojson',
                                'data': geojson
                            },
                            'paint': {
                                'line-color': '#4a90e2',
                                'line-width': 6
                            }
                        }, findFirstBuildingLayerId());
                        addRouteMarkers(geojson.features[0]);
                        if (fitBounds) {
                            var bounds = new tt.LngLatBounds();
                            geojson.features[0].geometry.coordinates.forEach(function (point) {
                                bounds.extend(tt.LngLat.convert(point));
                            });
                            map.fitBounds(bounds, { duration: 0, padding: 50 });
                        }
                        loadingHint.hide();
                    }).catch(function () {
                        if (signal.aborted === true) {
                            return;
                        }
                        clearMap();
                        errorHint.setMessage('There was a problem calculating the route');
                        loadingHint.hide();
                    });
            })();
        }
    },
    beforeMount() {
        for (let i = 0; i < this.trackObjects.length; i++) {
            this.drawPoints.push({
                coordinates: this.trackObjects[i].states[0].location,
                properties: {
                    id: i,
                    name: "Checkpoint A" + i
                }
            });
        }
    },
    mounted() {
        this.hideScroll();
        const tt = window.tt;
        this.map = tt.map({
            key: "AW5OTGOCL3pyo5GbAL8528R6PAv74ol0",
            container: this.$refs.mapRef,
            style: "tomtom://vector/1/basic-main",
            language: "ru",
        });
        this.map.addControl(new tt.FullscreenControl());
        this.map.addControl(new tt.NavigationControl());
        this.map.on("load", () => {
            this.map.addSource("point-source", {
                type: "geojson",
                data: this.geoJson,
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50
            });
            this.map.addLayer({
                id: "clusters",
                type: "circle",
                source: "point-source",
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#EC619F",
                        4,
                        "#008D8D",
                        7,
                        "#004B7F"
                    ],
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        15,
                        4,
                        20,
                        7,
                        25
                    ],
                    "circle-stroke-width": 1,
                    "circle-stroke-color": "white",
                    "circle-stroke-opacity": 1
                }
            });
            this.map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: "point-source",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-size": 16
                },
                paint: {
                    "text-color": "white"
                }
            });
            this.map.on("data", (e) => {
                if (e.sourceId !== "point-source" || !this.map.getSource("point-source").loaded()) {
                    return;
                }
                this.refreshMarkers();
                if (!this.eventListenersAdded) {
                    this.map.on("move", this.refreshMarkers);
                    this.map.on("moveend", this.refreshMarkers);
                    this.eventListenersAdded = true;
                }
            });
            let cacheMap = this.map;
            this.map.on("click", "clusters", (e) => {
                var features = this.map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
                console.log(this.geoJson.features);
                var features = this.geoJson.features;
                var clusterId = features[0].properties.cluster_id;
                cacheMap.getSource("point-source").getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err) {
                        return;
                    }
                    cacheMap.flyTo({
                        center: features[0].geometry.coordinates,
                        zoom: 5
                    });
                });
            });
            for (let i = 0; i < this.trackObjects.length; i++) {
                this.drawPoints.push({
                    coordinates: this.trackObjects[i].states[0].location,
                    properties: {
                        id: i,
                        name: "Checkpoint A" + i
                    }
                });
            }
            var startSearchBox = this.createSearchBox('start');
            var finishSearchBox = this.createSearchBox('finish');
            map.on('click', onMapClick);
            startSearchBox.getSearchBoxHTML().querySelector('input.tt-search-box-input').value = 'Coimbra';
            finishSearchBox.getSearchBoxHTML().querySelector('input.tt-search-box-input').value = 'Madrid';
            this.drawRoute(true);
        });
    },
    data: () => ({
        route : {
            start: [-8.4292, 40.21149],
            finish: [-3.70034, 40.41669]
        },
        modalSettingsVisible: false,
        appBarVisible: true,
        map: null,
        informationDrawer: false,
        clipped: true,
        markers: [],
        informationWindowHeight: 30,
        mapHeight: "100vh - 60px",
        markersOnTheMap: {},
        eventListenersAdded: false,
        drawPoints: [],
        trackObjects: [
            {
                icon: "mdi-truck",
                name: "Track",
                states: [
                    {
                        location: [-121.91595, 33.36729],
                        temperatur: 0
                    },
                    {
                        location: [-121.91595, 32.36729],
                        temperatur: 0
                    },
                    {
                        location: [-121.91595, 31.36729],
                        temperatur: 0
                    },
                ]
            },
            {
                icon: "mdi-truck",
                name: "Track1",
                states: [
                    {
                        location: [-111.91595, 32.36729],
                        temperatur: 0
                    },
                    {
                        location: [-111.91595, 31.36729],
                        temperatur: 0
                    },
                ]
            },
            {
                icon: "mdi-truck",
                name: "Track2",
                states: [
                    {
                        location: [-111.91595, 45.36729],
                        temperatur: 0
                    },
                    {
                        location: [-109.91595, 42.36729],
                        temperatur: 0
                    },
                ]
            },
            {
                icon: "mdi-car-side",
                name: "Car",
                states: [
                    {
                        location: [-121.91595, 41.36729],
                        temperatur: 0
                    },
                    {
                        location: [-125.91595, 41.36729],
                        temperatur: 0
                    },
                ]
            },
        ],
        miniVariant: false,
        right: true,
        rightDrawer: false,
        title: "CDO-LOGISTIC",
    }),
}

// function reverseGeocoding(marker, popup) {
//     const tt = window.tt;
//     tt.services.reverseGeocode({
//         key: 'iTF86GRA2V5iGjM6LMMV54lrK8v6zC1w',
//         position: marker.getLngLat()
//     }).go().then( function( result ){
//         console.log(result.addresses[0].address.freeformAddress);
//         popup.setHTML(result.addresses[0].address.freeformAddress);
//     })
// }

</script>

<style>
#map {
    height: calc(100vh - 60px);
    width: calc(100vw - 256px);
}

.popup {
    color: red;
}

.marker1 {
    background-image: url('https://i.postimg.cc/zf4vhRTz/1.png');
    background-size: cover;
    width: 25px;
    height: 30px;
}

.informationWindow {
    z-index: 10;
    background-color: rgb(46, 46, 46);
    width: calc(400px);
    height: calc(100vh - 60px);
    position: absolute;
    top: 0 !important;
    right: 0;
    /* left: 0; */
    /* opacity: 90%; */
}

.windowCloseButton {
    position: absolute;
    top: 0px;
    right: 0px;
}

.windowCloseButton:hover {
    position: absolute;
    border-radius: 45px;
    background-color: rgba(255, 0, 0, 0.247);
    top: 0px;
    right: 0px;
}

.informationWindowHeader {
    width: auto;
    height: 40px;
    background-color: hwb(0 11% 89%);
}

.informationWindowHeaderTitle {
    text-align: center;
    padding-top: 6px;
}


.informationItemsBg {
    height: calc(100vh - 100px);
    overflow-y: scroll;
}

.informationItem {
    height: 100px;
    background-color: rgb(0, 0, 0);
    border-radius: 10px;
    margin: 10px;
}
</style>