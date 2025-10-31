import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionButton,
  Button,
  Flex,
  Provider,
  Text,
  View,
  SearchField,
  TextField,
  defaultTheme,
} from '@adobe/react-spectrum';
import Minimize from '@spectrum-icons/workflow/Minimize';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { isValidLatLon } from './utils';
import { ADSB_SERVICE, AIRCRAFT_SERVICE, CALLSIGN_SERVICE, GEO_SERVICE, MAP_SERVICE } from './config';
import MyPosition from './MyPosition.jsx';
import './App.css';

function App() {

  const [myPosition, setMyPosition] = useState([33.0, -112.0]);
  const [center, setCenter] = useState([33.0, -112.0]);
  const [zoom, setZoom] = useState(10);

  const [useFallback, setUseFallback] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tileBaseUrl, setTileBaseUrl] = useState(null);

  // Callsign Search
  const [searchCallsign, setSearchCallsign] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Lat/Lon Search
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [latLonError, setLatLonError] = useState(null);
  const [latLonMarker, setLatLonMarker] = useState(null);

  // Load default location
  useEffect(() => {
    const fetchDefaultGrid = async () => {
      try {
        const response = await fetch(GEO_SERVICE);
        if (!response.ok) throw new Error('Failed to fetch default location');
        const data = await response.json();
        if (isValidLatLon(data)) {
          const { lat, lon } = data.position;
          setMyPosition([lat, lon]);
          setCenter([lat, lon]);
        }
      } catch (err) {
        console.warn('Could not load default location:', err);
      }
    };
    fetchDefaultGrid();
  }, []);

  // Load map tile service info
  useEffect(() => {
    async function fetchMapServices() {
      try {
        const response = await fetch(MAP_SERVICE);
        const services = await response.json();
        if (services.length > 0) {
          setTileBaseUrl(services[0].url);
        } else {
          setUseFallback(true);
        }
      } catch (err) {
        console.error('Failed to fetch map services:', err);
        setUseFallback(true);
      }
    }
    fetchMapServices();
  }, []);

  const mapTiler = useCallback(
    (x, y, z, dpr) => {
      if (useFallback) {
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      }
      if (!tileBaseUrl) return '';
      return `${tileBaseUrl}/tiles/${z}/${x}/${y}.png`;
    },
    [tileBaseUrl, useFallback]
  );

  // Handle callsign search
  const handleSearch = async () => {
    if (!searchCallsign) return;
    setSearchError(null);
    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch(
        `${CALLSIGN_SERVICE}?callsign=${encodeURIComponent(searchCallsign)}`
      );
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data = await response.json();

      if (data.lat && data.lon) {
        setSearchResult(data);
        setCenter([data.lat, data.lon]);
        setZoom(10);
      } else {
        setSearchError('Callsign not found.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Callsign search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle lat/lon search
  const handleLatLonSearch = () => {
    setLatLonError(null);
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);

    if (isNaN(lat) || isNaN(lon)) {
      setLatLonError('Both latitude and longitude must be numbers.');
      return;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLatLonError('Latitude must be between -90 and 90, longitude between -180 and 180.');
      return;
    }

    const coords = [lat, lon];
    setLatLonMarker(coords);
    setCenter(coords);
    setZoom(10);
  };

  return (
    <Provider theme={defaultTheme}>
      <Flex direction="column" height="100vh">
        <Flex direction="row" flexGrow={1}>
          {/* Sidebar */}
          {sidebarOpen && (
            <View backgroundColor="gray-100" padding="size-200" width="size-4600">
              <Flex direction="column" gap="size-200">

                {/* Top row: Hide + MyPosition */}
                <Flex direction="row" gap="size-200" alignItems="center">
                  <ActionButton onPress={() => setSidebarOpen(false)} aria-label="Hide Panel">
                    <Minimize /><Text>Hide</Text>
                  </ActionButton>
                  <MyPosition
                    setMyPosition={setMyPosition}
                    setCenter={setCenter}
                    showText={true}
                  />
                </Flex>

                {/* Callsign Search */}
                <Flex direction="row" gap="size-200" alignItems="end">
                  <SearchField
                    label="Callsign Lookup"
                    placeholder="callsign"
                    value={searchCallsign}
                    onChange={setSearchCallsign}
                    onSubmit={handleSearch}
                    width="100%"
                  />
                  <Button
                    variant="cta"
                    onPress={handleSearch}
                    isDisabled={isSearching}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </Flex>

                {/* Lat/Lon Search */}
                <Flex direction="row" gap="size-200" alignItems="end">
                  <TextField
                    label="Latitude"
                    placeholder="e.g., 33.45"
                    value={latInput}
                    onChange={setLatInput}
                    width="50%"
                  />
                  <TextField
                    label="Longitude"
                    placeholder="e.g., -111.93"
                    value={lonInput}
                    onChange={setLonInput}
                    width="50%"
                  />
                  <Button variant="cta" onPress={handleLatLonSearch}>
                    Go
                  </Button>
                </Flex>

                {latLonError && (
                  <Text UNSAFE_style={{ color: 'red' }}>{latLonError}</Text>
                )}

                {/* Callsign Result */}
                {searchError && (
                  <Text UNSAFE_style={{ color: 'red' }}>{searchError}</Text>
                )}

                {searchResult && (
                  <View
                    backgroundColor="gray-200"
                    padding="size-100"
                    borderRadius="regular"
                    marginTop="size-200"
                  >
                    <Text><b>{searchResult.firstName}</b> {searchResult.callsign}</Text><br />
                    <Text>{searchResult.city}, {searchResult.state} {searchResult.zip}</Text><br />
                    <Text>Grid: {searchResult.grid}</Text><br />
                    <Text>Lat/Lon: {searchResult.lat.toFixed(4)}, {searchResult.lon.toFixed(4)}</Text><br />
                    <Text>Alt: {searchResult.alt} m</Text><br />
                    <Text>Distance: {searchResult.distance.toFixed(2)} mi</Text><br />
                    <Text>Bearing: {searchResult.bearing}°</Text>
                  </View>
                )}
              </Flex>
            </View>
          )}

          {/* Sidebar toggle */}
          {!sidebarOpen && (
            <View backgroundColor="gray-100" padding="size-100">
              <Flex direction="column" gap="size-200">
                <ActionButton onPress={() => setSidebarOpen(true)} aria-label="Show Panel">
                  <ShowMenu />
                </ActionButton>
                <MyPosition
                  setMyPosition={setMyPosition}
                  setCenter={setCenter}
                  showText={false}
                />
              </Flex>
            </View>
          )}

          {/* Map */}
          <View flexGrow={1}>
	    <View
              backgroundColor="gray-200"
              borderWidth="thin"
              borderColor="dark"
              padding="size-50"
            >
              <Text>
                Your Position: {myPosition[0].toFixed(4)},{myPosition[1].toFixed(5)}
              </Text>
	    </View>

            <Map
              attributionPrefix="The Tech Prepper | Pigeon Maps"
              provider={mapTiler}
              height="100%"
              center={center}
              zoom={zoom}
              minZoom={2}
              maxZoom={11}
              onBoundsChanged={({ center, zoom }) => {
                setCenter(center);
                setZoom(zoom);
              }}
            >
              <ZoomControl />
              {/* My Position */}
              <Marker anchor={myPosition} />
              {/* Callsign Marker */}
              {searchResult && (
                <Marker
                  anchor={[searchResult.lat, searchResult.lon]}
                  payload={searchResult.callsign}
                  color="#e03e3e"
                />
              )}
              {/* Lat/Lon Marker */}
              {latLonMarker && (
                <Marker
                  anchor={latLonMarker}
                  color="#007aff"
                />
              )}
            </Map>
          </View>
        </Flex>
      </Flex>
    </Provider>
  );
}

export default App;
