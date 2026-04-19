import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { useCountries } from '../hooks/useCountries';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SearchBar } from '../components/SearchBar';
import { FilterChip } from '../components/FilterChip';
import { CountryCard } from '../components/CountryCard';
import { userStore } from '../store/userStore';
import { Country } from '../types';

type LayoutMode = 'grid' | 'list';

const REGIONS: { key: string; label: string }[] = [
  { key: 'Tümü', label: 'Tümü' },
  { key: 'Africa', label: 'Afrika' },
  { key: 'Europe', label: 'Avrupa' },
  { key: 'Asia', label: 'Asya' },
  { key: 'Americas', label: 'Amerika' },
  { key: 'Oceania', label: 'Okyanusya' },
];

const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialRegion: string | undefined = route.params?.region;

  const {
    filteredCountries,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    sortBy,
    setSortBy,
  } = useCountries();

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [searchText, setSearchText] = useState<string>(searchQuery);
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [kesfedilenCodes, setKesfedilenCodes] = useState<string[]>([]);

  useEffect(() => {
    if (initialRegion) {
      setSelectedRegion(initialRegion);
    }
  }, [initialRegion, setSelectedRegion]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadDiscovered = async () => {
        const codes = await userStore.getKesfedilenCodes();
        if (isActive) {
          setKesfedilenCodes(codes);
        }
      };

      void loadDiscovered();

      return () => {
        isActive = false;
      };
    }, []),
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchText);
      setVisibleCount(20);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText, setSearchQuery]);

  const data = useMemo(
    () => filteredCountries.slice(0, visibleCount),
    [filteredCountries, visibleCount],
  );

  const handleEndReached = () => {
    if (visibleCount < filteredCountries.length) {
      setVisibleCount((prev) => prev + 20);
    }
  };

  const handlePressCountry = (country: Country) => {
    navigation.navigate('CountryDetail', { code: country.cca3 });
  };

  const renderItem = ({ item }: { item: Country }) => (
    <CountryCard
      country={item}
      discovered={kesfedilenCodes.includes(item.cca3)}
      layout={layoutMode}
      onPress={() => handlePressCountry(item)}
    />
  );

  const keyExtractor = (item: Country) => item.cca3;

  const numColumns = layoutMode === 'grid' ? 2 : 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ülkeleri Keşfet</Text>
        <Text style={styles.subtitle}>Dünyanın dört bir yanını filtrele, ara ve incele.</Text>
      </View>

      <View style={styles.searchSection}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Ülke adıyla ara..."
        />
      </View>

      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={REGIONS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              active={selectedRegion === item.key}
              onPress={() => setSelectedRegion(item.key)}
            />
          )}
          contentContainerStyle={styles.regionList}
        />
      </View>

      <View style={styles.toolbar}>
        <View style={styles.sortRow}>
          <Text style={styles.toolbarLabel}>Sırala:</Text>
          <FilterChip
            label="A-Z"
            active={sortBy === 'name'}
            onPress={() => setSortBy('name')}
          />
          <FilterChip
            label="Nüfus"
            active={sortBy === 'population'}
            onPress={() => setSortBy('population')}
          />
          <FilterChip
            label="Yüzölçüm"
            active={sortBy === 'area'}
            onPress={() => setSortBy('area')}
          />
        </View>
        <View style={styles.viewToggleRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.viewToggle, layoutMode === 'grid' && styles.viewToggleActive]}
            onPress={() => setLayoutMode('grid')}
          >
            <Text style={[styles.viewToggleText, layoutMode === 'grid' && styles.viewToggleTextActive]}>
              Grid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.viewToggle, layoutMode === 'list' && styles.viewToggleActive]}
            onPress={() => setLayoutMode('list')}
          >
            <Text style={[styles.viewToggleText, layoutMode === 'list' && styles.viewToggleTextActive]}>
              Liste
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <LoadingSpinner fullscreen />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredCountries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Ülke bulunamadı</Text>
          <Text style={styles.emptySubtitle}>
            Farklı bir arama dene ya da filtreleri temizle.
          </Text>
        </View>
      ) : (
        <FlatList
          key={layoutMode}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.fontSizeXL,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    marginTop: spacing.xs,
  },
  searchSection: {
    marginBottom: spacing.md,
  },
  filtersRow: {
    marginBottom: spacing.sm,
  },
  regionList: {
    paddingRight: spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toolbarLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    marginRight: spacing.sm,
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  viewToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  viewToggleActive: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  viewToggleText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
  viewToggleTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.fontSizeMD,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.fontSizeLG,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default ExploreScreen;

