import React, { useState, useEffect } from 'react';
import './TableManagement.css';

const TableManagement = ({ onJumpToOrders, onSelectTable }) => {
  // State management
  const [activeTab, setActiveTab] = useState('Restaurant');
  const [quickJumpInput, setQuickJumpInput] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPanel, setShowPanel] = useState(!isMobile);

  const categories = ['Restaurant', 'Coffee shop', 'Terrace', 'Smoking area'];

  const tables = [
    { id: 1, status: 'occupied', guests: 4, order: 'Order #1234', category: 'Restaurant' },
    { id: 2, status: 'available', guests: 0, order: null, category: 'Restaurant' },
    { id: 3, status: 'occupied', guests: 2, order: 'Order #1235', category: 'Restaurant' },
    { id: 4, status: 'available', guests: 0, order: null, category: 'Restaurant' },
    { id: 5, status: 'reserved', guests: 6, order: null, category: 'Terrace' },
    { id: 6, status: 'occupied', guests: 3, order: 'Order #1236', category: 'Terrace' },
    { id: 7, status: 'available', guests: 0, order: null, category: 'Coffee shop' },
    { id: 8, status: 'available', guests: 0, order: null, category: 'Coffee shop' },
    { id: 9, status: 'occupied', guests: 2, order: 'Order #1237', category: 'Smoking area' },
    { id: 10, status: 'available', guests: 0, order: null, category: 'Smoking area' },
    { id: 11, status: 'available', guests: 0, order: null, category: 'Smoking area' },
    { id: 12, status: 'occupied', guests: 5, order: 'Order #1238', category: 'Restaurant' },
    // Pool tables (only restaurant zone example)
    // { id: 101, type: 'pool', status: 'occupied', guests: 2, order: 'Order #P101', category: 'Restaurant' },
    // { id: 102, type: 'pool', status: 'available', guests: 0, order: null, category: 'Restaurant' },
    // { id: 103, type: 'pool', status: 'reserved', guests: 4, order: null, category: 'Restaurant' },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setShowPanel(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleJump = () => {
    const num = parseInt(quickJumpInput, 10);
    if (isNaN(num)) return;

    const tableElement = document.getElementById(`table-${num}`);
    if (tableElement) {
      document.querySelectorAll('.table-highlight').forEach((el) => {
        el.classList.remove('table-highlight', 'animate-pulse');
      });
      tableElement.classList.add('table-highlight', 'animate-pulse');
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => {
        tableElement.classList.remove('table-highlight', 'animate-pulse');
      }, 2000);
    }
  };

  const renderTable = (table) => {
  const statusColor =
    table.status === 'occupied' ? '#4CAF50' :
    table.status === 'reserved' ? '#FFC107' : '#9E9E9E';

  // Restaurant → Round tables
  const isRestaurant = activeTab === 'Restaurant';

  if (table.type === 'pool') {
    return (
      <div
        key={table.id}
        id={`table-${table.id}`}
        className="pool-table"
        style={{ borderColor: statusColor }}
      >
        <div className="pool-table-inner">
          <span>{table.id}</span>
          <div className="pool-table-holes">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="pool-hole"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={table.id}
      id={`table-${table.id}`}
      className={`restaurant-table ${isRestaurant ? 'round-table ' : ''}`}
      style={{ borderColor: statusColor }}
    >
      <div className="table-number">{table.id}</div>
      {/* <div className="table-status" style={{ backgroundColor: statusColor }}></div> */}
      <div className="table-chairs">
        {/* {[...Array(4)].map((_, i) => (
          <div key={i} className="table-chair"></div>
        ))} */}
      </div>
    </div>
  );
};


  return (
    <div className="table-management-container">
      <div className="main-content">
        <div className="floor-plan">
          {/* Kitchen + Tabs */}
          <div className="kitchen-area">
            <div className="kitchen-equipment fw-bold text-dark">
              KITCHEN
             <div className="tab-container mt-2">
  <ul className="category-list">
    {categories.map((tab) => (
      <li
        key={tab}
        className={`category-item ${activeTab === tab ? 'active' : ''}`}
        onClick={() => setActiveTab(tab)}
      >
        {tab}
      </li>
    ))}
  </ul>
</div>

            </div>
            <div className="kitchen-storage fw-bold text-dark">KITCHEN STORAGE</div>
          </div>

          {/* Dining Area (changes with tab) */}
          <div className="dining-area">
            <h3 className="text-center mb-3">{activeTab}</h3>

            {/* Regular Tables */}
            <div className="tables-grid">
              {tables.filter((t) => t.category === activeTab && !t.type).map(renderTable)}
            </div>

            {/* Pool Tables only for Restaurant */}
            {activeTab === 'Restaurant' && (
              <div className="pool-tables-area">
                {/* <div className="pool-tables-label">POOL ZONE</div>
                <div className="pool-tables-grid">
                  {tables.filter((t) => t.category === activeTab && t.type === 'pool').map(renderTable)}
                </div> */}
              </div>
            )}

            {/* Bar Area */}
            {activeTab === 'Restaurant' && (
              <div className="bar-area">
                <div className="bar-counter">DRINKING ZONE</div>
              </div>
            )}
          </div>
        </div>

        {/* Control Panel */}
        {showPanel && (
          <div className="control-panel">
            <h2>Table Management</h2>
            <div className="panel-content">
              <input
                type="number"
                placeholder="Enter table number"
                value={quickJumpInput}
                onChange={(e) => setQuickJumpInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJump()}
              />
              <div className="number-pad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuickJumpInput((prev) => prev + num.toString())}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="action-buttons">
                <button
                  className="back-btn"
                  onClick={() => setQuickJumpInput((prev) => prev.slice(0, -1))}
                >
                  ← Back
                </button>
                <button
                  className="jump-btn"
                  onClick={() => {
                    handleJump();
                    if (onSelectTable) onSelectTable(quickJumpInput);
                    if (onJumpToOrders) onJumpToOrders();
                  }}
                >
                  Jump
                </button>
              </div>

              <div className="status-legend">
                <h3>Table Status</h3>
                <div className="legend-item">
                  <div className="status-indicator occupied"></div>
                  <span>Occupied</span>
                </div>
                <div className="legend-item">
                  <div className="status-indicator available"></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="status-indicator reserved"></div>
                  <span>Reserved</span>
                </div>
              </div>
            </div>
            {isMobile && (
              <button className="close-panel-btn" onClick={() => setShowPanel(false)}>
                Close Panel
              </button>
            )}
          </div>
        )}

        {!showPanel && isMobile && (
          <button className="show-panel-btn" onClick={() => setShowPanel(true)}>
            Show Panel
          </button>
        )}
      </div>
    </div>
  );
};

export default TableManagement;
