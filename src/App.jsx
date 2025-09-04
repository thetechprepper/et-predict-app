import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionButton,
  ButtonGroup,
  defaultTheme,
  Content,
  Flex,
  Item,
  Provider,
  Text,
  View,
} from '@adobe/react-spectrum';
import Minimize from '@spectrum-icons/workflow/Minimize';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { isValidLatLon } from './utils';
import { ADSB_SERVICE, AIRCRAFT_SERVICE, GEO_SERVICE, MAP_SERVICE } from './config';
import MyPosition from './MyPosition.jsx';
import './App.css';

function App() {

  const [myPosition, setMyPosition] = useState([33.0, -112.0]);
  const [center, setCenter] = useState([33.0, -112.0]);
  const [zoom, setZoom] = useState(10);

  const [useFallback, setUseFallback] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aircraftList, setAircraftList] = useState([]);
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedAircraftData, setSelectedAircraftData] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(new Set());

  useEffect(() => {
    const fetchDefaultGrid = async () => {
      try {
        const response = await fetch(GEO_SERVICE);
        if (!response.ok) throw new Error('Failed to fetch default location from et-api');
        const data = await response.json();
        if (isValidLatLon(data)) {
	  const { lat, lon } = data.position;
          setMyPosition([lat, lon]);
          setCenter([lat, lon]);
        }
      } catch (err) {
        console.warn('Could not load default location from GPS or user config:', err);
      }
    };

    fetchDefaultGrid();
  }, []);

  const [tileBaseUrl, setTileBaseUrl] = useState(null);

  // Load map tile service info on mount
  useEffect(() => {
    async function fetchMapServices() {
      try {
        const response = await fetch(MAP_SERVICE);
        const services = await response.json();
        if (services.length > 0) {
          setTileBaseUrl(services[0].url);
        } else {
          console.warn('No map tile services found.');
          setUseFallback(true);
        }
      } catch (err) {
        console.error('Failed to fetch map services:', err);
        setUseFallback(true);s
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

  return (
    <Provider theme={defaultTheme}>
      <Flex direction="column" height="100vh">
        {/* Content: Sidebar + Map */}
        <Flex direction="row" flexGrow={1}>
          {/* Sidebar */}
          {sidebarOpen && (
            <View width="65%" backgroundColor="gray-100" padding="size-200">
              <Flex direction="column" gap="size-200">
		<Flex direction="row" gap="size-200">
                  <ActionButton onPress={() => setSidebarOpen(false)} aria-label="Hide Panel">
                    <Minimize/><Text>Hide</Text>
                  </ActionButton>

		  <MyPosition
                    setMyPosition={setMyPosition}
                    setCenter={setCenter}
                    showText={true}
                  />

		</Flex>

              </Flex>
            </View>
          )}

          {/* Toggle Button if Sidebar is hidden */}
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
            <Map 
              attributionPrefix="The Tech Prepper | Pigeon Maps"
              provider={mapTiler}
              height="100%"
              center={center}
              zoom={zoom}
              minZoom={2}
              maxZoom={11}
              onBoundsChanged={({ center, zoom }) => { 
                setCenter(center) 
                setZoom(zoom) 
              }} 
            >

              <ZoomControl />
              <Marker anchor={myPosition} />

            </Map>
          </View>
        </Flex>
      </Flex>
    </Provider>
  )
}

export default App
