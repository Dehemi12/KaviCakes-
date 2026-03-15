import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { Filter, ChevronDown } from 'lucide-react';


const CakesPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category') || 'All';
    const initialSearch = queryParams.get('search') || '';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState(categoryParam);
    const [priceRange, setPriceRange] = useState(5000);
    const [sortBy, setSortBy] = useState('featured');
    const [categories, setCategories] = useState(['All']);

    // Sync category state with URL params
    useEffect(() => {
        setCategory(categoryParam);
    }, [categoryParam]);

    // Fetch categories from API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/public/cakes/master-data');
                // Backend returns { sizes, shapes, flavors, categories: [...] }
                if (res.data && res.data.categories) {
                    const apiCategories = res.data.categories.map(c => c.name);
                    setCategories(['All', ...apiCategories]);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                setCategories(['All']);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [category]); // Re-fetch when category changes

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Fetch from API with current filters
            // Note: For now fetching all and filtering locally or fetching by category if simple
            // Building query string
            // Fetch from API with current filters
            // Note: For now fetching all and filtering locally or fetching by category if simple
            // Building query string
            let url = `/public/cakes?`;
            if (category !== 'All') url += `categoryName=${encodeURIComponent(category)}`;

            const res = await api.get(url);
            if (res.status === 200) {
                const data = res.data;
                setProducts(data);
            } else {
                // Fallback to dummy
                setProducts([]);
            }
        } catch (err) {
            console.error(err);
            setProducts([]);
        }
        setLoading(false);
    };

    // Filter logic (Frontend side for price/sort for now)
    // Filter logic (Frontend side for price/sort for now)
    const filteredProducts = products.filter(product => {
        const matchesPrice = (product.price || product.basePrice) <= priceRange;
        const matchesCategory = category === 'All' ||
            (product.categoryName && product.categoryName.toLowerCase() === category.toLowerCase()) ||
            (product.categoryName && category.toLowerCase().includes(product.categoryName.toLowerCase())); // partial match for robust fallback
        return matchesPrice && matchesCategory;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || a.basePrice) - (b.price || b.basePrice);
        if (sortBy === 'price-high') return (b.price || b.basePrice) - (a.price || a.basePrice);
        return 0; // Default featured
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 capitalize">{category === 'All' ? 'All Cakes' : `${category} Cakes`}</h1>
                <p className="text-gray-500 mt-2">Celebrate another year with our delicious {category.toLowerCase()} cakes.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-gray-900">Filters</h3>
                            <Filter className="h-4 w-4 text-gray-500" />
                        </div>

                        {/* Category Filter */}
                        <div className="mb-8">
                            <h4 className="font-medium text-gray-700 mb-3">Categories</h4>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <label key={cat} className="flex items-center cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="category"
                                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300"
                                            checked={category.toLowerCase() === cat.toLowerCase()}
                                            onChange={() => setCategory(cat)}
                                        />
                                        <span className={`ml-3 text-sm group-hover:text-pink-600 transition-colors ${category.toLowerCase() === cat.toLowerCase() ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                            {cat === 'All' ? 'All Categories' : cat}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Price Range</h4>
                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                <span>Rs. 0</span>
                                <span>Rs. {priceRange}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10000"
                                step="100"
                                value={priceRange}
                                onChange={(e) => setPriceRange(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm text-gray-600">{sortedProducts.length} products found</p>
                        <div className="flex items-center">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm rounded-md bg-white shadow-sm"
                            >
                                <option value="featured">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-80"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {sortedProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sortedProducts.map(product => (
                                        <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
                                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                                                <img
                                                    src={product.imageUrl || 'https://placehold.co/600x600?text=No+Image'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {/* Quick Add Overlay (Optional) */}
                                            </div>
                                            <div className="p-5">
                                                <div className="text-xs text-gray-500 mb-1">{product.category}</div>
                                                <h3 className="font-bold text-gray-900 mb-2 truncate">{product.name}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{product.description || 'Delicious handcrafted cake.'}</p>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="text-lg font-bold text-pink-600">Rs. {product.price || product.basePrice}</span>
                                                    <Link to={`/cakes/${product.id}`} className="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-sm hover:shadow-md">
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="bg-gray-100 p-6 rounded-full mb-4">
                                        {/* <Empty className="h-10 w-10 text-gray-400" /> */}
                                        {/* Lucide doesn't have Empty, maybe package mismatch, use fallback icon */}
                                        <Filter className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No cakes found</h3>
                                    <p className="text-gray-500 mt-1 max-w-sm">Try adjusting your search or filter to find what you're looking for.</p>
                                    <button onClick={() => { setCategory('All'); setPriceRange(10000); }} className="mt-4 text-pink-600 font-medium hover:underline">Clear all filters</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CakesPage;
