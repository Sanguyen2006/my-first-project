<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$name = trim((string)($input['ho_ten'] ?? ''));
$email = trim((string)($input['email'] ?? ''));
$phone = trim((string)($input['so_dien_thoai'] ?? ''));
$username = trim((string)($input['ten_dang_nhap'] ?? ''));
$password = (string)($input['mat_khau'] ?? '');
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || $username === '' || strlen($password) < 8) {
  http_response_code(422);
  echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Vui lòng nhập đủ thông tin, email hợp lệ và mật khẩu ít nhất 8 ký tự.'], JSON_UNESCAPED_UNICODE); exit;
}
$check = $pdo->prepare('SELECT id FROM nguoi_dung WHERE email = ? OR ten_dang_nhap = ? LIMIT 1');
$check->execute([$email, $username]);
if ($check->fetch()) {
  http_response_code(409);
  echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Email hoặc tên đăng nhập đã tồn tại.'], JSON_UNESCAPED_UNICODE); exit;
}
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO nguoi_dung (ho_ten,email,so_dien_thoai,ten_dang_nhap,mat_khau,vai_tro,trang_thai,ngay_tao) VALUES (?,?,?,?,?,'khach_hang','hoat_dong',NOW())");
$stmt->execute([$name,$email,$phone,$username,$hash]);
echo json_encode(['thanh_cong'=>true,'thong_bao'=>'Đăng ký thành công.'], JSON_UNESCAPED_UNICODE);
