import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Database, Search, Sparkles, Utensils } from 'lucide-react';

export default function FoodDatabase({ authToken, onBack, onSelectProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadProducts = async () => {
      if (!authToken) {
        setIsLoading(false);
        setError('Sign in again to view the food database.');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const query = searchTerm.trim()
          ? `?search=${encodeURIComponent(searchTerm.trim())}`
          : '';
        const response = await fetch(`http://localhost:5000/scans/database${query}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Failed to load products');
        const data = await response.json();
        if (isMounted) setProducts(Array.isArray(data) ? data : []);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          console.error(loadError);
          if (isMounted) setError('Could not load scanned products.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(loadProducts, searchTerm ? 250 : 0);

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [authToken, searchTerm]);

  const productCountLabel = useMemo(() => {
    if (isLoading) return 'Loading products';
    if (products.length === 1) return '1 shared product';
    return `${products.length} shared products`;
  }, [isLoading, products.length]);

  return (
    <div className="food-db-page">
      <section className="food-db-shell" aria-label="Food database">
        <header className="food-db-header">
          <button type="button" onClick={onBack} aria-label="Back to dashboard">
            <ArrowLeft size={20} />
          </button>
          <div>
            <span>FitScan</span>
            <h1>Food Database</h1>
          </div>
          <Database size={22} />
        </header>

        <section className="food-db-hero">
          <div>
            <strong>{productCountLabel}</strong>
            <p>Search products scanned by everyone, then analyze one for your own health profile.</p>
          </div>
          <Sparkles size={24} />
        </section>

        <div className="food-db-search">
          <Search size={18} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search any scanned product"
            aria-label="Search scanned products"
          />
        </div>

        {error && <p className="food-db-error">{error}</p>}

        <div className="food-db-list" aria-label="Scanned products">
          {isLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <div className="food-db-skeleton" key={index} />
            ))
          ) : products.length ? (
            products.map((product) => (
              <button
                className="food-db-card"
                key={`${product.brands}-${product.product_name}-${product.id}`}
                type="button"
                onClick={() => onSelectProduct(product)}
              >
                <span className="food-db-mark">
                  <Utensils size={18} />
                </span>
                <span className="food-db-copy">
                  <strong>{product.product_name || 'Unknown Product'}</strong>
                  <small>{product.brands || 'Unknown Brand'}</small>
                </span>
                <span className="food-db-score">{product.latest_score || '--'}</span>
              </button>
            ))
          ) : (
            <div className="food-db-empty">
              <Database size={28} />
              <strong>No products found</strong>
              <span>Try another search or scan a product first.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
