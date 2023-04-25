import "./styles.css";

import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  HStack,
  VStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { FaLocationArrow, FaTimes } from "react-icons/fa";

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import { useRef, useState } from "react";

const center = { lat: 48.8584, lng: 2.2945 };

function App() {
  //const [markers, setMarker] = useState([])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [optimize, setOptimize] = useState(true);
  const [markers, setMarkers] = useState([
    { lat: 48.8605, lng: 2.2945 },
    { lat: 48.8595, lng: 2.2945 },
  ]);
  const [selectedMarker, setSelectedMarker] = useState(-1);

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef();
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destiantionRef = useRef();

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function calculateRoute() {
    if (originRef.current.value === "" || destiantionRef.current.value === "") {
      return;
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destiantionRef.current.value,
      waypoints: waypoints.map((waypoint) => ({
        location: waypoint,
        stopover: true,
      })),
      optimizeWaypoints: optimize,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text); // TODO: sum all legs
    setDuration(results.routes[0].legs[0].duration.text); // TODO: sum all legs
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance("");
    setDuration("");
    originRef.current.value = "";
    destiantionRef.current.value = "";
  }

  function handleMarkerClick(index) {
    return () => {
      console.log(index);
      console.log(markers);
      console.log(waypoints);
      setSelectedMarker(index);
    };
  }

  function handleAddWaypoint(index) {
    return () => {
      setWaypoints([...waypoints, markers[index]]);
      setSelectedMarker(-1);
    };
  }

  function handleRemoveWaypoint(index) {
    return () => {
      var arr = [...waypoints];
      arr.splice(index, 1);
      setWaypoints(arr);
    };
  }

  return (
    <Flex
      position="relative"
      flexDirection="column"
      alignItems="center"
      h="100vh"
      w="100vw"
    >
      <Box position="absolute" left={0} top={0} h="100%" w="100%">
        {/* Google Map Box */}
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={(map) => setMap(map)}
        >
          {/* Markers */}

          {markers.map((marker, index) => (
            <Marker
              position={{
                lat: marker.lat,
                lng: marker.lng,
              }}
              onClick={handleMarkerClick(index)}
            >
              {selectedMarker == index && (
                <InfoWindow
                  options={{ closeBoxURL: ``, enableEventPropagation: true }}
                  onCloseClick={() => {
                    setSelectedMarker(-1);
                  }}
                  width="300px"
                >
                  <VStack style={{ fontSize: `16px`, fontColor: `#08233B` }}>
                    <h1>
                      {marker.lat} {marker.lng}
                    </h1>
                    <button
                      className="button"
                      onClick={handleAddWaypoint(index)}
                    >
                      Add to path
                    </button>
                  </VStack>
                </InfoWindow>
              )}
            </Marker>
          ))}

          {/* Popup */}

          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </Box>
      <Box
        position="absolute"
        left={0}
        top={0}
        h="100%"
        p={4}
        borderRadius="lg"
        bgColor="white"
        shadow="base"
        minW={400}
        zIndex="1"
      >
        <Flex flexDirection="column" gap={100}>
          <VStack spacing={2} justifyContent="space-between">
            <Box flexGrow={1}>
              <Autocomplete>
                <Input type="text" placeholder="Origin" ref={originRef} />
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <Autocomplete>
                <Input
                  type="text"
                  placeholder="Destination"
                  ref={destiantionRef}
                />
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <Input type="text" placeholder="Adjective" />
            </Box>

            <ButtonGroup>
              <button className="button" onClick={calculateRoute}>
                Calculate Route
              </button>
              <IconButton
                aria-label="center back"
                icon={<FaTimes />}
                onClick={clearRoute}
              />
            </ButtonGroup>
          </VStack>
          <VStack spacing={4} mt={4} justifyContent="space-between">
            <Checkbox onChange={(e) => setOptimize(e.target.checked)}>
              Optimize Route
            </Checkbox>
            <Text>Distance: {distance} </Text>
            <Text>Duration: {duration} </Text>
            <IconButton
              aria-label="center back"
              icon={<FaLocationArrow />}
              isRound
              onClick={() => {
                map.panTo(center);
                map.setZoom(15);
              }}
            />
          </VStack>
          <VStack>
            {waypoints.map((waypoint, index) => (
              <div>
                <h1>
                  {waypoint.lat} {waypoint.lng} {index}
                </h1>
                <button onClick={handleRemoveWaypoint(index)}>Remove</button>
              </div>
            ))}
          </VStack>
        </Flex>
      </Box>
    </Flex>
  );
}

export default App;
