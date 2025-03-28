let id, tag, city, user, kitCounter, currentData, currentTitle;
let socketIndex, socketDetail;
let isFirstLoad = true;

window.onload = function () {
  dashboardInit();
};

// dashboard initialization
function dashboardInit() {
  loading(true);
  urlGetParameters();
  globalInterface();

  if (id) {
    getKit(id);
  } else if (tag) {
    getKits("tag", tag);
  } else if (city) {
    getKits("city", city);
  } else if (user) {
    getKits("user", user);
  } else {
    getKits();
  }
}

// get parameters from url
function urlGetParameters() {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (params.has("id") || params.has("tag") || params.has("city") || params.has("user")) {
    getFromUrl();
  } else {
    if ((settings.filter.type) && (settings.filter.value)) {
      settings.filter.type === "tag" ? (tag = settings.filter.value) : (tag = null);
      settings.filter.type === "city" ? (city = settings.filter.value) : (city = null);
      settings.filter.type === "user" ? (user = settings.filter.value) : (user = null);
      urlAddParameters(settings.filter.type, settings.filter.value);
    } else {
      getFromUrl();
    }
  }

  function getFromUrl() {
    params.has("id") === true ? (id = params.get("id")) : (id = null);
    params.has("tag") === true ? (tag = params.get("tag")) : (tag = null);
    params.has("city") === true ? (city = params.get("city")) : (city = null);
    params.has("user") === true ? (user = params.get("user")) : (user = null);
  }

}

// add parameters to url
function urlAddParameters(parameter, value) {
  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Purge current parameter
  params.forEach(function (value, key) {
    params.delete(key);
  });

  // Add new parameter
  if (parameter != null) {
    params.set(parameter, value);
  }

  let new_url = url.toString();
  history.pushState({}, null, new_url);
}

// dashboard update
function dashboardUpdate(filterType = null, filterValue = null) {
  urlAddParameters(filterType, filterValue);
  dashboardInit();
}

// get kit from API
function getKit(id) {
  const kitUrl = `https://api.smartcitizen.me/v0/devices/${id}`;
  https: fetch(kitUrl)
  .then((res) => {
    return res.json();
  })
  .then((kit) => {
    displayKit(kit);
  });
}

// get kits from API
function getKits(filterType = null, filterValue = null) {
  const kitsUrl = "https://api.smartcitizen.me/v0/devices/world_map";
  https: fetch(kitsUrl)
  .then((res) => {
    return res.json();
  })
  .then((kits) => {
    displayKits(kits, filterType, filterValue);
  });
}

