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
      let cleanName = c.name.replace(/\s*\d{10,}.*$/, '').trim();
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
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => {
          const priceA = a.price_type === 'RANGE' ? a.min_price : a.default_price;
          const priceB = b.price_type === 'RANGE' ? b.min_price : b.default_price;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        list.sort((a, b) => {
          const priceA = a.price_type === 'RANGE' ? a.max_price : a.default_price;
          const priceB = b.price_type === 'RANGE' ? b.max_price : b.default_price;
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
          const aIsCustom = a.price_type === 'CUSTOM' || a.unit_name?.toLowerCase().includes('meter') ? 1 : 0;
          const bIsCustom = b.price_type === 'CUSTOM' || b.unit_name?.toLowerCase().includes('meter') ? 1 : 0;
          return bIsCustom - aIsCustom;
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
