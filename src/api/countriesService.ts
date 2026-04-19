import axiosInstance from './axiosInstance';
import { Country } from '../types';

// REST Countries API şu an 10'dan fazla field isteğine 400 döndüğü için
// listeler için sadece en kritik alanları çekiyoruz.
const LIST_FIELDS =
  'name,flags,capital,population,area,region,subregion,languages,currencies,cca3';

// Komşu ülkeler listesi için hafif bir field seti
const NEIGHBOR_FIELDS = 'name,flags,region,cca3';

export const CountriesService = {
  async getAllCountries(): Promise<Country[]> {
    const response = await axiosInstance.get<Country[]>(`/all`, {
      params: { fields: LIST_FIELDS },
    });
    return response.data;
  },

  async getByRegion(region: string): Promise<Country[]> {
    const response = await axiosInstance.get<Country[]>(`/region/${encodeURIComponent(region)}`, {
      params: { fields: LIST_FIELDS },
    });
    return response.data;
  },

  async searchByName(name: string): Promise<Country[]> {
    const response = await axiosInstance.get<Country[]>(`/name/${encodeURIComponent(name)}`, {
      params: { fields: LIST_FIELDS },
    });
    return response.data;
  },

  async getByCodes(codes: string[]): Promise<Country[]> {
    if (!codes.length) {
      return [];
    }
    const response = await axiosInstance.get<Country[]>(`/alpha`, {
      params: { codes: codes.join(','), fields: NEIGHBOR_FIELDS },
    });
    return response.data;
  },

  // Sadece borders bilgisini almak için hafif bir istek
  async getBorders(code: string): Promise<string[]> {
    const response = await axiosInstance.get<Array<Pick<Country, 'borders'>>>('/alpha/' + encodeURIComponent(code), {
      params: { fields: 'borders' },
    });
    const country = response.data[0];
    return country?.borders ?? [];
  },
};

