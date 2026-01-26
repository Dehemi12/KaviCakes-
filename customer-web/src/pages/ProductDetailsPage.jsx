import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { docData } from '../data/dummyData';

const ProductDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // Mock product data (replace with API fetch later)
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [size, setSize] = useState('1kg');
    const [flavor, setFlavor] = useState('Chocolate');
    const [shape, setShape] = useState('Round');
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState('');
    const [currentPrice, setCurrentPrice] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            // Simulate network delay
            setTimeout(() => {
                const found = docData.cakes.find(c => c.id === parseInt(id));

                if (found) {
                    // Start: Transform docData structure to match UI expectations
                    // docData has variants as array of objects { size, shape, flavor, price }
                    // UI expects variants: { sizes: [], flavors: [], shapes: [] }

                    // We will extract unique options from docData variants to populate selectors
                    // and then look up the specific variant price when selected.

                    const sizes = [...new Set(found.variants.map(v => JSON.stringify(v.size)))].map(s => JSON.parse(s));
                    const shapes = [...new Set(found.variants.map(v => JSON.stringify(v.shape)))].map(s => JSON.parse(s));
                    const flavors = [...new Set(found.variants.map(v => JSON.stringify(v.flavor)))].map(s => JSON.parse(s));

                    const transformedProduct = {
                        ...found,
                        price: found.basePrice, // default
                        image: found.imageUrl,
                        variants: {
                            original: found.variants, // keep original for lookup
                            sizes: sizes.map(s => ({ label: s.label, priceMod: s.price })),
                            shapes: shapes.map(s => ({ label: s.label, priceMod: s.price })),
                            flavors: flavors.map(s => ({ label: s.label, priceMod: s.price }))
                        },
                        allergens: ['Eggs', 'Dairy', 'Gluten'] // Hardcoded for now
                    };

                    setProduct(transformedProduct);

                    // Set Defaults
                    if (sizes.length > 0) setSize(sizes[0].label);
                    if (flavors.length > 0) setFlavor(flavors[0].label);
                    if (shapes.length > 0) setShape(shapes[0].label);

                    setCurrentPrice(found.variants[0]?.price || found.basePrice);
                } else {
                    setProduct(null);
                }
                setLoading(false);
            }, 500);
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
                setCurrentPrice(match.price);
            } else {
                // Approximate fallback if exact combo not found (summing modifiers)
                // This handles cases where user selects a combination that wasn't explicitly defined in docData examples
                const selectedSize = product.variants.sizes.find(s => s.label === size);
                const selectedFlavor = product.variants.flavors.find(f => f.label === flavor);
                const selectedShape = product.variants.shapes.find(s => s.label === shape);

                let price = product.basePrice;
                if (selectedSize) price += (selectedSize.priceMod || 0); // Note: docData variant structure puts price in 'price' field, but transformed uses priceMod. 
                // Actually my transform mapped 'price' to 'priceMod' for sizes/shapes/flavors.
                // But wait, the 'price' in sizes/shapes/flavors in docData is actually 0 for base options. 
                // Let's rely on the transformed priceMod logic which mapped 'price' -> 'priceMod'.

                if (selectedSize) price += selectedSize.priceMod;
                if (selectedFlavor) price += selectedFlavor.priceMod;
                if (selectedShape) price += selectedShape.priceMod;

                setCurrentPrice(price);
            }
        }
    }, [size, flavor, shape, product]);

    const handleQuantityChange = (delta) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleAddToCart = () => {
        if (!product) return;

        const variant = {
            size,
            flavor,
            shape,
            price: currentPrice
        };

        addToCart(product, variant, quantity, instructions);

        // Feedback to user
        // Using a simple alert for immediate feedback as requested, to verify functionality
        alert("Delicious choice! Added to your cart.");

        // Small delay to ensure state propagates (though React handles this, it feels better UX-wise in lieu of animation)
        setTimeout(() => {
            navigate('/cart');
        }, 100);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

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
                                        {s.label} {s.priceMod > 0 && `- +Rs.${s.priceMod}`}
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
                                        {f.label} {f.priceMod > 0 && `(+Rs.${f.priceMod})`}
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
                                        {s.label} {s.priceMod > 0 && `(+Rs.${s.priceMod})`}
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

                        {/* Allergens */}
                        <div className="mb-8">
                            <h3 className="text-sm font-bold text-gray-900 mb-3">Allergens</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.allergens.map(a => (
                                    <span key={a} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                                        {a}
                                    </span>
                                ))}
                            </div>
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

                            <div className="flex-1 flex gap-4 items-end">
                                <button
                                    onClick={handleAddToCart}
                                    className="flex-1 bg-pink-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-pink-700 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center"
                                >
                                    <ShoppingBag className="h-5 w-5 mr-2" /> Add to Cart
                                </button>
                                <button className="px-4 py-3.5 rounded-xl border border-pink-200 text-pink-600 font-bold hover:bg-pink-50 transition-colors flex items-center justify-center">
                                    <Heart className="h-5 w-5 mr-2" /> Save for Later
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsPage;
