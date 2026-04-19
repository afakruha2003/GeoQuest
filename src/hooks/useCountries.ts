import { useEffect, useMemo, useState } from 'react';
import { CountriesService } from '../api/countriesService';
import { Country } from '../types';

type SortBy = 'name' | 'population' | 'area';

interface UseCountriesState {
  allCountries: Country[];
  filteredCountries: Country[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedRegion: string;
  setSelectedRegion: (r: string) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  refresh: () => Promise<void>;
  getCountryByCode: (code: string) => Country | undefined;
  getNeighbors: (codes: string[]) => Country[];
}

export function useCountries(): UseCountriesState {
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('Tümü');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  async function loadCountries() {
    try {
      setLoading(true);
      setError(null);
      const data = await CountriesService.getAllCountries();
      setAllCountries(data);
    } catch {
      setError('Veriler yüklenemedi, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCountries();
  }, []);

  const filteredCountries = useMemo(() => {
    let result = [...allCountries];

    if (selectedRegion !== 'Tümü') {
      result = result.filter((c) => c.region === selectedRegion);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => c.name.common.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'population':
        result.sort((a, b) => b.population - a.population);
        break;
      case 'area':
        result.sort((a, b) => b.area - a.area);
        break;
      case 'name':
      default:
        result.sort((a, b) => a.name.common.localeCompare(b.name.common));
        break;
    }

    return result;
  }, [allCountries, searchQuery, selectedRegion, sortBy]);

  const getCountryByCode = (code: string): Country | undefined => {
    return allCountries.find((c) => c.cca3 === code);
  };

  const getNeighbors = (codes: string[]): Country[] => {
    if (!codes.length) return [];
    return allCountries.filter((c) => codes.includes(c.cca3));
  };

  return {
    allCountries,
    filteredCountries,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedRegion,
    setSelectedRegion,
    sortBy,
    setSortBy,
    refresh: loadCountries,
    getCountryByCode,
    getNeighbors,
  };
}

