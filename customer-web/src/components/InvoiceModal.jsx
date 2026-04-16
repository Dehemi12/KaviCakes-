import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, Mail } from 'lucide-react';
import dayjs from 'dayjs';

const InvoiceModal = ({ isOpen, onClose, invoiceData }) => {
    const printRef = useRef();

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('invoice-modal-open');
        } else {
            document.body.classList.remove('invoice-modal-open');
        }
        return () => document.body.classList.remove('invoice-modal-open');
    }, [isOpen]);

    if (!isOpen || !invoiceData) return null;

    const { invoice, order } = invoiceData;
    const { customer, items, delivery } = order;

    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.unitPrice) * item.quantity), 0);
    const deliveryFee = parseFloat(delivery?.deliveryFee || 0);
    const loyaltyDiscount = parseFloat(order.loyaltyDiscount || 0);
    const total = parseFloat(order.total);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:backdrop-blur-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-h-none print:w-full print:rounded-none">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 print:hidden bg-white">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🧾</span>
                        <h3 className="text-sm font-semibold text-gray-800">Tax Invoice</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="p-2 text-pink-600 hover:bg-gray-50 rounded-lg transition" title="Print Invoice">
                            <Printer className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div ref={printRef} className="flex-1 overflow-y-auto p-6 font-sans text-gray-700 print:overflow-visible print:p-0 bg-white">
                    
                    {/* Brand Section */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-pink-600 tracking-tight mb-1">KaviCakes</h1>
                        <p className="text-gray-500 text-xs">1st Lane, Wabada Road, Kadawatha</p>
                        <p className="text-gray-500 text-xs">077 123 4567 • Kavicakes@gmail.com</p>
                    </div>

                    {/* Meta Info */}
                    <div className="border-y border-dashed border-gray-200 py-3 mb-6 text-[13px] text-gray-600">
                        <div className="flex justify-between mb-1.5">
                            <span className="text-gray-400">Invoice No:</span>
                            <span className="font-medium text-gray-800">#{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between mb-1.5">
                            <span className="text-gray-400">Date:</span>
                            <span className="font-medium text-gray-800">{dayjs(invoice.issuedAt).format('DD MMM YYYY')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Billed To:</span>
                            <span className="font-medium text-gray-800">{customer?.name || 'Customer'}</span>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                        <h4 className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider mb-3">Order Summary</h4>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start text-[13px]">
                                    <div className="pr-4 flex-1">
                                        <p className="font-medium text-gray-800">{item.name}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                            {item.quantity} x Rs. {parseFloat(item.unitPrice).toLocaleString()}
                                            {item.variant ? `<br/>${item.variant.size} • ${item.variant.flavor}` : ''}
                                        </p>
                                    </div>
                                    <p className="font-medium text-gray-800">Rs. {(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                            
                            {deliveryFee > 0 && (
                                <div className="flex justify-between items-start text-[13px] pt-1">
                                    <p className="text-gray-500">Delivery Charge</p>
                                    <p className="font-medium text-gray-800">Rs. {deliveryFee.toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4 hidden print:block"></div>

                    {/* Footer Summary */}
                    <div className="border-t border-gray-100 pt-4 mb-6">
                        <div className="flex justify-between text-[13px] text-gray-500 mb-2">
                            <span>Subtotal</span>
                            <span>Rs. {subtotal.toLocaleString()}</span>
                        </div>
                        {loyaltyDiscount > 0 && (
                            <div className="flex justify-between text-[13px] text-pink-600 mb-2">
                                <span>Discount (Loyalty)</span>
                                <span>-Rs. {loyaltyDiscount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-semibold text-gray-800 pt-2 mt-2">
                            <span>Total Amount</span>
                            <span className="text-pink-600 font-bold">Rs. {total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-end items-center gap-2 text-[11px] font-medium uppercase mt-3">
                            <span className="text-gray-500">{order.paymentMethod} •</span>
                            <span className={order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-500'}>
                                {order.paymentStatus}
                            </span>
                        </div>
                    </div>
                    
                    {/* Delivery & Notes */}
                    <div className="border-t border-dashed border-gray-200 pt-4 text-center">
                        <p className="text-[13px] font-medium text-gray-800 mb-1">Delivery due on {dayjs(order.deliveryDate).format('DD MMM YYYY')}</p>
                        <p className="text-[12px] text-gray-400">{order.address || delivery?.address || 'Pickup from store'}</p>
                    </div>

                    {/* Thanks */}
                    <div className="text-center mt-6">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1">Thank you 💖</p>
                    </div>
                </div>

                {/* Footer Cancel Button */}
                <div className="p-4 border-t border-gray-100 print:hidden bg-gray-50 flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:text-gray-800 transition"
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>
    );
};

export default InvoiceModal;
