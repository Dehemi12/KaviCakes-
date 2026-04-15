import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import api from '../services/api';

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Stagger animation
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Hero Section - Fragmented Layout */}
            <section className="relative pt-24 pb-20 overflow-hidden bg-slate-50 border-b border-gray-100">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-50 transform -skew-x-12 translate-x-1/4"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="md:w-1/2 mb-10 md:mb-0"
                    >
                        <div className="inline-flex items-center space-x-2 bg-pink-100 px-3 py-1 rounded-full text-pink-700 text-xs font-bold uppercase tracking-widest mb-6">
                            <Sparkles className="h-3 w-3" />
                            <span>Collections</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                            Choose Your <br/>
                            <span className="text-pink-600 relative">
                                Perfect Slice
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-pink-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/>
                                </svg>
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 max-w-md">
                            From grand wedding tiers to simple afternoon treats, explore our finest categories of handcrafted delights.
                        </p>
                    </motion.div>
                    
                    {/* Abstract Decorative Element */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="md:w-1/3 relative hidden md:block"
                    >
                        <div className="aspect-square rounded-full bg-gradient-to-tr from-pink-200 to-rose-100 relative shadow-2xl overflow-hidden group">
                            <img 
                                src="https://images.unsplash.com/photo-1616541824424-91694f42013a?auto=format&fit=crop&q=80&w=800" 
                                alt="Cake Collections"
                                className="w-full h-full object-cover opacity-90 mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Grid Section */}
            <section className="py-20 relative bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse bg-slate-100 h-96 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-12"
                        >
                            {categories.map((cat, idx) => (
                                <motion.div key={idx} variants={itemVariants} className="group cursor-pointer">
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
        </div>
    );
};

export default CategoriesPage;
