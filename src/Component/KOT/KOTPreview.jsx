import React from 'react';
import KOTSlip from './KOTSlip';

const KOTPreview = ({ order, printerType = 'kitchen', paperSize = '80mm' }) => {
  return (
    <div className="kot-preview-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>KOT Preview</h5>
        <div className="d-flex gap-2">
          <select 
            className="form-select form-select-sm" 
            style={{ width: 'auto' }}
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value)}
          >
            <option value="58mm">58mm Paper</option>
            <option value="80mm">80mm Paper</option>
          </select>
          <button className="btn btn-primary btn-sm">
            <i className="fa fa-print me-1"></i>
            Print Test
          </button>
        </div>
      </div>
      
      <div className={`kot-preview-paper ${paperSize === '58mm' ? 'paper-58mm' : 'paper-80mm'}`}>
        <KOTSlip order={order} printerType={printerType} />
      </div>
      
      <style jsx>{`
        .kot-preview-container {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        
        .kot-preview-paper {
          background: white;
          margin: 0 auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .paper-58mm {
          width: 220px;
        }
        
        .paper-80mm {
          width: 300px;
        }
      `}</style>
    </div>
  );
};

export default KOTPreview;
