import React, { useState } from 'react';
import './CreateAuction.css';

function CreateAuction({ onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    startingPrice: '',
    duration: 3600 // 1 giờ mặc định
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || !formData.startingPrice) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    if (parseFloat(formData.startingPrice) <= 0) {
      alert('Giá khởi điểm phải lớn hơn 0!');
      return;
    }

    onSubmit(formData);
  };

  const durationOptions = [
    { value: 300, label: '5 phút' },
    { value: 600, label: '10 phút' },
    { value: 1800, label: '30 phút' },
    { value: 3600, label: '1 giờ' },
    { value: 7200, label: '2 giờ' },
    { value: 86400, label: '1 ngày' },
    { value: 259200, label: '3 ngày' },
    { value: 604800, label: '7 ngày' }
  ];

  return (
    <div className="create-auction">
      <h2>Tạo đấu giá mới</h2>
      
      <form onSubmit={handleSubmit} className="auction-form">
        <div className="form-group">
          <label>Tên sản phẩm *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên sản phẩm"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Mô tả *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả chi tiết sản phẩm"
            rows="4"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>URL hình ảnh</label>
          <input
            type="text"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            disabled={loading}
          />
          {formData.imageUrl && (
            <div className="image-preview">
              <img src={formData.imageUrl} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Giá khởi điểm (ETH) *</label>
            <input
              type="number"
              name="startingPrice"
              value={formData.startingPrice}
              onChange={handleChange}
              placeholder="0.1"
              step="0.001"
              min="0"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Thời gian đấu giá</label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              disabled={loading}
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Tạo đấu giá'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateAuction;