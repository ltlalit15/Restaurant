import React, { useState, useEffect } from 'react';
import {
    RiDashboardLine, RiShoppingCartLine, RiPrinterLine, RiGamepadLine,
    RiUserLine, RiBarChartLine, RiPrinterFill, RiRefreshLine,
    RiSearchLine, RiRestaurantLine, RiCupLine, RiCheckLine,
    RiTimeLine, RiTimerLine
} from 'react-icons/ri';
import kotPrinter from '../../../utils/kotPrinter';
import { kotAPI, orderAPI } from '../../../services/apiService';

const KOTQueue = () => {
    const [activeTab, setActiveTab] = useState('activeKots');
    const [lastUpdated, setLastUpdated] = useState(2);
    const [kots, setKots] = useState([
        {
            id: 'KOT-2025-001',
            orderNumber: '#12345',
            table: 'Table 12',
            customer: 'John Doe',
            items: [
                { name: 'Chicken Wings', quantity: 2, notes: 'Extra spicy', price: 12.99 },
                { name: 'Caesar Salad', quantity: 1, notes: 'No croutons', price: 8.99 }
            ],
            orderType: 'dineIn',
            priority: 'normal',
            estimatedTime: 25,
            timeElapsed: 12,
            status: 'preparing',
            lastUpdated: new Date(Date.now() - 12 * 60000),
            specialInstructions: 'Customer has nut allergy',
            printer: 'Kitchen Printer 1',
            timestamp: new Date().toISOString(),
            total: 21.98
        },
        {
            id: 'KOT-2025-002',
            orderNumber: '#12346',
            table: 'Table 8',
            customer: 'Jane Smith',
            items: [
                { name: 'Energy Drinks', quantity: 2, notes: 'Extra cold', price: 3.99 },
                { name: 'Coffee', quantity: 1, notes: 'Extra shot', price: 4.99 }
            ],
            orderType: 'takeOut',
            priority: 'high',
            estimatedTime: 15,
            timeElapsed: 8,
            status: 'preparing',
            lastUpdated: new Date(Date.now() - 8 * 60000),
            specialInstructions: '',
            printer: 'Bar Printer 1',
            timestamp: new Date().toISOString(),
            total: 12.97
        },
        {
            id: 'KOT-2025-003',
            orderNumber: '#12347',
            table: 'Table 15',
            customer: 'Mike Johnson',
            items: [
                { name: 'Margherita Pizza', quantity: 1, notes: 'Extra cheese', price: 15.99 },
                { name: 'Garlic Bread', quantity: 2, notes: '', price: 4.99 }
            ],
            orderType: 'delivery',
            priority: 'normal',
            estimatedTime: 30,
            timeElapsed: 25,
            status: 'ready',
            lastUpdated: new Date(Date.now() - 25 * 60000),
            specialInstructions: 'Deliver to back entrance',
            printer: 'Kitchen Printer 2',
            timestamp: new Date().toISOString(),
            total: 25.97
        },
        {
            id: 'KOT-2025-004',
            orderNumber: '#12348',
            table: 'Table 3',
            customer: 'Sarah Wilson',
            items: [
                { name: 'Nachos Supreme', quantity: 3, notes: 'Extra jalapeños', price: 9.99 },
                { name: 'Coca Cola', quantity: 2, notes: 'No ice', price: 2.99 }
            ],
            orderType: 'dineIn',
            priority: 'normal',
            estimatedTime: 20,
            timeElapsed: 5,
            status: 'preparing',
            lastUpdated: new Date(Date.now() - 5 * 60000),
            specialInstructions: '',
            printer: 'Kitchen Printer 1',
            timestamp: new Date().toISOString(),
            total: 35.95
        }
    ]);

    useEffect(() => {
        loadKOTs();
        
        const timer = setInterval(() => {
            setLastUpdated(prev => prev + 1);
            loadKOTs(); // Refresh KOTs every minute
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const loadKOTs = async () => {
        try {
            const response = await kotAPI.getQueue();
            if (response.success) {
                const formattedKots = response.kots.map(kot => ({
                    ...kot,
                    orderNumber: kot.orderId,
                    timeElapsed: Math.floor((new Date() - new Date(kot.createdAt)) / 60000),
                    lastUpdated: new Date(kot.createdAt),
                    priority: 'normal',
                    estimatedTime: 25,
                    printer: kot.printerType === 'kitchen' ? 'Kitchen Printer 1' : 'Bar Printer 1'
                }));
                setKots(formattedKots);
            }
        } catch (error) {
            console.error('Failed to load KOTs:', error);
        }
    };

    const handleMarkComplete = async (kotId) => {
        try {
            const response = await kotAPI.updateStatus(kotId, 'completed');
            if (response.success) {
                setKots(prevKots =>
                    prevKots.map(kot =>
                        kot.id === kotId
                            ? {
                                ...kot,
                                status: 'ready',
                                lastUpdated: new Date()
                            }
                            : kot
                    )
                );
            }
        } catch (error) {
            console.error('Failed to update KOT status:', error);
        }
    };

    const handleReprint = async (kotId) => {
        try {
            const response = await kotAPI.reprint(kotId);
            if (response.success) {
                console.log('KOT reprinted successfully');
            } else {
                console.error('Failed to reprint KOT:', response.message);
            }
        } catch (error) {
            console.error('Failed to reprint KOT:', error);
        }
    };

    const formatLastUpdated = (timestamp) => {
        const now = new Date();
        const updated = new Date(timestamp);
        const diffInMinutes = Math.floor((now - updated) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes === 1) return '1 min ago';
        return `${diffInMinutes} min ago`;
    };

    const formatGlobalLastUpdated = () => {
        if (lastUpdated < 60) {
            return `Last updated: ${lastUpdated} seconds ago`;
        } else {
            const minutes = Math.floor(lastUpdated / 60);
            return `Last updated: ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
    };

    return (
        <div className='p-3'>
            {/* Main Content */}
            <div className="">
                {/* Header */}
                <header className="">
                    <div className=" d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <div>
                                <h1 className="fs-3 fw-bold text-dark">KOT Queue Management</h1>
                                <p className="text-muted small">Monitor and manage kitchen order tickets</p>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            <div className="kot-update-status d-flex align-items-center gap-2 small text-muted">
                                <div className="kot-status-indicator bg-success rounded-circle"></div>
                                <span>{formatGlobalLastUpdated()}</span>
                            </div>
                            <button className="kot-refresh-btn btn btn-warning text-dark rounded-1 fw-medium d-flex align-items-center">
                                <RiRefreshLine className="me-2" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="kot-content-container">
                    {/* Tab Navigation */}
                    <div className="kot-tab-navigation mb-4">
                        <div className="kot-tab-buttons bg-light p-1 rounded d-inline-flex">
                            <button
                                className={`kot-tab-btn btn ${activeTab === 'activeKots' ? 'btn-warning text-dark' : 'text-muted'} rounded-1 fw-medium px-4 py-2`}
                                onClick={() => setActiveTab('activeKots')}
                            >
                                View Active KOTs
                            </button>
                            <button
                                className={`kot-tab-btn btn ${activeTab === 'printerRouting' ? 'btn-warning text-dark' : 'text-muted'} rounded-1 fw-medium px-4 py-2`}
                                onClick={() => setActiveTab('printerRouting')}
                            >
                                Printer-Wise Routing
                            </button>
                        </div>
                    </div>

                    {/* Active KOTs Section */}
                    {activeTab === 'activeKots' && (
                        <div className="kot-active-kots-section">
                            <div className="kot-section-header d-flex justify-content-between align-items-center mb-4">
                                <h2 className="kot-section-title text-dark fs-5 fw-semibold">Active Kitchen Order Tickets</h2>
                                <div className="kot-section-filters d-flex align-items-center gap-3">
                                    <div className="kot-search-input position-relative">
                                        <input
                                            type="text"
                                            placeholder="Search KOTs..."
                                            className="kot-search-field form-control ps-4 pe-3 py-2 border rounded-1"
                                        />
                                        <RiSearchLine className="kot-search-icon position-absolute top-50  start-0 translate-middle-y ms-1 text-muted" />
                                    </div>
                                    <select className="kot-category-select form-select px-
                    5 py-2 border rounded-1">
                                        <option>All Categories</option>
                                        <option>Food</option>
                                        <option>Beverages</option>
                                    </select>
                                </div>
                            </div>

                            <div className="kot-table-container bg-white rounded shadow-sm border border-light overflow-hidden">
                                <div className="table-responsive">
                                    <table className="kot-table table mb-0">
                                        <thead className="kot-table-header bg-light border-bottom border-light">
                                            <tr>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">KOT Number</th>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">Table/Session</th>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">Items</th>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">Category</th>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">Time Elapsed</th>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">Status</th>
                                                <th className="kot-table-th px-4 py-3 text-start small fw-semibold text-muted text-uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="kot-table-body">
                                            {kots.map((kot, index) => (
                                                <tr key={index} className="kot-table-row">
                                                    <td className="kot-table-td px-4 py-3">
                                                        <div className="kot-id fw-medium text-dark">{`#${kot.id}`}</div>
                                                    </td>
                                                    <td className="kot-table-td px-4 py-3">
                                                        <div className="kot-table-info">{kot.table}</div>
                                                        <div className="kot-session-info small text-muted">{kot.session}</div>
                                                    </td>
                                                    <td className="kot-table-td px-4 py-3">
                                                        {kot.items.map((item, i) => (
                                                            <div key={i} className="kot-item-info">{item.quantity}x {item.name}</div>
                                                        ))}
                                                        <div className="kot-item-count small text-muted">{`${kot.items.length} items total`}</div>
                                                    </td>
                                                    <td className="kot-table-td px-4 py-3">
                                                        <span className={`kot-category-badge d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-medium ${
                                                            kot.orderType === 'dineIn' ? 'bg-orange-100 text-orange-800' :
                                                            kot.orderType === 'takeOut' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {kot.orderType === 'dineIn' && <RiRestaurantLine className="me-1" />}
                                                            {kot.orderType === 'takeOut' && <RiCupLine className="me-1" />}
                                                            {kot.orderType === 'dineIn' ? 'Dine In' : 
                                                             kot.orderType === 'takeOut' ? 'Takeaway' : 'Delivery'}
                                                        </span>
                                                    </td>
                                                    <td className="kot-table-td px-4 py-3">
                                                        <div className={`kot-time-elapsed small fw-medium ${
                                                            kot.timeElapsed > 20 ? 'text-danger' : 
                                                            kot.timeElapsed > 10 ? 'text-warning' : 'text-success'
                                                        }`}>
                                                            {kot.timeElapsed} min
                                                        </div>
                                                        {kot.priority && <div className="kot-priority-info small text-muted">{
                                                            kot.priority === 'high' ? 'High Priority' : 
                                                            kot.priority === 'normal' ? 'Normal Priority' : 'Low Priority'
                                                        }</div>}
                                                    </td>
                                                    <td className="kot-table-td px-4 py-3">
                                                        <span className={`kot-status-badge d-inline-flex align-items-center px-2 py-1 rounded-pill small fw-medium ${
                                                            kot.status === 'ready' ? 'bg-success-100 text-success-800' : 
                                                            'bg-warning-100 text-warning-800'
                                                        }`}>
                                                            {kot.status === 'ready' ? 'Completed' : 'Preparing'}
                                                        </span>
                                                    </td>
                                                    <td className="kot-table-td px-4 py-3">
                                                        {kot.status !== 'ready' ? (
                                                            <button
                                                                className="kot-complete-btn btn btn-success text-white rounded-1 small fw-medium px-3 py-1"
                                                                onClick={() => handleMarkComplete(kot.id)}
                                                            >
                                                                Mark Complete
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="kot-completed-btn btn btn-light text-muted rounded-1 small fw-medium px-3 py-1"
                                                                disabled
                                                            >
                                                                Completed
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Printer Routing Section */}
                    {activeTab === 'printerRouting' && (
                        <div className="kot-printer-routing-section">
                            <h2 className="kot-section-title text-dark fs-5 fw-semibold mb-4">Printer-Wise Routing Status</h2>

                            <div className="kot-printer-grid row g-4">
                                {/* Kitchen Printer */}
                                <div className="kot-printer-card col-lg-6">
                                    <div className="kot-card bg-white rounded shadow-sm border border-light p-4 h-100">
                                        <div className="kot-printer-header d-flex justify-content-between align-items-center mb-4">
                                            <div className="kot-printer-info d-flex align-items-center gap-3">
                                                <div className="kot-printer-icon bg-orange-100 rounded-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <RiPrinterFill className="text-orange-600 fs-5" />
                                                </div>
                                                <div>
                                                    <h3 className="kot-printer-title text-dark fs-5 fw-semibold">Kitchen Printer</h3>
                                                    <p className="kot-printer-subtitle small text-muted">Food items routing</p>
                                                </div>
                                            </div>
                                            <div className="kot-printer-status d-flex align-items-center gap-2">
                                                <div className="kot-status-indicator bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                                                <span className="kot-status-text small fw-medium text-success">Online</span>
                                            </div>
                                        </div>

                                        <div className="kot-order-list">
                                            {kots.filter(kot => 
                                                kot.items.some(item => 
                                                    item.name.includes('Wings') || 
                                                    item.name.includes('Salad') || 
                                                    item.name.includes('Pizza') || 
                                                    item.name.includes('Bread') || 
                                                    item.name.includes('Nachos')
                                                )
                                            ).map((kot, index) => (
                                                <div key={index} className="kot-order-card border border-light rounded-1 p-3 mb-3">
                                                    <div className="kot-order-header d-flex justify-content-between align-items-center mb-2">
                                                        <span className="kot-order-id fw-medium text-dark">{`#${kot.id}`}</span>
                                                        <span className={`kot-order-status small px-2 py-1 rounded-pill fw-medium ${kot.status === 'Completed' ? 'bg-success-100 text-success-800' : 'bg-warning text-dark'
                                                            }`}>
                                                            {kot.status === 'Completed' ? 'Completed' : 'Sent to Kitchen'}
                                                        </span>
                                                    </div>
                                                    <div className="kot-order-items small text-muted">
                                                        {kot.items.filter(item => 
                                                            item.name.includes('Wings') || 
                                                            item.name.includes('Salad') || 
                                                            item.name.includes('Pizza') || 
                                                            item.name.includes('Bread') || 
                                                            item.name.includes('Nachos')
                                                        ).map((item, i) => (
                                                            <div key={i}>{item.quantity}x {item.name}</div>
                                                        ))}
                                                    </div>
                                                    <div className="kot-order-time small text-muted mt-2">
                                                        {kot.table} • {kot.status === 'ready' ? 'Completed' : `${kot.timeElapsed} min ago`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bar Printer */}
                                <div className="kot-printer-card col-lg-6">
                                    <div className="kot-card bg-white rounded shadow-sm border border-light p-4 h-100">
                                        <div className="kot-printer-header d-flex justify-content-between align-items-center mb-4">
                                            <div className="kot-printer-info d-flex align-items-center gap-3">
                                                <div className="kot-printer-icon bg-blue-100 rounded-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                    <RiPrinterFill className="text-blue-600 fs-5" />
                                                </div>
                                                <div>
                                                    <h3 className="kot-printer-title text-dark fs-5 fw-semibold">Bar Printer</h3>
                                                    <p className="kot-printer-subtitle small text-muted">Beverage items routing</p>
                                                </div>
                                            </div>
                                            <div className="kot-printer-status d-flex align-items-center gap-2">
                                                <div className="kot-status-indicator bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                                                <span className="kot-status-text small fw-medium text-success">Online</span>
                                            </div>
                                        </div>

                                        <div className="kot-order-list">
                                            {kots.filter(kot => 
                                                kot.items.some(item => 
                                                    item.name.includes('Drinks') || 
                                                    item.name.includes('Coffee') || 
                                                    item.name.includes('Cola')
                                                )
                                            ).map((kot, index) => (
                                                <div key={index} className={`kot-order-card border border-light rounded-1 p-3 mb-3 ${index === 2 ? 'opacity-50' : ''}`}>
                                                    <div className="kot-order-header d-flex justify-content-between align-items-center mb-2">
                                                        <span className="kot-order-id fw-medium text-dark">{`#${kot.id}`}</span>
                                                        <span className={`kot-order-status small px-2 py-1 rounded-pill fw-medium ${index === 2 ? 'bg-light text-muted' : 'bg-warning text-dark'
                                                            }`}>
                                                            {index === 2 ? 'Queued' : 'Sent to Bar'}
                                                        </span>
                                                    </div>
                                                    <div className="kot-order-items small text-muted">
                                                        {kot.items.filter(item => 
                                                            item.name.includes('Drinks') || 
                                                            item.name.includes('Coffee') || 
                                                            item.name.includes('Cola')
                                                        ).map((item, i) => (
                                                            <div key={i}>{item.quantity}x {item.name}</div>
                                                        ))}
                                                    </div>
                                                    <div className="kot-order-time small text-muted mt-2">
                                                        {kot.table} • {kot.status === 'ready' ? 'Completed' : `${kot.timeElapsed} min ago`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Printer Stats */}
                            <div className="kot-printer-stats bg-white rounded shadow-sm border border-light p-4 mt-4">
                                <h3 className="kot-stats-title text-dark fs-5 fw-semibold mb-3">Printer Status Overview</h3>
                                <div className="kot-stats-grid row">
                                    <div className="kot-stat-col col-md-3 text-center">
                                        <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                                            width: '60px',
                                            height: '60px',
                                            backgroundColor: 'rgba(34, 197, 94, 0.1)'
                                        }}>
                                            <RiCheckLine className="text-green-500 fs-4" style={{ color: '#22c55e' }} />
                                        </div>
                                        <div className="kot-stat-value text-dark fs-3 fw-bold">8</div>
                                        <div className="kot-stat-label small text-muted">Completed Today</div>
                                    </div>

                                    <div className="kot-stat-col col-md-3 text-center">
                                        <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                                            width: '60px',
                                            height: '60px',
                                            backgroundColor: 'rgba(249, 115, 22, 0.1)'
                                        }}>
                                            <RiTimeLine className="fs-4" style={{ color: '#f97316' }} />
                                        </div>
                                        <div className="kot-stat-value text-dark fs-3 fw-bold">3</div>
                                        <div className="kot-stat-label small text-muted">Pending Orders</div>
                                    </div>

                                    <div className="kot-stat-col col-md-3 text-center">
                                        <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                                            width: '60px',
                                            height: '60px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)'
                                        }}>
                                            <RiPrinterLine className="fs-4" style={{ color: '#3b82f6' }} />
                                        </div>
                                        <div className="kot-stat-value text-dark fs-3 fw-bold">2</div>
                                        <div className="kot-stat-label small text-muted">Active Printers</div>
                                    </div>

                                    <div className="kot-stat-col col-md-3 text-center">
                                        <div className="kot-stat-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2" style={{
                                            width: '60px',
                                            height: '60px',
                                            backgroundColor: 'rgba(168, 85, 247, 0.1)'
                                        }}>
                                            <RiTimerLine className="fs-4" style={{ color: '#a855f7' }} />
                                        </div>
                                        <div className="kot-stat-value text-dark fs-3 fw-bold">7.5</div>
                                        <div className="kot-stat-label small text-muted">Avg. Time (min)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KOTQueue;
