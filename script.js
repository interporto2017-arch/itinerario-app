// -------------------------
// CONFIG
// -------------------------
const API_KEY = "AIzaSyDFCaVFjvR-RVjdtIWU2wn96E-v8UuGzMc";

let indirizzi = [];
let map, directionsService, directionsRenderer;
let userLocation = null;

// -------------------------
// GOOGLE MAPS INIT
// -------------------------
function initMap() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: { lat: 41.9028, lng: 12.4964 },

    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },

    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_LEFT,
    },

    fullscreenControl: true,
    fullscreenControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },

    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },

    disableDoubleClickZoom: isMobile,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
  });
}

// -------------------------
// AGGIUNTA INDIRIZZO MANUALE
// -------------------------
window.addSingle = function () {
  const input = document.getElementById("singleInput").value.trim();
  if (input === "") return alert("Inserisci un indirizzo");

  indirizzi.push(input);
  renderList();
  document.getElementById("singleInput").value = "";
};

// -------------------------
// RENDER LISTA + ELIMINA
// -------------------------
function renderList() {
  const list = document.getElementById("resultList");
  list.innerHTML = "";

  indirizzi.forEach((indirizzo, index) => {
    const li = document.createElement("li");

    const textSpan = document.createElement("span");
    textSpan.textContent = indirizzo;

    const delBtn = document.createElement("button");
    delBtn.className = "delBtn";
    delBtn.innerHTML = "🗑️";

    delBtn.onclick = () => {
      indirizzi.splice(index, 1);
      renderList();
    };

    li.appendChild(textSpan);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// -------------------------
// GEOLOCALIZZAZIONE
// -------------------------
window.useGPS = function () {
  if (!navigator.geolocation) {
    alert("La geolocalizzazione non è supportata dal dispositivo.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      // CENTRA LA MAPPA
      map.setCenter(userLocation);
      map.setZoom(15);

      // AGGIUNGE IL PALLINO BLU
      new google.maps.Marker({
        position: userLocation,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      alert("Posizione registrata. Verrà usata come punto di partenza.");
    },
    (err) => {
      alert("Errore GPS: " + err.message);
    }
  );
};

// -------------------------
// OTTIMIZZAZIONE ITINERARIO
// -------------------------
window.optimize = function () {
  if (indirizzi.length < 2) {
    alert("Aggiungi almeno 2 indirizzi.");
    return;
  }

  // SE c'è la posizione GPS → parte da lì
  // ALTRIMENTI → parte dal primo indirizzo
  const start = userLocation
    ? `${userLocation.lat},${userLocation.lng}`
    : indirizzi[0];
  const end = indirizzi[indirizzi.length - 1];

  const waypoints = indirizzi.slice(1, -1).map((addr) => ({
    location: addr,
    stopover: true,
  }));

  directionsService.route(
    {
      origin: start,
      destination: end,
      waypoints: waypoints,
      optimizeWaypoints: true,
      travelMode: "DRIVING",
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setMap(null);
        directionsRenderer = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
        });
        directionsRenderer.setDirections(result);

        // MARKER NUMERICI
        const route = result.routes[0];
        const legs = route.legs;

        legs.forEach((leg, index) => {
          new google.maps.Marker({
            position: leg.start_location,
            map: map,
            label: `${index + 1}`,
          });

          if (index === legs.length - 1) {
            new google.maps.Marker({
              position: leg.end_location,
              map: map,
              label: `${index + 2}`,
            });
          }
        });

        // RIORDINA LISTA — NON INSERIRE LA POSIZIONE GPS
        const order = result.routes[0].waypoint_order;
        let finalOrder = [];

        if (!userLocation) {
          finalOrder.push(start);
        }

        order.forEach((i) => finalOrder.push(indirizzi[i + 1]));
        finalOrder.push(end);

        indirizzi = finalOrder;
        renderList();
      } else {
        alert("Errore percorso: " + status);
      }
    }
  );
};

// -------------------------
// DETTAZIONE VOCALE
// -------------------------
window.startVoice = function () {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("La dettatura vocale funziona solo su Chrome.");
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = "it-IT";
  rec.start();

  rec.onresult = (e) => {
    const testo = e.results[0][0].transcript;
    indirizzi.push(testo);
    renderList();
  };
};

// -------------------------
// INIT MAP
// -------------------------
window.initMap = initMap;
