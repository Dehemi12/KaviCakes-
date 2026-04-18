import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, ChevronRight, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const Home = () => {

    const [categories, setCategories] = React.useState([]);
    const [loadingCategories, setLoadingCategories] = React.useState(true);

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/public/cakes/master-data');
                if (res.data && res.data.categories) {
                    const mapped = res.data.categories.map(c => {
                        let finalImage = c.imageUrl;
                        if (!finalImage) {
                            // Fallbacks
                            if (c.name === 'Birthday') finalImage = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600';
                            else if (c.name === 'Cupcakes') finalImage = 'https://images.unsplash.com/photo-1599785209707-33b6a22f7907?auto=format&fit=crop&q=80&w=600';
                            else if (c.name === 'Dessert Jars') finalImage = 'https://images.unsplash.com/photo-1563729768601-d6fa4805e9a1?auto=format&fit=crop&q=80&w=600';
                            else if (c.name === 'Brownies') finalImage = 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600';
                            else if (c.name === 'Wedding') finalImage = 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&q=80&w=600';
                            else finalImage = 'https://placehold.co/600x600/fdf2f8/ec4899?text=' + c.name;
                        }
                        return {
                            name: c.name,
                            image: finalImage,
                            link: `/cakes?category=${encodeURIComponent(c.name)}`,
                            description: `Discover our sweet ${c.name.toLowerCase()} collection.`
                        };
                    });
                    
                    // Prepend "All Cakes"
                    const allCakes = {
                        name: 'All Cakes',
                        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&q=80&w=600',
                        link: '/cakes',
                        description: 'Explore our complete collection of delightful creations.'
                    };
                    
                    setCategories([allCakes, ...mapped]);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setLoadingCategories(false);
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
    const [loadingBestSellers, setLoadingBestSellers] = React.useState(true);

    React.useEffect(() => {
        const fetchBestSellers = async () => {
            setLoadingBestSellers(true);
            try {
                // Fetch live best sellers calculated by backend
                const res = await api.get('/public/cakes/best-sellers?limit=4');
                if (res.data) {
                    setBestSellers(res.data.map(item => ({
                        ...item,
                        image: item.image || item.imageUrl // Support both field names
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch best sellers", err);
            } finally {
                setLoadingBestSellers(false);
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

            {/* Categories Section - Moved from CategoriesPage */}
            <section className="relative pt-24 pb-20 overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-50 transform -skew-x-12 translate-x-1/4 opacity-50"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between mb-16">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="md:w-1/2 mb-10 md:mb-0"
                    >
                        <div className="inline-flex items-center space-x-2 bg-pink-100 px-3 py-1 rounded-full text-pink-700 text-xs font-bold uppercase tracking-widest mb-6">
                            <Sparkles className="h-3 w-3" />
                            <span>Collections</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                            Choose Your <br/>
                            <span className="text-pink-600 relative">
                                Perfect Slice
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-pink-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/>
                                </svg>
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 max-w-md">
                            From grand wedding tiers to simple afternoon treats, explore our finest categories of handcrafted delights.
                        </p>
                    </motion.div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    {loadingCategories ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse bg-slate-100 h-96 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ staggerChildren: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12"
                        >
                            {categories.map((cat, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ type: "spring", stiffness: 100, delay: idx * 0.1 }}
                                    className="group cursor-pointer"
                                >
                                    <Link to={cat.link} className="block h-full">
                                        <div className="relative overflow-hidden rounded-2xl aspect-[4/5] shadow-sm border border-slate-100 bg-slate-50 transition-shadow hover:shadow-2xl">
                                            <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                                            <img 
                                                src={cat.image} 
                                                alt={cat.name} 
                                                className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                                            />
                                            
                                            {/* Modern overlay title */}
                                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                <div className="bg-white/95 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-xl flex items-center justify-between border border-white/40">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{cat.name}</h3>
                                                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">{cat.description}</p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-600 transition-colors duration-300 shrink-0 shadow-sm">
                                                        <ArrowRight className="h-5 w-5 text-pink-600 group-hover:text-white transition-colors" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loadingBestSellers ? (
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse bg-white p-4 rounded-2xl shadow-sm flex items-center space-x-4 h-40">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-xl"></div>
                                    <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))
                        ) : bestSellers.length > 0 ? (
                            bestSellers.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex sm:flex-row flex-col items-center sm:space-x-4 space-y-4 sm:space-y-0 text-center sm:text-left h-full">
                                    <div className="w-full sm:w-24 sm:h-24 h-40 lg:w-32 lg:h-32 flex-shrink-0 rounded-xl overflow-hidden aspect-square">
                                        <img src={item.image || item.imageUrl || 'https://placehold.co/128x128?text=Best+Seller'} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                                            <div className="flex items-center justify-center sm:justify-start mt-1 mb-2">
                                                <div className="flex text-yellow-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`h-4 w-4 fill-current`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between w-full mt-2">
                                            <span className="text-lg font-bold text-pink-600 truncate mr-2">Rs. {item.price}</span>
                                            <Link to={`/cakes/${item.id}`} className="p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 shadow-md shrink-0">
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-gray-500 py-10">
                                <p>Our best sellers are coming soon! Check back later.</p>
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
                        <div className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer shadow-xl border border-pink-100">
                            <img src="/images/banners/custom_orders.png" alt="Custom Orders" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-3xl font-extrabold text-white mb-2">Custom Orders</h3>
                                <p className="text-white/95 mb-4 font-medium">Have a specific design in mind? Let's bring your dream cake to life with our artisan bakers.</p>
                                <Link to="/custom-orders" className="inline-flex items-center text-white font-bold bg-pink-600/90 hover:bg-pink-600 px-6 py-2.5 rounded-full w-fit shadow-lg backdrop-blur-sm transition-all group-hover:px-8">
                                    Start Designing <ChevronRight className="ml-1 h-5 w-5" />
                                </Link>
                            </div>
                        </div>

                        {/* Bulk Order */}
                        <div className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer shadow-xl border border-blue-100">
                            <img src="/images/banners/bulk_orders.png" alt="Bulk Orders" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-3xl font-extrabold text-white mb-2">Corporate & Bulk Orders</h3>
                                <p className="text-white/95 mb-4 font-medium">Planning a big event or office party? Get special rates and dedicated support for bulk orders.</p>
                                <Link to="/bulk-orders" className="inline-flex items-center text-white font-bold bg-blue-600/90 hover:bg-blue-600 px-6 py-2.5 rounded-full w-fit shadow-lg backdrop-blur-sm transition-all group-hover:px-8">
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

        </div>
    );
};

export default Home;
