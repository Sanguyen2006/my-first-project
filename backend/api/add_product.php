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
if (!is_array($input)) {
    $input = $_POST;
}

$sku = strtoupper(trim((string)($input['ma_san_pham'] ?? '')));
$name = trim((string)($input['ten_san_pham'] ?? ''));
$category = trim((string)($input['danh_muc'] ?? 'Khác')) ?: 'Khác';
$priceRaw = $input['gia_ban'] ?? null;
$stockRaw = $input['so_luong_ton'] ?? null;
$price = filter_var($priceRaw, FILTER_VALIDATE_FLOAT);
$stock = filter_var($stockRaw, FILTER_VALIDATE_INT);
$image = trim((string)($input['hinh_anh'] ?? ''));
$description = trim((string)($input['mo_ta'] ?? ''));

if ($sku === '' || $name === '' || $price === false || $price < 0 ||
    $stock === false || $stock < 0) {
    reply(422, [
        'thanh_cong' => false,
        'thong_bao' => 'Mã, tên, giá bán hoặc số lượng tồn không hợp lệ.'
    ]);
}

try {
    $check = $pdo->prepare('SELECT id FROM san_pham WHERE ma_san_pham = ? LIMIT 1');
    $check->execute([$sku]);
    if ($check->fetch()) {
        reply(409, [
            'thanh_cong' => false,
            'thong_bao' => 'Mã sản phẩm đã tồn tại trong database.'
        ]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO san_pham
         (ma_san_pham, ten_san_pham, danh_muc, gia_ban, gia_khuyen_mai,
          so_luong_ton, hinh_anh, mo_ta, ngay_tao)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, NOW())'
    );
    $stmt->execute([$sku, $name, $category, $price, $stock, $image, $description]);

    reply(201, [
        'thanh_cong' => true,
        'thong_bao' => 'Đã thêm sản phẩm vào MySQL.',
        'ma_san_pham' => $sku
    ]);
} catch (PDOException $error) {
    error_log('add_product.php: ' . $error->getMessage());
    reply(500, [
        'thanh_cong' => false,
        'thong_bao' => 'Lỗi database khi thêm sản phẩm. Hãy kiểm tra cấu trúc bảng san_pham.'
    ]);
}