// display kits (index)
function displayKits(kits, filterType = null, filterValue = null) {
  var indexDone = false;
  document.getElementById("main").innerHTML = "";
  document.body.removeAttribute('id');
  document.body.removeAttribute('isGlobal');
  document.body.classList.add('index');

  if (filterType == null) {
    document.body.classList.remove("filtered")
  } else {
    document.body.classList.add("filtered")
  }

  kitsCounter = 0;
  let { activeCounter, kitsFiltered } = filterKits();
  let devices = document.createElement('div');
  // devices.id = 'devices';
  devices.classList.add('devices');
  devices.classList.add('list');

  document.getElementById("main").appendChild(devices);

  if (settings.indexInt) {
    indexInterface();
  }
  loading(false);

  document.getElementById('header').classList.remove('wavy-background');
  document.getElementById('header').classList.remove('large-top-header');
  document.getElementById('header').classList.add('flat-background');

  document.getElementById('main').classList.remove('flat-background');
  document.getElementById('main').classList.add('wavy-background');

  for (let kit of kitsFiltered) {
    devices.appendChild(elemHtml(kit));
    kitsCounter++;
  }

  searchBar();
  var oh = document.getElementById('header').offsetHeight;
  document.getElementById('main').style.paddingTop = oh;
  extraArea();
  // webSocketIndexUpdate();


  if (filterType == null) {
    document.getElementById('resetButton').classList.add('button-hide');
  } else{
    document.getElementById('resetButton').classList.remove('button-hide');
  }

  function indexInterface() {
    let header = document.getElementById('header');
    // header
    currentTitle = ""
    if (settings.showFilterHeader) {
      if (filterType !== null) {
        if (filterType === 'tag') {
          currentTitle += '#' + filterValue
        } else if (filterType === 'city') {
          currentTitle += 'Kits in ' + filterValue
        } else if (filterType === 'user') {
          currentTitle += 'Kits by ' + filterValue
        }
      } else {
        currentTitle = settings.header
      }

      header.insertAdjacentHTML('beforeend', '<div id="title">' + currentTitle + '</div>');
    }

    // subtitle
    header.insertAdjacentHTML('beforeend', '<div id="subtitle">' + activeCounter + ' Kits connected from a total of ' + kitsFiltered.length +
      ' (' + Math.round(activeCounter/kitsFiltered.length*100) + ' %)' + '</div>');

    currentData = kitsFiltered;
  }

  function filterKits() {

    let kitsFiltered = [];
    let activeCounter = 0;
    let dateNow = new Date();
    for (let kit of kits) {
      // Add 'is active' value
      if (settings.activeByMinutes){
        let dateDifferenceMinutes = Math.abs(Math.round((dateNow.getTime() - new Date(kit.last_reading_at).getTime()) / 1000 / 60));
        // Check if it's still active
        if (dateDifferenceMinutes < settings.activeByMinutes) {
          kit.isActive = true;
        } else {
          kit.isActive = false;
        }
      } else {
        if (kit.system_tags.includes("online")) { kit.isActive = true}
        else if (kit.system_tags.includes("offline")) { kit.isActive = false}
      }

      if (filterType != null) {
        if (filterType === "tag" && kit.user_tags.includes(filterValue)) {
          kitsFiltered.push(kit);
          if (kit.isActive) { activeCounter++; }
        } else if (filterType === "city" && kit.city === filterValue) {
          kitsFiltered.push(kit);
          if (kit.isActive) { activeCounter++; }
        } else if (filterType === "user" && kit.owner_username === filterValue) {
          kitsFiltered.push(kit);
          if (kit.isActive) { activeCounter++; }
        }
      } else {
        kitsFiltered.push(kit);
        if (kit.isActive) { activeCounter++; }
      }
    }

    // Sort kits by date
    kitsFiltered.sort(function (a, b) {
      return new Date(b.last_reading_at) - new Date(a.last_reading_at);
    });

    return { activeCounter, kitsFiltered }
  }

  function elemHtml(kit) {
    let elem = document.createElement("div");
    elem.classList.add("device");
    elem.id = kit.id;
    kit.isActive ? elem.classList.add("active") : elem.classList.add("inactive");

    elem.innerHTML += `<div class="name" onclick="dashboardUpdate('id','` + kit.id + `')">`
    + kit.name
    // + '<br><span style="font-weight: 100;">' + ' by ' + kit.owner_username + '</span>'
    + '</div>'

    for (let i = 0; i < settings.indexView.length; i++) {
      switch (settings.indexView[i]) {
        case "id":
          elem.innerHTML += `<div class="id" onclick="dashboardUpdate('id','` + kit.id + `')">` + kit.id + '</div>';
          break;
        case "city":
          elem.innerHTML += `<div class="city" onclick="dashboardUpdate('city','` + kit.location.city + `')">` + kit.location.city + '</div>';
          break;
        case "user":
          elem.innerHTML += `<div class="user" onclick="dashboardUpdate('user','` + kit.owner_username +
        `')">` + kit.owner_username + '</div>';
          break;
        case "tags":
          if (kit.user_tags.length > 0) {
            elemTags = '<div class="tags">';
            for (let i = 0; i < kit.user_tags.length; i++) {
              elemTags += `<div class="tag" onclick="dashboardUpdate('tag','` + kit.user_tags[i] + `')">`
              + kit.user_tags[i] + '</div>';
            }
            elem.innerHTML += elemTags;
          }
          break;
        default:
          console.log("This element does not exist");
        break;
      }
    }
    elem.innerHTML += '<div class="lastUpdate">' + 'Last Update: ' + new Date(kit.last_reading_at).toLocaleString("en-GB") + '</div>';
    // if ((kitsCounter <= 20) && (settings.primarySensor)) {
    //   primarySensor(kit);
    // }
    return elem;
  }

  function searchBar() {
    if (settings.searchBar) {
      // Display
      if (!document.getElementById("searchInput")) {
          document.getElementById("header").insertAdjacentHTML('afterbegin', "<div id='headerBar'></div>")
          if (settings.logo) {
            document.getElementById("headerBar").insertAdjacentHTML('afterbegin', "<div id='logo'><img width=70px src='assets/images/"+settings.logo+"'></div>");
          }
          document.getElementById("headerBar").insertAdjacentHTML('beforeend', "<div id='searchBar'></div>");

          let searchInput = document.createElement("input");
          searchInput.type = "text";
          searchInput.placeholder = "FILTER KITS 🔍";
          searchInput.classList.add("fuzzy-search");
          searchInput.id = "searchInput";
          document.getElementById("searchBar").insertAdjacentElement('afterbegin', searchInput);

          let resetButton = document.createElement("button");
          resetButton.id = "resetButton";
          resetButton.innerHTML = 'Reset';
          resetButton.onclick = function () {
            resetFilters();
          };
          document.getElementById("searchBar").insertAdjacentElement('beforeend', resetButton);

          // Search init
          let mainList = new List('main', {
            valueNames: ['name', 'city', 'tag', 'id', 'lastUpdate']
          });

          document.getElementById("logo").onclick = function () {
            resetFilters();
          };

          document.getElementById("searchInput").onkeyup = function() {
            // console.log('searching...');
            setTimeout(() => {  var searchString = this.value;
                                mainList.search(searchString);}, 500);
          };
      }
    }
  }
}

