import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Customer Pages
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { Checkout } from './pages/Checkout';
import { OrderConfirmed } from './pages/OrderConfirmed';
import { About } from './pages/About';

// Admin Pages
import { Login } from './pages/admin/Login';
import { Dashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/Products';
import { Orders } from './pages/admin/Orders';
import { DeliveryPricing } from './pages/admin/DeliveryPricing';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-brand-dark">
          {/* Header */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-grow">
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmed" element={<OrderConfirmed />} />
              <Route path="/about" element={<About />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/delivery" element={<DeliveryPricing />} />

              {/* Fallback redirect */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
