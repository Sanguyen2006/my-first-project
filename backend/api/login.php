<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/../config/db.php';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$login = trim((string)($input['ten_dang_nhap'] ?? $input['email'] ?? ''));
$password = (string)($input['mat_khau'] ?? '');
$stmt = $pdo->prepare('SELECT id, ho_ten, ten_dang_nhap, email, mat_khau, vai_tro, trang_thai FROM nguoi_dung WHERE ten_dang_nhap = ? OR email = ? LIMIT 1');
$stmt->execute([$login, $login]);
$user = $stmt->fetch();
if (!$user || !password_verify($password, $user['mat_khau']) || $user['trang_thai'] !== 'hoat_dong') {
  http_response_code(401);
  echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Thông tin đăng nhập không đúng hoặc tài khoản đang bị khóa.'], JSON_UNESCAPED_UNICODE); exit;
}
$_SESSION['nguoi_dung_id'] = $user['id'];
$_SESSION['vai_tro'] = $user['vai_tro'];
echo json_encode(['thanh_cong'=>true,'thong_bao'=>'Đăng nhập thành công.','nguoi_dung'=>['id'=>$user['id'],'ho_ten'=>$user['ho_ten'],'vai_tro'=>$user['vai_tro']]], JSON_UNESCAPED_UNICODE);
