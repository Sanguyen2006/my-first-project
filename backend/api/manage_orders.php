<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/../config/db.php';
if (($_SESSION['vai_tro'] ?? '') !== 'quan_tri') { http_response_code(403); echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Bạn cần đăng nhập bằng tài khoản quản trị.'], JSON_UNESCAPED_UNICODE); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?? $_POST;
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
  $id = (int)($in['id'] ?? 0); $status = (string)($in['trang_thai'] ?? '');
  $allowed = ['cho_xu_ly','da_xac_nhan','dang_giao','da_hoan_thanh','da_huy'];
  if ($id < 1 || !in_array($status, $allowed, true)) { http_response_code(422); echo json_encode(['thanh_cong'=>false,'thong_bao'=>'Dữ liệu cập nhật không hợp lệ.'], JSON_UNESCAPED_UNICODE); exit; }
  $stmt = $pdo->prepare('UPDATE don_hang SET trang_thai = ? WHERE id = ?'); $stmt->execute([$status,$id]);
  echo json_encode(['thanh_cong'=>true,'thong_bao'=>'Đã cập nhật trạng thái đơn hàng.'], JSON_UNESCAPED_UNICODE); exit;
}
$stmt = $pdo->query('SELECT d.id,d.ma_don_hang,d.ngay_dat,d.tong_tien,d.trang_thai,n.ho_ten FROM don_hang d JOIN nguoi_dung n ON n.id=d.nguoi_dung_id ORDER BY d.id DESC');
echo json_encode(['thanh_cong'=>true,'don_hang'=>$stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
