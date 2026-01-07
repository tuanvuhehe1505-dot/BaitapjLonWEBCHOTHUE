# Hướng dẫn cấu hình Cloudinary để lưu ảnh vĩnh viễn

## Bước 1: Tạo tài khoản Cloudinary (MIỄN PHÍ)

1. Truy cập: https://cloudinary.com/
2. Click "Sign Up for Free"
3. Đăng ký bằng email hoặc Google/GitHub
4. Free tier cho phép: 25GB storage, 25GB bandwidth/tháng - đủ dùng cho project nhỏ

## Bước 2: Lấy thông tin API

1. Đăng nhập vào Cloudinary Dashboard
2. Ở trang Dashboard, bạn sẽ thấy:
   - **Cloud Name**: ví dụ `dxxxxxxxxx`
   - **API Key**: ví dụ `123456789012345`
   - **API Secret**: ví dụ `aBcDeFgHiJkLmNoPqRsTuVwXyZ`

## Bước 3: Cấu hình trên Render.com

1. Vào Render Dashboard: https://dashboard.render.com/
2. Chọn service backend của bạn
3. Vào tab **Environment**
4. Thêm 3 biến môi trường:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Click "Save Changes"
6. Service sẽ tự động redeploy

## Bước 4: Kiểm tra

Sau khi deploy xong:

1. Đăng nhập admin
2. Đăng tin mới với ảnh
3. Refresh trang - ảnh vẫn còn!
4. Đợi vài phút, refresh lại - ảnh vẫn còn!

## Lưu ý

- Ảnh sẽ được tự động resize về max 1200x900 để tiết kiệm dung lượng
- Cloudinary hỗ trợ các định dạng: jpg, jpeg, png, gif, webp
- Giới hạn file size: 5MB/ảnh
- Ảnh cũ đã upload trước khi có Cloudinary sẽ bị mất khi server restart

## Troubleshooting

Nếu ảnh vẫn không hiển thị:

1. Kiểm tra console log của server trên Render
2. Tìm dòng "✅ Cloudinary storage enabled" để xác nhận Cloudinary đang hoạt động
3. Nếu thấy "⚠️ Using local storage" nghĩa là thiếu config Cloudinary
