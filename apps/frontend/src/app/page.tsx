'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { publicService, PublicCatalog } from '../services/publicService';
import { useCatalogFilter } from '../hooks/useCatalogFilter';
import { TopTicker } from '../components/landing/TopTicker';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeatureHighlights } from '../components/landing/FeatureHighlights';
import { ServiceShowcase } from '../components/landing/ServiceShowcase';
import { OrderWorkflow } from '../components/landing/OrderWorkflow';
import { CatalogSection } from '../components/landing/CatalogSection';
import { FaqSection } from '../components/landing/FaqSection';
import { CtaBanner } from '../components/landing/CtaBanner';
import { LandingFooter } from '../components/landing/LandingFooter';
import { FloatingWhatsApp } from '../components/shared/FloatingWhatsApp';

export default function HomePage() {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const catalogRef = useRef<HTMLDivElement>(null);

  // Filter & sorting hook
  const {
    searchTerm,
    setSearchTerm,
    activeCategoryId,
    setActiveCategoryId,
    selectedServiceId,
    selectService,
    sortBy,
    setSortBy,
    cleanCategories,
    getCategoryName,
    processedProducts,
    resetAllFilters,
    isFilteringActive
  } = useCatalogFilter(catalog);

  // Sync theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const nextDark = !prev;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return nextDark;
    });
  }, []);

  // Fetch public catalog
  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await publicService.getCatalog();
      setCatalog(data);
    } catch (err: any) {
      console.error('Failed to load public catalog:', err);
      setError('Gagal memuat katalog produk. Pastikan server backend aktif.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const scrollToCatalog = useCallback(() => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-[150px] animate-pulse-subtle" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[150px] animate-float-slow" />
        <div className="absolute bottom-10 left-1/4 w-[650px] h-[650px] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[160px] animate-float-reverse" />
      </div>

      <TopTicker />

      <LandingNavbar
        storeName={catalog?.store.name}
        storePhone={catalog?.store.phone}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onScrollToCatalog={scrollToCatalog}
      />

      <HeroSection
        store={catalog?.store}
        onScrollToCatalog={scrollToCatalog}
      />

      <FeatureHighlights />

      <ServiceShowcase
        selectedServiceId={selectedServiceId}
        onSelectService={selectService}
        onScrollToCatalog={scrollToCatalog}
      />

      <OrderWorkflow />

      <CatalogSection
        catalogRef={catalogRef}
        loading={loading}
        error={error}
        catalog={catalog}
        processedProducts={processedProducts}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeCategoryId={activeCategoryId}
        onCategoryChange={setActiveCategoryId}
        sortBy={sortBy}
        onSortChange={setSortBy}
        cleanCategories={cleanCategories}
        selectedServiceId={selectedServiceId}
        onClearServiceFilter={() => selectService(null)}
        getCategoryName={getCategoryName}
        resetAllFilters={resetAllFilters}
        isFilteringActive={isFilteringActive}
        onRetry={fetchCatalog}
      />

      <FaqSection />

      <CtaBanner
        store={catalog?.store}
        onScrollToCatalog={scrollToCatalog}
      />

      <LandingFooter
        store={catalog?.store}
        onScrollToCatalog={scrollToCatalog}
      />

      <FloatingWhatsApp phone={catalog?.store.phone} />
    </div>
  );
}
