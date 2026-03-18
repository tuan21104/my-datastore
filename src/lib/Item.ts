import mongoose, { Schema, model, models } from 'mongoose';

// Định nghĩa cấu trúc dữ liệu cho một Item (Link hoặc Ảnh)
const ItemSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String },
  imageUrl: { type: String },
  type: { type: String, enum: ['LINK', 'IMAGE'], required: true },
  tags: [{ type: String }],
  collectionId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Kiểm tra xem Model đã tồn tại chưa (tránh lỗi khi Next.js reload)
const Item = models.Item || model('Item', ItemSchema);

export default Item;