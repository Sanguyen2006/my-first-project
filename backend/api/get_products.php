<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
$q = trim((string)($_GET['q'] ?? ''));
$sql = 'SELECT id, ma_san_pham, ten_san_pham, danh_muc, gia_ban, gia_khuyen_mai, so_luong_ton, hinh_anh, mo_ta FROM san_pham';
$params = [];
if ($q !== '') { $sql .= ' WHERE ten_san_pham LIKE ? OR ma_san_pham LIKE ? OR danh_muc LIKE ?'; $like = "%{$q}%"; $params = [$like,$like,$like]; }
$sql .= ' ORDER BY id DESC';
$stmt = $pdo->prepare($sql); $stmt->execute($params);
echo json_encode(['thanh_cong'=>true,'san_pham'=>$stmt->fetchAll()], JSON_UNESCAPED_UNICODE);
