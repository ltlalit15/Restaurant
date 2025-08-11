import React from 'react';

const KOTSlip = ({ order, printerType = 'kitchen' }) => {
  const orderTypeDisplay = {
    'dineIn': 'DINE IN',
    'takeOut': 'TAKEAWAY',
    'delivery': 'DELIVERY'
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="kot-slip" style={{ 
      fontFamily: 'monospace', 
      fontSize: '14px', 
      lineHeight: '1.2',
      width: '300px',
      margin: '0 auto',
      padding: '10px',
      border: '1px solid #ddd',
      backgroundColor: '#fff'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>================================</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>KITCHEN ORDER TICKET</div>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>================================</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Order #:</strong> {order.id}</div>
        <div><strong>Date:</strong> {formatDate(order.timestamp)}</div>
        <div><strong>Time:</strong> {formatTime(order.timestamp)}</div>
        <div><strong>Table:</strong> {order.table}</div>
        <div><strong>Customer:</strong> {order.customer}</div>
        <div><strong>Type:</strong> {orderTypeDisplay[order.orderType] || 'DINE IN'}</div>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>
        ================================
      </div>

      <div style={{ marginBottom: '10px' }}>
        {order.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>
              {item.quantity}x {item.name}
            </div>
            <div style={{ marginLeft: '20px', color: '#666' }}>
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            
            {item.sides && item.sides.length > 0 && (
              <div style={{ marginLeft: '20px' }}>
                {item.sides.map((side, sideIndex) => (
                  <div key={sideIndex} style={{ color: '#666' }}>
                    + {side.name}
                  </div>
                ))}
              </div>
            )}
            
            {item.specialInstructions && (
              <div style={{ marginLeft: '20px', fontStyle: 'italic', color: '#666' }}>
                NOTE: {item.specialInstructions}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>
        ================================
      </div>

      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div><strong>Total Items:</strong> {order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
        <div><strong>Order Total:</strong> ${order.total.toFixed(2)}</div>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>
        ================================
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Special Instructions:</strong></div>
        <div style={{ marginLeft: '10px', fontStyle: 'italic' }}>
          {order.specialInstructions || 'None'}
        </div>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>
        ================================
      </div>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
        <div>Printed: {formatTime(new Date())}</div>
        <div>Station: {printerType.toUpperCase()}</div>
      </div>

      <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginTop: '10px' }}>
        ================================
      </div>
    </div>
  );
};

export default KOTSlip;
