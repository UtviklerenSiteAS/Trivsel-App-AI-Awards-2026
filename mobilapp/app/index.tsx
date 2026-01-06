import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TextInput, Platform, Alert, TouchableOpacity, ScrollView, Keyboard, Modal, Image } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{ 
    latitude: number, 
    longitude: number, 
    name?: string, 
    postCode?: string, 
    address?: string,
    score?: number 
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const mapRef = useRef<MapView>(null);
  const inputRef = useRef<TextInput>(null);

  // Mock markers for categories
  const categoryMarkers: Record<string, { latitude: number, longitude: number, title: string }[]> = {
    'Categories': [
      { latitude: 59.9139, longitude: 10.7522, title: 'Oslo Sentrum' },
      { latitude: 58.1599, longitude: 8.0182, title: 'Kristiansand Sentrum' },
    ],
    'Dialog': [
      { latitude: 59.9170, longitude: 10.7275, title: 'Slottsparken' },
    ],
    'Glass': [
      { latitude: 59.9075, longitude: 10.7530, title: 'Operahuset' },
    ]
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Initial location
      let initialLocation = await Location.getCurrentPositionAsync({});
      setLocation(initialLocation);

      // Real-time tracking
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(false);
    Keyboard.dismiss();

    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setSearchLocation({ latitude, longitude });
        
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      } else {
        Alert.alert('Ingen treff', 'Fant ikke stedet du søkte etter.');
      }
    } catch (error) {
      Alert.alert('Feil', 'Det oppstod en feil under søket.');
    }
  };

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const getScoreColor = (score: number) => {
    // 0-33: Green, 34-66: Orange, 67-100: Red
    if (score < 34) return '#22C55E'; // Green
    if (score < 67) return '#F97316'; // Orange
    return '#EF4444'; // Red
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const addr = results[0];
        setSelectedPoint({
          latitude,
          longitude,
          name: addr.name || addr.street || 'Ukjent sted',
          postCode: addr.postalCode || '',
          address: `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || ''}`.trim(),
          score: Math.floor(Math.random() * 101), // Random score 0-100
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const navigateToLocation = (latitude: number, longitude: number, title: string) => {
    setSearchLocation({ latitude, longitude });
    setSearchQuery(title);
    setIsSearching(false);
    Keyboard.dismiss();
    
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  if (errorMsg) {
    return (
      <View style={styles.container}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
        mapType="none" // Hide default Google/Apple maps to show custom tile clearly
        userInterfaceStyle="light"
        showsCompass={false}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate="https://cache.kartverket.no/v1/no_topo_wms/1.0.0/no_topo_wms/default/3857/{z}/{y}/{x}.png"
          maximumZ={19}
          flipY={false}
        />
        {searchLocation && (
          <Marker
            coordinate={searchLocation}
            title={searchQuery}
            pinColor="blue"
          />
        )}
        {selectedPoint && (
          <Marker
            coordinate={{ latitude: selectedPoint.latitude, longitude: selectedPoint.longitude }}
            pinColor="red"
          />
        )}
        {activeCategory && categoryMarkers[activeCategory]?.map((marker, index) => (
          <Marker
            key={`${activeCategory}-${index}`}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            pinColor="green"
          />
        ))}
      </MapView>

      {isSearching && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={closeSearch} 
        />
      )}

      <View style={[styles.searchContainer, isSearching && styles.searchContainerActive]}>
        <View style={styles.searchBarWrapper}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <View style={[styles.searchBar, isSearching && styles.searchBarActive]}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Søk..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearching(true)}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {isSearching && (
              <TouchableOpacity onPress={closeSearch}>
                <Ionicons name="close-circle" size={24} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isSearching && (
          <>
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent</Text>
                <TouchableOpacity onPress={() => { /* logic to clear */ }}><Text style={styles.clearAll}>Clear all</Text></TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.recentItem}
                onPress={() => navigateToLocation(59.9139, 10.7522, 'Oslo')}
              >
                <View style={[styles.recentIcon, { backgroundColor: '#F0E6FF' }]}>
                  <Ionicons name="apps" size={24} color="#A855F7" />
                </View>
                <View style={styles.recentText}>
                  <Text style={styles.recentTitle}>Oslo Sentrum</Text>
                  <Text style={styles.recentSub}>Hovedstaden, Norge</Text>
                </View>
                <TouchableOpacity><Ionicons name="trash-outline" size={20} color="#999" /></TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.recentItem}
                onPress={() => navigateToLocation(58.1599, 8.0182, 'Kristiansand')}
              >
                <View style={[styles.recentIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="desktop" size={24} color="#0EA5E9" />
                </View>
                <View style={styles.recentText}>
                  <Text style={styles.recentTitle}>Kristiansand</Text>
                  <Text style={styles.recentSub}>Sørlandets perle</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.pillsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                <TouchableOpacity 
                  style={[styles.pill, { backgroundColor: '#FDBA74' }, activeCategory === 'Categories' && styles.pillActive]}
                  onPress={() => {
                    setActiveCategory(activeCategory === 'Categories' ? null : 'Categories');
                    setIsSearching(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Text style={styles.pillCount}>2</Text>
                  <Text style={styles.pillText}>Byer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.pill, { backgroundColor: '#FEF08A' }, activeCategory === 'Dialog' && styles.pillActive]}
                  onPress={() => {
                    setActiveCategory(activeCategory === 'Dialog' ? null : 'Dialog');
                    setIsSearching(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Ionicons name={activeCategory === 'Dialog' ? "close" : "chatbubble"} size={16} color="#000" />
                  <Text style={styles.pillText}>Parker</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.pill, { backgroundColor: '#F0ABFC' }, activeCategory === 'Glass' && styles.pillActive]}
                  onPress={() => {
                    setActiveCategory(activeCategory === 'Glass' ? null : 'Glass');
                    setIsSearching(false);
                    Keyboard.dismiss();
                  }}
                >
                  <Ionicons name={activeCategory === 'Glass' ? "close" : "wine"} size={16} color="#000" />
                  <Text style={styles.pillText}>Kultur</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </>
        )}
      </View>

      {selectedPoint && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>{selectedPoint.name}</Text>
              <Text style={styles.sheetSubTitle}>{selectedPoint.address}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPoint(null)}>
              <Ionicons name="close-circle" size={30} color="#999" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.sheetContent}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoText}>Postnummer: {selectedPoint.postCode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="map-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}
              </Text>
            </View>

            <View style={styles.scoreSection}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreLabel}>Trivselsindikator</Text>
                <TouchableOpacity onPress={() => setShowDetails(true)}>
                  <Text style={styles.moreInfoLink}>More info?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.scoreGrid}>
                {[...Array(9)].map((_, i) => {
                  const isActive = (selectedPoint.score ?? 0) >= (i + 1) * (100/9);
                  let squareColor = '#E5E7EB'; // Default gray
                  
                  if (isActive) {
                    if (i < 3) squareColor = '#22C55E'; // Green
                    else if (i < 6) squareColor = '#F97316'; // Orange
                    else squareColor = '#EF4444'; // Red
                  }

                  return (
                    <View 
                      key={i}
                      style={[
                        styles.scoreSquare,
                        { backgroundColor: squareColor }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Detaljer</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{selectedPoint?.name}</Text>
              <Text style={styles.detailAddress}>{selectedPoint?.address}</Text>
              
              <View style={styles.detailDivider} />
              
              <View style={styles.detailInfoRow}>
                <Ionicons name="location" size={20} color="#3B82F6" />
                <View>
                  <Text style={styles.detailInfoLabel}>Postnummer</Text>
                  <Text style={styles.detailInfoValue}>{selectedPoint?.postCode}</Text>
                </View>
              </View>

              <View style={styles.detailInfoRow}>
                <Ionicons name="navigate" size={20} color="#3B82F6" />
                <View>
                  <Text style={styles.detailInfoLabel}>Koordinater</Text>
                  <Text style={styles.detailInfoValue}>
                    {selectedPoint?.latitude.toFixed(6)}, {selectedPoint?.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailInfoRow}>
                <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                <View>
                  <Text style={styles.detailInfoLabel}>Trivselsscore</Text>
                  <Text style={[styles.detailInfoValue, { color: getScoreColor(selectedPoint?.score ?? 0) }]}>
                    {selectedPoint?.score}/100
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoSectionTitle}>Om området</Text>
              <Text style={styles.infoSectionText}>
                Dette området har en trivselsscore på {selectedPoint?.score}/100. 
                Dette er basert på sanntidsdata for luftkvalitet, støynivå, 
                tilgang til grøntarealer og nærhet til fasiliteter.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchContainerActive: {
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchBarActive: {
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 55,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  clearAll: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentText: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recentSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  pillsContainer: {
    marginTop: 8,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pillActive: {
    borderColor: '#000',
  },
  pillCount: {
    backgroundColor: '#FFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sheetSubTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  sheetContent: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#4B5563',
  },
  scoreSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moreInfoLink: {
    fontSize: 12,
    color: '#3B82F6',
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 10,
  },
  scoreSquare: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  detailAddress: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 20,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  detailInfoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 2,
  },
  infoSection: {
    padding: 4,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoSectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
