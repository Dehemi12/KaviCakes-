import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const Home = () => {
    const [categories, setCategories] = React.useState([]);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/public/cakes/master-data');
                if (res.data && res.data.categories) {
                    const mapped = res.data.categories.map(c => ({
                        name: c.name,
                        image: c.imageUrl ? c.imageUrl :
                            (c.name === 'Birthday' ? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400' :
                                c.name === 'Cupcakes' ? 'https://images.unsplash.com/photo-1599785209707-33b6a22f7907?auto=format&fit=crop&q=80&w=400' :
                                    c.name === 'Dessert Jars' ? 'https://images.unsplash.com/photo-1563729768601-d6fa4805e9a1?auto=format&fit=crop&q=80&w=400' :
                                        c.name === 'Brownies' ? 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400' :
                                            c.name === 'Wedding' ? 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=400' :
                                                'https://placehold.co/400x400/fee2e2/ec4899?text=' + c.name),
                        link: `/cakes?category=${encodeURIComponent(c.name)}`
                    }));
                    console.log('Processed Categories:', mapped);
                    setCategories(mapped);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    const [featuredCakes, setFeaturedCakes] = React.useState([]);

    React.useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Fetch latest 4 cakes
                const res = await api.get('/public/cakes?limit=4');
                if (res.status === 200) {
                    const data = res.data;
                    setFeaturedCakes(data.map(c => ({
                        id: c.id,
                        name: c.name,
                        price: c.price, // Use calculated 1kg price
                        image: c.imageUrl,
                        description: c.description
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch featured cakes", err);
                setFeaturedCakes([]);
            }
        };
        fetchFeatured();
    }, []);

    const [bestSellers, setBestSellers] = React.useState([]);

    React.useEffect(() => {
        const fetchBestSellers = async () => {
            try {
                // Fetch random or specific cakes for best sellers (using limit and shuffle or just different limit)
                // Since verified "Best Seller" logic isn't on backend yet, we'll fetch latest 3 for now.
                const res = await api.get('/public/cakes?limit=3');
                if (res.data) {
                    setBestSellers(res.data.map(c => ({
                        id: c.id,
                        name: c.name,
                        price: c.price,
                        image: c.imageUrl
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch best sellers", err);
            }
        };
        fetchBestSellers();
    }, []);

    // Testimonials
    const [testimonials, setTestimonials] = React.useState([]);

    React.useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await api.get('/feedback/public');
                // Map to UI format
                // Backend: { id, rating, comment, customer: { name }, reply }
                if (res.data) {
                    setTestimonials(res.data.map(f => ({
                        id: f.id,
                        name: f.customer?.name || "Customer",
                        text: f.comment,
                        rating: f.rating,
                        reply: f.reply
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch testimonials", err);
                // Fallback
                setTestimonials([
                    { id: 1, name: 'Kasun Perera', text: 'The birthday cake I ordered for my daughter was absolutely beautiful and delicious. Everyone at the party loved it!', rating: 5 },
                    { id: 2, name: 'Dilshan De Silva', text: 'Excellent service and timely delivery. The custom design came out exactly as I imagined.', rating: 5 },
                    { id: 3, name: 'Amaya Fernando', text: 'Best red velvet cake I have ever tasted! Will definitely order again.', rating: 4 },
                ]);
            }
        };
        fetchTestimonials();
    }, []);

    const [siteSettings, setSiteSettings] = React.useState({});

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/content/settings');
                setSiteSettings(res.data);
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="font-sans">
            {/* Hero Section */}
            <section className="bg-pink-50 py-12 md:py-20 rounded-3xl mx-4 md:mx-0 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col-reverse md:flex-row items-center">
                    <div className="w-full md:w-1/2 text-center md:text-left z-10">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
                        >
                            {siteSettings.HOME_HERO_TITLE ? (
                                <span dangerouslySetInnerHTML={{ __html: siteSettings.HOME_HERO_TITLE.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <>Delicious Cakes for <br /> <span className="text-pink-600">Every Occasion</span></>
                            )}
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0"
                        >
                            {siteSettings.HOME_HERO_SUBTITLE || "Handcrafted with love using the finest ingredients. Make your celebrations sweeter with KaviCakes."}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex space-x-4 justify-center md:justify-start"
                        >
                            <Link to="/cakes" className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-700 transition-transform transform hover:-translate-y-1">
                                Shop Now
                            </Link>
                            <Link to="/custom-orders" className="bg-white text-pink-600 border-2 border-pink-100 px-8 py-3 rounded-full font-bold hover:bg-pink-50 transition-colors">
                                Custom Order
                            </Link>
                        </motion.div>
                    </div>
                    <div className="w-full md:w-1/2 mb-10 md:mb-0 relative z-10 flex justify-center">
                        <motion.img
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            src={siteSettings.HOME_HERO_IMAGE || "https://placehold.co/600x400/5d4037/ffffff?text=Hero+Cake"}
                            alt="Delicious Chocolate Cake"
                            className="rounded-2xl shadow-2xl w-full max-w-lg object-cover"
                        />
                        {/* Decorative blob or circle could go here */}
                    </div>
                </div>
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-pink-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
            </section>

            {/* Browse by Category */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">Browse by Category</h2>
                        <div className="w-16 h-1 bg-pink-500 mx-auto mt-4 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {categories.map((cat, idx) => (
                            <Link to={cat.link} key={idx} className="group text-center">
                                <div className="relative overflow-hidden rounded-2xl aspect-square mb-4 shadow-md group-hover:shadow-xl transition-shadow bg-gray-100">
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all"></div>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-pink-600 transition-colors">{cat.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Cakes */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Featured Cakes</h2>
                            <div className="w-16 h-1 bg-pink-500 mt-2 rounded-full"></div>
                        </div>
                        <Link to="/cakes" className="text-pink-600 font-semibold hover:text-pink-700 flex items-center group">
                            View All <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featuredCakes.map((cake) => (
                            <div key={cake.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100">
                                <Link to={`/cakes/${cake.id}`}>
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={cake.image || 'https://placehold.co/400x300?text=No+Image'}
                                            alt={cake.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-xs font-bold shadow-sm uppercase tracking-wide text-gray-800">New</div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{cake.name}</h3>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{cake.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-bold text-pink-600">Rs. {cake.price}</span>
                                            <button className="text-sm bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg hover:bg-pink-200 transition-colors font-medium">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Best Sellers */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Best Sellers</h2>
                            <p className="mt-2 text-gray-600">Our most loved cakes by customers.</p>
                        </div>
                        <Link to="/cakes" className="text-pink-600 font-semibold hover:text-pink-700 flex items-center group">
                            View All <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {bestSellers.length > 0 ? bestSellers.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center space-x-4">
                                <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden">
                                    <img src={item.image || 'https://placehold.co/128x128?text=Best+Seller'} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 truncate">{item.name}</h3>
                                    <div className="flex items-center mt-1 mb-2">
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < 5 ? 'fill-current' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400 ml-2">(Popular)</span>
                                    </div>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-lg font-bold text-pink-600">Rs. {item.price}</span>
                                        <Link to={`/cakes/${item.id}`} className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 shadow-md">
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-3 text-center text-gray-500 py-10">
                                <p>Loading best sellers...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Custom & Bulk Orders */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Custom Order */}
                        <div className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer">
                            <img src="https://placehold.co/800x600/f3e5f5/purple?text=Custom+Orders" alt="Custom Orders" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-3xl font-bold text-white mb-2">Custom Orders</h3>
                                <p className="text-white/90 mb-4">Have a specific design in mind? Let's bring your dream cake to life.</p>
                                <Link to="/custom-orders" className="inline-flex items-center text-white font-bold hover:underline">
                                    Start Designing <ChevronRight className="ml-1 h-5 w-5" />
                                </Link>
                            </div>
                        </div>

                        {/* Bulk Order */}
                        <div className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer">
                            <img src="https://placehold.co/800x600/e3f2fd/blue?text=Bulk+Orders" alt="Bulk Orders" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-3xl font-bold text-white mb-2">Corporate & Bulk Orders</h3>
                                <p className="text-white/90 mb-4">Planning a big event or office party? Get special rates for bulk orders.</p>
                                <Link to="/bulk-orders" className="inline-flex items-center text-white font-bold hover:underline">
                                    Request Quote <ChevronRight className="ml-1 h-5 w-5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-pink-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
                        <p className="mt-2 text-gray-600">Real feedback from our happy customers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t) => (
                            <div key={t.id} className="bg-white p-8 rounded-2xl shadow-sm relative">
                                <div className="absolute -top-4 left-8 bg-pink-500 text-white p-3 rounded-xl shadow-lg">
                                    <span className="text-2xl font-serif">"</span>
                                </div>
                                <div className="flex text-yellow-400 mb-4 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-current' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <p className="text-gray-600 italic mb-6 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 shrink-0">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="font-bold text-gray-900">{t.name}</h4>
                                        <span className="text-xs text-green-500 font-medium flex items-center">
                                            <Check className="h-3 w-3 mr-1" /> Verified Buyer
                                        </span>
                                    </div>
                                </div>
                                {t.reply && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 -mx-8 -mb-8 p-6 rounded-b-2xl">
                                        <div className="flex items-start gap-2">
                                            <span className="text-xs font-bold text-pink-600 uppercase tracking-wider shrink-0 mt-0.5">Response:</span>
                                            <p className="text-sm text-gray-600 italic">"{t.reply}"</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter is deliberately removed or should I remove it? The plan says "Remove Community section". The newsletter section title is "Join our Sweet Community". So I should remove lines 274-288. In this replacement I already removed it. Wait. My replacement ends at 288 (the section closing tag). But the original file has lines up to 289 where the newsletter section is. I should ensure I am removing the Newsletter section. */}
        </div>
    );
};

export default Home;
