import "./styles.css";
import {
  Alert,
  AlertIcon,
  AlertDescription,
  Box,
  Button,
  Divider,
  Flex,
  VStack,
  HStack,
  Icon,
  Input,
  InputLeftElement,
  InputGroup,
  SkeletonText,
  Text,
  Heading,
  Grid,
  GridItem,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import {
  FaMapMarkerAlt,
  FaUmbrellaBeach,
  FaMapSigns,
  FaSearch,
  FaCarAlt,
  FaClock,
  FaSlidersH,
} from "react-icons/fa";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import axios from "axios";
import { useRef, useState, useEffect } from "react";

const center = { lat: 42.35525556385052, lng: -71.09141481361783 };

function App() {
  //const [markers, setMarker] = useState([])

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [map, setMap] = useState(/** @type google.maps.Map */ (null));
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(-1);

  const [popularityWeight, setPopularityWeight] = useState(33);
  const [modelWeight, setModelWeight] = useState(67);
  const [distanceWeight, setDistanceWeight] = useState(0);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originDisplay, setOriginDisplay] = useState("");
  const [destinationDisplay, setDestinationDisplay] = useState("");
  const [originRoute, setOriginRoute] = useState("");
  const [destinationRoute, setDestinationRoute] = useState("");
  const [adjective, setAdjective] = useState("");
  const [stops, setStops] = useState("");

  const [alert, setAlert] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  /** @type React.MutableRefObject<HTMLInputElement> */
  const originRef = useRef();
  /** @type React.MutableRefObject<HTMLInputElement> */
  const destinationRef = useRef();

  // useEffect(() => {
  //   const fd = async () => {
  //     // eslint-disable-next-line no-undef
  //     const directionsService = new google.maps.DirectionsService();
  //     const results = await directionsService.route({
  //       origin: originRef.current.value,
  //       destination: destinationRef.current.value,
  //       waypoints: waypoints.map((waypoint) => ({
  //         location: waypoint,
  //         stopover: true,
  //       })),
  //       optimizeWaypoints: true,
  //       // eslint-disable-next-line no-undef
  //       travelMode: google.maps.TravelMode.DRIVING,
  //     });
  //     setDirectionsResponse(results);
  //   };

  //   fd().catch(console.error);
  // }, [waypoints]);

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function fetchData(url, queryParams) {
    try {
      const urlObject = new URL(url);
      urlObject.search = new URLSearchParams(queryParams).toString();
      const response = await fetch(urlObject.toString());

      console.log("Response:", response);

      if (!response.ok) {
        setIsLoading(false);
        setError(true);
        throw new Error(
          `Error requesting from backend: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Fetched data:", data);

      const newWaypoints = data.results.map((result) => result.name);
      console.log("New waypoints:", newWaypoints);
      setWaypoints(newWaypoints);
      return newWaypoints;
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function calculateRoute() {
    if (
      origin === "" ||
      destination === "" ||
      adjective === "" ||
      stops === ""
    ) {
      setAlert(true);
      return;
    }
    setAlert(false);
    setError(false);
    setIsLoading(true);
    const url = "https://detour-ai-mit.uk.r.appspot.com";
    const queryParams = {
      key: "beaver",
      origin: origin.place_id,
      destination: destination.place_id,
      keyword: adjective,
      modelWeight: parseFloat(modelWeight),
      distanceWeight: parseFloat(distanceWeight),
      popularityWeight: parseFloat(popularityWeight),
      targetCount: parseInt(stops),
    };
    console.log("Requesting detour with params:", queryParams);
    const newWaypoints = await fetchData(url, queryParams);
    console.log("Got waypoints:", newWaypoints);
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originDisplay,
      destination: destinationDisplay,
      waypoints: newWaypoints.map((waypoint) => ({
        location: waypoint,
        stopover: true,
      })),
      optimizeWaypoints: true,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });

    console.log("Route results", results);

    setOriginRoute(origin);
    setDestinationRoute(destination);
    setDirectionsResponse(results);
    setIsLoading(false);
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
      setSelectedMarker(-1);
    };
  }

  const handleAutoCompleteOrigin = (autocomplete) => {
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      console.log(place);
      // This is the complete response from Autocomplete
      setOriginDisplay(originRef.current.value);
      setOrigin(place);
    });
  };

  const handleAutoCompleteDestination = (autocomplete) => {
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      // This is the complete response from Autocomplete
      setDestinationDisplay(destinationRef.current.value);
      setDestination(place);
    });
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
              {selectedMarker === index && (
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

      {/* {directionsResponse && (
        <Box
          position="fixed"
          top="20px"
          right="20px"
          bg="white"
          boxShadow="md"
          borderRadius="md"
          p={4}
          width="20%"
        >
          <VStack>
            {true && (
              <div>
                <h1>start</h1>
              </div>
            )}
            {waypoints.map((waypoint, index) => (
              <div>
                <h1>
                  {waypoint.lat} {waypoint.lng} {index}
                </h1>
                <button onClick={handleRemoveWaypoint(index)}>Remove</button>
              </div>
            ))}
            {true && (
              <div>
                <h1>end</h1>
              </div>
            )}
          </VStack>
        </Box>
      )} */}
      <Box
        position="fixed"
        top="20px"
        left="20px"
        bg="white"
        boxShadow="md"
        borderRadius="md"
        py={6}
        px={4}
        width="275px"
        maxH="90%"
        overflow="auto"
      >
        <VStack spacing={6} justifyContent="space-between">
          <VStack spacing={2} justifyContent="space-between">
            <Box flexGrow={1}>
              <Autocomplete
                onLoad={(autocomplete) =>
                  handleAutoCompleteOrigin(autocomplete)
                }
              >
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<FaMapMarkerAlt color="gray.500" />}
                  />
                  <Input
                    type="text"
                    placeholder="Leaving from"
                    ref={originRef}
                    value={originDisplay}
                    onChange={(e) => setOriginDisplay(e.target.value)}
                  />
                </InputGroup>
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <Autocomplete
                onLoad={(autocomplete) =>
                  handleAutoCompleteDestination(autocomplete)
                }
              >
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<FaMapMarkerAlt color="gray.500" />}
                  />
                  <Input
                    type="text"
                    placeholder="Going to"
                    ref={destinationRef}
                    value={destinationDisplay}
                    onChange={(e) => setDestinationDisplay(e.target.value)}
                  />
                </InputGroup>
              </Autocomplete>
            </Box>
            <Box flexGrow={1}>
              <InputGroup>
                <InputLeftElement
                  pointerEvents="none"
                  children={<FaUmbrellaBeach color="gray.500" />}
                />
                <Input
                  type="text"
                  placeholder="Adjective"
                  value={adjective}
                  onChange={(e) => setAdjective(e.target.value)}
                />
              </InputGroup>
            </Box>
            <Box flexGrow={1}>
              <InputGroup>
                <InputLeftElement
                  pointerEvents="none"
                  children={<FaMapSigns color="gray.500" />}
                />
                <Input
                  type="number"
                  placeholder={"Stops"}
                  value={stops}
                  onChange={(e) => setStops(e.target.value)}
                />
              </InputGroup>
            </Box>
            <Button
              onClick={onOpen}
              leftIcon={<FaSlidersH />}
              size="sm"
              bg="white"
            >
              Model parameters
            </Button>

            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Adjust model parameters</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={4} align="left">
                    <VStack spacing={2} align="left">
                      <Text>Popularity weight</Text>
                      <Slider
                        defaultValue={popularityWeight}
                        onChange={(val) => setPopularityWeight(val)}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </VStack>
                    <VStack spacing={2} align="left">
                      <Text>Model weight</Text>
                      <Slider
                        defaultValue={modelWeight}
                        onChange={(val) => setModelWeight(val)}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </VStack>
                    <VStack spacing={2} align="left">
                      <Text>Distance weight</Text>
                      <Slider
                        defaultValue={distanceWeight}
                        onChange={(val) => setDistanceWeight(val)}
                      >
                        <SliderTrack>
                          <SliderFilledTrack />
                        </SliderTrack>
                        <SliderThumb />
                      </Slider>
                    </VStack>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {alert ? (
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>Please fill in each field.</AlertDescription>
              </Alert>
            ) : (
              <></>
            )}
            {error ? (
              <Alert status="error">
                <AlertIcon />
                <AlertDescription>Error getting route.</AlertDescription>
              </Alert>
            ) : (
              <></>
            )}
          </VStack>

          <Button
            flex={1}
            leftIcon={<Icon as={FaSearch} />}
            p={4}
            rounded={"full"}
            bg={"blue.500"}
            color={"white"}
            boxShadow={
              "0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)"
            }
            _hover={{
              bg: "blue.600",
            }}
            _focus={{
              bg: "blue.600",
            }}
            onClick={calculateRoute}
            isLoading={isLoading}
          >
            Plan my trip
          </Button>
        </VStack>

        {directionsResponse && <Divider orientation="horizontal" pt={8} />}
        {directionsResponse && (
          <VStack align="left" pt={6} spacing={6}>
            <Box>
              <Heading size="sm">{originRoute.name}</Heading>
              <Text fontSize="sm" color="gray">
                {originRoute.formatted_address}
              </Text>
            </Box>
            {waypoints.map((_, i) => (
              <>
                <Grid
                  templateAreas={`"icon1 duration"
                  "icon2 distance"`}
                  gridTemplateRows={"20px 1fr 20px"}
                  gridTemplateColumns={"20px 1fr 80px"}
                  h="40px"
                  gap="1"
                  color="gray"
                  fontSize="sm"
                >
                  <GridItem pl="2" area={"icon1"} transform="translateY(2px)">
                    <Icon as={FaClock} />
                  </GridItem>
                  <GridItem pl="2" area={"icon2"} transform="translateY(2px)">
                    <Icon as={FaCarAlt} />
                  </GridItem>
                  <GridItem pl="2" area={"duration"}>
                    {directionsResponse.routes[0].legs.at(i).duration.text}
                  </GridItem>
                  <GridItem pl="2" area={"distance"}>
                    {directionsResponse.routes[0].legs.at(i).distance.text}
                  </GridItem>
                </Grid>
                <Box>
                  <Heading size="sm">
                    {waypoints[directionsResponse.routes[0].waypoint_order[i]]}
                  </Heading>
                  <Text fontSize="sm" color="gray">
                    {directionsResponse.routes[0].legs[i].end_address}
                  </Text>
                </Box>
              </>
            ))}
            <Grid
              templateAreas={`"icon1 duration"
                  "icon2 distance"`}
              gridTemplateRows={"20px 1fr 20px"}
              gridTemplateColumns={"20px 1fr 80px"}
              h="40px"
              gap="1"
              color="gray"
              fontSize="sm"
            >
              <GridItem pl="2" area={"icon1"} transform="translateY(2px)">
                <Icon as={FaClock} />
              </GridItem>
              <GridItem pl="2" area={"icon2"} transform="translateY(2px)">
                <Icon as={FaCarAlt} />
              </GridItem>
              <GridItem pl="2" area={"duration"}>
                {directionsResponse.routes[0].legs.at(-1).duration.text}
              </GridItem>
              <GridItem pl="2" area={"distance"}>
                {directionsResponse.routes[0].legs.at(-1).distance.text}
              </GridItem>
            </Grid>
            <Box>
              <Heading size="sm">{destinationRoute.name}</Heading>
              <Text fontSize="sm" color="gray">
                {destinationRoute.formatted_address}
              </Text>
            </Box>
          </VStack>
        )}
      </Box>
    </Flex>
  );
}

export default App;
