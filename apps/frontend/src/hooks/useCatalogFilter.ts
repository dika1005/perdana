import { useState, useMemo, useCallback } from 'react';
import { PublicCatalog, PublicProduct } from '../services/publicService';
import { PRESET_SERVICES } from '../data/landingData';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'custom_size';

export interface CleanCategory {
  id: number;
  name: string;
  count: number;
}

export function useCatalogFilter(catalog: PublicCatalog | null) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<number | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Clean and group categories
  const cleanCategories = useMemo<CleanCategory[]>(() => {
    if (!catalog) return [];

    const categoryMap = new Map<number, CleanCategory>();

    catalog.categories.forEach((c) => {
      let cleanName = c.name.replace(/\s*\d{10,}.*$/, '').trim();
      if (!cleanName) cleanName = 'Kategori Umum';

      const count = catalog.products.filter((p: PublicProduct) => p.category_id === c.id).length;
      if (count > 0) {
        categoryMap.set(c.id, { id: c.id, name: cleanName, count });
      }
    });

    return Array.from(categoryMap.values());
  }, [catalog]);

  // Lookup map for fast category name resolution
  const categoryNameMap = useMemo(() => {
    const map = new Map<number, string>();
    if (!catalog) return map;
    catalog.categories.forEach((c) => {
      const cleanName = c.name.replace(/\s*\d{10,}.*$/, '').trim();
      map.set(c.id, cleanName || c.name);
    });
    return map;
  }, [catalog]);

  const getCategoryName = useCallback((id: number | null | undefined): string | null => {
    if (id === null || id === undefined) return null;
    return categoryNameMap.get(id) || null;
  }, [categoryNameMap]);

  // Main filtered & sorted product list
  const processedProducts = useMemo(() => {
    if (!catalog) return [];

    let list = [...catalog.products];

    // Filter by active category ID
    if (activeCategoryId !== undefined) {
      list = list.filter((p) => p.category_id === activeCategoryId);
    }

    // Filter by service card keyword if selected
    if (selectedServiceId) {
      const service = PRESET_SERVICES.find((s) => s.id === selectedServiceId);
      if (service) {
        const keywords = service.matchKeyword.split(',');
        list = list.filter((p) => {
          const nameLower = p.name.toLowerCase();
          return keywords.some((k) => nameLower.includes(k.trim()));
        });
      }
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Sort
    // Harga CUSTOM (nego) tidak punya angka pembanding yang jujur —
    // selalu diletakkan paling akhir pada pengurutan berbasis harga.
    const priceOf = (p: PublicProduct, edge: 'min' | 'max'): number | null =>
      p.price_type === 'CUSTOM'
        ? null
        : p.price_type === 'RANGE'
          ? (edge === 'min' ? p.min_price : p.max_price)
          : p.default_price;
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => {
          const priceA = priceOf(a, 'min');
          const priceB = priceOf(b, 'min');
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        list.sort((a, b) => {
          const priceA = priceOf(a, 'max');
          const priceB = priceOf(b, 'max');
          if (priceA === null && priceB === null) return 0;
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceB - priceA;
        });
        break;
      case 'name_asc':
        list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
        break;
      case 'name_desc':
        list.sort((a, b) => b.name.localeCompare(a.name, 'id'));
        break;
      case 'custom_size':
        list.sort((a, b) => {
          const unitOf = (p: PublicProduct) => (p.unit_name || '').trim().toLowerCase();
          const aIsCustomSize = ['m2', 'm²', 'sqm', 'meter_persegi', 'meter persegi'].includes(unitOf(a)) || unitOf(a) === 'meter' || unitOf(a) === 'm' || a.price_type === 'CUSTOM' ? 1 : 0;
          const bIsCustomSize = ['m2', 'm²', 'sqm', 'meter_persegi', 'meter persegi'].includes(unitOf(b)) || unitOf(b) === 'meter' || unitOf(b) === 'm' || b.price_type === 'CUSTOM' ? 1 : 0;
          return bIsCustomSize - aIsCustomSize;
        });
        break;
      default:
        break;
    }

    return list;
  }, [catalog, activeCategoryId, selectedServiceId, searchTerm, sortBy]);

  const resetAllFilters = useCallback(() => {
    setActiveCategoryId(undefined);
    setSelectedServiceId(null);
    setSearchTerm('');
    setSortBy('default');
  }, []);

  const selectService = useCallback((serviceId: string | null) => {
    setSelectedServiceId((prev) => (prev === serviceId ? null : serviceId));
    setActiveCategoryId(undefined);
  }, []);

  const isFilteringActive = activeCategoryId !== undefined || !!selectedServiceId || !!searchTerm || sortBy !== 'default';

  return {
    searchTerm,
    setSearchTerm,
    activeCategoryId,
    setActiveCategoryId,
    selectedServiceId,
    setSelectedServiceId,
    selectService,
    sortBy,
    setSortBy,
    cleanCategories,
    getCategoryName,
    processedProducts,
    resetAllFilters,
    isFilteringActive
  };
}
