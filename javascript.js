// Mapbox basemap
var map = L.map('map').setView([40.53131646519857, -99.29443181421964], 5);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoidHJpZ2VvIiwiYSI6ImNsZHZ5YW9tYjAyODAzdXM4bHlwbjhnNm4ifQ.kHTDG7XT7noaK7zzYwHYbA'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var tableData = L.layerGroup().addTo(map);
var url ="https://gisdb.xyz/sql?q=" //was previously "https://178.128.228.240:4000/sql?q=";
// change the Query below by replacing lab_7_name with your table name
var sqlQuery = "SELECT * FROM skier_info";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + "User Name: " + " " + feature.properties.name + "</b><br>" +
        "Feature Description: " + feature.properties.description + "<br>" +
        "User Age: " + feature.properties.age + "<br>" +
        "User Gender: " + feature.properties.gender + "<br>" +
        "User Traveled From: " + feature.properties.traveled_from

    );
}

fetch(url + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(tableData);
    });

new L.Control.Draw({
    draw : {
        polygon : true,
        polyline : true,
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

//Form popup
function createFormPopup() {
    var popupContent = 
        '<form>' +
        '<b>User\'s Name:<br><input type="text" id="input_name"></b><br>' +
        'Feature Description:<br><input type="text" id="input_desc"><br>' +
        'User Age:<br><input type="text"id="input_age"><br>' +
        'User Gender:<br><input type="text" id="input_gender"><br>' +
        'User Traveled from:<br><input type="text" id="input_from"><br>' +
        
        '<input type="button" value="Submit" id="submit">' +
        '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    createFormPopup();
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredage = document.getElementById("input_age").value;
        var enteredgender = document.getElementById("input_gender").value;
        var enteredfrom = document.getElementById("input_from").value;
        var enteredUsername = document.getElementById("input_name").value;
        var enteredDescription = document.getElementById("input_desc").value;

           	// For each drawn layer
    drawnItems.eachLayer(function(layer) {
           
        // Create SQL expression to insert layer
        var drawing = JSON.stringify(layer.toGeoJSON().geometry);
        var sql =
            "INSERT INTO skier_info (geom, description, age, gender, traveled_from, name) " +
            "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
            drawing + "'), 4326), '" +
            enteredDescription + "', '" +
            enteredage + "', '" +
            enteredgender + "', '" +
            enteredfrom + "', '" +
            enteredUsername + "');";
        console.log(sql);

        // Send the data
        fetch(url + encodeURI(sql))
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log("Data saved:", data);
        })
        .catch(function(error) {
            console.log("Problem saving the data:", error);
        });

    // Transfer submitted drawing to the tableData layer 
    //so it persists on the map without you having to refresh the page
    var newData = layer.toGeoJSON();
    newData.properties.description = enteredDescription;
    newData.properties.name = enteredUsername;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(tableData);

});

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});


// Text box overlay
L.Control.textbox = L.Control.extend({
    onAdd: function(map) {
        
    var text = L.DomUtil.create('div', "textBoxStyle");
    text.id = "info_text";
    text.innerHTML = "<strong>Instructions</strong> <br> Draw a polygon, polyline, or marker. Then, click on the drawing to enter information about the ski resort you're at."
    return text;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});
L.control.textbox = function(opts) { return new L.Control.textbox(opts);}
L.control.textbox({ position: 'bottomleft'}).addTo(map);