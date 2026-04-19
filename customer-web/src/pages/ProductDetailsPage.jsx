import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Heart, ShoppingBag, ArrowLeft, CheckCircle, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';


const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();

    // Mock product data (replace with API fetch later)
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [size, setSize] = useState('');
    const [flavor, setFlavor] = useState('');
    const [shape, setShape] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState('');
    const [currentPrice, setCurrentPrice] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    
    // Popup state
    const [showCartPopup, setShowCartPopup] = useState(false);

    useEffect(() => {
        const checkWishlist = async () => {
            if (product && user) {
                try {
                    const response = await api.get(`/wishlist/status/${product.id}`);
                    setIsWishlisted(response.data.isWishlisted);
                } catch (error) {
                    console.error("Failed to check wishlist status", error);
                }
            }
        };
        checkWishlist();
    }, [product, user]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/public/cakes/${id}`);
                const found = response.data;

                // Start: Transform API data structure to match UI expectations
                // API has variants as array of objects { size: {}, shape: {}, flavor: {}, price: number }
                // UI expects variants: { sizes: [], flavors: [], shapes: [] }

                // We will extract unique options from variants to populate selectors
                // and then look up the specific variant price when selected.

                if (found) {
                    const sizes = [...new Set(found.variants.map(v => JSON.stringify(v.size)))].map(s => JSON.parse(s));
                    const shapes = [...new Set(found.variants.map(v => JSON.stringify(v.shape)))].map(s => JSON.parse(s));
                    const flavors = [...new Set(found.variants.map(v => JSON.stringify(v.flavor)))].map(s => JSON.parse(s));

                    const transformedProduct = {
                        ...found,
                        price: found.basePrice, // default
                        image: found.imageUrl,
                        variants: {
                            original: found.variants, // keep original for lookup
                            sizes: sizes.map(s => ({ label: s.label, priceMod: s.price })), // Assuming size.price is the extra cost
                            shapes: shapes.map(s => ({ label: s.label, priceMod: s.price })),
                            flavors: flavors.map(s => ({ label: s.label, priceMod: s.price }))
                        },
                        allergens: found.ingredients ? found.ingredients.split(',').map(i => i.trim()) : ['Eggs', 'Dairy', 'Gluten'] // Adapt if necessary
                    };

                    setProduct(transformedProduct);

                    // Set Defaults
                    const defaultSize = sizes.length > 0 ? sizes[0].label : '';
                    const defaultFlavor = flavors.length > 0 ? flavors[0].label : '';
                    const defaultShape = shapes.length > 0 ? shapes[0].label : '';

                    setSize(defaultSize);
                    setFlavor(defaultFlavor);
                    setShape(defaultShape);

                    // Initial Price Calculation based on defaults
                    // Try to find the matching variant for defaults
                    const match = found.variants.find(v =>
                        v.size.label === defaultSize &&
                        v.shape.label === defaultShape &&
                        v.flavor.label === defaultFlavor
                    );

                    if (match) {
                        setCurrentPrice(match.price || found.basePrice);
                    } else {
                        setCurrentPrice(found.price || found.basePrice);
                    }
                } else {
                    setProduct(null);
                }
            } catch (error) {
                console.error("Failed to fetch cake details", error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Update price when size, flavor, or shape changes
    useEffect(() => {
        if (product && product.variants && product.variants.original) {
            // Find specific variant logic
            // In docData, variants are specific combinations.
            // We try to find the match.
            const match = product.variants.original.find(v =>
                v.size.label === size &&
                v.shape.label === shape &&
                v.flavor.label === flavor
            );

            if (match) {
                setCurrentPrice(match.price || product.basePrice);
            } else {
                // Approximate fallback if exact combo not found (summing modifiers)
                // This handles cases where user selects a combination that wasn't explicitly defined
                const selectedSize = product.variants.sizes.find(s => s.label === size);
                const selectedFlavor = product.variants.flavors.find(f => f.label === flavor);
                const selectedShape = product.variants.shapes.find(s => s.label === shape);

                let price = product.basePrice;
                // Note: The backend logic for 'basePrice' + modifiers might differ from this frontend approximation.
                // Ideally backend sends fully computed variants.
                // If match is found, we use it. If not, we fall back to this sum.

                if (selectedSize) price += (selectedSize.priceMod || 0);
                if (selectedFlavor) price += (selectedFlavor.priceMod || 0);
                if (selectedShape) price += (selectedShape.priceMod || 0);

                setCurrentPrice(price);
            }
        }
    }, [size, flavor, shape, product]);

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        if (!product) return;

        // Find the specific variant ID
        const match = product.variants.original.find(v =>
            v.size.label === size &&
            v.shape.label === shape &&
            v.flavor.label === flavor
        );

        const variant = {
            id: match ? match.id : null, // Pass the database ID of the variant
            size,
            flavor,
            shape,
            price: currentPrice
        };

        addToCart(product, variant, quantity, instructions);

        // Feedback to user (Popup instead of alert/redirect)
        setShowCartPopup(true);

        // Auto-close after 5 seconds
        setTimeout(() => {
            setShowCartPopup(false);
        }, 5000);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found. <button onClick={() => navigate(-1)} className='text-pink-500 ml-2'>Go Back</button></div>;

    return (
        <div className="bg-white min-h-screen font-sans pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb / Back */}
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-pink-600 mb-6 transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cakes
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Image */}
                    <div className="space-y-4">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative shadow-md">
                            <button className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-colors">
                                <Heart className="h-5 w-5" />
                            </button>
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                        <p className="text-gray-500 mb-6 leading-relaxed">{product.description}</p>

                        <div className="text-3xl font-bold text-pink-600 mb-8">Rs. {currentPrice.toLocaleString()}</div>

                        {/* Size Selection */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Size</h3>
                            <div className="flex flex-wrap gap-3">
                                {product.variants.sizes.map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => setSize(s.label)}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${size === s.label
                                            ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500 ring-offset-2'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Flavor Selection */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Flavor</h3>
                            <div className="flex flex-wrap gap-3">
                                {product.variants.flavors.map(f => (
                                    <button
                                        key={f.label}
                                        onClick={() => setFlavor(f.label)}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${flavor === f.label
                                            ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500 ring-offset-2'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Shape Selection */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Shape</h3>
                            <div className="flex flex-wrap gap-3">
                                {product.variants.shapes.map(s => (
                                    <button
                                        key={s.label}
                                        onClick={() => setShape(s.label)}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${shape === s.label
                                            ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500 ring-offset-2'
                                            : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Special Instructions */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Special Instructions (Optional)</h3>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Add any special instructions or customization requests..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm min-h-[100px]"
                            />
                        </div>



                        {/* Quantity & Actions */}
                        <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row gap-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Quantity</h3>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <Minus className="h-4 w-4 text-gray-600" />
                                    </button>
                                    <span className="text-xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-end gap-2">
                                <div className="text-right">
                                    <span className="text-gray-500 text-sm">Total Price:</span>
                                    <span className="text-2xl font-bold text-pink-600 ml-2">Rs. {(currentPrice * quantity).toLocaleString()}</span>
                                </div>
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={handleAddToCart}
                                        className="flex-1 bg-pink-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-pink-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center"
                                    >
                                        <ShoppingBag className="h-5 w-5 mr-2" /> Add to Cart
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!user) {
                                                toast.error("Please login to manage your wishlist");
                                                navigate('/login');
                                                return;
                                            }

                                            try {
                                                if (isWishlisted) {
                                                    await api.delete(`/wishlist/${product.id}`);
                                                    setIsWishlisted(false);
                                                    toast.success("Removed from Wishlist");
                                                } else {
                                                    await api.post('/wishlist/add', { cakeId: product.id });
                                                    setIsWishlisted(true);
                                                    toast.success("Added to Wishlist");
                                                }
                                                window.dispatchEvent(new Event('wishlist-updated'));
                                            } catch (error) {
                                                console.error("Wishlist operation failed", error);
                                                toast.error("Something went wrong");
                                            }
                                        }}
                                        className={`px-4 py-3.5 rounded-xl border font-bold transition-colors flex items-center justify-center min-w-[60px] ${isWishlisted ? 'bg-pink-50 border-pink-200 text-pink-600' : 'border-pink-200 text-pink-600 hover:bg-pink-50'}`}
                                    >
                                        <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Success Toast Notification */}
            {showCartPopup && (
                <div 
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-full shadow-lg px-6 py-3 transform transition-all duration-300 flex items-center gap-3"
                    style={{ animation: 'slideUp 0.3s ease-out' }}
                >
                    <style>{`
                        @keyframes slideUp {
                            from { transform: translate(-50%, 100%); opacity: 0; }
                            to { transform: translate(-50%, 0); opacity: 1; }
                        }
                    `}</style>
                    <CheckCircle className="text-green-400 h-5 w-5" />
                    <span className="text-sm font-medium">Item added to your cart successfully.</span>
                </div>
            )}
        </div>
    );
};

export default ProductDetailsPage;
