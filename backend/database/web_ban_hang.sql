CREATE DATABASE IF NOT EXISTS may_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE may_store;
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS nguoi_dung (
 id INT AUTO_INCREMENT PRIMARY KEY, ho_ten VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE,
 so_dien_thoai VARCHAR(30), ten_dang_nhap VARCHAR(60) NOT NULL UNIQUE, mat_khau VARCHAR(255) NOT NULL,
 vai_tro ENUM('quan_tri','khach_hang') NOT NULL DEFAULT 'khach_hang',
 trang_thai ENUM('hoat_dong','khoa') NOT NULL DEFAULT 'hoat_dong',
 ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS san_pham (
 id INT AUTO_INCREMENT PRIMARY KEY, ma_san_pham VARCHAR(40) NOT NULL UNIQUE, ten_san_pham VARCHAR(180) NOT NULL,
 danh_muc VARCHAR(100) NOT NULL DEFAULT 'Khác', gia_nhap DECIMAL(12,2) NOT NULL DEFAULT 0,
 gia_ban DECIMAL(12,2) NOT NULL, gia_khuyen_mai DECIMAL(12,2) NULL, so_luong_ton INT NOT NULL DEFAULT 0,
 hinh_anh TEXT, mo_ta TEXT, ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS don_hang (
 id INT AUTO_INCREMENT PRIMARY KEY, ma_don_hang VARCHAR(40) NOT NULL UNIQUE, nguoi_dung_id INT NOT NULL,
 ngay_dat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, tong_tien DECIMAL(12,2) NOT NULL DEFAULT 0,
 trang_thai ENUM('cho_xu_ly','da_xac_nhan','dang_giao','da_hoan_thanh','da_huy') NOT NULL DEFAULT 'cho_xu_ly',
 dia_chi_giao TEXT, phuong_thuc_thanh_toan VARCHAR(80),
 FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS chi_tiet_don_hang (
 id INT AUTO_INCREMENT PRIMARY KEY, don_hang_id INT NOT NULL, san_pham_id INT NOT NULL,
 so_luong INT NOT NULL DEFAULT 1, don_gia DECIMAL(12,2) NOT NULL,
 FOREIGN KEY (don_hang_id) REFERENCES don_hang(id) ON DELETE CASCADE,
 FOREIGN KEY (san_pham_id) REFERENCES san_pham(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS dia_chi_giao_hang (
 id INT AUTO_INCREMENT PRIMARY KEY, nguoi_dung_id INT NOT NULL, ho_ten_nguoi_nhan VARCHAR(120) NOT NULL,
 so_dien_thoai VARCHAR(30) NOT NULL, tinh_thanh VARCHAR(100), quan_huyen VARCHAR(100), phuong_xa VARCHAR(100),
 dia_chi_cu_the VARCHAR(255) NOT NULL, mac_dinh TINYINT(1) NOT NULL DEFAULT 0,
 FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS khuyen_mai (
 id INT AUTO_INCREMENT PRIMARY KEY, ma_voucher VARCHAR(50) NOT NULL UNIQUE, ten_chuong_trinh VARCHAR(160) NOT NULL,
 loai_giam ENUM('phan_tram','tien_mat') NOT NULL, gia_tri DECIMAL(12,2) NOT NULL, giam_toi_da DECIMAL(12,2),
 don_toi_thieu DECIMAL(12,2) NOT NULL DEFAULT 0, ngay_bat_dau DATETIME, ngay_ket_thuc DATETIME,
 so_luong INT NOT NULL DEFAULT 0, trang_thai TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES
('Quản trị viên','admin@maystore.local','0900000000','admin','$2y$12$LZMHb1SLkB8RDhNXQlX/ju/qD5BQte5l0BTqjiINBQqAQ6/iLXA6m','quan_tri','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Nguyễn Minh Anh','minhanh01@example.com','0901000001','khachhang01','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Trần Gia Bảo','giabao02@example.com','0901000002','khachhang02','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Lê Hoàng Yến','hoangyen03@example.com','0901000003','khachhang03','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Phạm Quốc Huy','quochuy04@example.com','0901000004','khachhang04','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Võ Ngọc Linh','ngoclinh05@example.com','0901000005','khachhang05','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Đặng Tuấn Kiệt','tuankiet06@example.com','0901000006','khachhang06','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Bùi Khánh Vy','khanhvy07@example.com','0901000007','khachhang07','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Đỗ Đức Thành','ducthanh08@example.com','0901000008','khachhang08','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Hoàng Mai Chi','maichi09@example.com','0901000009','khachhang09','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai) VALUES ('Phan Nhật Nam','nhatnam10@example.com','0901000010','khachhang10','$2y$12$KDa3d01NmQI4DJDbrPWki.hsscNAv6R3bKytZ2upWYrYTF32H5tE6','khach_hang','hoat_dong');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP001','Tai nghe không dây May Air 2','Phụ kiện','890000',790000,34,'','Tai nghe gọn nhẹ, âm thanh cân bằng, hộp sạc tiện dụng.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP002','Điện thoại Nova X12','Điện thoại','6990000',6490000,18,'','Màn hình sắc nét, pin dung lượng cao, phù hợp nhu cầu hằng ngày.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP003','Ốp lưng chống sốc Clear Pro','Phụ kiện','220000',NULL,65,'','Ốp trong suốt, viền chống sốc và dễ tháo lắp.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP004','Sạc nhanh 33W USB-C','Phụ kiện','390000',329000,42,'','Bộ sạc nhỏ gọn hỗ trợ sạc nhanh qua cổng USB-C.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP005','Đồng hồ thông minh Fit S','Thiết bị đeo','1590000',1390000,21,'','Theo dõi vận động, thông báo và nhiều chế độ luyện tập.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP006','Loa Bluetooth Mini Boom','Âm thanh','790000',NULL,27,'','Loa di động, kết nối Bluetooth ổn định, âm thanh rõ.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP007','Bàn phím cơ K87','Phụ kiện máy tính','1290000',1190000,16,'','Bàn phím cơ 87 phím, thiết kế tối giản cho góc làm việc.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP008','Chuột không dây Silent M3','Phụ kiện máy tính','450000',399000,39,'','Chuột không dây thao tác êm, phù hợp học tập và văn phòng.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP009','Màn hình View 24 inch','Màn hình','3290000',3090000,9,'','Màn hình 24 inch cho làm việc, học tập và giải trí.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP010','Máy tính bảng Tab Lite 10','Máy tính bảng','4990000',4690000,12,'','Máy tính bảng màn hình lớn cho đọc tài liệu và xem phim.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP011','Cáp sạc bền bỉ 1.2 m','Phụ kiện','150000',NULL,88,'','Cáp sạc bọc bền, chiều dài tiện dụng.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP012','Pin dự phòng Power 10K','Phụ kiện','590000',549000,31,'','Dung lượng 10.000 mAh, dễ mang theo khi di chuyển.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP013','Webcam Full HD C920','Phụ kiện máy tính','990000',899000,14,'','Webcam Full HD phục vụ họp trực tuyến và học online.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP014','Ổ cứng SSD 1TB','Linh kiện','1890000',1750000,11,'','Ổ SSD dung lượng 1TB giúp tăng tốc lưu trữ.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP015','Tai nghe chụp tai Studio','Âm thanh','1190000',NULL,20,'','Thiết kế chụp tai êm, phù hợp nghe nhạc và làm việc.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP016','Đế tản nhiệt Laptop N5','Phụ kiện máy tính','490000',449000,25,'','Đế tản nhiệt hỗ trợ lưu thông không khí cho laptop.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP017','Điện thoại Nova A5','Điện thoại','3990000',3790000,7,'','Điện thoại phổ thông cho liên lạc, học tập và giải trí.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP018','Bộ vệ sinh thiết bị 7 món','Phụ kiện','180000',NULL,53,'','Bộ dụng cụ vệ sinh màn hình, bàn phím và thiết bị điện tử.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP019','Micro USB Stream','Âm thanh','850000',799000,13,'','Micro USB cho học trực tuyến, thu âm và phát trực tiếp.');
INSERT INTO san_pham (ma_san_pham,ten_san_pham,danh_muc,gia_ban,gia_khuyen_mai,so_luong_ton,hinh_anh,mo_ta) VALUES ('SP020','Bộ chuyển đổi USB-C 6 trong 1','Phụ kiện máy tính','690000',629000,17,'','Mở rộng cổng kết nối cho laptop và máy tính bảng.');
