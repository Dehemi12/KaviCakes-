export const docData = {
    masterData: {
        categories: [
            { id: 1, name: 'Cakes', basePrice: 1500 },
            { id: 2, name: 'Cupcakes', basePrice: 240 },
            { id: 3, name: 'Dessert Jars', basePrice: 650 },
            { id: 4, name: 'Brownies', basePrice: 400 },
            { id: 5, name: 'Cookies', basePrice: 150 }
        ],
        sizes: [
            { id: 1, label: '1kg', price: 0 },
            { id: 2, label: '2kg', price: 1200 },
            { id: 3, label: '500g', price: -500 },
            { id: 4, label: 'Pack of 6', price: 0 },
            { id: 5, label: 'Pack of 12', price: 1000 }
        ],
        shapes: [
            { id: 1, label: 'Round', price: 0 },
            { id: 2, label: 'Square', price: 200 },
            { id: 3, label: 'Heart', price: 300 },
            { id: 4, label: 'Standard', price: 0 }
        ],
        flavors: [
            { id: 1, label: 'Chocolate', price: 0 },
            { id: 2, label: 'Vanilla', price: 0 },
            { id: 3, label: 'Ribbon', price: 100 },
            { id: 4, label: 'Coffee', price: 150 },
            { id: 5, label: 'Red Velvet', price: 300 },
            { id: 6, label: 'Blueberry', price: 400 }
        ]
    },
    cakes: [
        {
            id: 1,
            name: 'Chocolate Fudge Cake',
            description: 'Rich, moist chocolate cake layered with creamy chocolate fudge frosting.',
            imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=500',
            ingredients: 'Flour, Sugar, Cocoa Powder, Butter, Eggs, Milk',
            availability: true,
            categoryId: 1,
            categoryName: 'Cakes',
            basePrice: 1500,
            variants: [
                { id: 101, size: { id: 1, label: '1kg' }, shape: { id: 1, label: 'Round' }, flavor: { id: 1, label: 'Chocolate' }, price: 4500 },
                { id: 102, size: { id: 2, label: '2kg' }, shape: { id: 2, label: 'Square' }, flavor: { id: 1, label: 'Chocolate' }, price: 8500 }
            ]
        },
        {
            id: 2,
            name: 'Red Velvet Love',
            description: 'Classic red velvet cake with cream cheese frosting, perfect for anniversaries.',
            imageUrl: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&q=80&w=500',
            ingredients: 'Flour, Sugar, Buttermilk, Cocoa, Red Food Coloring, Cream Cheese',
            availability: true,
            categoryId: 1,
            categoryName: 'Cakes',
            basePrice: 1500,
            variants: [
                { id: 201, size: { id: 1, label: '1kg' }, shape: { id: 3, label: 'Heart' }, flavor: { id: 5, label: 'Red Velvet' }, price: 5200 }
            ]
        },
        {
            id: 3,
            name: 'Assorted Cupcakes (Box of 6)',
            description: 'A mix of vanilla, chocolate, and strawberry cupcakes.',
            imageUrl: 'https://images.unsplash.com/photo-1599785209707-33b6a22f7907?auto=format&fit=crop&q=80&w=500',
            ingredients: 'Flour, Butter, Sugar, Eggs, Vanilla Extract',
            availability: true,
            categoryId: 2,
            categoryName: 'Cupcakes',
            basePrice: 1440,
            variants: [
                { id: 301, size: { id: 4, label: 'Pack of 6' }, shape: { id: 4, label: 'Standard' }, flavor: { id: 2, label: 'Vanilla' }, price: 1800 }
            ]
        },
        {
            id: 4,
            name: 'Blueberry Cheesecake Jar',
            description: 'Layers of biscuit crust, cream cheese filling, and blueberry coulis.',
            imageUrl: 'https://images.unsplash.com/photo-1563729768601-d6fa4805e9a1?auto=format&fit=crop&q=80&w=500',
            ingredients: 'Cream Cheese, Biscuits, Blueberries, Sugar, Whipping Cream',
            availability: true,
            categoryId: 3,
            categoryName: 'Dessert Jars',
            basePrice: 650,
            variants: [
                { id: 401, size: { id: 4, label: 'Pack of 6' }, shape: { id: 4, label: 'Standard' }, flavor: { id: 6, label: 'Blueberry' }, price: 3900 }
            ]
        },
        {
            id: 5,
            name: 'Double Chocolate Brownies',
            description: 'Fudgy brownies loaded with chocolate chunks.',
            imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=500',
            ingredients: 'Dark Chocolate, Butter, Sugar, Eggs, Flour',
            availability: false,
            categoryId: 4,
            categoryName: 'Brownies',
            basePrice: 400,
            variants: [
                { id: 501, size: { id: 4, label: 'Pack of 6' }, shape: { id: 2, label: 'Square' }, flavor: { id: 1, label: 'Chocolate' }, price: 2400 }
            ]
        }
    ],
    orders: [
        { id: 1092, customer: { name: 'Kavindi Ratnayake' }, items: [{ name: 'Chocolate Fudge Cake', quantity: 1, variant: '1kg' }], createdAt: '2023-10-26T08:30:00', total: 4500, status: 'NEW', paymentStatus: 'PENDING', address: '123 Main St, Colombo' },
        { id: 1091, customer: { name: 'Amal Perera' }, items: [{ name: 'Red Velvet Love', quantity: 1, variant: '1kg' }, { name: 'Cupcakes', quantity: 1, variant: 'Box of 6' }], createdAt: '2023-10-25T14:20:00', total: 7000, status: 'CONFIRMED', paymentStatus: 'PAID', address: '45/2 Templers Rd, Mt Lavinia' },
        { id: 1090, customer: { name: 'Didul C.' }, items: [{ name: 'Blueberry Jar', quantity: 5 }], createdAt: '2023-10-25T10:00:00', total: 3250, status: 'PREPARING', paymentStatus: 'PAID', address: 'PickUp' },
        { id: 1089, customer: { name: 'Sahan D.' }, items: [{ name: 'Brownies', quantity: 2 }], createdAt: '2023-10-24T16:45:00', total: 4800, status: 'DELIVERED', paymentStatus: 'PAID', address: '789 Kandy Rd, Kiribathgoda' },
        { id: 1088, customer: { name: 'Nimali S.' }, items: [{ name: 'Custom Cake', quantity: 1 }], createdAt: '2023-10-23T09:15:00', total: 12500, status: 'CANCELLED', paymentStatus: 'REFUNDED', address: '12 Flower Rd, Colombo 7' },
    ],
    customers: [
        { id: '1', displayId: 'C065', name: 'Kavindi Ratnayake', email: 'kavindi@example.com', phone: '075-567-8901', loyaltyPoints: 1250, orderCount: 15, totalSpent: 45000, lastOrderDate: '2023-10-26' },
        { id: '2', displayId: 'C066', name: 'Amal Perera', email: 'amal.p@example.com', phone: '077-123-4567', loyaltyPoints: 800, orderCount: 8, totalSpent: 28000, lastOrderDate: '2023-10-25' },
        { id: '3', displayId: 'C067', name: 'Didul Chamikara', email: 'didul@example.com', phone: '071-444-5555', loyaltyPoints: 450, orderCount: 3, totalSpent: 12000, lastOrderDate: '2023-10-25' },
        { id: '4', displayId: 'C068', name: 'Sahan Dias', email: 'sahan@example.com', phone: '076-999-8888', loyaltyPoints: 2200, orderCount: 25, totalSpent: 150000, lastOrderDate: '2023-10-24' }
    ],
    feedbacks: [
        { id: 1, customer: { name: 'Amal Perera', loyaltyPoints: 800 }, orderId: 1091, rating: 5, title: 'Amazing Taste!', comment: 'The Red Velvet was absolutely delicious. Will order again.', status: 'APPROVED' },
        { id: 2, customer: { name: 'Kavindi Ratnayake', loyaltyPoints: 1250 }, orderId: 1085, rating: 4, title: 'Good service', comment: 'Delivery was slightly late but cake was good.', status: 'PENDING' }
    ]
};