function extraArea() {
  if (settings.extraArea) {
    // Display
    if (!document.getElementById("extras")) {

        let extrasButton = document.createElement("button");
        extrasButton.id = "extras";
        extrasButton.innerHTML = 'GET THIS DATA';
        extrasButton.onclick = function () {
          extrasPopup();
        };
        document.getElementById("searchBar").insertAdjacentElement('afterbegin', extrasButton);
    }
  }
}

// display kit (detail)
function displayKit(kit) {
  document.getElementById("main").innerHTML = "";
  document.body.classList.remove('index');

  let data = new Object();
  let plots = new Object();

  sideBar(kit);
  detailInterface();

  let d = new Date();
  let rightNow = d.toISOString().slice(0, 19)+'Z';

  let l = new Date(kit.last_reading_at).getTime();

  if ((d-l)/1000/3600/24 < settings.defaultDays) {
    // 7 days ago
    let then = new Date(d.setDate(d.getDate()-settings.defaultDays)).toISOString().slice(0, 10);
    settings.dates [0] = then;
    settings.dates [1] = rightNow;
  } else {
    // 7 days from last reading
    let then = new Date(l-settings.defaultDays*24*3600*1000).toISOString().slice(0, 10);
    settings.dates [0] = then;
    settings.dates [1] = kit.last_reading_at;
  }

  kitData(kit);

  document.getElementById('header').classList.remove('flat-background');
  document.getElementById('header').classList.add('wavy-background');
  document.getElementById('header').classList.add('large-top-header');

  document.getElementById('main').classList.remove('wavy-background');
  document.getElementById('main').classList.add('flat-background');

  loading(false);
  webSocketDetailUpdate();

  function sideBar(kit) {
    //side bar
    document.getElementById("main").insertAdjacentHTML('afterbegin',
        '<div id="sidebar" class="sidebar-small">\
          <div id="points-snackbar">Woah! That\'s too many points!<br> We increased the interval a bit...</div>\
          <div id="frequent-snackbar">Woah! The interval you select is too short!</div>\
          <button id="sidebar-button">\
              🛠️\
          </button>\
          <div id="sidebar-items" class="sidebar-item-hidden">\
            <h3 class="sidebar-header">Dashboard settings</h3>\
            <div class="sidebar-settings">\
              <button id="toggle-graphs" class="active round"></button>\
              <label class="sidebar-text">\
                SHOW GRAPHS\
              </label>\
            </div>\
            <div id="datepicker" class="sidebar-settings">\
              <input type=hidden id="ranged">\
            </div>\
            <div id="freqpicker" class="sidebar-settings">\
              <label id="request-interval-label" for="request-interval">Interval (minutes)</label>\
              <input type="number" id="request-interval" value="60" min="5" max="1440">\
              <button type="button" id="refresh-button">\
                  <span class="button-text">Refresh</span>\
              </button>\
            </div>\
            <h4 class="sidebar-header">Tidy this up</h3>\
            <p class="sidebar-content sidebar-text">Select which metrics are shown and reorder the graphs here</p>\
          </div>\
        </div>'
    )

    document.getElementById("refresh-button").disabled = true;

    document.getElementById("sidebar").insertAdjacentHTML('beforeend',
      '<div id="draggable-sensor-list" class="sidebar-item-hidden"></div>');
    for (let i = 0; i < kit.data.sensors.length; i++) {
      document.getElementById('draggable-sensor-list').insertAdjacentHTML('afterbegin',
        '<div class="draggable-sensor-item active" id="'+kit.data.sensors[i].id+'">'
        + '<div class="draggable-sensor-name">'
        + kit.data.sensors[i].name.split("-").pop() + '<span style="font-weight:lighter"> ('
        + kit.data.sensors[i].name.split("-")[0].trimRight() + ')</span></div>'
        + `<button id=drag-` + kit.data.sensors[i].id +` class="toggle-sensor-item round active" onclick="toggleSensorItem('`+ kit.data.sensors[i].id +`')"></button>`
        + '</div>'
      );
    }

    var ranged = new Datepicker('#ranged', {
      inline: true,
      ranged: true,

      min: (function(){
        return new Date(kit.added_at).getTime();
      })(),
      // 10 days in the future
      max: (function(){
        return new Date(kit.last_reading_at).getTime();
      })(),

      // weekStart: 1,
      // time: true

      onChange: function( event, ui) {
        if (this._selected.length > 1) {
          let d = new Date();

          let oldest = new Date(Math.min.apply(Math, this._selected));
          settings.dates [0] = oldest.toISOString().slice(0, 19)+'Z';

          let latest = new Date(Math.max.apply(Math, this._selected));

          if (Math.floor((d - latest) / 86400000) > 0){
            // console.log('use latest')
            settings.dates [1] = latest.toISOString().slice(0, 19)+'Z';
          } else {
            // console.log('use now')
            settings.dates [1] = new Date().toISOString().slice(0, 19)+'Z';
          }

          var n_points = Math.round((latest - oldest) / 60000) / settings.requestInterval; // minutes

          // console.log(n_points);
          if (n_points > settings.maxDataPoints) {
            var allowedRequestInterval = Math.round((latest - oldest) / 60000 / settings.maxDataPoints );
            document.getElementById("request-interval").min = allowedRequestInterval;
            document.getElementById("request-interval").value = allowedRequestInterval;
            settings.minRequestInterval = allowedRequestInterval;
            settings.requestInterval = allowedRequestInterval;
            popUpToast('points-snackbar');
          } else {
            settings.minRequestInterval = settings.minDRequestInterval;
          }

          document.getElementById("refresh-button").disabled = false;

          let limit = new Date(d.setDate(d.getDate()-1))

          // console.log(settings.dates);
          if (latest < limit ) {
            document.getElementById("toggle-auto-update").classList.remove('active');
            socketDetail.off();
          } else {
            document.getElementById("toggle-auto-update").classList.add('active');
            webSocketDetailUpdate();
          }
        }
      }
    });

    document.getElementById("sidebar-button").onclick = function () {
      document.getElementById("sidebar").classList.toggle('sidebar-small');
      document.getElementById("sidebar-button").classList.toggle('sidebar-button-clicked');
      document.getElementById("draggable-sensor-list").classList.toggle('sidebar-item-hidden');
      // document.getElementById("sidebar-settings-header").classList.toggle('sidebar-item-hidden');
      // document.getElementById("sidebar-order-header").classList.toggle('sidebar-item-hidden');
      document.getElementById("sidebar-items").classList.toggle('sidebar-item-hidden');
    }

    document.getElementById("toggle-graphs").onclick = function() {
      // console.log(this.checked);
      if (this.classList.contains('active')) {
        plotelements = document.querySelectorAll('.uplot');
        for (var i = 0; i < plotelements.length; i++) {
          plotelements[i].classList.add('noshow');
        }
        document.getElementById("datepicker").classList.add('noshow');
        document.getElementById("freqpicker").classList.add('noshow');

        latestval = document.querySelectorAll('.latest-value');
        for (var i = 0; i < latestval.length; i++) {
          latestval[i].classList.add('nodecoration');
          latestval[i].classList.add('breathe');
        }

        sensorelements = document.querySelectorAll('.sensor-item');
        for (var i = 0; i < sensorelements.length; i++) {
          sensorelements[i].classList.add('large-card');
        }

        headerelements = document.querySelectorAll('.device-header');
        for (var i = 0; i < headerelements.length; i++) {
          headerelements[i].classList.add('large-header');
        }

        this.classList.remove('active');

      } else {

        plotelements = document.querySelectorAll('.uplot');
        for (var i = 0; i < plotelements.length; i++) {
          plotelements[i].classList.remove('noshow');
        }
        document.getElementById("datepicker").classList.remove('noshow');
        document.getElementById("freqpicker").classList.remove('noshow');

        latestval = document.querySelectorAll('.latest-value');
        for (var i = 0; i < latestval.length; i++) {
          latestval[i].classList.remove('nodecoration');
          latestval[i].classList.remove('breathe');
        }

        sensorelements = document.querySelectorAll('.sensor-item');
        for (var i = 0; i < sensorelements.length; i++) {
          sensorelements[i].classList.remove('large-card');
        }

        headerelements = document.querySelectorAll('.device-header');
        for (var i = 0; i < headerelements.length; i++) {
          headerelements[i].classList.remove('large-header');
        }

        this.classList.add('active');
      }
    }

    document.getElementById('request-interval').onchange = function () {
      var requestInterval = document.getElementById("request-interval").value;
      if (requestInterval !== settings.requestInterval) {
        document.getElementById("refresh-button").disabled = false;
        if (requestInterval < settings.minRequestInterval) {
          popUpToast('frequent-snackbar');
          document.getElementById("request-interval").value = settings.minRequestInterval;
          requestInterval = settings.minRequestInterval;
        }
        settings.requestInterval = requestInterval;
      };
    }

    document.getElementById("refresh-button").onclick = function () {
      this.classList.toggle('button-loading');
      document.getElementById("sensors").remove();
      kitData(kit);
      document.getElementById("refresh-button").disabled = true;
      this.classList.toggle('button-loading');
    }

    const dragArea = document.querySelector("#draggable-sensor-list");
    new Sortable(dragArea, {
      animation: 200,
      swapThreshold: 0.5,
      // multiDrag: true, // Enable multi-drag
      selectedClass: 'draggable-sensor-item-selected', // The class applied to the selected items
      fallbackTolerance: 3, // So that we can select items on mobile
      onUpdate: function( event, ui) {
        var array = [];
        var idsInOrder = document.getElementById("draggable-sensor-list").children;
        for (let j=0; j<idsInOrder.length; j++) {
          array.push(idsInOrder[j].id);
        }

        order(document.getElementById('sensors'), array);
      }
    });
  }

  function detailInterface() {
    let header = document.getElementById('header');
    // id
    document.body.removeAttribute('id');
    document.body.setAttribute('id', kit.id);

    // title
    header.insertAdjacentHTML('beforeend', '<div id="title"><span>' + kit.name + '</span></div>');
    header.insertAdjacentHTML('beforeend', '<div id="owner_username"><span>by ' + kit.owner.username + '</span></div>');

    // subtitle
    header.insertAdjacentHTML('beforeend', '<div id="subtitle">' + kit.description + '</div>');

    // reset
    header.insertAdjacentHTML('beforeend', '<button id="back">Back to dashboard</button>');
    document.getElementById("back").onclick = function () {
      resetFilters();
      socketDetail.off();
    };

    // read more
    document.getElementById("header").insertAdjacentHTML('beforeend', '<div id="buttons-area"></div>')
    document.getElementById("buttons-area").insertAdjacentHTML('beforeend',
      '<button " id="more" target="_blank">More info on this kit</button>');
    document.getElementById("more").onclick = function () {
      morePopup(kit);
    };

    // download data
    document.getElementById("buttons-area").insertAdjacentHTML('afterbegin',
      '<button " id="download-csv" target="_blank">Get this data</button>');
    document.getElementById("download-csv").onclick = function () {
      extrasPopup(true, kit);
    };

    // main class
    for (let i = 0; i < kit.user_tags.length; i++) {
      let tag = kit.user_tags[i].replace(/ /g,"_");
      document.getElementById("main").classList.add(tag);
    }
  }

  function kitData(kit) {
    document.getElementById("main").insertAdjacentHTML('afterbegin',
     '<ul class="list sensors-loading" id="sensors"></ul>');

    for (let i = 0; i < kit.data.sensors.length; i++) {
      const sensorUrl = `https://api.smartcitizen.me/v0/devices/${kit.id}/readings?sensor_id=${kit.data.sensors[i].id}&rollup=${settings.requestInterval}m&from=${settings.dates[0]}&to=${settings.dates[1]}`;
      // console.log(kit.data.sensors[i].id)
      https: fetch(sensorUrl)
      .then((res) => {
        return res.json();
      })
      .then((sensor) => {

        let sensorData = [[], []];
        if (sensor.readings !== undefined){
          for (const reading of sensor.readings) {

            let date = new Date(reading[0]).getTime() / 1000;
            sensorData[0].push(date);
            sensorData[1].push(reading[1]);
          }

          // Reverse for uplot to understand
          sensorData[0] = sensorData[0].reverse();
          sensorData[1] = sensorData[1].reverse();

          data[kit.data.sensors[i].id] = sensorData;

          var draggableSensors = [];
          var idsInOrder = document.getElementById("draggable-sensor-list").children;
          for (let j=0; j<idsInOrder.length; j++) {
            draggableSensors.push(idsInOrder[j].id);
          }

          displaySensor();
          order(document.getElementById('sensors'), draggableSensors);

          if (i == kit.data.sensors.length - 1) {
            let sdiv = document.getElementById('sensors');
            sdiv.classList.remove('sensors-loading');
          }
        }

        function displaySensor() {

          if (sensorData != undefined && sensorData[0].length > 0) {
            let sensor_id = kit.data.sensors[i].id;
            let value = Math.floor(kit.data.sensors[i].value, 1);
            let sensorStatus;

            if (settings.sensors) {
              for (let i = 0; i < settings.sensors.length; i++) {
                if (settings.sensors[i].id == sensor_id) {
                  if ((settings.sensors[i].threshold[0] <= value) && (value <= settings.sensors[i].threshold[1])) {
                    sensorStatus = 'inRange'
                  } else {
                    sensorStatus = 'outRange'
                  }
                }
              }
            } else {
              sensorStatus = 'noRange'
            }

            let sensors = document.getElementById("sensors");

            if (sensors) {
              sensors.insertAdjacentHTML('beforeend', '<li id="' + kit.data.sensors[i].id + '" class="active sensor-item ' + sensorStatus + '"></li>');
            }

            let canvasParent = document.getElementById(kit.data.sensors[i].id);
            var style = getComputedStyle(document.body);

            if (canvasParent) {
              canvasParent.insertAdjacentHTML('beforeend', '<div class="device-header"><div class="sensor-header"><h2 class="metric-name value">'
              + kit.data.sensors[i].name.split("-").pop() + '</h2><span class="sensor-name"> ('
              + kit.data.sensors[i].name.split("-")[0].trimRight() + ')</span></div>'
              + '<h3 class="latest-value"><span class="value">' + value + '</span>' + kit.data.sensors[i].unit + '</h3></div>');

              const opts = {
                class: "chart",
                ...getSize(canvasParent),
                scales: {
                  x: {
                    time: true,
                    // auto: false,
                  //  range: [0, 6],
                  },
                },
                cursor: {
                  sync:
                    {
                      key: 'moo',
                      setSeries: true,
                    }
                },
                series: [
                  {},
                  {
                    spanGaps: true,
                    // label: kit.data.sensors[i].name + kit.data.sensors[i].unit,
                    width: 3,
                    stroke: style.getPropertyValue('--colorBase'),
                    width: 1
                  },
                ],
                axes: [
                  {
                    label: "Date",
                    labelSize: 20,
                    stroke: style.getPropertyValue('--colorBase'),
                  },
                  {
                    label: kit.data.sensors[i].name.split("-").pop() + ' (' + kit.data.sensors[i].unit + ')',
                    labelSize: 20,
                    stroke: style.getPropertyValue('--colorBase')
                  }
                ]
              };
              let uplot = new uPlot(opts, data[kit.data.sensors[i].id], document.getElementById(kit.data.sensors[i].id));

              plots[String(kit.data.sensors[i].id)] = uplot;
            }
          }
        }
        currentData = data;
      });
    }
  }

  function webSocketDetailUpdate() {

    if (typeof socketIndex !== 'undefined') {
      socketIndex.off();
    }

    socketDetail = io.connect("wss://ws.smartcitizen.me", { reconnect: true });
    socketDetail.on("data-received", d => {
      if (d.id == kit.id) {
        for (let i = 0; i < d.data.sensors.length; i++) {

          let id = d.data.sensors[i].id;
          let elem = document.getElementById(id);

          if (elem) {

            let newValue = d.data.sensors[i].value;

            if (newValue){
              // Update banner

              let currentValue = elem.getElementsByClassName("value")[1];
              if (currentValue != undefined){
                currentValue.innerHTML = Math.round(newValue);

                // Shift if we exceed data points
                if (data[id][0].length > settings.maxDataPoints) {
                  data[id][0].shift();
                  data[id][1].shift();
                }

                data[id][0].push(new Date(d.data['recorded_at']).getTime() / 1000);
                data[id][1].push(newValue);

                // Update plot
                plots[id].setData(data[id]);
              }
            }



            let sensorStatus;
            if (settings.sensors) {
              for (let i = 0; i < settings.sensors.length; i++) {
                if (id == settings.sensors[i].id) {
                  if ((settings.sensors[i].threshold[0] <= newValue) && (newValue <= settings.sensors[i].threshold[1])) {
                    sensorStatus = 'inRange'
                  } else {
                    sensorStatus = 'outRange'
                  }
                }
              }
            } else {
              sensorStatus = 'noRange';
            }

            elem.classList.remove("updated", "inRange", "outRange");
            elem.classList.add("updated", sensorStatus);
            // console.log(d.data.sensors[i].name + '(id = ' + id + '): updated! New value: ' + newValue);
          }
        }
      }
      currentData = data;
    });
  }

  window.addEventListener("resize", e => {
    for (let plot in plots) {
      let canvasParent = document.getElementById(plot);
      plots[plot].setSize(getSize(canvasParent));
    }
  });

  var oh = document.getElementById('header').offsetHeight;
  document.getElementById('main').style.paddingTop = oh;
}

