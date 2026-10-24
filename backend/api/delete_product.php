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

if ($sku === '') {
    reply(422, ['thanh_cong' => false, 'thong_bao' => 'Thiếu mã sản phẩm.']);
}

try {
    $check = $pdo->prepare('SELECT id FROM san_pham WHERE ma_san_pham = ? LIMIT 1');
    $check->execute([$sku]);
    if (!$check->fetch()) {
        reply(404, ['thanh_cong' => false, 'thong_bao' => 'Không tìm thấy sản phẩm cần xóa.']);
    }

    $stmt = $pdo->prepare('DELETE FROM san_pham WHERE ma_san_pham = ?');
    $stmt->execute([$sku]);

    reply(200, ['thanh_cong' => true, 'thong_bao' => 'Đã xóa sản phẩm khỏi MySQL.']);
} catch (PDOException $error) {
    error_log('delete_product.php: ' . $error->getMessage());
    reply(500, [
        'thanh_cong' => false,
        'thong_bao' => 'Không thể xóa sản phẩm. Có thể sản phẩm đã được dùng trong đơn hàng.'
    ]);
}
