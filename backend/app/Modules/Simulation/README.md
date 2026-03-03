# Simulation Module

## 📋 Overview
Module này chịu trách nhiệm điều phối sự tiến hóa của vũ trụ (WorldOS Simulation) thông qua lăng kính của Sử gia (Narrative-Driven).

## 🏗️ Architecture
- **Domain Layer**: Chứa các Entity thuần như `UniverseEntity`, `RelicEntity`. Trực tiếp quản lý các quy luật tiến hóa (Axioms).
- **Application Layer**: Các Actions như `ManifestRelicAction`, `WavefunctionCollapseAction` điều phối logic giữa thực tại và lời kể.
- **Infrastructure Layer**: Mapping giữa Eloquent Models và Domain Entities.

## 📐 Structure
- `Actions/`: Các use case mô phỏng.
- `Services/`: Các engine tính toán (Entropy, Observation, Epoch).
- `Entities/`: Trạng thái thuần của vũ trụ.
- `Contracts/`: Interfaces cho data access.

## 🚀 Usage
```php
$action = app(ManifestRelicAction::class);
$action->handle($universe, $tick, $data);
```

## 🧪 Testing
Sử dụng `artisan test` để kiểm tra các kịch bản mô phỏng.
