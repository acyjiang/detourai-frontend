import "./styles.css";

import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Flex,
  VStack,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  const [waypoints, setWaypoints] = useState([]);
  const [optimize, setOptimize] = useState(true);
  const [markers, setMarkers] = useState([
    { lat: 48.8605, lng: 2.2945 },
    { lat: 48.8595, lng: 2.2945 },
  ]);
  const [selectedMarker, setSelectedMarker] = useState(-1);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [targetCount, setTargetCount] = useState(3);

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef();
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destinationRef = useRef();
  /** @type React.MutableRefObject<HTMLInputElement> */
  const adjectiveRef = useRef();

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function fetchData(url, queryParams) {
    try {
      const urlObject = new URL(url);
      urlObject.search = new URLSearchParams(queryParams).toString();
      const response = await fetch(urlObject.toString());

      if (!response.ok) {
        throw new Error(`An error occurred: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Data:", data);

      const newWaypoints = data.results.map((result) => result.name);
      setWaypoints(newWaypoints);
      return newWaypoints;
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function calculateRoute() {
    if (
      originRef.current.value === "" ||
      destinationRef.current.value === "" ||
      adjectiveRef.current.value === ""
    ) {
      return;
    }

    const url = "https://detour-ai-mit.uk.r.appspot.com";
    const queryParams = {
      key: "beaver",
      origin: originId,
      destination: destinationId,
      keyword: adjectiveRef.current.value,
      modelWeight: 20,
      distanceWeight: 0,
      popularityWeight: 10,
      targetCount: targetCount,
    };
    console.log(queryParams);
    const newWaypoints = await fetchData(url, queryParams);
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      waypoints: newWaypoints.map((waypoint) => ({
        location: waypoint,
        stopover: true,
      })),
      optimizeWaypoints: optimize,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    console.log(results);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setWaypoints([]);
    originRef.current.value = "";
    destinationRef.current.value = "";
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

  const handleAutoCompleteOrigin = (autocomplete) => {
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      // This is the complete response from Autocomplete
      setOriginId(place.place_id);
    });
  };

  const handleAutoCompleteDestination = (autocomplete) => {
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      // This is the complete response from Autocomplete
      setDestinationId(place.place_id);
    });
  };

  const handleStopsChange = (valueAsString, valueAsNumber) => {
    setTargetCount(valueAsNumber);
  };

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
      <div className="resizable">
        <Box
          position="absolute"
          left={0}
          top={0}
          h="100%"
          p={4}
          borderRadius="lg"
          bgColor="white"
          shadow="base"
          minW={200}
          zIndex="1"
        >
          <Flex flexDirection="column" gap={100}>
            <VStack spacing={2} justifyContent="space-between">
              <Box flexGrow={1}>
                <Autocomplete
                  onLoad={(autocomplete) =>
                    handleAutoCompleteOrigin(autocomplete)
                  }
                >
                  <Input type="text" placeholder="Origin" ref={originRef} />
                </Autocomplete>
              </Box>
              <Box flexGrow={1}>
                <Autocomplete
                  onLoad={(autocomplete) =>
                    handleAutoCompleteDestination(autocomplete)
                  }
                >
                  <Input
                    type="text"
                    placeholder="Destination"
                    ref={destinationRef}
                  />
                </Autocomplete>
              </Box>
              <Box flexGrow={1}>
                <Input type="text" placeholder="Adjective" ref={adjectiveRef} />
              </Box>
              <Text>Number of stops:</Text>
              <Box flexGrow={1}>
                <NumberInput
                  defaultValue={3}
                  min={1}
                  onChange={handleStopsChange}
                  value={targetCount}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>
              <Checkbox
                defaultChecked
                onChange={(e) => setOptimize(e.target.checked)}
              >
                Optimize Route
              </Checkbox>
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
            {directionsResponse ? (
              <VStack spacing={2} justifyContent="space-between">
                <Box
                  width="100%"
                  left={0}
                  top={0}
                  p={4}
                  borderRadius="lg"
                  bgColor="white"
                  shadow="base"
                  minW={200}
                  zIndex="1"
                  textAlign="center"
                >
                  <Text>{originRef.current.value}</Text>
                </Box>
                {waypoints.map((waypoint, i) => (
                  <>
                    <Box
                      width="100%"
                      p={4}
                      borderLeftWidth="1px"
                      borderLeftStyle="solid"
                      borderLeftColor="black"
                    >
                      <Text>
                        {directionsResponse.routes[0].legs[i].distance.text}
                      </Text>
                      <Text>
                        {directionsResponse.routes[0].legs[i].duration.text}
                      </Text>
                    </Box>
                    <Box
                      width="100%"
                      left={0}
                      top={0}
                      p={4}
                      borderRadius="lg"
                      bgColor="white"
                      shadow="base"
                      minW={200}
                      zIndex="1"
                      textAlign="center"
                    >
                      <Text>{waypoint}</Text>
                    </Box>
                  </>
                ))}
                <Box
                  width="100%"
                  p={4}
                  borderLeftWidth="1px"
                  borderLeftStyle="solid"
                  borderLeftColor="black"
                >
                  <Text>
                    {directionsResponse.routes[0].legs.at(-1).distance.text}
                  </Text>
                  <Text>
                    {directionsResponse.routes[0].legs.at(-1).duration.text}
                  </Text>
                </Box>
                <Box
                  width="100%"
                  left={0}
                  top={0}
                  p={4}
                  borderRadius="lg"
                  bgColor="white"
                  shadow="base"
                  minW={200}
                  zIndex="1"
                  textAlign="center"
                >
                  <Text>{destinationRef.current.value}</Text>
                </Box>
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
            ) : (
              <></>
            )}
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
      </div>
    </Flex>
  );
}

export default App;
