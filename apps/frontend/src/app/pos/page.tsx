'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ProductCatalog } from '../../components/pos/ProductCatalog';
import { CartSidebar } from '../../components/pos/CartSidebar';
import { usePOSState } from '../../hooks/usePOSState';

const CheckoutModal = dynamic(
  () => import('../../components/pos/CheckoutModal').then(mod => mod.CheckoutModal),
  { ssr: false }
);
const BannerCalculatorModal = dynamic(
  () => import('../../components/pos/BannerCalculatorModal').then(mod => mod.BannerCalculatorModal),
  { ssr: false }
);
const AISmartOrderModal = dynamic(
  () => import('../../components/pos/AISmartOrderModal').then(mod => mod.AISmartOrderModal),
  { ssr: false }
);
const ReceiptModal = dynamic(
  () => import('../../components/pos/ReceiptModal').then(mod => mod.ReceiptModal),
  { ssr: false }
);

export default function POSPage() {
  const {
    products,
    categories,
    customers,
    rawMaterials,
    availableAddons,
    activeCategoryId,
    setActiveCategoryId,
    searchTerm,
    setSearchTerm,
    loading,
    cart,
    setCart,
    selectedCustomer,
    setSelectedCustomer,
    customCustomerName,
    setCustomCustomerName,
    discountAmount,
    setDiscountAmount,
    showCheckoutModal,
    setShowCheckoutModal,
    payAmount,
    setPayAmount,
    paymentStatus,
    setPaymentStatus,
    paymentMethod,
    setPaymentMethod,
    estimatedDoneAt,
    setEstimatedDoneAt,
    submitting,
    invoiceData,
    setInvoiceData,
    showCalcModal,
    setShowCalcModal,
    showAIModal,
    setShowAIModal,
    subtotal,
    total,
    handleSearch,
    addToCart,
    updateMaterials,
    handleToggleAddon,
    handleUpdateAddonQty,
    updateQty,
    updatePrice,
    updateDimensions,
    removeFromCart,
    clearCart,
    handleOpenCheckout,
    handleProcessTransaction,
    handleApplyAIItems,
  } = usePOSState();

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Product Catalog Section */}
        <div className="flex-1 w-full min-w-0">
          <ProductCatalog
            products={products}
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={setActiveCategoryId}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearchSubmit={handleSearch}
            onAddToCart={addToCart}
            loading={loading}
            cart={cart}
            onOpenBannerCalc={() => setShowCalcModal(true)}
            onOpenAIModal={() => setShowAIModal(true)}
          />
        </div>

        {/* Cart & Billing Sidebar */}
        <CartSidebar
          cart={cart}
          customers={customers}
          availableAddons={availableAddons}
          rawMaterials={rawMaterials}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          customCustomerName={customCustomerName}
          onCustomCustomerNameChange={setCustomCustomerName}
          onUpdateQty={updateQty}
          onUpdatePrice={updatePrice}
          onUpdateDimensions={updateDimensions}
          onUpdateMaterials={updateMaterials}
          onToggleAddon={handleToggleAddon}
          onUpdateAddonQty={handleUpdateAddonQty}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          discountAmount={discountAmount}
          onDiscountChange={setDiscountAmount}
          subtotal={subtotal}
          total={total}
          onOpenCheckout={handleOpenCheckout}
        />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        total={total}
        customerName={selectedCustomer ? selectedCustomer.name : (customCustomerName.trim() || 'Pelanggan Umum')}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={setPaymentStatus}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        payAmount={payAmount}
        onPayAmountChange={setPayAmount}
        estimatedDoneAt={estimatedDoneAt}
        onEstimatedDoneAtChange={setEstimatedDoneAt}
        submitting={submitting}
        onSubmit={handleProcessTransaction}
      />

      {/* Banner Spanduk Meteran Calculator Modal */}
      <BannerCalculatorModal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        products={products}
        onAddToCart={item => {
          const existing = cart.find(c => c.product.id === item.product.id);
          if (existing) {
            setCart(cart.map(c => c.product.id === item.product.id ? { 
              ...c, 
              qty: c.qty + item.qty, 
              price: item.price,
              length: item.length,
              width: item.width
            } : c));
          } else {
            setCart([...cart, item]);
          }
        }}
      />

      {/* AI Smart Order Modal */}
      <AISmartOrderModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        products={products}
        onApplyItems={handleApplyAIItems}
      />

      {/* Receipt Modal */}
      {invoiceData && (
        <ReceiptModal
          invoiceData={invoiceData}
          onClose={() => setInvoiceData(null)}
        />
      )}
    </DashboardLayout>
  );
}
