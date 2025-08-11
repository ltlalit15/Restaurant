import React, { useState } from 'react';
import kotPrinter from '../../utils/kotPrinter';

const KOTTestPrint = () => {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleOrder = {
    id: 'TEST-001',
    table: 'Table 1',
    customer: 'Test Customer',
    items: [
      { name: 'Chicken Wings', quantity: 2, price: 12.99, notes: 'Extra spicy' },
      { name: 'Caesar Salad', quantity: 1, price: 8.99, notes: 'No croutons' }
    ],
    total: 34.97,
    timestamp: new Date().toISOString(),
    orderType: 'dineIn',
    specialInstructions: 'Test order for printer setup'
  };

  const handleTestPrint = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      const result = await kotPrinter.printToCategory(sampleOrder, 'food');
      if (result.success) {
        setTestResult('✅ Test print successful! Check your printer for the test slip.');
      } else {
        setTestResult(`❌ Test print failed: ${result.message}`);
      }
    } catch (error) {
      setTestResult(`❌ Test print error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="kot-test-print">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">KOT Test Print</h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-3">
            Test your KOT printer setup with a sample order. Make sure your printer is connected and has paper loaded.
          </p>
          
          <div className="mb-3">
            <h6>Sample Order Details:</h6>
            <ul className="list-unstyled small">
              <li><strong>Order:</strong> {sampleOrder.id}</li>
              <li><strong>Table:</strong> {sampleOrder.table}</li>
              <li><strong>Customer:</strong> {sampleOrder.customer}</li>
              <li><strong>Items:</strong> 2x Chicken Wings, 1x Caesar Salad</li>
              <li><strong>Total:</strong> ${sampleOrder.total}</li>
            </ul>
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleTestPrint}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Printing...
              </>
            ) : (
              <>
                <i className="fa fa-print me-2"></i>
                Test Print KOT
              </>
            )}
          </button>

          {testResult && (
            <div className={`alert mt-3 ${testResult.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KOTTestPrint;