// loading screen
function loading(status) {
  status ? document.body.classList.add("isLoading") : document.body.classList.remove("isLoading");
}

// global interface
function globalInterface() {
  // title
  document.title = settings.title;
  // styles
  if (settings.styles) {
    styleKeys = Object.keys(settings.styles);
    styleValues = Object.values(settings.styles);
    for (let i = 0; i < styleKeys.length; i++) {
      document.documentElement.style.setProperty('--' + styleKeys[i], styleValues[i]);
    }
  }
  // header
  if (document.getElementById("header")) {
    document.getElementById("header").remove();
  }

  let header = document.createElement("header");
  header.id = "header"
  document.body.prepend(header);
}

function resetFilters() {
  ((settings.filter.type) && (settings.filter.value)) ? urlAddParameters(settings.filter.type, settings.filter.value) : urlAddParameters(null);
  dashboardInit();
}

/* MODAL */
function extrasPopup(timeseries = false, kit = null) {
  // console.log('opening pop-up');

  if (!document.getElementById("extras-modal")) {
    document.getElementById("main").insertAdjacentHTML('afterbegin', '<div id="extras-modal"></div>');
    modal = document.getElementById("extras-modal");
    modal.insertAdjacentHTML('afterbegin',
      '<div id="modal-content">\
      <span id="modal-close">&times;</span>\
      <h2>GET THIS DATA!</h2>\
      <div id="modal-wrapper">\
        <p> Click below to get a csv with all the data shown here.<br>\
        Note that this will only download the data that you currently see on the dashboard...\
        <br><span style="font-weight:bolder">This is an experimental feature. If you are looking for reliable data, use the API...</span></p>\
        </div>\
      </div>')

    document.getElementById("main").appendChild(modal);

    modalWrapper = document.getElementById('modal-wrapper')

    let downloadButton = document.createElement("button");
    downloadButton.innerHTML = 'Download!';
    downloadButton.onclick = function () {
      downloadData(timeseries, kit);
    };

    modalWrapper.appendChild(downloadButton);
  }
  modal.style.display = "block";

  btn = document.getElementById("modal-close");
  btn.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    var modal = document.getElementById("extras-modal");

    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

function morePopup(kit) {
  // console.log('opening pop-up');

  // console.log(kit);
  if (!document.getElementById("more-modal")) {
    document.getElementById("main").insertAdjacentHTML('afterbegin', '<div id="more-modal"></div>');
    modal = document.getElementById("more-modal");
    // console.log(kit);
    modal.insertAdjacentHTML('afterbegin',
      '<div id="modal-content">\
      <span id="modal-close">&times;</span>\
      <h2>Info for this kit</h2>\
      <div id="modal-wrapper">\
        <p> Here you have some basic info on this kit:\</p>\
        <div id="more-info">\
        <ul>\
        <li><span>Name:</span> ' + kit.name +'</li>\
        <li><span>Description:</span> ' + kit.description +'</li>\
        <li><span>ID:</span> <a href="https://smartcitizen.me/kits/' + kit.id + '"" target=_blank>' + kit.id + '</a></li>\
        <li><span>Owner:</span> <a href="https://smartcitizen.me/users/' + kit.owner.id + '"" target=_blank>' + kit.owner.username + '</a></li>\
        <li><span>Tags:</span> ' + kit.user_tags + '</li>\
        <li><span>Latest Update:</span> ' + new Date(kit.last_reading_at).toLocaleString('en-GB') + '</li>\
        <li><span>API endpoint:</span> <a href="https://api.smartcitizen.me/v0/devices/' + kit.id + '"" target=_blank>' + kit.id + '</a></li>\
        </div>\
        </div>\
      </div>')

    document.getElementById("main").appendChild(modal);

    modalWrapper = document.getElementById('modal-wrapper')

    let downloadButton = document.createElement("button");
    downloadButton.innerHTML = 'Download!';
    downloadButton.onclick = function () {
      downloadData();
    };

    // modalWrapper.appendChild(downloadButton);
  }
  modal.style.display = "block";

  btn = document.getElementById("modal-close");
  btn.onclick = function() {
    modal.style.display = "none";
  }

  window.onclick = function(event) {
    var modal = document.getElementById("more-modal");

    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

window.onresize = function(event) {
    var oh = document.getElementById('header').offsetHeight;
    document.getElementById('main').style.paddingTop = oh;
};

class DataFrame {
  constructor(columns = ['TIME'], units = ['ISO 8601'], index = null, data = null) {
    this.columns = columns;
    this.units = units;
    this.index = index;
    this.data = data;
  }

  merge(series) {

    //first add the name to our header
    if (this.columns.includes(series.name)) {
      console.log('includes ' + series.name)
      return null
    } else {
      this.columns.push(series.name)
      this.units.push(series.unit)
    }

    if (this.data === null && this.index === null) {
      this.index = series.index
      this.data = series.data.map(item => {
        return [item]
      })

    } else {

      let sindex = series.index
      let sdata = series.data

      // merge series to data nulls
      for (let sidx in sindex) {
        if (!this.index.includes(sindex[sidx])) {

          var i=this.index.findIndex(function(element) {
            return element > sindex[sidx];
          });

          this.index.splice(i, 0, sindex[sidx])
          this.data.splice(i, 0, Array.apply(null, Array(this.columns.length -2)))
        }
      }

      // the other way around
      for (let tidx in this.index){
        if (!sindex.includes(this.index[tidx])) {

          let valMax = this.index[tidx]
          var i=sindex.findIndex(function(element) {
            return element > valMax;
          });

          sindex.splice(i, 0, this.index[tidx])
          sdata.splice(i, 0, Array.apply(null, Array(1)))
        }
      }

      // merge it all!
      for (let didx in this.data) {
        this.data[didx].push(sdata[didx])
      }
    }
  }

  to_csv() {

    var index = this.index.map(item => {
        return [new Date(item*1000).toISOString().slice(0, 19)+'Z']
      })

    var data = this.data

    var json = index
    for (let i in index) {
      json[i].push(data[i])
    }

    var csv = json.map(function(row){
      return row.join('\t')
    })

    csv.unshift(this.units.join('\t')) // add units column
    csv.unshift(this.columns.join('\t')) // add header column
    csv = csv.join('\r\n');

    return csv
  }
}

class Series {
  constructor(name = '', unit, index = [], data = null) {
    this.name = name;
    this.unit = unit;
    this.index = index;
    this.data = data;
  }
}

function downloadData(timeseries = false, kit = null) {

  if (timeseries) {

    let dataframe = new DataFrame()

    let sensor_name;
    let sensor_unit;
    for (let item in currentData) {
      for (let sensor in kit.data.sensors) {
        if (String(kit.data.sensors[sensor].id) === item) {
          sensor_name = kit.data.sensors[sensor].name
          sensor_unit = kit.data.sensors[sensor].unit
          break
        }
      }

      if (sensor_name != undefined) {
        let series = new Series( name = sensor_name, unit = sensor_unit)
        series.index = currentData[item][0]
        series.data = currentData[item][1]

        dataframe.merge(series)
      }
    }

    var csv = dataframe.to_csv()

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a')
    a.setAttribute('href', url)
    let fileName = 'data';
    a.setAttribute('download', fileName + '.csv');
    a.click()

  } else {

    var json = currentData
    var fields = Object.keys(json[0])
    var replacer = function(key, value) { return value === null ? '' : value }
    var csv = json.map(function(row){
      return fields.map(function(fieldName){
        return JSON.stringify(row[fieldName], replacer)
      }).join('\t')
    })
    csv.unshift(fields.join('\t')) // add header column
    csv = csv.join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a')
    a.setAttribute('href', url)
    let fileName;
    if (currentTitle === "") {
      fileName = 'data_download'
    } else {
      fileName = currentTitle.split(' ').join('_').toLowerCase();
    }
    a.setAttribute('download', fileName + '.csv');
    a.click()
  }

}

function getSize(canvasParent) {
  let padding = parseInt(window.getComputedStyle(canvasParent, null).getPropertyValue('padding-left'), 10) * 2;
  let canvasWidth = canvasParent.offsetWidth - padding;

  return {
    width: canvasWidth,
    height: (canvasWidth / 25) * 10,
  }
}

function order(ul, array) {
  // get html children elements of li
  // in case of ul children will be li
  // ` Array.from` will hell helps to convert them into array
  var elements = Array.from(ul.children);

  // sort them with the same code
  elements.sort(function(a, b){
    var va = array.indexOf(a.id),
        vb = array.indexOf(b.id);
    return vb < va ? 1 : -1;
    // return array.indexOf(a) - array.indexOf(b);
  });

  // append back to update the order
  // forEach can be used to update since it's in array format
  elements.forEach(function(ele) {
    ul.appendChild(ele)
  });
}

function popUpToast(element_name) {
  // Get the snackbar DIV
  var x = document.getElementById(element_name);

  // Add the "show" class to DIV
  x.className = "show";

  // After 3 seconds, remove the show class from DIV
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}

function toggleSensorItem(id = null) {
  // console.log(id);
  // console.log(document.getElementById(id));

  let dragElement = document.getElementById('drag-' + id);
  let elem = document.getElementById(id);

  // for (let dragElement of dragElements) {
    if (dragElement.id == 'drag-' + id) {
      if (dragElement.classList.contains('active')) {
        dragElement.classList.remove('active');
      } else {
        dragElement.classList.add('active');
      }
    }
  // }

  // for (let elem of elems) {
    if (elem.id == id) {
      if (elem.classList.contains('graph-hidden')) {
        elem.classList.remove('graph-hidden');
      } else {
        elem.classList.add('graph-hidden');
      }
    }
  // }
};
