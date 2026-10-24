<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/../config/db.php';

function reply(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    reply(405, ['thanh_cong' => false, 'thong_bao' => 'Chỉ chấp nhận POST.']);
}

if (($_SESSION['vai_tro'] ?? '') !== 'quan_tri') {
    reply(403, [
        'thanh_cong' => false,
        'thong_bao' => 'Bạn cần đăng nhập bằng tài khoản quản trị.'
    ]);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) $input = $_POST;

$sku = strtoupper(trim((string)($input['ma_san_pham'] ?? '')));
$name = trim((string)($input['ten_san_pham'] ?? ''));
$category = trim((string)($input['danh_muc'] ?? 'Khác')) ?: 'Khác';
$price = filter_var($input['gia_ban'] ?? null, FILTER_VALIDATE_FLOAT);
$stock = filter_var($input['so_luong_ton'] ?? null, FILTER_VALIDATE_INT);
$image = trim((string)($input['hinh_anh'] ?? ''));
$description = trim((string)($input['mo_ta'] ?? ''));

if ($sku === '' || $name === '' || $price === false || $price < 0 ||
    $stock === false || $stock < 0) {
    reply(422, [
        'thanh_cong' => false,
        'thong_bao' => 'Thông tin sản phẩm không hợp lệ.'
    ]);
}

try {
    $check = $pdo->prepare('SELECT id FROM san_pham WHERE ma_san_pham = ? LIMIT 1');
    $check->execute([$sku]);
    if (!$check->fetch()) {
        reply(404, ['thanh_cong' => false, 'thong_bao' => 'Không tìm thấy sản phẩm cần sửa.']);
    }

    $stmt = $pdo->prepare(
        'UPDATE san_pham
         SET ten_san_pham = ?, danh_muc = ?, gia_ban = ?,
             gia_khuyen_mai = NULL, so_luong_ton = ?, hinh_anh = ?, mo_ta = ?
         WHERE ma_san_pham = ?'
    );
    $stmt->execute([$name, $category, $price, $stock, $image, $description, $sku]);

    reply(200, ['thanh_cong' => true, 'thong_bao' => 'Đã cập nhật sản phẩm trong MySQL.']);
} catch (PDOException $error) {
    error_log('update_product.php: ' . $error->getMessage());
    reply(500, [
        'thanh_cong' => false,
        'thong_bao' => 'Lỗi database khi cập nhật sản phẩm.'
    ]);
}
